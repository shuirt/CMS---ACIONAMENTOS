import type { ReactNode } from 'react';

interface OperatorCellProps {
  name: string;
  compact?: boolean;
  rightSlot?: ReactNode;
}

export function getOperatorInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'CM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function OperatorCell({ name, compact = false, rightSlot }: OperatorCellProps) {
  const displayName = name.trim() || 'Não identificado';
  const initials = getOperatorInitials(displayName);

  return (
    <div
      className={`flex items-center justify-between gap-3 min-w-0 ${
        compact
          ? 'md:w-[172px] md:border-l md:border-[#d4dfe4] md:pl-3.5'
          : 'md:w-[180px] md:border-l md:border-[#d4dfe4] md:pl-3.5'
      } md:shrink-0`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="w-7 h-7 rounded-full bg-[#ebf4fa] border border-[#b6d6ea] text-[#154f73] flex items-center justify-center text-[11px] font-semibold shrink-0"
          aria-hidden="true"
        >
          {initials}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#64737c] leading-tight">
            Operador CMS
          </span>
          <span
            className="text-[13px] font-semibold text-[#162229] tracking-[-0.01em] truncate leading-snug"
            title={displayName}
          >
            {displayName}
          </span>
        </div>
      </div>
      {rightSlot}
    </div>
  );
}
