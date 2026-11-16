import { useState } from 'react';
import { Check, Copy, MinusCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { copyTextToClipboard } from '../utils/clipboard';
import { hasValidInc } from '../utils/validation';

interface IncBadgeProps {
  inc: string;
  onNotify?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  size?: 'sm' | 'md';
}

export function IncBadge({ inc, onNotify, size = 'sm' }: IncBadgeProps) {
  const [copied, setCopied] = useState(false);
  const valid = hasValidInc(inc);
  const cleanInc = inc.trim();

  if (!valid) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-xl border border-[#F3D085] dark:border-[#5E3F10] bg-[#FEF6E3] dark:bg-[#2B1B06] text-[#8A5602] dark:text-[#FCD34D] font-semibold tracking-[-0.01em] whitespace-nowrap shrink-0 ${
          size === 'md' ? 'px-3 py-1 text-xs' : 'px-2.5 py-1 text-[12px]'
        }`}
        title="Acionamento ainda sem código INC registrado"
      >
        <MinusCircle className="w-3.5 h-3.5 text-[#D99114] dark:text-[#FBBF24] shrink-0" aria-hidden="true" />
        <span>Sem INC</span>
      </span>
    );
  }

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(cleanInc);
    if (ok) {
      setCopied(true);
      onNotify?.(`INC ${cleanInc} copiado para a área de transferência.`, 'success');
      window.setTimeout(() => setCopied(false), 1800);
    } else {
      onNotify?.('Não foi possível copiar o INC automaticamente.', 'warning');
    }
  };

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={() => void handleCopy()}
      title={`Copiar código ${cleanInc}`}
      aria-label={`Copiar INC ${cleanInc}`}
      className={`group/inc inline-flex items-center gap-1.5 rounded-xl border font-mono font-semibold tracking-[-0.02em] transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00807C] ${
        size === 'md' ? 'px-3 py-1 text-xs' : 'px-2.5 py-1 text-[12px]'
      } ${
        copied
          ? 'bg-[#E7F4F3] dark:bg-[#0A2E2C] border-[#00807C] dark:border-[#00A39E] text-[#005451] dark:text-[#4DD4CF] shadow-2xs'
          : 'bg-[#EBF4FA] hover:bg-[#dcecf6] dark:bg-[#132A3A] dark:hover:bg-[#19364A] border-[#9ec5de] hover:border-[#1F6E9C] dark:border-[#224A63] dark:hover:border-[#4CA3D9] text-[#154F73] dark:text-[#78BBE6] shadow-2xs'
      }`}
    >
      <span>{cleanInc}</span>
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="copied"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{ duration: 0.12 }}
            className="inline-flex items-center gap-0.5 font-sans text-[11px] font-semibold text-[#005C59] dark:text-[#4DD4CF]"
          >
            <Check className="w-3.5 h-3.5 text-[#00807C] dark:text-[#00C2BB]" aria-hidden="true" />
            <span>Copiado</span>
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{ duration: 0.12 }}
            className="inline-flex items-center"
          >
            <Copy
              className="w-3.5 h-3.5 text-[#1F6E9C] dark:text-[#4CA3D9] group-hover/inc:text-[#0f4568] dark:group-hover/inc:text-[#78BBE6] transition-colors shrink-0"
              aria-hidden="true"
            />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
