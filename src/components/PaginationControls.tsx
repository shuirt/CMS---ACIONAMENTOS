import { ChevronLeft, ChevronRight } from 'lucide-react';

export const ACIONAMENTO_PAGE_SIZE = 50;

interface PaginationControlsProps {
  page: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({
  page,
  totalItems,
  onPageChange,
}: PaginationControlsProps) {
  const pageCount = Math.ceil(totalItems / ACIONAMENTO_PAGE_SIZE);
  if (pageCount <= 1) return null;

  const firstItem = page * ACIONAMENTO_PAGE_SIZE + 1;
  const lastItem = Math.min((page + 1) * ACIONAMENTO_PAGE_SIZE, totalItems);

  return (
    <nav
      aria-label="Paginação dos acionamentos"
      className="flex flex-wrap items-center justify-between gap-3 px-1 py-2"
    >
      <span className="text-xs text-[#64737C] tabular-nums">
        Exibindo {firstItem}–{lastItem} de {totalItems}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          aria-label="Página anterior"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D4DFE4] bg-white text-xs font-medium text-[#52636D] hover:text-[#162229] disabled:opacity-45 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Anterior
        </button>
        <span className="text-xs text-[#52636D] tabular-nums">
          Página {page + 1} de {pageCount}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page + 1 >= pageCount}
          aria-label="Próxima página"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D4DFE4] bg-white text-xs font-medium text-[#52636D] hover:text-[#162229] disabled:opacity-45 disabled:cursor-not-allowed"
        >
          Próxima
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
