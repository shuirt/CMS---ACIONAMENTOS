import type { NextFunction, Request, Response } from 'express';

export interface AuthenticatedOperator {
  email: string;
  name: string;
  accessToken: string;
}

declare global {
  namespace Express {
    interface Request {
      operator?: AuthenticatedOperator;
    }
  }
}

interface CachedTokenInfo {
  email: string;
  name: string;
  expiresAtMs: number;
}

const tokenCache = new Map<string, CachedTokenInfo>();

export function parseAllowedEmails(envValue: string | undefined): string[] {
  if (!envValue) return [];
  return envValue
    .split(/[\s,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowed(email: string, allowedList: string[]): boolean {
  if (allowedList.length === 0) return false;
  return allowedList.includes(email.trim().toLowerCase());
}

async function verifyGoogleAccessToken(accessToken: string): Promise<{ email: string; name: string }> {
  const now = Date.now();
  const cached = tokenCache.get(accessToken);
  if (cached && cached.expiresAtMs > now) {
    return { email: cached.email, name: cached.name };
  }

  const tokenInfoRes = await fetch(
    `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
  );

  if (!tokenInfoRes.ok) {
    throw new AuthError('Sessão Google inválida ou expirada. Faça login novamente.', 401);
  }

  const tokenInfo = (await tokenInfoRes.json()) as {
    email?: string;
    email_verified?: string | boolean;
    expires_in?: string | number;
    scope?: string;
  };

  if (!tokenInfo.email || (tokenInfo.email_verified !== 'true' && tokenInfo.email_verified !== true)) {
    throw new AuthError('Conta Google sem e-mail verificado.', 401);
  }

  const scopeStr = tokenInfo.scope ?? '';
  if (!scopeStr.includes('https://www.googleapis.com/auth/spreadsheets')) {
    throw new AuthError(
      'Permissão do Google Sheets não concedida. Autorize o acesso às planilhas ao entrar.',
      403
    );
  }

  let displayName = tokenInfo.email.split('@')[0];
  try {
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (userInfoRes.ok) {
      const profile = (await userInfoRes.json()) as { name?: string };
      if (profile.name && profile.name.trim()) {
        displayName = profile.name.trim();
      }
    }
  } catch {
    // Fallback to email prefix if userinfo endpoint is unreachable
  }

  const expiresInSec = Number(tokenInfo.expires_in ?? 60);
  const ttlMs = Math.min(Math.max(expiresInSec - 15, 10), 60) * 1000;
  tokenCache.set(accessToken, {
    email: tokenInfo.email.toLowerCase(),
    name: displayName,
    expiresAtMs: now + ttlMs,
  });

  // Prevent unbounded cache growth
  if (tokenCache.size > 50) {
    for (const [key, val] of tokenCache.entries()) {
      if (val.expiresAtMs <= now) tokenCache.delete(key);
    }
  }

  return { email: tokenInfo.email.toLowerCase(), name: displayName };
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export async function requireAuthorizedOperator(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization ?? '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match || !match[1]?.trim()) {
    res.status(401).json({
      error: 'Acesso não autenticado. Entre com uma conta Google autorizada.',
      code: 'UNAUTHENTICATED',
    });
    return;
  }

  const accessToken = match[1].trim();
  try {
    const verified = await verifyGoogleAccessToken(accessToken);
    const allowedEmails = parseAllowedEmails(process.env.ALLOWED_OPERATOR_EMAILS);

    if (allowedEmails.length === 0) {
      res.status(403).json({
        error:
          'Lista ALLOWED_OPERATOR_EMAILS não configurada no servidor. Configure os e-mails autorizados no ambiente do servidor.',
        code: 'ALLOWLIST_NOT_CONFIGURED',
        email: verified.email,
      });
      return;
    }

    if (!isEmailAllowed(verified.email, allowedEmails)) {
      res.status(403).json({
        error: `O e-mail ${verified.email} não está autorizado a acessar a Central de Acionamentos — CMS.`,
        code: 'FORBIDDEN_EMAIL',
        email: verified.email,
      });
      return;
    }

    req.operator = {
      email: verified.email,
      name: verified.name,
      accessToken,
    };
    next();
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.status).json({ error: err.message, code: 'AUTH_ERROR' });
      return;
    }
    res.status(502).json({
      error: 'Falha ao validar credencial Google no servidor.',
      code: 'AUTH_VERIFICATION_FAILED',
    });
  }
}
