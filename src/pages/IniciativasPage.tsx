import { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  ChevronRight,
  FileText,
  Plus,
  RotateCcw,
  Search,
  User,
  X,
} from 'lucide-react';
import { BUTTON_VARIANTS, SURFACE_TOKENS } from '../design/tokens';
import type { Iniciativa } from '../types/acionamento';
import {
  formatDateBR,
  formatLongDateBR,
  getTodayIsoDate,
  getUniqueOperators,
  hasValidInc,
  isValidIsoDate,
} from '../utils/validation';
import { IncBadge } from '../components/IncBadge';
import { getOperatorInitials } from '../components/OperatorCell';

interface IniciativasPageProps {
  iniciativas: Iniciativa[];
  loading: boolean;
  error: string | null;
  onNewIniciativa: () => void;
  onSelectIniciativa: (item: Iniciativa) => void;
  onNotify: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onRefresh: () => void;
}

export function IniciativasPage({
  iniciativas,
  loading,
  error,
  onNewIniciativa,
  onSelectIniciativa,
  onNotify,
  onRefresh,
}: IniciativasPageProps) {
  const [search, setSearch] = useState('');
  const [operatorFilter, setOperatorFilter] = useState('Todos');
  const [incFilter, setIncFilter] = useState<'todos' | 'com_inc' | 'sem_inc'>('todos');
  const [dateFilter, setDateFilter] = useState<'hoje' | 'ontem' | 'todas'>('todas');

  const searchRef = useRef<HTMLInputElement | null>(null);
  const todayIso = getTodayIsoDate();
  const yesterdayIso = useMemo(() => {
    const [y, m, d] = todayIso.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d - 1));
    return dt.toISOString().slice(0, 10);
  }, [todayIso]);

  const operatorOptions = useMemo(() => getUniqueOperators(iniciativas), [iniciativas]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return iniciativas.filter((item) => {
      if (dateFilter === 'hoje' && item.dataRegistro !== todayIso) return false;
      if (dateFilter === 'ontem' && item.dataRegistro !== yesterdayIso) return false;
      if (operatorFilter !== 'Todos' && item.createdByName.trim() !== operatorFilter) return false;
      if (incFilter === 'com_inc' && !hasValidInc(item.inc)) return false;
      if (incFilter === 'sem_inc' && hasValidInc(item.inc)) return false;

      if (!term) return true;
      const haystack = [
        item.descricao,
        item.municipio,
        item.tipificacao,
        hasValidInc(item.inc) ? item.inc : '',
        item.analistaResponsavel,
        item.createdByName,
        `iniciativa #${item.numeroIniciativa}`,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [iniciativas, search, operatorFilter, incFilter, dateFilter, todayIso, yesterdayIso]);

  const dateTotals = useMemo(() => {
    return {
      hoje: iniciativas.filter((i) => i.dataRegistro === todayIso).length,
      ontem: iniciativas.filter((i) => i.dataRegistro === yesterdayIso).length,
      todas: iniciativas.length,
    };
  }, [iniciativas, todayIso, yesterdayIso]);

  const incCounts = useMemo(() => {
    const comInc = filteredItems.filter((i) => hasValidInc(i.inc)).length;
    const semInc = filteredItems.length - comInc;
    return { comInc, semInc };
  }, [filteredItems]);

  const hasAnyFilter = Boolean(
    search.trim() || operatorFilter !== 'Todos' || incFilter !== 'todos' || dateFilter !== 'todas'
  );

  const clearAllFilters = () => {
    setSearch('');
    setOperatorFilter('Todos');
    setIncFilter('todos');
    setDateFilter('todas');
  };

  return (
    <div className={SURFACE_TOKENS.pageContainer}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Controls & Filters */}
        <aside className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
          <div className="bg-white border border-[#D4DFE4] rounded-2xl p-5 shadow-2xs space-y-5">
            {/* Title & Action */}
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <h1 className="text-[22px] sm:text-[24px] font-bold text-[#162229] tracking-[-0.03em]">
                  Iniciativas CMS
                </h1>
                <p className="text-[13px] text-[#52636D]">
                  Gestão de iniciativas estratégicas e preventivas
                </p>
              </div>

              <button
                type="button"
                onClick={onNewIniciativa}
                className={`${BUTTON_VARIANTS.primary} w-full text-[14px] px-4 py-2.5 justify-center`}
              >
                <Plus className="w-4 h-4" />
                <span>Nova iniciativa</span>
              </button>
            </div>

            <hr className="border-[#EDF2F4]" />

            {/* Search */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#3e4e57] uppercase tracking-wider">
                Pesquisa
              </label>
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64737C]">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  ref={searchRef}
                  type="search"
                  aria-label="Pesquisar iniciativas"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar ID, município, analista..."
                  className="w-full h-9 pl-9 pr-8 bg-[#F4F7F9] hover:bg-white text-[#162229] text-xs rounded-xl border border-[#D4DFE4] focus:bg-white focus:border-[#00807C] focus:outline-none transition-colors placeholder:text-[#77787B]/75"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    aria-label="Limpar busca"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#77787B] hover:text-[#162229] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Período / Data */}
            <div className="space-y-1.5">
              <span className="block text-xs font-bold text-[#3e4e57] uppercase tracking-wider">
                Período / Data
              </span>
              <div
                className="grid grid-cols-3 p-1 rounded-xl bg-[#EDF2F4] gap-1"
                role="group"
                aria-label="Filtrar iniciativas por data"
              >
                <button
                  type="button"
                  onClick={() => setDateFilter('hoje')}
                  className={`flex flex-col items-center justify-center px-2 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    dateFilter === 'hoje'
                      ? 'bg-white text-[#162229] font-semibold shadow-xs'
                      : 'text-[#52636D] hover:text-[#162229]'
                  }`}
                >
                  <span>Hoje</span>
                  <span className="text-[11px] font-mono font-bold text-[#005451]">
                    {dateTotals.hoje}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDateFilter('ontem')}
                  className={`flex flex-col items-center justify-center px-2 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    dateFilter === 'ontem'
                      ? 'bg-white text-[#162229] font-semibold shadow-xs'
                      : 'text-[#52636D] hover:text-[#162229]'
                  }`}
                >
                  <span>Ontem</span>
                  <span className="text-[11px] font-mono font-bold text-[#154F73]">
                    {dateTotals.ontem}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDateFilter('todas')}
                  className={`flex flex-col items-center justify-center px-2 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    dateFilter === 'todas'
                      ? 'bg-white text-[#162229] font-semibold shadow-xs'
                      : 'text-[#52636D] hover:text-[#162229]'
                  }`}
                >
                  <span>Todas</span>
                  <span className="text-[11px] font-mono font-bold text-[#52636D]">
                    {dateTotals.todas}
                  </span>
                </button>
              </div>
            </div>

            <hr className="border-[#EDF2F4]" />

            {/* Filters */}
            <div className="space-y-3">
              <span className="block text-xs font-bold text-[#3e4e57] uppercase tracking-wider">
                Filtros
              </span>

              {/* Operador dropdown */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#52636d]">Operador CMS</label>
                <div className="relative">
                  <select
                    aria-label="Filtrar por operador"
                    value={operatorFilter}
                    onChange={(e) => setOperatorFilter(e.target.value)}
                    className={`w-full h-9 pl-3 pr-8 text-xs font-medium rounded-xl border appearance-none transition-colors cursor-pointer ${
                      operatorFilter !== 'Todos'
                        ? 'bg-[#E7F4F3] border-[#00807C] text-[#005451] font-semibold'
                        : 'bg-[#F4F7F9] hover:bg-white border-[#D4DFE4] text-[#52636D]'
                    }`}
                  >
                    <option value="Todos">Todos os operadores</option>
                    {operatorOptions.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#77787B] text-[10px]" aria-hidden="true">
                    ▼
                  </span>
                </div>
              </div>

              {/* INC filter */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#52636d]">Código INC</label>
                <div className="grid grid-cols-3 p-0.5 rounded-lg bg-[#EDF2F4] gap-0.5">
                  <button
                    type="button"
                    onClick={() => setIncFilter('todos')}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                      incFilter === 'todos'
                        ? 'bg-white text-[#162229] font-semibold shadow-xs'
                        : 'text-[#52636D]'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setIncFilter('com_inc')}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                      incFilter === 'com_inc'
                        ? 'bg-white text-[#162229] font-semibold shadow-xs'
                        : 'text-[#52636D]'
                    }`}
                  >
                    Com INC
                  </button>
                  <button
                    type="button"
                    onClick={() => setIncFilter('sem_inc')}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                      incFilter === 'sem_inc'
                        ? 'bg-white text-[#8A5602] font-semibold shadow-xs'
                        : 'text-[#52636D]'
                    }`}
                  >
                    Sem INC
                  </button>
                </div>
              </div>

              {hasAnyFilter && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[#00807C] hover:text-[#005451] bg-[#E7F4F3]/50 hover:bg-[#E7F4F3] rounded-xl border border-[#9fd0cc]/40 transition-colors cursor-pointer mt-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpar filtros</span>
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Right Main Column: Iniciativas List */}
        <main className="lg:col-span-8 space-y-4 min-w-0">
          {error && (
            <div
              role="alert"
              className="flex items-center justify-between gap-3 rounded-2xl bg-[#fcefef] border border-[#ecc4c3] px-5 py-4 text-sm text-[#8c3230]"
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-[#b94a48] shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={onRefresh}
                className="px-3.5 py-1.5 rounded-xl bg-[#b94a48] text-white text-xs font-semibold cursor-pointer"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`${SURFACE_TOKENS.card} p-5 animate-pulse h-24 bg-white`} />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className={`${SURFACE_TOKENS.card} px-6 py-14 text-center space-y-3 bg-white`}>
              <div className="w-11 h-11 rounded-2xl bg-[#eef3f6] border border-[#d4dfe4] text-[#4e6b7c] flex items-center justify-center mx-auto">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-[#162229]">
                  Nenhuma iniciativa encontrada
                </p>
                <p className="text-xs text-[#64737c]">
                  {hasAnyFilter
                    ? 'Tente ajustar os filtros ou a busca aplicada.'
                    : 'Clique em "Nova iniciativa" para registrar a primeira iniciativa.'}
                </p>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={onNewIniciativa}
                  className={`${BUTTON_VARIANTS.primary} px-4 py-2 text-xs`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nova iniciativa</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => {
                const opName = item.createdByName.trim() || 'Operador';
                const opInit = getOperatorInitials(opName);
                return (
                  <article
                    key={item.id}
                    className={`${SURFACE_TOKENS.card} w-full group overflow-hidden transition-all hover:border-[#bdd0d8] hover:bg-[#fcfefe]`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 px-5 sm:px-6 py-4.5 sm:py-5">
                      <button
                        type="button"
                        onClick={() => onSelectIniciativa(item)}
                        className="flex-1 min-w-0 flex flex-col gap-2 text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00807C] rounded-xl"
                      >
                        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 min-w-0">
                          <span className="text-[15.5px] text-[#162229] font-semibold group-hover:text-[#005C59] transition-colors">
                            {item.tipificacao || 'Iniciativa Operacional'}
                          </span>
                          <span className="text-[11.5px] font-mono font-bold text-[#005C59] whitespace-nowrap">
                            INICIATIVA #{item.numeroIniciativa}
                          </span>
                        </div>

                        <p className="text-[13.5px] leading-[22px] text-[#162229] line-clamp-2">
                          {item.descricao}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#52636d] pt-1.5 border-t border-[#eef3f5]">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-[#ebf4fa] border border-[#b6d6ea] text-[#154f73] inline-flex items-center justify-center text-[10px] font-semibold">
                              {opInit}
                            </span>
                            <span className="font-semibold text-[#162229]">{opName}</span>
                          </div>
                          <span>·</span>
                          <span className="font-mono font-bold text-[#162229]">{item.horario}</span>
                          <span>·</span>
                          <span className="font-mono text-[#52636d]">{formatDateBR(item.dataRegistro)}</span>
                          <span>·</span>
                          <span className="font-medium text-[#3e4e57]">{item.municipio}</span>
                          {item.analistaResponsavel && (
                            <>
                              <span>·</span>
                              <span>Analista: {item.analistaResponsavel}</span>
                            </>
                          )}
                        </div>
                      </button>

                      <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-2 lg:pt-0">
                        <IncBadge inc={item.inc} onNotify={onNotify} />
                        <button
                          type="button"
                          onClick={() => onSelectIniciativa(item)}
                          title="Abrir ficha completa"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-xl border border-transparent hover:border-[#d4dfe4] hover:bg-[#f4f7f9] text-[#64737c] hover:text-[#00807C] transition-colors cursor-pointer shrink-0"
                        >
                          <ChevronRight className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
