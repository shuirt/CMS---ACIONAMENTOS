import { useMemo, useRef, useState } from 'react';
import {
  ChevronRight,
  ClipboardList,
  Copy,
  FileText,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { motion } from 'motion/react';
import { IncBadge } from '../components/IncBadge';
import { OperatorCell } from '../components/OperatorCell';
import { StatusIndicator } from '../components/StatusBadge';
import { BUTTON_VARIANTS, SURFACE_TOKENS } from '../design/tokens';
import type { Acionamento, IncFilter } from '../types/acionamento';
import { copyTextToClipboard } from '../utils/clipboard';
import {
  buildAcionamentoTitle,
  filterReportAcionamentos,
  formatAcionamentoClipboardText,
  formatDateBR,
  getUniqueOperators,
  hasValidInc,
  isRelevantReportAcionamento,
} from '../utils/validation';

interface ProtocolosPageProps {
  acionamentos: Acionamento[];
  loading: boolean;
  refreshing: boolean;
  lastReportNumber: number;
  nextReportNumber: number;
  onRefresh: () => void;
  onNewReport: () => void;
  onSelectAcionamento: (item: Acionamento) => void;
  onNotify: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

type ReportViewTab = 'todos' | 'pendentes' | 'concluidos';

export function ProtocolosPage({
  acionamentos,
  loading,
  refreshing,
  lastReportNumber,
  nextReportNumber,
  onRefresh,
  onNewReport,
  onSelectAcionamento,
  onNotify,
}: ProtocolosPageProps) {
  const [viewTab, setViewTab] = useState<ReportViewTab>('todos');
  const [incFilter, setIncFilter] = useState<IncFilter>('todos');
  const [operatorFilter, setOperatorFilter] = useState('Todos');
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement | null>(null);

  const allRelevant = useMemo(
    () => acionamentos.filter(isRelevantReportAcionamento),
    [acionamentos]
  );

  const pendingReportCount = useMemo(
    () => allRelevant.filter((item) => item.statusOperacional === 'Report').length,
    [allRelevant]
  );

  const concludedReportCount = allRelevant.length - pendingReportCount;

  const missingIncRelevantCount = useMemo(
    () => allRelevant.filter((item) => !hasValidInc(item.inc)).length,
    [allRelevant]
  );

  const operatorOptions = useMemo(() => getUniqueOperators(allRelevant), [allRelevant]);

  const tabCounts = useMemo(
    () => ({
      todos: filterReportAcionamentos(acionamentos, {
        view: 'todos',
        incFilter,
        operatorFilter,
        search,
      }).length,
      pendentes: filterReportAcionamentos(acionamentos, {
        view: 'pendentes',
        incFilter,
        operatorFilter,
        search,
      }).length,
      concluidos: filterReportAcionamentos(acionamentos, {
        view: 'concluidos',
        incFilter,
        operatorFilter,
        search,
      }).length,
    }),
    [acionamentos, incFilter, operatorFilter, search]
  );

  const filteredReports = useMemo(
    () =>
      filterReportAcionamentos(acionamentos, {
        view: viewTab,
        incFilter,
        operatorFilter,
        search,
      }),
    [acionamentos, viewTab, incFilter, operatorFilter, search]
  );

  const hasFilters = Boolean(
    search.trim() || operatorFilter !== 'Todos' || incFilter !== 'todos'
  );

  const clearFilters = () => {
    setSearch('');
    setOperatorFilter('Todos');
    setIncFilter('todos');
  };

  const handleCopyReportSummary = async (item: Acionamento) => {
    const text = formatAcionamentoClipboardText(item);
    const ok = await copyTextToClipboard(text);
    if (ok) {
      onNotify(
        item.numeroReport !== null
          ? `Resumo do REPORT #${item.numeroReport} copiado.`
          : 'Resumo da ocorrência relevante copiado.',
        'success'
      );
    } else {
      onNotify('Não foi possível copiar o resumo automaticamente.', 'warning');
    }
  };

  const tabs: Array<{ id: ReportViewTab; label: string; count: number }> = [
    { id: 'todos', label: 'Todos', count: tabCounts.todos },
    { id: 'pendentes', label: 'Em Report', count: tabCounts.pendentes },
    { id: 'concluidos', label: 'Encerrados', count: tabCounts.concluidos },
  ];

  return (
    <div className={`${SURFACE_TOKENS.pageContainer} space-y-6`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8A5602] bg-[#FEF6E3] border border-[#F3D085] px-3 py-0.5 rounded-xl">
            <ShieldAlert className="w-3.5 h-3.5 text-[#D99114]" />
            <span>Protocolos · Ocorrências Relevantes</span>
          </div>
          <h1 className="text-[28px] leading-[36px] font-bold text-[#162229] tracking-[-0.025em]">
            Ocorrências Relevantes (Report)
          </h1>
          <p className="text-sm text-[#52636d]">
            Acompanhamento dedicado aos acionamentos classificados como <strong>Report</strong>,
            com controle sequencial, código INC e resposta operacional.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            disabled={refreshing || loading}
            onClick={onRefresh}
            className={`${BUTTON_VARIANTS.secondary} px-3.5 py-2 text-xs`}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#00807C] ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Atualizando...' : 'Atualizar'}</span>
          </button>
          <button
            type="button"
            onClick={onNewReport}
            className={`${BUTTON_VARIANTS.primary} px-4 py-2 text-xs sm:text-sm`}
          >
            <Plus className="w-4 h-4" />
            <span>Novo Report</span>
          </button>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <section
        aria-label="Indicadores de ocorrências relevantes"
        className="grid grid-cols-1 sm:grid-cols-3 gap-3.5"
      >
        <div className={`${SURFACE_TOKENS.card} p-4 flex items-center justify-between gap-3`}>
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64737c]">
              Em aberto (Report)
            </span>
            <div className="text-2xl font-bold tabular-nums text-[#162229]">
              {pendingReportCount}
            </div>
            <p className="text-xs text-[#52636d]">
              {pendingReportCount === 1
                ? 'Ocorrência aguardando conclusão'
                : 'Ocorrências aguardando conclusão'}
            </p>
          </div>
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
              pendingReportCount > 0
                ? 'bg-[#FEF6E3] border-[#F3D085] text-[#965F04]'
                : 'bg-[#E7F4F3] border-[#B3DCD9] text-[#005C59]'
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className={`${SURFACE_TOKENS.card} p-4 flex items-center justify-between gap-3`}>
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64737c]">
              Sequencial oficial
            </span>
            <div className="text-2xl font-bold font-mono tabular-nums text-[#162229]">
              {lastReportNumber > 0 ? `#${lastReportNumber}` : '—'}
            </div>
            <p className="text-xs text-[#52636d] tabular-nums">
              Próximo: <span className="font-mono font-semibold">REPORT #{nextReportNumber}</span> ·{' '}
              {allRelevant.length} {allRelevant.length === 1 ? 'registro' : 'registros'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#EBF4FA] border border-[#B6D6EA] text-[#154F73] flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>

        <div className={`${SURFACE_TOKENS.card} p-4 flex items-center justify-between gap-3`}>
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64737c]">
              Reports sem INC
            </span>
            <div
              className={`text-2xl font-bold tabular-nums ${
                missingIncRelevantCount > 0 ? 'text-[#8A5602]' : 'text-[#005451]'
              }`}
            >
              {missingIncRelevantCount}
            </div>
            <p className="text-xs text-[#52636d]">
              {missingIncRelevantCount > 0
                ? 'Aguardando vinculação de INC'
                : 'Todos os Reports possuem INC'}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-xl text-[11px] font-semibold border shrink-0 ${
              missingIncRelevantCount > 0
                ? 'bg-[#FEF6E3] border-[#F3D085] text-[#8A5602]'
                : 'bg-[#E7F4F3] border-[#B3DCD9] text-[#005451]'
            }`}
          >
            {missingIncRelevantCount > 0 ? 'Pendente' : 'Regular'}
          </span>
        </div>
      </section>

      {/* Filters Tray */}
      <section className="bg-[#f6f9fa] border border-[#d4dfe4] rounded-2xl p-3.5 flex flex-col gap-2.5 shadow-2xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
          {/* Report Classification Tabs */}
          <div
            className="grid grid-cols-3 sm:inline-flex p-1 rounded-xl bg-[#e1e9ed] gap-1 w-full sm:w-auto sm:self-start lg:self-auto shrink-0"
            role="tablist"
            aria-label="Filtrar ocorrências relevantes por situação"
          >
            {tabs.map((tab) => {
              const isActive = viewTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setViewTab(tab.id)}
                  className={`relative inline-flex items-center justify-center gap-1.5 px-2 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-[13px] font-medium transition-colors duration-150 focus:outline-none cursor-pointer whitespace-nowrap ${
                    isActive ? 'text-[#162229] font-semibold' : 'text-[#52636d] hover:text-[#162229]'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="protocolos-report-pill"
                      transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                      className="absolute inset-0 bg-white shadow-xs border border-[#c8d5db]/70 rounded-xl"
                      aria-hidden="true"
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                  <span
                    className={`relative z-10 text-[11px] font-mono tabular-nums px-1.5 rounded-lg ${
                      isActive
                        ? 'bg-[#FEF6E3] text-[#8A5602] font-semibold'
                        : 'text-[#64737c]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 lg:justify-end">
            <select
              aria-label="Filtrar Reports por operador CMS"
              value={operatorFilter}
              onChange={(e) => setOperatorFilter(e.target.value)}
              className="h-10 px-3.5 bg-white text-[#162229] text-[13px] font-medium rounded-xl border border-[#c8d5db] focus:border-[#00807C] focus:outline-none sm:w-44 shrink-0 cursor-pointer"
            >
              <option value="Todos">Todos operadores</option>
              {operatorOptions.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#64737c] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchRef}
                type="search"
                aria-label="Pesquisar ocorrências relevantes"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar REPORT #, INC, analista..."
                className="w-full h-10 pl-10 pr-3.5 bg-white text-[#162229] text-[13px] rounded-xl border border-[#c8d5db] placeholder:text-[#77787B]/75"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#dde6ea]">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrar Reports por código INC">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#52636d] mr-1">
              Código INC:
            </span>
            {(
              [
                { id: 'todos', label: 'Todos' },
                { id: 'com_inc', label: 'Com INC' },
                { id: 'sem_inc', label: 'Sem INC' },
              ] as const
            ).map((opt) => {
              const isActive = incFilter === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setIncFilter(opt.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    isActive
                      ? opt.id === 'sem_inc'
                        ? 'bg-[#FEF6E3] border-[#EEA722] text-[#8A5602]'
                        : 'bg-[#EBF4FA] border-[#1F6E9C] text-[#154F73]'
                      : 'bg-white border-[#d4dfe4] text-[#52636d] hover:text-[#162229]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-semibold text-[#00807C] hover:underline cursor-pointer"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </section>

      {/* Relevant Report Cards */}
      {loading ? (
        <section className={`${SURFACE_TOKENS.card} p-8 text-center text-sm text-[#52636d]`}>
          Carregando ocorrências relevantes...
        </section>
      ) : filteredReports.length === 0 ? (
        <section className={`${SURFACE_TOKENS.card} p-12 text-center space-y-3`}>
          <FileText className="w-6 h-6 text-[#9eb1bb] mx-auto" />
          <p className="text-sm font-semibold text-[#162229]">
            {hasFilters
              ? 'Nenhuma ocorrência relevante encontrada para os filtros aplicados.'
              : 'Nenhuma ocorrência classificada como Report nesta visualização.'}
          </p>
          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className={`${BUTTON_VARIANTS.mineralBlue} px-3.5 py-1.5 text-xs`}
            >
              Limpar filtros
            </button>
          ) : (
            <button
              type="button"
              onClick={onNewReport}
              className={`${BUTTON_VARIANTS.primary} px-4 py-2 text-xs`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar ocorrência como Report</span>
            </button>
          )}
        </section>
      ) : (
        <motion.div
          key={`${viewTab}-${incFilter}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-3.5"
          aria-label="Lista de ocorrências relevantes Report"
        >
          {filteredReports.map((item) => {
            const title = buildAcionamentoTitle(item);
            const isActiveReport = item.statusOperacional === 'Report';
            const chronologyPreview = item.descricaoCronologia
              .split('\n')
              .map((line) => line.trim())
              .filter(Boolean)
              .slice(-1)[0];

            return (
              <article
                key={item.id}
                className={`${SURFACE_TOKENS.card} overflow-hidden border-l-4 ${
                  isActiveReport ? 'border-l-[#00807C]' : 'border-l-[#1F6E9C]'
                }`}
              >
                {/* Card Top Strip: Report Number, Date/Time, INC Badge, Status */}
                <div className="px-5 py-3 bg-[#f8fbfc] border-b border-[#e3ebee] flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FEF6E3] border border-[#F3D085] text-[#8A5602] text-xs font-mono font-bold">
                      <ClipboardList className="w-3.5 h-3.5 text-[#D99114]" aria-hidden="true" />
                      <span>
                        {item.numeroReport !== null ? `REPORT #${item.numeroReport}` : 'REPORT'}
                      </span>
                    </span>
                    <span className="text-xs font-mono font-semibold text-[#3e4e57] tabular-nums">
                      {formatDateBR(item.dataRegistro)} · {item.horarioAcionamento}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <IncBadge inc={item.inc} onNotify={onNotify} />
                    <StatusIndicator status={item.statusOperacional} />
                  </div>
                </div>

                {/* Clickable Summary Body */}
                <button
                  type="button"
                  onClick={() => onSelectAcionamento(item)}
                  aria-label={`Abrir detalhes de ${title}`}
                  className="w-full text-left px-5 py-4 hover:bg-[#f4f8f9] transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#00807C] space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-[16px] sm:text-[17px] leading-snug font-semibold text-[#162229] tracking-[-0.015em]">
                      {title}
                    </h2>
                    <ChevronRight className="w-5 h-5 text-[#77787B]/70 shrink-0 mt-0.5" />
                  </div>

                  <p className="text-xs text-[#52636d] leading-relaxed">
                    <span className="font-semibold text-[#3e4e57]">{item.quemAcionou}</span>
                    {' · '}
                    {item.tipoLocalidade} · {item.municipio || '—'} · {item.kmFerroviario || '—'}
                    {item.analistaResponsavel ? ` · Analista: ${item.analistaResponsavel}` : ''}
                    {item.equipeCampo
                      ? ` · Equipe: ${item.equipeCampo}${item.vigilantes ? ` (${item.vigilantes})` : ''}`
                      : ''}
                  </p>

                  {chronologyPreview && (
                    <p className="text-[13px] text-[#3e4e57] bg-[#f4f7f9] border border-[#e3ebee] rounded-xl px-3.5 py-2.5 line-clamp-2 leading-relaxed">
                      {chronologyPreview}
                    </p>
                  )}
                </button>

                {/* Card Footer: Operator + Quick Actions */}
                <div className="px-5 py-2.5 border-t border-[#eef3f5] bg-white flex flex-wrap items-center justify-between gap-3">
                  <OperatorCell name={item.createdByName} compact />

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleCopyReportSummary(item)}
                      className={`${BUTTON_VARIANTS.secondary} px-2.5 py-1.5 text-xs`}
                    >
                      <Copy className="w-3.5 h-3.5 text-[#1F6E9C]" />
                      <span>Copiar resumo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectAcionamento(item)}
                      className={`${BUTTON_VARIANTS.mineralBlue} px-3 py-1.5 text-xs`}
                    >
                      <span>Ver detalhes</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
