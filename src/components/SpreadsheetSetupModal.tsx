import { useEffect, useState } from 'react';
import { CheckCircle2, FileSpreadsheet, Plus, X } from 'lucide-react';
import { BUTTON_VARIANTS, FIELD_VARIANTS } from '../design/tokens';
import {
  bootstrapSpreadsheetOnServer,
  createSpreadsheetOnServer,
} from '../services/repository';

interface SpreadsheetSetupModalProps {
  open: boolean;
  accessToken: string;
  currentSpreadsheetId: string;
  envSpreadsheetPinned: boolean;
  onSelectSpreadsheet: (spreadsheetId: string) => void;
  onClose: () => void;
}

export function extractSpreadsheetId(raw: string): string {
  const trimmed = raw.trim();
  const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch && urlMatch[1]) return urlMatch[1];
  return trimmed;
}

export function SpreadsheetSetupModal({
  open,
  accessToken,
  currentSpreadsheetId,
  envSpreadsheetPinned,
  onSelectSpreadsheet,
  onClose,
}: SpreadsheetSetupModalProps) {
  const [inputVal, setInputVal] = useState(currentSpreadsheetId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [confirmCreate, setConfirmCreate] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, busy, onClose]);

  if (!open) return null;

  const handleConnectExisting = async () => {
    const sid = extractSpreadsheetId(inputVal);
    if (!sid) {
      setError('Informe o ID ou o link completo da planilha Google Sheets.');
      return;
    }
    setBusy(true);
    setError(null);
    setStatusMsg(null);
    try {
      const result = await bootstrapSpreadsheetOnServer(accessToken, sid);
      setStatusMsg(
        `Planilha "${result.title}" validada com sucesso.${
          result.createdTabs.length > 0
            ? ` Abas criadas: ${result.createdTabs.join(', ')}.`
            : ''
        }`
      );
      onSelectSpreadsheet(sid);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Não foi possível validar a planilha informada.'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleCreateNew = async () => {
    setBusy(true);
    setError(null);
    setStatusMsg(null);
    try {
      const created = await createSpreadsheetOnServer(accessToken, 'Central de Acionamentos — CMS');
      setInputVal(created.spreadsheetId);
      setConfirmCreate(false);
      setStatusMsg(
        `Nova planilha "${created.title}" criada com as 3 abas (Acionamentos, Config, Auditoria). ID: ${created.spreadsheetId}`
      );
      onSelectSpreadsheet(created.spreadsheetId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar nova planilha.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#162229]/50 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheets-setup-title"
    >
      <div className="bg-white rounded-3xl border border-[#c8d5db] shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="h-[3px] flex" aria-hidden="true">
          <div className="w-[74%] bg-[#00807C]" />
          <div className="w-[26%] bg-[#EEA722]" />
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#E7F4F3] border border-[#B3DCD9] flex items-center justify-center text-[#005C59] shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h2 id="sheets-setup-title" className="text-base font-semibold text-[#162229]">
                  Conectar Planilha Google Sheets
                </h2>
                <p className="text-xs text-[#64737C]">
                  Base oficial compartilhada (abas Acionamentos, Config e Auditoria)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar configuração da planilha"
              className="p-1.5 rounded-xl text-[#64737C] hover:text-[#162229] hover:bg-[#eef3f5] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {envSpreadsheetPinned && (
            <div className="rounded-2xl bg-[#f4f7f9] border border-[#d4dfe4] p-3.5 text-xs text-[#3e4e57]">
              O servidor possui <code className="font-mono font-semibold">GOOGLE_SHEETS_SPREADSHEET_ID</code>{' '}
              fixado em ambiente (<span className="font-mono">{currentSpreadsheetId}</span>). Você
              pode validar/inicializar as 3 abas abaixo.
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="spreadsheet-id-input"
              className="block text-xs font-semibold uppercase tracking-wider text-[#3e4e57]"
            >
              ID ou URL da Planilha Compartilhada
            </label>
            <input
              id="spreadsheet-id-input"
              type="text"
              value={inputVal}
              disabled={envSpreadsheetPinned || busy}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className={`${FIELD_VARIANTS.input} text-xs font-mono disabled:bg-[#f4f7f9]`}
            />
            <p className="text-[11px] text-[#64737C]">
              Ao validar, o sistema verifica automaticamente as abas Acionamentos, Config e Auditoria
              e cria cabeçalhos faltantes sem apagar registros existentes.
            </p>
          </div>

          {error && (
            <div className="rounded-2xl bg-[#FCEFEF] border border-[#ECC4C3] p-3.5 text-xs text-[#8C3230]">
              {error}
            </div>
          )}

          {statusMsg && (
            <div className="flex items-start gap-2 rounded-2xl bg-[#E7F4F3] border border-[#B3DCD9] p-3.5 text-xs text-[#005451]">
              <CheckCircle2 className="w-4 h-4 text-[#00807C] shrink-0 mt-0.5" />
              <span>{statusMsg}</span>
            </div>
          )}

          {confirmCreate ? (
            <div className="rounded-2xl bg-[#FEF6E3] border border-[#F3D085] p-4 space-y-3">
              <p className="text-xs text-[#7A4B00] font-medium">
                Confirmar criação de uma nova planilha &quot;Central de Acionamentos — CMS&quot; na sua
                conta Google Drive? Lembre-se de compartilhá-la com os demais operadores autorizados.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirmCreate(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#52636d] hover:bg-[#f9e8bc] cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleCreateNew()}
                  className={`${BUTTON_VARIANTS.primary} px-3.5 py-1.5 text-xs`}
                >
                  {busy ? 'Criando...' : 'Confirmar criação'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-[#e3ebee]">
              {!envSpreadsheetPinned ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirmCreate(true)}
                  className={`${BUTTON_VARIANTS.mineralBlue} px-3.5 py-2 text-xs`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Criar nova planilha CMS</span>
                </button>
              ) : (
                <span />
              )}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={onClose}
                  className={`${BUTTON_VARIANTS.ghost} px-4 py-2 text-xs`}
                >
                  Fechar
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleConnectExisting()}
                  className={`${BUTTON_VARIANTS.primary} px-4 py-2 text-xs`}
                >
                  {busy ? 'Validando...' : 'Validar e conectar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
