import { useEffect } from 'react';
import { AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  details?: string[];
  confirmLabel: string;
  cancelLabel?: string;
  variant?: 'primary' | 'warning';
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  details,
  confirmLabel,
  cancelLabel = 'Cancelar',
  variant = 'primary',
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, busy, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#162229]/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-3xl border border-[#c8d5db] shadow-2xl max-w-md w-full overflow-hidden"
          >
        <div
          className={`h-[3px] w-full ${variant === 'warning' ? 'bg-[#EEA722]' : 'bg-[#00807C]'}`}
          aria-hidden="true"
        />
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                variant === 'warning'
                  ? 'bg-[#fef6e3] text-[#965f04] border border-[#f3d085]'
                  : 'bg-[#e7f4f3] text-[#005c59] border border-[#b3dcd9]'
              }`}
            >
              {variant === 'warning' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <FileSpreadsheet className="w-5 h-5" />
              )}
            </div>
            <div className="space-y-1">
              <h2 id="confirm-dialog-title" className="text-base font-semibold text-[#162229]">
                {title}
              </h2>
              <p className="text-sm text-[#3e4e57] leading-relaxed">{description}</p>
            </div>
          </div>

          {details && details.length > 0 && (
            <ul className="bg-[#f4f7f9] border border-[#d4dfe4] rounded-2xl px-4 py-3 space-y-1 text-xs text-[#162229]">
              {details.map((line, i) => (
                <li key={i} className="truncate">
                  {line}
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              disabled={busy}
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[#52636d] hover:text-[#162229] hover:bg-[#eef3f5] transition-colors cursor-pointer disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onConfirm}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50 ${
                variant === 'warning'
                  ? 'bg-[#EEA722] hover:bg-[#d99114] text-[#162229]'
                  : 'bg-[#00807C] hover:bg-[#006562] text-white'
              }`}
            >
              {busy ? 'Processando...' : confirmLabel}
            </button>
          </div>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
