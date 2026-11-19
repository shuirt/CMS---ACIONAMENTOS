import { useId, useState } from 'react';
import { ArrowUpRight, ChevronDown, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { SURFACE_TOKENS } from '../design/tokens';
import type { Acionamento } from '../types/acionamento';
import {
  buildAcionamentoTitle,
  computeElapsedMinutesWithDates,
  formatDateBR,
  formatDurationPT,
} from '../utils/validation';
import { IncBadge } from './IncBadge';
import { getOperatorInitials } from './OperatorCell';
import { StatusIndicator } from './StatusBadge';

interface AcionamentoListRowProps {
  item: Acionamento;
  showDateInTimeAnchor?: boolean;
  compactOperator?: boolean;
  onSelectAcionamento: (item: Acionamento) => void;
  onNotify?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export function AcionamentoListRow({
  item,
  showDateInTimeAnchor = true,
  onSelectAcionamento,
  onNotify,
}: AcionamentoListRowProps) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const title = buildAcionamentoTitle(item);
  const operatorName = item.createdByName.trim() || 'Não identificado';
  const operatorInitials = getOperatorInitials(operatorName);

  const elapsedMinutes = computeElapsedMinutesWithDates(
    item.dataRegistro,
    item.horarioAcionamento,
    item.dataFim,
    item.horarioNormalizacao
  );
  const durationLabel = elapsedMinutes !== null ? formatDurationPT(elapsedMinutes) : null;

  const dateDisplay =
    item.dataFim && item.dataFim !== item.dataRegistro
      ? `${formatDateBR(item.dataRegistro).slice(0, 5)} → ${formatDateBR(item.dataFim).slice(0, 5)}`
      : formatDateBR(item.dataRegistro);

  const locationDetails = [
    item.tipoLocalidade,
    item.nomeLocalidade ? `Nome: ${item.nomeLocalidade}` : '',
    item.kmFerroviario || 'KM não informado',
    item.housingRh || 'RH não informado',
    item.equipeCampo ? `Equipe: ${item.equipeCampo}` : '',
  ].filter(Boolean);

  return (
    <article
      className={`${SURFACE_TOKENS.card} w-full group overflow-hidden transition-all duration-150 ${
        expanded ? 'border-[#b9cbd3] bg-[#fbfdfe]' : 'hover:border-[#bdd0d8] hover:bg-[#fcfefe]'
      }`}
    >
      {/* Primary Collapsed / Summary Row (Stacked for responsive clarity) */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 px-5 sm:px-6 py-4.5 sm:py-5">
        {/* Clickable Content Area: Stacks vertically so middle content wraps cleanly downward */}
        <button
          type="button"
          onClick={() => onSelectAcionamento(item)}
          aria-label={`Abrir detalhes de ${title}`}
          className="flex-1 min-w-0 flex flex-col gap-2.5 text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00807C] rounded-xl"
        >
          {/* 1. Título & REPORT */}
          <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-x-2.5 gap-y-0.5 min-w-0">
            <span className="text-[15.5px] sm:text-[16.5px] leading-[23px] text-[#162229] font-semibold tracking-[-0.01em] group-hover:text-[#005C59] transition-colors">
              {title}
            </span>
            {item.numeroReport !== null && (
              <span className="text-[11.5px] font-mono font-bold tracking-[-0.01em] text-[#965F04] whitespace-nowrap shrink-0">
                REPORT #{item.numeroReport}
              </span>
            )}
          </div>

          {/* 2. Município e Localidades */}
          <p className="text-[12.5px] leading-[19px] text-[#5c6c75]">
            <span className="font-semibold text-[#162229]">
              {item.municipio || 'Município não informado'}
            </span>
            {locationDetails.length > 0 && (
              <span>
                {' · '}
                {locationDetails.join(' · ')}
              </span>
            )}
          </p>

          {/* 3. Metadados (Operador, Horário, Data, Quem acionou) empilhados para baixo */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#52636d] pt-1.5 border-t border-[#eef3f5]">
            <div className="flex items-center gap-1.5">
              <span
                className="w-5 h-5 rounded-full bg-[#ebf4fa] border border-[#b6d6ea] text-[#154f73] inline-flex items-center justify-center text-[10px] font-semibold shrink-0"
                aria-hidden="true"
              >
                {operatorInitials}
              </span>
              <span className="font-semibold text-[#162229]">{operatorName}</span>
            </div>
            <span aria-hidden="true" className="text-[#9fb1bb]">·</span>
            <span className="font-mono font-bold text-[#162229]">{item.horarioAcionamento}</span>
            <span aria-hidden="true" className="text-[#9fb1bb]">·</span>
            <span className="font-mono text-[#52636d]">{dateDisplay}</span>
            <span aria-hidden="true" className="text-[#9fb1bb]">·</span>
            <span>
              Quem acionou:{' '}
              <strong className="font-medium text-[#3e4e57]">
                {item.quemAcionou || 'Não informado'}
              </strong>
            </span>
          </div>
        </button>

        {/* Far Right: INC + Status + Open Detail Control */}
        <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-2 lg:pt-0">
          <div className="flex items-center gap-2.5">
            <IncBadge inc={item.inc} status={item.statusOperacional} onNotify={onNotify} />
            <StatusIndicator status={item.statusOperacional} />
          </div>

          <button
            type="button"
            onClick={() => onSelectAcionamento(item)}
            aria-label={`Abrir ficha completa de ${title}`}
            title="Abrir ficha completa"
            className="inline-flex items-center justify-center w-8 h-8 rounded-xl border border-transparent hover:border-[#d4dfe4] hover:bg-[#f4f7f9] text-[#64737c] hover:text-[#00807C] transition-colors cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00807C]"
          >
            <ChevronRight className="w-4.5 h-4.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Expanded Downward Drawer: Description + Operational Timeline */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={panelId}
            key="expanded-content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-[#e3ebee] bg-[#f7fafb]"
          >
            <div className="px-5 sm:px-6 py-4 sm:py-5 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Description & Actions */}
                <div className="lg:col-span-7 space-y-2.5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#52636d]">
                    Descrição e cronologia
                  </div>
                  <p className="text-[13.5px] leading-[1.65] text-[#162229] whitespace-pre-wrap break-words">
                    {item.descricaoCronologia.trim() || 'Sem descrição registrada.'}
                  </p>
                  {item.acoesEnvolvidas.length > 0 && (
                    <div className="pt-1 text-[12px] text-[#52636d]">
                      <span className="font-semibold text-[#3e4e57]">Ações envolvidas: </span>
                      <span>{item.acoesEnvolvidas.join(' · ')}</span>
                    </div>
                  )}
                </div>

                {/* Operational Timeline & Field Details */}
                <div className="lg:col-span-5 space-y-3.5 lg:border-l lg:border-[#dde6ea] lg:pl-5">
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#52636d]">
                      Datas e marcos horários
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-x-4 gap-y-2 text-[12px]">
                      <div>
                        <div className="text-[11px] text-[#64737c]">Acionamento</div>
                        <div className="font-mono font-semibold tabular-nums text-[#162229]">
                          {item.horarioAcionamento || '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[#64737c]">Eq. acionada</div>
                        <div className="font-mono font-semibold tabular-nums text-[#162229]">
                          {item.horarioEquipeAcionada || '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[#64737c]">Chegada</div>
                        <div className="font-mono font-semibold tabular-nums text-[#162229]">
                          {item.horarioChegadaCampo || '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[#64737c]">Saída local</div>
                        <div className="font-mono font-semibold tabular-nums text-[#005C59]">
                          {item.horarioNormalizacao || '—'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[12px] pt-2 border-t border-[#e5edf0]">
                    <div className="sm:col-span-2 whitespace-nowrap">
                      <span className="text-[#64737c]">Início / Fim: </span>
                      <span className="font-mono font-medium tabular-nums text-[#162229]">
                        {formatDateBR(item.dataRegistro)}
                        {item.dataFim
                          ? ` → ${formatDateBR(item.dataFim)}`
                          : item.statusOperacional === 'Em andamento'
                            ? ' → Em aberto'
                            : ''}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[#64737c]">Analista responsável: </span>
                      <span className="font-medium text-[#162229]">
                        {item.analistaResponsavel || '—'}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[#64737c]">Vigilante(s): </span>
                      <span className="font-medium text-[#162229]">
                        {item.vigilantes || 'Não informado'}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[#64737c]">Tecnologia / Ativo: </span>
                      <span className="font-medium text-[#162229]">
                        {item.tecnologiaEmpregada
                          ? item.tecnologiaUtilizada || 'Sim'
                          : 'Sem tecnologia'}
                        {item.materialAtivos ? ` · ${item.materialAtivos}` : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Utility Bar */}
              <div className="pt-3 border-t border-[#e3ebee] flex flex-wrap items-center justify-between gap-2 text-[12px]">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[#5c6c75]">
                  <span>
                    Localidade:{' '}
                    <strong className="font-medium text-[#3e4e57]">{item.tipoLocalidade}</strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Duração total:{' '}
                    <strong className="font-mono font-semibold tabular-nums text-[#162229]">
                      {durationLabel ??
                        (item.statusOperacional === 'Em andamento' ? 'Em andamento' : '—')}
                    </strong>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectAcionamento(item)}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#00807C] hover:text-[#005C59] hover:underline cursor-pointer focus:outline-none"
                >
                  <span>Abrir ficha completa</span>
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Centered Bottom Toggle Bar: Expand / Collapse Description */}
      <div
        data-testid="acionamento-expand-footer"
        className="border-t border-[#eef3f5] bg-[#fafcfd] px-5 sm:px-6 py-2 flex items-center justify-center"
      >
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-controls={panelId}
          aria-label={
            expanded ? `Recolher descrição de ${title}` : `Expandir descrição de ${title}`
          }
          className={`inline-flex items-center justify-center gap-1.5 px-4 py-1 rounded-xl border text-[12px] font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00807C] ${
            expanded
              ? 'bg-[#E7F4F3] border-[#B3DCD9] text-[#005451]'
              : 'bg-white hover:bg-[#e7f4f3] border-[#d4dfe4] hover:border-[#B3DCD9] text-[#3e4e57] hover:text-[#005C59] shadow-2xs'
          }`}
        >
          <span>{expanded ? 'Ocultar descrição' : 'Expandir descrição'}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              expanded ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </button>
      </div>
    </article>
  );
}
