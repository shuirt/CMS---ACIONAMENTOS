import { STATUS_DESIGN_TOKENS } from '../design/tokens';
import type { StatusOperacional } from '../types/acionamento';

interface StatusIndicatorProps {
  status: StatusOperacional;
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
  const token = STATUS_DESIGN_TOKENS[status] ?? STATUS_DESIGN_TOKENS.Informação;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[12.5px] font-semibold leading-none whitespace-nowrap shrink-0 ${token.badgeClass}`}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${token.dotClass}`} aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
}
