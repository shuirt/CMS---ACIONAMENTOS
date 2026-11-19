import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  Calendar,
  FileText,
  History,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { AcionamentoListRow } from '../components/AcionamentoListRow';
import { ACIONAMENTO_PAGE_SIZE, PaginationControls } from '../components/PaginationControls';
import { TechnologyUsageChart } from '../components/TechnologyUsageChart';
import { BUTTON_VARIANTS, SURFACE_TOKENS } from '../design/tokens';
import type {
  Acionamento,
  IncFilter,
  RegistrosDateFilter,
  RegistrosTab,
} from '../types/acionamento';
import {
  filterAcionamentos,
  formatDateBR,
  formatDayDividerLabelBR,
  formatLongDateBR,
  formatShortDayHeaderBR,
  getTodayIsoDate,
  getUniqueOperators,
  groupAcionamentosByDate,
  hasValidInc,
  isIncRequiredForStatus,
  isValidIsoDate,
} from '../utils/validation';

interface RegistrosPageProps {
  acionamentos: Acionamento[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  syncedAt: string;
  isDemoMode?: boolean;
  activeTab: RegistrosTab;
  initialContinuousMode?: boolean;
  incFilter: IncFilter;
  search: string;
  operatorFilter: string;
  dateFilter?: RegistrosDateFilter;
  onDateFilterChange?: (date: RegistrosDateFilter) => void;
  onTabChange: (tab: RegistrosTab) => void;
  onIncFilterChange: (filter: IncFilter) => void;
  onSearchChange: (value: string) => void;
  onOperatorFilterChange: (value: string) => void;
  onRefresh: () => void;
  onNewAcionamento: () => void;
  onSelectAcionamento: (item: Acionamento) => void;
  onNotify: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const TAB_TITLES: Record<RegistrosTab, string> = {
  aberto: 'Em aberto',
  encerrado: 'Encerrados',
  todos: 'Todos os registros',
};

export function RegistrosPage({
  acionamentos,
  loading,
  refreshing,
  error,
  syncedAt,
  isDemoMode = false,
  activeTab,
  initialContinuousMode,
  incFilter,
  search,
  operatorFilter,
  dateFilter: propDateFilter,
  onDateFilterChange,
  onTabChange,
  onIncFilterChange,
  onSearchChange,
  onOperatorFilterChange,
  onRefresh,
  onNewAcionamento,
  onSelectAcionamento,
  onNotify,
}: RegistrosPageProps) {
  const [internalDateFilter, setInternalDateFilter] = useState<RegistrosDateFilter>('hoje');
  const [activeRecordsView, setActiveRecordsView] = useState<'records' | 'technology'>('records');
  const dateFilter = propDateFilter ?? internalDateFilter;
  const setDateFilter = onDateFilterChange ?? setInternalDateFilter;

  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [continuousMode, setContinuousMode] = useState(
    initialContinuousMode ?? false
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [isNearBottom, setIsNearBottom] = useState(false);
  const [activeDateIso, setActiveDateIso] = useState<string>('');

  const searchRef = useRef<HTMLInputElement | null>(null);
  const timelineRootRef = useRef<HTMLDivElement | null>(null);
  const timelinePresentRef = useRef<HTMLDivElement | null>(null);
  const stickyNavRef = useRef<HTMLDivElement | null>(null);
  const dateGroupRefs = useRef<Record<string, HTMLElement | null>>({});

  const todayIso = getTodayIsoDate();
  const yesterdayIso = useMemo(() => {
    const [y, m, d] = todayIso.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d - 1));
    return dt.toISOString().slice(0, 10);
  }, [todayIso]);

  const targetDateIso = useMemo(() => {
    if (dateFilter === 'hoje') return todayIso;
    if (dateFilter === 'ontem') return yesterdayIso;
    if (dateFilter === 'todas') return null;
    return isValidIsoDate(dateFilter) ? dateFilter : null;
  }, [dateFilter, todayIso, yesterdayIso]);

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

  const operatorOptions = useMemo(
    () => getUniqueOperators(acionamentos),
    [acionamentos]
  );

  const filteredItems = useMemo(
    () =>
      filterAcionamentos(acionamentos, {
        tab: activeTab,
        sortOrder: continuousMode ? 'asc' : sortOrder,
        incFilter,
        search,
        operatorFilter,
        dateExact: continuousMode ? undefined : targetDateIso,
      }),
    [acionamentos, activeTab, continuousMode, sortOrder, incFilter, search, operatorFilter, targetDateIso]
  );

  const tabCounts = useMemo(
    () => ({
      aberto: filterAcionamentos(acionamentos, {
        tab: 'aberto',
        incFilter,
        search,
        operatorFilter,
        dateExact: continuousMode ? undefined : targetDateIso,
      }).length,
      encerrado: filterAcionamentos(acionamentos, {
        tab: 'encerrado',
        incFilter,
        search,
        operatorFilter,
        dateExact: continuousMode ? undefined : targetDateIso,
      }).length,
      todos: filterAcionamentos(acionamentos, {
        tab: 'todos',
        incFilter,
        search,
        operatorFilter,
        dateExact: continuousMode ? undefined : targetDateIso,
      }).length,
    }),
    [acionamentos, incFilter, search, operatorFilter, continuousMode, targetDateIso]
  );

  const incCounts = useMemo(() => {
    const base = filterAcionamentos(acionamentos, {
      tab: activeTab,
      search,
      operatorFilter,
      dateExact: continuousMode ? undefined : targetDateIso,
    });
    const comInc = base.filter((i) => hasValidInc(i.inc)).length;
    const semInc = base.filter(
      (item) => isIncRequiredForStatus(item.statusOperacional) && !hasValidInc(item.inc)
    ).length;
    return { total: base.length, comInc, semInc };
  }, [acionamentos, activeTab, search, operatorFilter, continuousMode, targetDateIso]);

  const dateTotals = useMemo(() => {
    const base = filterAcionamentos(acionamentos, {
      search,
      operatorFilter,
      incFilter,
    });
    return {
      hoje: base.filter((a) => a.dataRegistro === todayIso).length,
      ontem: base.filter((a) => a.dataRegistro === yesterdayIso).length,
      todas: base.length,
    };
  }, [acionamentos, search, operatorFilter, incFilter, todayIso, yesterdayIso]);

  const pendingYesterdayCount = useMemo(() => {
    return acionamentos.filter(
      (a) =>
        a.dataRegistro === yesterdayIso &&
        a.statusOperacional === 'Em andamento'
    ).length;
  }, [acionamentos, yesterdayIso]);

  useEffect(() => {
    setCurrentPage(0);
  }, [filteredItems]);

  const pageItems = useMemo(
    () =>
      filteredItems.slice(
        currentPage * ACIONAMENTO_PAGE_SIZE,
        (currentPage + 1) * ACIONAMENTO_PAGE_SIZE
      ),
    [filteredItems, currentPage]
  );

  const timelineGroups = useMemo(
    () => (continuousMode ? groupAcionamentosByDate(pageItems) : []),
    [continuousMode, pageItems]
  );

  const pendingReportsCount = useMemo(
    () => filteredItems.filter((item) => item.statusOperacional === 'Report').length,
    [filteredItems]
  );

  const missingIncCount = useMemo(
    () =>
      filteredItems.filter(
        (item) => isIncRequiredForStatus(item.statusOperacional) && !hasValidInc(item.inc)
      ).length,
    [filteredItems]
  );

  const lastSyncFormatted = useMemo(() => {
    if (!syncedAt) return 'Aguardando sincronização';
    const dt = new Date(syncedAt);
    if (Number.isNaN(dt.getTime())) return 'Sincronizado';
    return `Última atualização às ${dt.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })}`;
  }, [syncedAt]);

  const getStickyHeaderOffset = useCallback(() => {
    const headerBottom =
      document.querySelector('header')?.getBoundingClientRect().bottom ?? (isDemoMode ? 90 : 60);
    const navHeight = stickyNavRef.current?.getBoundingClientRect().height ?? 60;
    return headerBottom + navHeight + 18;
  }, [isDemoMode]);

  const updateScrollState = useCallback(() => {
    if (!continuousMode || timelineGroups.length === 0) return;

    const presentEl = timelinePresentRef.current;
    if (presentEl) {
      const pRect = presentEl.getBoundingClientRect();
      setIsNearBottom(pRect.bottom <= window.innerHeight + 60);
    }

    const threshold = getStickyHeaderOffset() + 28;
    let current = timelineGroups[0].dateIso;
    for (const grp of timelineGroups) {
      const node = dateGroupRefs.current[grp.dateIso];
      if (node && node.getBoundingClientRect().top <= threshold) {
        current = grp.dateIso;
      }
    }
    setActiveDateIso(current);
  }, [continuousMode, getStickyHeaderOffset, timelineGroups]);

  useEffect(() => {
    if (!continuousMode || loading) return;
    const raf = window.requestAnimationFrame(() => updateScrollState());
    window.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState, { passive: true });
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [continuousMode, loading, updateScrollState]);

  const scrollToPresent = () => {
    const presentEl = timelinePresentRef.current;
    if (!presentEl) return;
    const rect = presentEl.getBoundingClientRect();
    const targetY = Math.max(0, rect.bottom + window.scrollY - window.innerHeight + 28);
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  };

  const scrollToPastTop = () => {
    const rootEl = timelineRootRef.current;
    if (!rootEl) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const headerBottom =
      document.querySelector('header')?.getBoundingClientRect().bottom ?? (isDemoMode ? 90 : 60);
    const targetY = Math.max(0, rootEl.getBoundingClientRect().top + window.scrollY - headerBottom - 14);
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  };

  const scrollToDateGroup = (dateIso: string) => {
    const target = dateGroupRefs.current[dateIso];
    if (!target) return;
    setActiveDateIso(dateIso);
    const targetY = Math.max(
      0,
      target.getBoundingClientRect().top + window.scrollY - getStickyHeaderOffset()
    );
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  };

  const tabs: Array<{ id: RegistrosTab; label: string; count: number }> = [
    { id: 'aberto', label: 'Em aberto', count: tabCounts.aberto },
    { id: 'encerrado', label: 'Encerrado', count: tabCounts.encerrado },
    { id: 'todos', label: 'Todos', count: tabCounts.todos },
  ];

  const hasAnyFilter = Boolean(
    search.trim() ||
    operatorFilter !== 'Todos' ||
    incFilter !== 'todos' ||
    dateFilter !== 'hoje' ||
    sortOrder !== 'desc'
  );

  const clearAllFilters = () => {
    onSearchChange('');
    onOperatorFilterChange('Todos');
    onIncFilterChange('todos');
    setDateFilter('hoje');
    setSortOrder('desc');
  };

  const renderAcionamentoRow = (item: Acionamento, showFullDateInSubtitle: boolean) => (
    <AcionamentoListRow
      key={item.id}
      item={item}
      showDateInTimeAnchor={showFullDateInSubtitle}
      onSelectAcionamento={onSelectAcionamento}
      onNotify={onNotify}
    />
  );

  return (
    <div className={SURFACE_TOKENS.pageContainer}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div
          role="tablist"
          aria-label="Visualização de registros"
          className="lg:col-span-12 flex gap-2"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeRecordsView === 'records'}
            onClick={() => setActiveRecordsView('records')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
              activeRecordsView === 'records'
                ? 'bg-[#005C59] border-[#005C59] text-white shadow-xs'
                : 'bg-white border-[#D4DFE4] text-[#52636D] hover:text-[#162229]'
            }`}
          >
            <FileText className="w-4 h-4" aria-hidden="true" />
            Registros
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeRecordsView === 'technology'}
            onClick={() => setActiveRecordsView('technology')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
              activeRecordsView === 'technology'
                ? 'bg-[#005C59] border-[#005C59] text-white shadow-xs'
                : 'bg-white border-[#D4DFE4] text-[#52636D] hover:text-[#162229]'
            }`}
          >
            <BarChart3 className="w-4 h-4" aria-hidden="true" />
            Gráficos
          </button>
        </div>

        {/* Left Sidebar: Header, Buttons & Filters */}
        {activeRecordsView === 'records' && (
        <aside className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
          <div className="bg-white border border-[#D4DFE4] rounded-2xl p-5 shadow-2xs space-y-5">
            {/* Title & Action */}
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <h1 className="text-[22px] sm:text-[24px] font-bold text-[#162229] tracking-[-0.015em]">
                  {TAB_TITLES[activeTab]}
                </h1>
                <p className="text-[13px] text-[#52636D]">
                  {continuousMode
                    ? 'Linha contínua cronológica'
                    : dateFilter === 'hoje'
                      ? `${formatLongDateBR(todayIso)}`
                      : dateFilter === 'ontem'
                        ? `${formatLongDateBR(yesterdayIso)}`
                        : 'Todas as datas'}
                </p>
              </div>

              <button
                type="button"
                onClick={onNewAcionamento}
                className={`${BUTTON_VARIANTS.primary} w-full text-[14px] px-4 py-2.5 justify-center`}
              >
                <Plus className="w-4 h-4" />
                <span>Novo acionamento</span>
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
                  aria-label="Pesquisar acionamentos"
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Buscar INC, local, operador..."
                  className="w-full h-9 pl-9 pr-8 bg-[#F4F7F9] hover:bg-white text-[#162229] text-xs rounded-xl border border-[#D4DFE4] focus:bg-white focus:border-[#00807C] focus:outline-none transition-colors placeholder:text-[#77787B]/75"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    aria-label="Limpar busca"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#77787B] hover:text-[#162229] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Data Operacional */}
            <div className="space-y-1.5">
              <span className="block text-xs font-bold text-[#3e4e57] uppercase tracking-wider">
                Período / Data
              </span>
              <div
                className="grid grid-cols-3 p-1 rounded-xl bg-[#EDF2F4] gap-1"
                role="group"
                aria-label="Filtrar por data operacional"
              >
                <button
                  type="button"
                  aria-pressed={dateFilter === 'hoje' && !continuousMode}
                  onClick={() => {
                    setContinuousMode(false);
                    setDateFilter('hoje');
                  }}
                  className={`flex flex-col items-center justify-center px-2 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    dateFilter === 'hoje' && !continuousMode
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
                  aria-pressed={dateFilter === 'ontem' && !continuousMode}
                  onClick={() => {
                    setContinuousMode(false);
                    setDateFilter('ontem');
                  }}
                  className={`flex flex-col items-center justify-center px-2 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    dateFilter === 'ontem' && !continuousMode
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
                  aria-pressed={dateFilter === 'todas'}
                  onClick={() => {
                    setContinuousMode(true);
                    setDateFilter('todas');
                  }}
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

            {/* Status (Em aberto / Encerrado / Todos) */}
            <div className="space-y-1.5">
              <span className="block text-xs font-bold text-[#3e4e57] uppercase tracking-wider">
                Status Operacional
              </span>
              <div
                className="grid grid-cols-3 p-1 rounded-xl bg-[#EDF2F4] gap-1"
                role="tablist"
                aria-label="Filtrar acionamentos por status"
              >
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const isOpenAlert = tab.id === 'aberto' && tab.count > 0;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => onTabChange(tab.id)}
                      className={`flex flex-col items-center justify-center px-2 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-white text-[#162229] font-semibold shadow-xs'
                          : 'text-[#52636D] hover:text-[#162229]'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`text-[11px] font-mono font-semibold px-1 rounded ${
                          isActive
                            ? 'text-[#005451]'
                            : isOpenAlert
                              ? 'text-[#8A5602]'
                              : 'text-[#64737C]'
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <hr className="border-[#EDF2F4]" />

            {/* Secondary Filters */}
            <div className="space-y-3">
              <span className="block text-xs font-bold text-[#3e4e57] uppercase tracking-wider">
                Filtros &amp; Exibição
              </span>

              {/* Operador dropdown */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#52636d]">Operador CMS</label>
                <div className="relative">
                  <select
                    aria-label="Filtrar por operador CMS"
                    value={operatorFilter}
                    onChange={(e) => onOperatorFilterChange(e.target.value)}
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
                    onClick={() => onIncFilterChange('todos')}
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
                    onClick={() => onIncFilterChange('com_inc')}
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
                    onClick={() => onIncFilterChange('sem_inc')}
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

              {/* Sort & Timeline Mode */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                  className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-[#F4F7F9] hover:bg-white border border-[#D4DFE4] text-[11.5px] font-medium text-[#3E4E57] transition-colors cursor-pointer"
                >
                  <ArrowUpDown className="w-3 h-3 text-[#00807C]" />
                  <span>{sortOrder === 'asc' ? 'Antigas topo' : 'Recentes topo'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setContinuousMode((prev) => !prev)}
                  className={`inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl text-[11.5px] font-medium border transition-colors cursor-pointer ${
                    continuousMode
                      ? 'bg-[#E7F4F3] border-[#00807C] text-[#005451] font-semibold'
                      : 'bg-[#F4F7F9] hover:bg-white border-[#D4DFE4] text-[#52636D]'
                  }`}
                >
                  <History className="w-3 h-3" />
                  <span>Linha contínua</span>
                </button>
              </div>

              {hasAnyFilter && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[#00807C] hover:text-[#005451] bg-[#E7F4F3]/50 hover:bg-[#E7F4F3] rounded-xl border border-[#9fd0cc]/40 transition-colors cursor-pointer mt-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpar todos os filtros</span>
                </button>
              )}
            </div>
          </div>
        </aside>
        )}

        {/* Right Main Column: Alerts & Records List */}
        <main className={`${activeRecordsView === 'technology' ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-4 min-w-0`}>
          {activeRecordsView === 'technology' ? (
            <TechnologyUsageChart acionamentos={acionamentos} loading={loading} />
          ) : (
          <>
          {/* Handover Alert: Open items from yesterday when viewing Hoje */}
          {pendingYesterdayCount > 0 && dateFilter === 'hoje' && !continuousMode && (
            <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2 bg-[#FEF6E3] border border-[#F3D085] rounded-xl text-xs text-[#8A5602] shadow-2xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#EEA722] shrink-0" />
                <span>
                  Atenção de turno: há <strong>{pendingYesterdayCount}</strong> {pendingYesterdayCount === 1 ? 'ocorrência pendente' : 'ocorrências pendentes'} de <strong>Ontem</strong> no CMS.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setContinuousMode(false);
                  setDateFilter('ontem');
                }}
                className="inline-flex items-center gap-1 font-semibold text-[#005C59] hover:underline cursor-pointer"
              >
                <span>Ver registros de Ontem ({dateTotals.ontem})</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          )}

          {/* Connection / Fetch Error Alert */}
          {error && (
            <div
              role="alert"
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-[#fcefef] border border-[#ecc4c3] px-5 py-4 text-sm text-[#8c3230]"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-[#b94a48] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Erro ao sincronizar com a planilha</p>
                  <p className="text-xs text-[#8c3230]/90 mt-0.5">{error}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onRefresh}
                className="px-3.5 py-1.5 rounded-xl bg-[#b94a48] hover:bg-[#9c3b39] text-white text-xs font-semibold shrink-0 cursor-pointer"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* List of Acionamentos */}
          <section aria-label="Lista de acionamentos">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((skeleton) => (
                  <div
                    key={skeleton}
                    className={`${SURFACE_TOKENS.card} flex items-center justify-between px-6 py-4.5 min-h-[76px] animate-pulse`}
                  >
                    <div className="flex items-center gap-6 min-w-0 flex-1">
                      <div className="h-6 w-14 bg-[#e4ecef] rounded-lg" />
                      <div className="space-y-2 flex-1 max-w-md">
                        <div className="h-4 w-3/4 bg-[#e4ecef] rounded-lg" />
                        <div className="h-3 w-1/2 bg-[#eff4f6] rounded-lg" />
                      </div>
                    </div>
                    <div className="h-6 w-24 bg-[#e4ecef] rounded-xl" />
                  </div>
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className={`${SURFACE_TOKENS.card} px-6 py-14 text-center space-y-3 bg-white`}>
                <div className="w-11 h-11 rounded-2xl bg-[#eef3f6] border border-[#d4dfe4] text-[#4e6b7c] flex items-center justify-center mx-auto">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-[#162229]">
                    {hasAnyFilter
                      ? dateFilter === 'hoje'
                        ? 'Nenhum acionamento encontrado para hoje com os filtros aplicados'
                        : dateFilter === 'ontem'
                          ? 'Nenhum acionamento encontrado para ontem com os filtros aplicados'
                          : 'Nenhum acionamento encontrado para os filtros aplicados'
                      : dateFilter === 'hoje'
                        ? 'Nenhum acionamento registrado hoje'
                        : dateFilter === 'ontem'
                          ? 'Nenhum acionamento registrado ontem'
                          : activeTab === 'aberto'
                            ? 'Nenhum acionamento em aberto no momento'
                            : activeTab === 'encerrado'
                              ? 'Nenhum acionamento encerrado encontrado'
                              : 'Nenhum acionamento cadastrado'}
                  </p>
                  <p className="text-xs text-[#64737c]">
                    {hasAnyFilter
                      ? 'Tente ajustar os filtros de data, operador, INC ou buscar por outro termo.'
                      : 'Clique em "Novo acionamento" para registrar uma ocorrência no CMS.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {hasAnyFilter && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className={`${BUTTON_VARIANTS.mineralBlue} px-3.5 py-1.5 text-xs`}
                    >
                      Limpar filtros
                    </button>
                  )}
                  {dateFilter === 'hoje' && dateTotals.ontem > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setContinuousMode(false);
                        setDateFilter('ontem');
                      }}
                      className={`${BUTTON_VARIANTS.secondary} px-3.5 py-1.5 text-xs`}
                    >
                      Ver registros de Ontem ({dateTotals.ontem})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onNewAcionamento}
                    className={`${BUTTON_VARIANTS.primary} px-4 py-2 text-xs`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Novo acionamento</span>
                  </button>
                </div>
              </div>
            ) : continuousMode ? (
              <div ref={timelineRootRef} data-testid="timeline-flow" className="space-y-6">
                {/* Sticky Floating Timeline Navigation Bar */}
                <div
                  ref={stickyNavRef}
                  data-testid="timeline-sticky-nav"
                  className={`sticky ${
                    isDemoMode ? 'top-[148px] sm:top-[96px]' : 'top-[108px] sm:top-[68px]'
                  } z-20 bg-white/95 backdrop-blur-md border border-[#c8d5db] rounded-2xl px-4 sm:px-5 py-3 shadow-[0_8px_22px_-8px_rgba(22,34,41,0.14)] flex flex-col lg:flex-row lg:items-center justify-between gap-2.5`}
                  aria-label="Navegação da linha contínua"
                >
                  <div className="flex items-center gap-2 overflow-x-auto pb-0.5 lg:pb-0 min-w-0">
                    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-[#005C59] shrink-0 pr-1">
                      <History className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Datas:</span>
                    </span>
                    {timelineGroups.map((group) => {
                      const isToday = group.dateIso === todayIso;
                      const isHighlighted = activeDateIso === group.dateIso;
                      const jumpLabel = isToday
                        ? 'Hoje'
                        : formatDayDividerLabelBR(group.dateIso).slice(0, 10);
                      return (
                        <button
                          key={group.dateIso}
                          type="button"
                          onClick={() => scrollToDateGroup(group.dateIso)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                            isHighlighted
                              ? 'bg-[#005C59] border-[#005C59] text-white shadow-xs'
                              : isToday
                                ? 'bg-[#e7f4f3] text-[#005451] border-[#9fd0cc] hover:bg-[#d5ecea]'
                                : 'bg-[#f6f9fa] text-[#3e4e57] border-[#d4dfe4] hover:bg-white hover:text-[#162229] hover:border-[#9fb3bd]'
                          }`}
                        >
                          <span>{jumpLabel}</span>
                          <span
                            className={`text-[10.5px] font-mono tabular-nums px-1.5 py-0.2 rounded-md ${
                              isHighlighted
                                ? 'bg-white/20 text-white'
                                : isToday
                                  ? 'bg-white/80 text-[#005451]'
                                  : 'bg-[#e7eef2] text-[#52636d]'
                            }`}
                          >
                            {group.items.length}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-end gap-2 shrink-0 pt-1 lg:pt-0 border-t lg:border-t-0 border-[#eef3f5]">
                    <button
                      type="button"
                      onClick={scrollToPastTop}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f6f9fa] hover:bg-white border border-[#d4dfe4] hover:border-[#9fb3bd] text-xs font-semibold text-[#3e4e57] hover:text-[#162229] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Mais antigos</span>
                    </button>
                    <button
                      type="button"
                      onClick={scrollToPresent}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        !isNearBottom
                          ? 'bg-[#00807C] text-white shadow-xs hover:bg-[#006562]'
                          : 'bg-[#e7f4f3] border border-[#9fd0cc] text-[#005451] hover:bg-[#d5ecea]'
                      }`}
                    >
                      <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{!isNearBottom ? 'Ir ao presente' : 'No presente'}</span>
                    </button>
                  </div>
                </div>

                {/* Chronological Day Sections directly on Canvas */}
                <div className="space-y-8" aria-label="Linha do tempo contínua de acionamentos">
                  {timelineGroups.map((group, idx) => {
                    const isToday = group.dateIso === todayIso;
                    const isYesterday = group.dateIso === yesterdayIso;
                    const dayLabel = formatShortDayHeaderBR(group.dateIso, todayIso);
                    const dayMissingInc = group.items.filter(
                      (item) =>
                        isIncRequiredForStatus(item.statusOperacional) && !hasValidInc(item.inc)
                    ).length;

                    return (
                      <section
                        key={group.dateIso}
                        ref={(node) => {
                          dateGroupRefs.current[group.dateIso] = node;
                        }}
                        aria-label={`Dia ${dayLabel}`}
                        className="relative pl-5 sm:pl-7"
                      >
                        {/* Continuous Vertical Timeline Rail */}
                        <div
                          aria-hidden="true"
                          className={`absolute left-[9px] sm:left-[11px] top-4 ${
                            idx === timelineGroups.length - 1 ? '-bottom-4' : '-bottom-8'
                          } w-[2px] rounded-full ${
                            isToday ? 'bg-[#00807C]/45' : 'bg-[#c5d4dc]'
                          }`}
                        />

                        {/* Prominent Day Divider Header */}
                        <div
                          data-testid="timeline-day-divider"
                          className="relative flex flex-wrap items-center justify-between gap-x-3 gap-y-2 mb-4"
                        >
                          {/* Timeline Milestone Node */}
                          <span
                            aria-hidden="true"
                            className={`absolute -left-5 sm:-left-7 top-1/2 -translate-y-1/2 w-[20px] h-[20px] sm:w-[24px] sm:h-[24px] rounded-full flex items-center justify-center ring-4 ring-[#eaf0f2] ${
                              isToday
                                ? 'bg-[#00807C] shadow-xs'
                                : 'bg-white border-2 border-[#7e98a6]'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isToday ? 'bg-white' : 'bg-[#1F6E9C]'
                              }`}
                            />
                          </span>

                          <div
                            className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl border shadow-2xs ${
                              isToday
                                ? 'bg-[#E7F4F3] border-[#9fd0cc] text-[#004744]'
                                : 'bg-white border-[#c8d5db] text-[#162229]'
                            }`}
                          >
                            <Calendar
                              className={`w-4.5 h-4.5 shrink-0 ${
                                isToday ? 'text-[#00807C]' : 'text-[#1F6E9C]'
                              }`}
                              aria-hidden="true"
                            />
                            <h2 className="text-[15px] sm:text-[16px] leading-snug font-bold tracking-[-0.015em]">
                              {dayLabel}
                            </h2>
                            {isToday && (
                              <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#8a5602] bg-[#fef6e3] border border-[#f3d085] px-2 py-0.5 rounded-lg">
                                Presente
                              </span>
                            )}
                            {isYesterday && !isToday && (
                              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[#4e6b7c] bg-[#f4f7f9] border border-[#d4dfe4] px-2 py-0.5 rounded-lg">
                                Ontem
                              </span>
                            )}
                          </div>

                          <div
                            className="hidden sm:block flex-1 h-px bg-[#c7d6dd]"
                            aria-hidden="true"
                          />

                          <div className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-[#52636d] tabular-nums bg-white/80 border border-[#d4dfe4] px-3 py-1.5 rounded-xl">
                            <span>
                              {group.items.length}{' '}
                              {group.items.length === 1 ? 'acionamento' : 'acionamentos'}
                            </span>
                            {dayMissingInc > 0 && (
                              <>
                                <span aria-hidden="true" className="text-[#9fb1bb]">
                                  ·
                                </span>
                                <span className="text-[#8A5602]">{dayMissingInc} sem INC</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Vertically Separated Cards */}
                        <div className="space-y-3">
                          {group.items.map((item) => renderAcionamentoRow(item, false))}
                        </div>
                      </section>
                    );
                  })}
                </div>

                {/* Presente End Milestone */}
                <div
                  ref={timelinePresentRef}
                  className="relative pl-5 sm:pl-7 pt-2"
                >
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[20px] h-[20px] sm:w-[24px] sm:h-[24px] rounded-full bg-[#00807C] ring-4 ring-[#eaf0f2] flex items-center justify-center shadow-xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-white" />
                  </span>
                  <div className="bg-[#e7f4f3] border border-[#9fd0cc] rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-[13px] text-[#004744] shadow-2xs">
                    <span className="inline-flex items-center gap-2 font-semibold">
                      <span>Presente · Registros mais recentes nesta extremidade</span>
                    </span>
                    <button
                      type="button"
                      onClick={onNewAcionamento}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#00807C] hover:bg-[#006562] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Registrar novo acionamento</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <motion.div
                key={`${activeTab}-${incFilter}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-3"
              >
                {pageItems.map((item) => renderAcionamentoRow(item, true))}
              </motion.div>
            )}
          </section>

          <PaginationControls
            page={currentPage}
            totalItems={filteredItems.length}
            onPageChange={setCurrentPage}
          />

          {/* Quiet Metrics Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 pt-0.5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[#5c6c75] text-[12px] leading-[18px]">
              <span>
                Exibindo <strong>{pageItems.length}</strong> de{' '}
                <strong>{filteredItems.length}</strong> resultados
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Pendentes (Report): <strong>{pendingReportsCount}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Sem INC: <strong>{missingIncCount}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-[11.5px] text-[#64737c]">
              <span>{lastSyncFormatted}</span>
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                title="Atualizar dados da planilha"
                aria-label="Atualizar dados da planilha"
                className="p-1 rounded-lg hover:bg-[#e4ecef] text-[#52636d] transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          </>
          )}
        </main>
      </div>
    </div>
  );
}
