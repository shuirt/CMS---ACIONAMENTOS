import { AlertTriangle, Check, Info, X, XCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-md pointer-events-none"
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const styleMap = {
            success: 'bg-[#005C59] text-white border-[#00807C]',
            error: 'bg-[#8C3230] text-white border-[#B94A48]',
            warning: 'bg-[#965F04] text-white border-[#EEA722]',
            info: 'bg-[#154F73] text-white border-[#1F6E9C]',
          };
          const iconBgMap = {
            success: 'bg-[#00807C]',
            error: 'bg-[#B94A48]',
            warning: 'bg-[#EEA722] text-[#162229]',
            info: 'bg-[#1F6E9C]',
          };

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              role="status"
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl text-xs sm:text-sm font-medium ${styleMap[toast.type]}`}
            >
              <span
                className={`p-1 rounded-full inline-flex items-center justify-center shrink-0 ${iconBgMap[toast.type]}`}
              >
                {toast.type === 'success' && <Check className="w-3.5 h-3.5 text-white" />}
                {toast.type === 'error' && <XCircle className="w-3.5 h-3.5 text-white" />}
                {toast.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-[#162229]" />}
                {toast.type === 'info' && <Info className="w-3.5 h-3.5 text-white" />}
              </span>
              <span className="flex-1 leading-snug">{toast.message}</span>
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                aria-label="Fechar notificação"
                className="text-white/75 hover:text-white transition-colors p-0.5 rounded-lg focus:outline-none cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
