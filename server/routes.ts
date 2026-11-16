import express from 'express';
import type { Request, Response } from 'express';
import { requireAuthorizedOperator } from './auth';
import {
  ConflictError,
  GoogleSheetsAcionamentoRepository,
  NotFoundError,
  ValidationError,
} from './repository';
import {
  createCmsSpreadsheet,
  ensureCmsSpreadsheetStructure,
  SheetsApiError,
} from './sheetsClient';

export const apiRouter = express.Router();

apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'cms-central-acionamentos' });
});

function resolveSpreadsheetId(req: Request): string {
  const envId = (process.env.GOOGLE_SHEETS_SPREADSHEET_ID ?? '').trim();
  const headerId = String(req.headers['x-spreadsheet-id'] ?? '').trim();
  return envId || headerId;
}

function handleApiError(res: Response, err: unknown): void {
  if (err instanceof ValidationError) {
    res.status(400).json({ error: err.message, fieldErrors: err.errors, code: 'VALIDATION_ERROR' });
    return;
  }
  if (err instanceof ConflictError) {
    res.status(409).json({
      error: err.message,
      latestRecord: err.latestRecord,
      code: 'CONFLICT_ERROR',
    });
    return;
  }
  if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message, code: 'NOT_FOUND' });
    return;
  }
  if (err instanceof SheetsApiError) {
    const status = err.status === 401 || err.status === 403 || err.status === 404 ? err.status : 502;
    res.status(status).json({
      error: `Google Sheets: ${err.message}`,
      code: 'SHEETS_API_ERROR',
    });
    return;
  }
  res.status(500).json({
    error: err instanceof Error ? err.message : 'Erro interno no servidor.',
    code: 'INTERNAL_ERROR',
  });
}

// Protected session verification endpoint
apiRouter.get('/auth/session', requireAuthorizedOperator, (req: Request, res: Response) => {
  const envSpreadsheetId = (process.env.GOOGLE_SHEETS_SPREADSHEET_ID ?? '').trim();
  res.json({
    authorized: true,
    operator: {
      name: req.operator!.name,
      email: req.operator!.email,
    },
    envSpreadsheetId,
  });
});

// Create a brand new 3-tab CMS spreadsheet
apiRouter.post('/sheets/create', requireAuthorizedOperator, async (req: Request, res: Response) => {
  try {
    const title = typeof req.body?.title === 'string' && req.body.title.trim()
      ? req.body.title.trim()
      : 'Central de Acionamentos — CMS';
    const created = await createCmsSpreadsheet(req.operator!.accessToken, title);
    res.status(201).json({
      spreadsheetId: created.spreadsheetId,
      spreadsheetUrl: created.spreadsheetUrl,
      title: created.properties.title,
    });
  } catch (err) {
    handleApiError(res, err);
  }
});

// Ensure existing spreadsheet has the 3 tabs + headers + initial Config
apiRouter.post('/sheets/bootstrap', requireAuthorizedOperator, async (req: Request, res: Response) => {
  try {
    const bodyId = typeof req.body?.spreadsheetId === 'string' ? req.body.spreadsheetId.trim() : '';
    const spreadsheetId = bodyId || resolveSpreadsheetId(req);
    if (!spreadsheetId) {
      res.status(400).json({
        error: 'Informe o ID da planilha Google Sheets.',
        code: 'MISSING_SPREADSHEET_ID',
      });
      return;
    }
    const result = await ensureCmsSpreadsheetStructure(spreadsheetId, req.operator!.accessToken);
    res.json({
      spreadsheetId,
      ...result,
    });
  } catch (err) {
    handleApiError(res, err);
  }
});

// Load workspace (Acionamentos + Config + Auditoria)
apiRouter.get('/workspace', requireAuthorizedOperator, async (req: Request, res: Response) => {
  try {
    const spreadsheetId = resolveSpreadsheetId(req);
    if (!spreadsheetId) {
      res.status(400).json({
        error: 'Nenhuma planilha Google Sheets configurada.',
        code: 'MISSING_SPREADSHEET_ID',
      });
      return;
    }
    const repo = new GoogleSheetsAcionamentoRepository(spreadsheetId, req.operator!.accessToken);
    const workspace = await repo.getWorkspace();
    res.json(workspace);
  } catch (err) {
    handleApiError(res, err);
  }
});

// Create new Acionamento
apiRouter.post('/acionamentos', requireAuthorizedOperator, async (req: Request, res: Response) => {
  try {
    const spreadsheetId = resolveSpreadsheetId(req);
    if (!spreadsheetId) {
      res.status(400).json({
        error: 'Nenhuma planilha Google Sheets configurada.',
        code: 'MISSING_SPREADSHEET_ID',
      });
      return;
    }
    const repo = new GoogleSheetsAcionamentoRepository(spreadsheetId, req.operator!.accessToken);
    const result = await repo.createAcionamento(req.body, req.operator!);
    res.status(201).json(result);
  } catch (err) {
    handleApiError(res, err);
  }
});

// Update existing Acionamento (preserving ID, creator, creation date, and checking conflicts)
apiRouter.put('/acionamentos/:id', requireAuthorizedOperator, async (req: Request, res: Response) => {
  try {
    const spreadsheetId = resolveSpreadsheetId(req);
    if (!spreadsheetId) {
      res.status(400).json({
        error: 'Nenhuma planilha Google Sheets configurada.',
        code: 'MISSING_SPREADSHEET_ID',
      });
      return;
    }
    const id = String(req.params.id ?? '').trim();
    if (!id) {
      res.status(400).json({ error: 'ID do acionamento ausente.', code: 'MISSING_ID' });
      return;
    }
    const expectedUpdatedAt =
      typeof req.body?.expectedUpdatedAt === 'string' ? req.body.expectedUpdatedAt : '';
    const repo = new GoogleSheetsAcionamentoRepository(spreadsheetId, req.operator!.accessToken);
    const result = await repo.updateAcionamento(id, req.body, expectedUpdatedAt, req.operator!);
    res.json(result);
  } catch (err) {
    handleApiError(res, err);
  }
});
