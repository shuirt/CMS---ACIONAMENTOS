import { useEffect, useMemo, useRef } from 'react';
import { Calendar, FileText, RefreshCw, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { AcionamentoListRow } from '../components/AcionamentoListRow';
import { STATUS_OPTIONS } from '../config/defaultCatalog';
import { BUTTON_VARIANTS, SURFACE_TOKENS } from '../design/tokens';
import type {
  Acionamento,
  ConfigCatalog,
  HistoricoFilters,
  IncFilter,
  StatusOperacional,
  TipoLocalidade,
} from '../types/acionamento';
import {
  filterAcionamentos,
  formatDayDividerLabelBR,
  getRelativeDateRange,
  getTodayIsoDate,
  getUniqueFieldValues,
  getUniqueOperators,
  groupAcionamentosByDate,
  hasValidInc,
} from '../utils/validation';

interface HistoricoPageProps {
  acionamentos: Acionamento[];
  catalog: ConfigCatalog;
  loading: boolean;
  refreshing: boolean;
  filters: HistoricoFilters;
  onFiltersChange: (next: HistoricoFilters) => void;
  onClearFilters: () => void;
  onRefresh: () => void;
  onSelectAcionamento: (item: Acionamento) => void;
  onNotify?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export function HistoricoPage({
  acionamentos,
  catalog,
  loading,
  refreshing,
  filters,
  onFiltersChange,
  onClearFilters,
  onRefresh,
  onSelectAcionamento,
  onNotify,
}: HistoricoPageProps) {
  const searchRef = useRef<HTMLInputElement | null>(null);
  const todayIso = getTodayIsoDate();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement | null)?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
          e.preventDefault();
          searchRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const updateFilter = <K extends keyof HistoricoFilters>(
    key: K,
    value: HistoricoFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const operatorOptions = useMemo(
    () => getUniqueOperators(acionamentos),
    [acionamentos]
  );

  const quemAcionouOptions = useMemo(
    () => getUniqueFieldValues(acionamentos, 'quemAcionou', catalog.quemAcionouAtalhos),
    [acionamentos, catalog.quemAcionouAtalhos]
  );

  const municipioOptions = useMemo(
    () => getUniqueFieldValues(acionamentos, 'municipio', catalog.municipios),
    [acionamentos, catalog.municipios]
  );

  const tipificacaoOptions = useMemo(
    () => getUniqueFieldValues(acionamentos, 'tipificacao', catalog.tipificacoes),
    [acionamentos, catalog.tipificacoes]
  );

  const analistaOptions = useMemo(
    () => getUniqueFieldValues(acionamentos, 'analistaResponsavel', catalog.analistas),
    [acionamentos, catalog.analistas]
  );

  const filtered = useMemo(
    () =>
      filterAcionamentos(acionamentos, {
        tab: 'todos',
        search: filters.search,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        statusFilter: filters.statusFilter,
        operatorFilter: filters.operatorFilter,
        incFilter: filters.incFilter,
        quemAcionouFilter: filters.quemAcionouFilter,
        tipoLocalidadeFilter: filters.tipoLocalidadeFilter,
        municipioFilter: filters.municipioFilter,
        tipificacaoFilter: filters.tipificacaoFilter,
        analistaFilter: filters.analistaFilter,
        tecnologiaFilter: filters.tecnologiaFilter,
        reportFilter: filters.reportFilter,
      }),
    [acionamentos, filters]
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.dateFrom || filters.dateTo) count += 1;
    if (filters.statusFilter !== 'Todos') count += 1;
    if (filters.operatorFilter !== 'Todos') count += 1;
    if (filters.incFilter !== 'todos') count += 1;
    if (filters.quemAcionouFilter !== 'Todos') count += 1;
    if (filters.tipoLocalidadeFilter !== 'Todas') count += 1;
    if (filters.municipioFilter !== 'Todos') count += 1;
    if (filters.tipificacaoFilter !== 'Todos') count += 1;
    if (filters.analistaFilter !== 'Todos') count += 1;
    if (filters.tecnologiaFilter !== 'todas') count += 1;
    if (filters.reportFilter !== 'todos') count += 1;
    if (filters.search.trim()) count += 1;
    return count;
  }, [filters]);

  const hasFilters = activeFilterCount > 0;

  const missingIncInResult = useMemo(
    () => filtered.filter((item) => !hasValidInc(item.inc)).length,
    [filtered]
  );

  const dayGroups = useMemo(() => groupAcionamentosByDate(filtered), [filtered]);

  const yesterdayIso = useMemo(() => {
    const [y, m, d] = todayIso.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
  }, [todayIso]);

  const applyPreset = (daysBack: number) => {
    const range = getRelativeDateRange(daysBack, todayIso);
    onFiltersChange({
      ...filters,
      dateFrom: range.from,
      dateTo: range.to,
    });
  };

  const range7 = getRelativeDateRange(6, todayIso);
  const range30 = getRelativeDateRange(29, todayIso);
  const activePreset =
    filters.dateFrom === todayIso && filters.dateTo === todayIso
      ? 'today'
      : filters.dateFrom === range7.from && filters.dateTo === range7.to
        ? '7d'
        : filters.dateFrom === range30.from && filters.dateTo === range30.to
          ? '30d'
          : !filters.dateFrom && !filters.dateTo
            ? 'all'
            : null;

  return (
    <div className={SURFACE_TOKENS.pageContainer}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Header, Action & Complete Filters */}
        <aside className="lg:col-span-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6.5rem)] lg:overflow-y-auto space-y-4">
          <div className="bg-white border border-[#D4DFE4] rounded-2xl p-5 shadow-2xs space-y-4">
            {/* Title & Action */}
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <h1 className="text-[22px] sm:text-[24px] font-bold text-[#162229] tracking-[-0.03em]">
                    Histórico de Ocorrências
                  </h1>
                  <AnimatePresence initial={false}>
                    {hasFilters && (
                      <motion.span
                        key="active-count"
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.94 }}
                        transition={{ duration: 0.15 }}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-xl bg-[#E7F4F3] border border-[#B3DCD9] text-[#005451] text-[11px] font-semibold tabular-nums shrink-0 mt-1"
                      >
                        {activeFilterCount} {activeFilterCount === 1 ? 'filtro' : 'filtros'}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <p className="text-[13px] text-[#52636D] leading-snug">
                  Consulta avançada por período, situação de INC, localidade, tipificação e equipe CMS.
                </p>
              </div>

              <button
                type="button"
                disabled={refreshing || loading}
                onClick={onRefresh}
                className={`${BUTTON_VARIANTS.secondary} w-full px-4 py-2 text-xs justify-center`}
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#00807C] ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Atualizando...' : 'Atualizar planilha'}</span>
              </button>
            </div>

            <hr className="border-[#EDF2F4]" />

            {/* Search */}
            <div className="space-y-1.5">
              <label htmlFor="hist-search" className="text-xs font-bold text-[#3e4e57] uppercase tracking-wider">
                Pesquisa livre
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-[#64737c] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchRef}
                  id="hist-search"
                  type="search"
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  placeholder="Buscar INC, KM, RH, equipe, descrição..."
                  className="w-full h-9 pl-9 pr-8 text-xs text-[#162229] bg-[#F4F7F9] hover:bg-white border border-[#D4DFE4] focus:bg-white focus:border-[#00807C] focus:outline-none rounded-xl transition-colors placeholder:text-[#77787B]/75"
                />
                {filters.search ? (
                  <button
                    type="button"
                    onClick={() => updateFilter('search', '')}
                    aria-label="Limpar busca"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#77787B] hover:text-[#162229] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <kbd
                    aria-hidden="true"
                    className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-[#64737c] bg-white border border-[#d4dfe4] rounded-md pointer-events-none"
                  >
                    /
                  </kbd>
                )}
              </div>
            </div>

            {/* Periodo rápido & Datas */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#3e4e57] uppercase tracking-wider">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#1f6e9c]" />
                  <span>Período / Data</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Período rápido">
                {[
                  {
                    id: 'all',
                    label: 'Todo período',
                    onClick: () => onFiltersChange({ ...filters, dateFrom: '', dateTo: '' }),
                  },
                  { id: 'today', label: 'Hoje', onClick: () => applyPreset(0) },
                  { id: '7d', label: 'Últimos 7 dias', onClick: () => applyPreset(6) },
                  { id: '30d', label: 'Últimos 30 dias', onClick: () => applyPreset(29) },
                ].map((preset) => {
                  const isSelected = activePreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={preset.onClick}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#ebf4fa] text-[#154f73] border border-[#b6d6ea]'
                          : 'bg-[#F4F7F9] text-[#52636D] border border-[#d4dfe4] hover:bg-white hover:text-[#162229] hover:border-[#b5c7d0]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label htmlFor="hist-from" className="text-[11px] font-medium text-[#52636d] flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#1f6e9c]" />
                    <span>Data inicial</span>
                  </label>
                  <input
                    id="hist-from"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => updateFilter('dateFrom', e.target.value)}
                    className="w-full h-9 text-xs font-medium text-[#162229] bg-[#F4F7F9] hover:bg-white focus:bg-white border border-[#D4DFE4] focus:border-[#00807C] focus:outline-none rounded-xl px-2.5 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="hist-to" className="text-[11px] font-medium text-[#52636d] flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#1f6e9c]" />
                    <span>Data final</span>
                  </label>
                  <input
                    id="hist-to"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => updateFilter('dateTo', e.target.value)}
                    className="w-full h-9 text-xs font-medium text-[#162229] bg-[#F4F7F9] hover:bg-white focus:bg-white border border-[#D4DFE4] focus:border-[#00807C] focus:outline-none rounded-xl px-2.5 transition-colors"
                  />
                </div>
              </div>
            </div>

            <hr className="border-[#EDF2F4]" />

            {/* Complete Filters Grid inside Sidebar */}
            <section aria-label="Filtros completos do histórico" className="space-y-3">
              <span className="block text-xs font-bold text-[#3e4e57] uppercase tracking-wider">
                Filtros Avançados
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label htmlFor="hist-status" className="text-[11px] font-medium text-[#52636d]">
                    Status
                  </label>
                  <select
                    id="hist-status"
                    value={filters.statusFilter}
                    onChange={(e) => updateFilter('statusFilter', e.target.value as StatusOperacional | 'Todos')}
                    className={`w-full h-9 text-xs font-medium rounded-xl border px-2.5 cursor-pointer transition-colors ${
                      filters.statusFilter !== 'Todos'
                        ? 'bg-[#E7F4F3] border-[#00807C] text-[#005451] font-semibold'
                        : 'bg-[#F4F7F9] hover:bg-white border-[#D4DFE4] text-[#162229]'
                    }`}
                  >
                    <option value="Todos">Todos</option>
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="hist-inc" className="text-[11px] font-medium text-[#52636d]">
                    Código INC
                  </label>
                  <select
                    id="hist-inc"
                    value={filters.incFilter}
                    onChange={(e) => updateFilter('incFilter', e.target.value as IncFilter)}
                    className={`w-full h-9 text-xs font-medium rounded-xl border px-2.5 cursor-pointer transition-colors ${
                      filters.incFilter !== 'todos'
                        ? 'bg-[#E7F4F3] border-[#00807C] text-[#005451] font-semibold'
                        : 'bg-[#F4F7F9] hover:bg-white border-[#D4DFE4] text-[#162229]'
                    }`}
                  >
                    <option value="todos">Todos</option>
                    <option value="com_inc">Com INC</option>
                    <option value="sem_inc">Sem INC</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="hist-operator" className="text-[11px] font-medium text-[#52636d]">
                    Operador CMS
                  </label>
                  <select
                    id="hist-operator"
                    value={filters.operatorFilter}
                    onChange={(e) => updateFilter('operatorFilter', e.target.value)}
                    className={`w-full h-9 text-xs font-medium rounded-xl border px-2.5 cursor-pointer transition-colors ${
                      filters.operatorFilter !== 'Todos'
                        ? 'bg-[#E7F4F3] border-[#00807C] text-[#005451] font-semibold'
                        : 'bg-[#F4F7F9] hover:bg-white border-[#D4DFE4] text-[#162229]'
                    }`}
                  >
                    <option value="Todos">Todos operadores</option>
                    {operatorOptions.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="hist-analista" className="text-[11px] font-medium text-[#52636d]">
                    Analista
                  </label>
                  <select
                    id="hist-analista"
                    value={filters.analistaFilter}
                    onChange={(e) => updateFilter('analistaFilter', e.target.value)}
                    className={`w-full h-9 text-xs font-medium rounded-xl border px-2.5 cursor-pointer transition-colors ${
                      filters.analistaFilter !== 'Todos'
                        ? 'bg-[#E7F4F3] border-[#00807C] text-[#005451] font-semibold'
                        : 'bg-[#F4F7F9] hover:bg-white border-[#D4DFE4] text-[#162229]'
                    }`}
                  >
                    <option value="Todos">Todos analistas</option>
                    {analistaOptions.map((an) => (
                      <option key={an} value={an}>
                        {an}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="hist-quem" className="text-[11px] font-medium text-[#52636d]">
                    Quem acionou
                  </label>
                  <select
                    id="hist-quem"
                    value={filters.quemAcionouFilter}
                    onChange={(e) => updateFilter('quemAcionouFilter', e.target.value)}
                    className={`w-full h-9 text-xs font-medium rounded-xl border px-2.5 cursor-pointer transition-colors ${
                      filters.quemAcionouFilter !== 'Todos'
                        ? 'bg-[#E7F4F3] border-[#00807C] text-[#005451] font-semibold'
                        : 'bg-[#F4F7F9] hover:bg-white border-[#D4DFE4] text-[#162229]'
                    }`}
                  >
                    <option value="Todos">Todos solicitantes</option>
                    {quemAcionouOptions.map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="hist-localidade" className="text-[11px] font-medium text-[#52636d]">
                    Localidade
                  </label>
                  <select
                    id="hist-localidade"
                    value={filters.tipoLocalidadeFilter}
                    onChange={(e) =>
                      updateFilter('tipoLocalidadeFilter', e.target.value as TipoLocalidade | 'Todas')
                    }
                    className={`w-full h-9 text-xs font-medium rounded-xl border px-2.5 cursor-pointer transition-colors ${
                      filters.tipoLocalidadeFilter !== 'Todas'
                        ? 'bg-[#E7F4F3] border-[#00807C] text-[#005451] font-semibold'
                        : 'bg-[#F4F7F9] hover:bg-white border-[#D4DFE4] text-[#162229]'
                    }`}
                  >
                    <option value="Todas">Todas localidades</option>
                    {catalog.tiposLocalidade.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="hist-municipio" className="text-[11px] font-medium text-[#52636d]">
                    Município
                  </label>
                  <select
                    id="hist-municipio"
                    value={filters.municipioFilter}
                    onChange={(e) => updateFilter('municipioFilter', e.target.value)}
                    className={`w-full h-9 text-xs font-medium rounded-xl border px-2.5 cursor-pointer transition-colors ${
                      filters.municipioFilter !== 'Todos'
                        ? 'bg-[#E7F4F3] border-[#00807C] text-[#005451] font-semibold'
                        : 'bg-[#F4F7F9] hover:bg-white border-[#D4DFE4] text-[#162229]'
                    }`}
                  >
                    <option value="Todos">Todos municípios</option>
                    {municipioOptions.map((mun) => (
                      <option key={mun} value={mun}>
                        {mun}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="hist-tipificacao" className="text-[11px] font-medium text-[#52636d]">
                    Tipificação
                  </label>
                  <select
                    id="hist-tipificacao"
                    value={filters.tipificacaoFilter}
                    onChange={(e) => updateFilter('tipificacaoFilter', e.target.value)}
                    className={`w-full h-9 text-xs font-medium rounded-xl border px-2.5 cursor-pointer transition-colors ${
                      filters.tipificacaoFilter !== 'Todos'
                        ? 'bg-[#E7F4F3] border-[#00807C] text-[#005451] font-semibold'
                        : 'bg-[#F4F7F9] hover:bg-white border-[#D4DFE4] text-[#162229]'
                    }`}
                  >
                    <option value="Todos">Todas tipificações</option>
                    {tipificacaoOptions.map((tip) => (
                      <option key={tip} value={tip}>
                        {tip}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="hist-tecnologia" className="text-[11px] font-medium text-[#52636d]">
                    Tecnologia
                  </label>
                  <select
                    id="hist-tecnologia"
                    value={filters.tecnologiaFilter}
                    onChange={(e) =>
                      updateFilter('tecnologiaFilter', e.target.value as HistoricoFilters['tecnologiaFilter'])
                    }
                    className={`w-full h-9 text-xs font-medium rounded-xl border px-2.5 cursor-pointer transition-colors ${
                      filters.tecnologiaFilter !== 'todas'
                        ? 'bg-[#E7F4F3] border-[#00807C] text-[#005451] font-semibold'
                        : 'bg-[#F4F7F9] hover:bg-white border-[#D4DFE4] text-[#162229]'
                    }`}
                  >
                    <option value="todas">Todas</option>
                    <option value="sim">Com tecnologia</option>
                    <option value="nao">Sem tecnologia</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="hist-report" className="text-[11px] font-medium text-[#52636d]">
                    REPORT #
                  </label>
                  <select
                    id="hist-report"
                    value={filters.reportFilter}
                    onChange={(e) =>
                      updateFilter('reportFilter', e.target.value as HistoricoFilters['reportFilter'])
                    }
                    className={`w-full h-9 text-xs font-medium rounded-xl border px-2.5 cursor-pointer transition-colors ${
                      filters.reportFilter !== 'todos'
                        ? 'bg-[#E7F4F3] border-[#00807C] text-[#005451] font-semibold'
                        : 'bg-[#F4F7F9] hover:bg-white border-[#D4DFE4] text-[#162229]'
                    }`}
                  >
                    <option value="todos">Todos</option>
                    <option value="com_report">Com REPORT #</option>
                    <option value="sem_report">Sem REPORT #</option>
                  </select>
                </div>
              </div>

              {hasFilters && (
                <button
                  type="button"
                  onClick={onClearFilters}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[#00807C] hover:text-[#005451] bg-[#E7F4F3]/50 hover:bg-[#E7F4F3] rounded-xl border border-[#9fd0cc]/40 transition-colors cursor-pointer mt-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpar todos os filtros</span>
                </button>
              )}
            </section>
          </div>
        </aside>

        {/* Right Main Column: Results List Grouped by Day */}
        <main className="lg:col-span-8 space-y-4 min-w-0">
          {loading ? (
            <section className={`${SURFACE_TOKENS.card} overflow-hidden`}>
              <div className="p-8 text-center text-sm text-[#52636d]">Carregando histórico...</div>
            </section>
          ) : dayGroups.length === 0 ? (
            <section className={`${SURFACE_TOKENS.card} overflow-hidden`}>
              <div className="p-12 text-center space-y-3 bg-white">
                <FileText className="w-6 h-6 text-[#9eb1bb] mx-auto" />
                <p className="text-sm font-semibold text-[#162229]">
                  Nenhum registro encontrado no histórico para os filtros informados.
                </p>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={onClearFilters}
                    className={`${BUTTON_VARIANTS.mineralBlue} px-3.5 py-1.5 text-xs`}
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            </section>
          ) : (
            <div className="space-y-6" aria-label="Lista de ocorrências agrupadas por dia">
              {dayGroups.map((group, idx) => {
                const dayLabel = formatDayDividerLabelBR(group.dateIso);
                const isToday = group.dateIso === todayIso;
                const isYesterday = group.dateIso === yesterdayIso;
                const dayMissingInc = group.items.filter((item) => !hasValidInc(item.inc)).length;

                return (
                  <motion.section
                    key={group.dateIso}
                    aria-label={`Dia ${dayLabel}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.18,
                      delay: Math.min(idx * 0.035, 0.12),
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="space-y-2.5"
                  >
                    {/* Vertical Day Divider */}
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 px-1">
                      <div
                        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-[13px] font-semibold tracking-[-0.015em] shadow-2xs shrink-0 ${
                          isToday
                            ? 'bg-[#E7F4F3] border-[#B3DCD9] text-[#005451]'
                            : 'bg-white border-[#c8d5db] text-[#162229]'
                        }`}
                      >
                        <Calendar
                          className={`w-3.5 h-3.5 shrink-0 ${isToday ? 'text-[#00807C]' : 'text-[#1F6E9C]'}`}
                        />
                        <span>{dayLabel}</span>
                        {isToday && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#005451] bg-white/80 border border-[#B3DCD9] px-1.5 py-0.2 rounded-lg">
                            Hoje
                          </span>
                        )}
                        {isYesterday && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#4e6b7c] bg-[#f4f7f9] border border-[#d4dfe4] px-1.5 py-0.2 rounded-lg">
                            Ontem
                          </span>
                        )}
                      </div>

                      <div className="hidden sm:block flex-1 h-px bg-[#d4dfe4]" aria-hidden="true" />

                      <div className="flex items-center gap-1.5 text-xs font-medium text-[#5c6c75]">
                        <span className="tabular-nums">
                          {group.items.length}{' '}
                          {group.items.length === 1 ? 'ocorrência' : 'ocorrências'}
                        </span>
                        {dayMissingInc > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums text-[#8A5602] font-semibold">
                              {dayMissingInc} sem INC
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Day Container (vertically separated cards) */}
                    <div className="space-y-3">
                      {group.items.map((item) => (
                        <AcionamentoListRow
                          key={item.id}
                          item={item}
                          showDateInTimeAnchor={false}
                          compactOperator
                          onSelectAcionamento={onSelectAcionamento}
                          onNotify={onNotify}
                        />
                      ))}
                    </div>
                  </motion.section>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#5c6c75] px-1">
            <div className="flex items-center gap-3">
              <span className="tabular-nums font-medium text-[#3e4e57]">
                {filtered.length}{' '}
                {filtered.length === 1 ? 'ocorrência exibida' : 'ocorrências exibidas'}
                {dayGroups.length > 0 && (
                  <>
                    {' '}
                    em {dayGroups.length} {dayGroups.length === 1 ? 'dia' : 'dias'}
                  </>
                )}
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{missingIncInResult} sem INC</span>
            </div>
            {hasFilters && (
              <button
                type="button"
                onClick={onClearFilters}
                className="text-[#00807C] hover:underline font-semibold cursor-pointer"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
