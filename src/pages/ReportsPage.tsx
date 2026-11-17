import { useMemo, useState } from 'react';
import { AlertCircle, ChevronRight, FileText, Plus, RefreshCw, RotateCcw, Search, X } from 'lucide-react';
import { IncBadge } from '../components/IncBadge';
import { getOperatorInitials } from '../components/OperatorCell';
import { BUTTON_VARIANTS, SURFACE_TOKENS } from '../design/tokens';
import type { Report } from '../types/acionamento';
import { formatDateBR, getTodayIsoDate, hasValidInc } from '../utils/validation';

interface ReportsPageProps {
  reports: Report[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  onNewReport: () => void;
  onSelectReport: (report: Report) => void;
  onNotify: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onRefresh: () => void;
}

type IncFilter = 'todos' | 'com_inc' | 'sem_inc';
type DateFilter = 'hoje' | 'ontem' | 'todas';

export function ReportsPage({
  reports,
  loading,
  refreshing,
  error,
  onNewReport,
  onSelectReport,
  onNotify,
  onRefresh,
}: ReportsPageProps) {
  const [search, setSearch] = useState('');
  const [operatorFilter, setOperatorFilter] = useState('Todos');
  const [incFilter, setIncFilter] = useState<IncFilter>('todos');
  const [dateFilter, setDateFilter] = useState<DateFilter>('todas');

  const todayIso = getTodayIsoDate();
  const yesterdayIso = useMemo(() => {
    const [year, month, day] = todayIso.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day - 1)).toISOString().slice(0, 10);
  }, [todayIso]);

  const operatorOptions = useMemo(
    () =>
      [...new Set(reports.map((report) => report.createdByName.trim()).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b, 'pt-BR')
      ),
    [reports]
  );

  const dateTotals = useMemo(
    () => ({
      hoje: reports.filter((report) => report.dataRegistro === todayIso).length,
      ontem: reports.filter((report) => report.dataRegistro === yesterdayIso).length,
      todas: reports.length,
    }),
    [reports, todayIso, yesterdayIso]
  );

  const filteredReports = useMemo(() => {
    const term = search.trim().toLowerCase();
    return reports.filter((report) => {
      if (dateFilter === 'hoje' && report.dataRegistro !== todayIso) return false;
      if (dateFilter === 'ontem' && report.dataRegistro !== yesterdayIso) return false;
      if (operatorFilter !== 'Todos' && report.createdByName.trim() !== operatorFilter) return false;
      if (incFilter === 'com_inc' && !hasValidInc(report.inc)) return false;
      if (incFilter === 'sem_inc' && hasValidInc(report.inc)) return false;
      if (!term) return true;

      const haystack = [
        `report #${report.numeroReport}`,
        report.inc,
        report.dataRegistro,
        report.horario,
        report.municipio,
        report.tipoLocalidade,
        report.kmFerroviario,
        report.analistaResponsavel,
        report.tipificacao,
        report.descricao,
        report.createdByName,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [reports, search, operatorFilter, incFilter, dateFilter, todayIso, yesterdayIso]);

  const hasAnyFilter = Boolean(
    search.trim() ||
      operatorFilter !== 'Todos' ||
      incFilter !== 'todos' ||
      dateFilter !== 'todas'
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
        <aside className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
          <div className="bg-white border border-[#D4DFE4] rounded-2xl p-5 shadow-2xs space-y-5">
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <h1 className="text-[22px] sm:text-[24px] font-bold text-[#162229] tracking-[-0.015em]">
                  Reports
                </h1>
                <p className="text-[13px] text-[#52636D]">
                  Gestão de Reports e referências dos acionamentos
                </p>
              </div>
              <button
                type="button"
                onClick={onNewReport}
                className={`${BUTTON_VARIANTS.primary} w-full text-[14px] px-4 py-2.5 justify-center`}
              >
                <Plus className="w-4 h-4" />
                <span>Novo Report</span>
              </button>
              <button
                type="button"
                disabled={refreshing || loading}
                onClick={onRefresh}
                className={`${BUTTON_VARIANTS.secondary} w-full text-xs px-4 py-2 justify-center`}
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#00807C] ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Atualizando...' : 'Atualizar Reports'}</span>
              </button>
            </div>

            <hr className="border-[#EDF2F4]" />

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#3e4e57] uppercase tracking-wider">
                Pesquisa
              </label>
              <div className="relative w-full">
                <Search className="absolute inset-y-0 left-0 ml-3 my-auto w-4 h-4 text-[#64737C]" />
                <input
                  type="search"
                  aria-label="Pesquisar Reports"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar número, INC, município..."
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

            <div className="space-y-1.5">
              <span className="block text-xs font-bold text-[#3e4e57] uppercase tracking-wider">
                Período / Data
              </span>
              <div
                className="grid grid-cols-3 p-1 rounded-xl bg-[#EDF2F4] gap-1"
                role="group"
                aria-label="Filtrar Reports por data"
              >
                {([
                  ['hoje', 'Hoje'],
                  ['ontem', 'Ontem'],
                  ['todas', 'Todas'],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDateFilter(value)}
                    className={`flex flex-col items-center justify-center px-2 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      dateFilter === value
                        ? 'bg-white text-[#162229] font-semibold shadow-xs'
                        : 'text-[#52636D] hover:text-[#162229]'
                    }`}
                  >
                    <span>{label}</span>
                    <span className="text-[11px] font-mono font-bold text-[#005451]">
                      {dateTotals[value]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-[#EDF2F4]" />

            <div className="space-y-3">
              <span className="block text-xs font-bold text-[#3e4e57] uppercase tracking-wider">
                Filtros
              </span>

              <div className="space-y-1">
                <label htmlFor="report-operator-filter" className="text-[11px] font-medium text-[#52636d]">
                  Operador CMS
                </label>
                <select
                  id="report-operator-filter"
                  aria-label="Filtrar Reports por operador"
                  value={operatorFilter}
                  onChange={(event) => setOperatorFilter(event.target.value)}
                  className={`w-full h-9 pl-3 pr-8 text-xs font-medium rounded-xl border appearance-none transition-colors cursor-pointer ${
                    operatorFilter !== 'Todos'
                      ? 'bg-[#E7F4F3] border-[#00807C] text-[#005451] font-semibold'
                      : 'bg-[#F4F7F9] hover:bg-white border-[#D4DFE4] text-[#52636D]'
                  }`}
                >
                  <option value="Todos">Todos os operadores</option>
                  {operatorOptions.map((operator) => (
                    <option key={operator} value={operator}>
                      {operator}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-medium text-[#52636d]">Código INC</span>
                <div className="grid grid-cols-3 p-0.5 rounded-lg bg-[#EDF2F4] gap-0.5">
                  {([
                    ['todos', 'Todos'],
                    ['com_inc', 'Com INC'],
                    ['sem_inc', 'Sem INC'],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setIncFilter(value)}
                      aria-pressed={incFilter === value}
                      className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                        incFilter === value
                          ? 'bg-white text-[#162229] font-semibold shadow-xs'
                          : 'text-[#52636D]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
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
              {[1, 2, 3].map((item) => (
                <div key={item} className={`${SURFACE_TOKENS.card} p-5 animate-pulse h-24 bg-white`} />
              ))}
            </div>
          ) : filteredReports.length === 0 ? (
            <div className={`${SURFACE_TOKENS.card} px-6 py-14 text-center space-y-3 bg-white`}>
              <div className="w-11 h-11 rounded-2xl bg-[#eef3f6] border border-[#d4dfe4] text-[#4e6b7c] flex items-center justify-center mx-auto">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-[#162229]">Nenhum Report encontrado</p>
                <p className="text-xs text-[#64737c]">
                  {hasAnyFilter
                    ? 'Tente ajustar os filtros ou a busca aplicada.'
                    : 'Clique em “Novo Report” para cadastrar o primeiro.'}
                </p>
              </div>
              {!hasAnyFilter && (
                <button
                  type="button"
                  onClick={onNewReport}
                  className={`${BUTTON_VARIANTS.primary} px-4 py-2 text-xs`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Report</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report) => {
                const operatorName = report.createdByName.trim() || 'Operador';
                return (
                  <article
                    key={report.id}
                    className={`${SURFACE_TOKENS.card} w-full group overflow-hidden transition-all hover:border-[#bdd0d8] hover:bg-[#fcfefe]`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 px-5 sm:px-6 py-4.5 sm:py-5">
                      <button
                        type="button"
                        onClick={() => onSelectReport(report)}
                        className="flex-1 min-w-0 flex flex-col gap-2 text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00807C] rounded-xl"
                      >
                        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 min-w-0">
                          <span className="text-[15.5px] text-[#162229] font-semibold group-hover:text-[#005C59] transition-colors">
                            {report.tipificacao || 'Report Operacional'}
                          </span>
                          <span className="text-[11.5px] font-mono font-bold text-[#005C59] whitespace-nowrap">
                            REPORT #{report.numeroReport}
                          </span>
                        </div>

                        <p className="text-[13.5px] leading-[22px] text-[#162229] line-clamp-2">
                          {report.descricao}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#52636d] pt-1.5 border-t border-[#eef3f5]">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-[#ebf4fa] border border-[#b6d6ea] text-[#154f73] inline-flex items-center justify-center text-[10px] font-semibold">
                              {getOperatorInitials(operatorName)}
                            </span>
                            <span className="font-semibold text-[#162229]">{operatorName}</span>
                          </div>
                          <span>·</span>
                          <span className="font-mono font-bold text-[#162229]">{report.horario}</span>
                          <span>·</span>
                          <span className="font-mono text-[#52636d]">{formatDateBR(report.dataRegistro)}</span>
                          <span>·</span>
                          <span className="font-medium text-[#3e4e57]">{report.municipio}</span>
                          {report.analistaResponsavel && (
                            <>
                              <span>·</span>
                              <span>Analista: {report.analistaResponsavel}</span>
                            </>
                          )}
                        </div>
                      </button>

                      <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-2 lg:pt-0">
                        <IncBadge inc={report.inc} onNotify={onNotify} />
                        <button
                          type="button"
                          onClick={() => onSelectReport(report)}
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
