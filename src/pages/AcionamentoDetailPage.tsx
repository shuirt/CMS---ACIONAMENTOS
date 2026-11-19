import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Clock,
  Copy,
  Edit3,
  History,
  MapPin,
  Shield,
  User,
} from 'lucide-react';
import { IncBadge } from '../components/IncBadge';
import { StatusIndicator } from '../components/StatusBadge';
import { BUTTON_VARIANTS, SURFACE_TOKENS } from '../design/tokens';
import type { Acionamento, AuditoriaEntry } from '../types/acionamento';
import {
  buildAcionamentoTitle,
  computeElapsedMinutes,
  computeElapsedMinutesWithDates,
  formatAcionamentoClipboardText,
  formatDateBR,
  formatDateTimeBR,
  formatDurationPT,
} from '../utils/validation';

interface AcionamentoDetailPageProps {
  record: Acionamento;
  auditoria: AuditoriaEntry[];
  backLabel?: string;
  onBack: () => void;
  onEdit: (record: Acionamento) => void;
  onNotify?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export function AcionamentoDetailPage({
  record,
  auditoria,
  backLabel = 'Voltar para Registros',
  onBack,
  onEdit,
  onNotify,
}: AcionamentoDetailPageProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const tag = (e.target as HTMLElement | null)?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
          onBack();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onBack]);

  const recordAudit = auditoria.filter((a) => a.idAcionamento === record.id);
  const title = buildAcionamentoTitle(record);

  const dispatchMins = computeElapsedMinutes(
    record.horarioAcionamento,
    record.horarioEquipeAcionada
  );
  const arrivalMins = computeElapsedMinutes(
    record.horarioAcionamento,
    record.horarioChegadaCampo
  );
  const totalMins = computeElapsedMinutesWithDates(
    record.dataRegistro,
    record.horarioAcionamento,
    record.dataFim,
    record.horarioNormalizacao
  );

  const handleCopyRecord = async () => {
    const text = formatAcionamentoClipboardText(record);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onNotify?.('Resumo do acionamento copiado para a área de transferência.', 'success');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        const helper = document.createElement('textarea');
        helper.value = text;
        helper.setAttribute('readonly', '');
        helper.style.position = 'fixed';
        helper.style.opacity = '0';
        document.body.appendChild(helper);
        helper.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(helper);
        if (ok) {
          setCopied(true);
          onNotify?.('Resumo do acionamento copiado para a área de transferência.', 'success');
          window.setTimeout(() => setCopied(false), 2000);
          return;
        }
      } catch {
        // Fallback failed
      }
      onNotify?.('Não foi possível acessar a área de transferência automaticamente.', 'warning');
    }
  };

  return (
    <div className={`${SURFACE_TOKENS.pageContainer} space-y-6`}>
      {/* Breadcrumb & Primary Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center text-xs font-medium text-[#52636d] hover:text-[#005C59] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            <span>{backLabel}</span>
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-[-0.015em] text-[#162229]">{title}</h1>
            {record.numeroReport !== null && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#FEF6E3] text-[#8A5602] border border-[#F3D085]">
                REPORT #{record.numeroReport}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#64737C]">
            <IncBadge
              inc={record.inc}
              status={record.statusOperacional}
              onNotify={onNotify}
              size="md"
            />
            <span aria-hidden="true">·</span>
            <span>{formatDateBR(record.dataRegistro)}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{record.horarioAcionamento}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-[#154F73] bg-[#EBF4FA] border border-[#B6D6EA] px-3 py-0.5 rounded-xl">
              <User className="w-3 h-3 text-[#1F6E9C]" />
              <span>Operador CMS: {record.createdByName || 'Não identificado'}</span>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
          <div className="px-3.5 py-2 rounded-2xl bg-white border border-[#d4dfe4] shadow-2xs">
            <StatusIndicator status={record.statusOperacional} />
          </div>

          <button
            type="button"
            onClick={() => void handleCopyRecord()}
            className={`${BUTTON_VARIANTS.secondary} px-3.5 py-2 text-sm`}
          >
            {copied ? (
              <Check className="w-4 h-4 text-[#00807C]" />
            ) : (
              <Copy className="w-4 h-4 text-[#52636d]" />
            )}
            <span>{copied ? 'Copiado!' : 'Copiar resumo'}</span>
          </button>

          <button
            type="button"
            onClick={() => onEdit(record)}
            className={`${BUTTON_VARIANTS.primary} px-4 py-2 text-sm`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Editar</span>
          </button>
        </div>
      </div>

      {/* Main Details Card */}
      <div className={`${SURFACE_TOKENS.cardElevated} overflow-hidden`}>
        {/* Vale institutional green + gold hairline accent */}
        <div className="h-[3px] flex" aria-hidden="true">
          <div className="w-[74%] bg-[#00807C]" />
          <div className="w-[26%] bg-[#EEA722]" />
        </div>

        <div className="p-6 sm:p-8 space-y-7">
          {/* Chronology times */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#3e4e57] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#00807C]" />
                <span>Solicitante e Marcos Horários</span>
              </h2>

              {(dispatchMins !== null || arrivalMins !== null || totalMins !== null) && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {dispatchMins !== null && (
                    <span className="px-3 py-0.5 rounded-xl bg-[#f1f6f8] border border-[#d4dfe4] text-[#3e4e57] font-medium">
                      Acionamento da equipe:{' '}
                      <strong className="font-mono text-[#162229]">{formatDurationPT(dispatchMins)}</strong>
                    </span>
                  )}
                  {arrivalMins !== null && (
                    <span className="px-3 py-0.5 rounded-xl bg-[#f1f6f8] border border-[#d4dfe4] text-[#3e4e57] font-medium">
                      Chegada em campo:{' '}
                      <strong className="font-mono text-[#162229]">{formatDurationPT(arrivalMins)}</strong>
                    </span>
                  )}
                  {totalMins !== null && (
                    <span className="px-3 py-0.5 rounded-xl bg-[#EBF4FA] border border-[#B6D6EA] text-[#154F73] font-medium">
                      Duração total:{' '}
                      <strong className="font-mono">{formatDurationPT(totalMins)}</strong>
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 bg-[#f4f7f9] border border-[#d4dfe4] rounded-2xl p-4">
              <div className="col-span-2 sm:col-span-2 lg:col-span-1">
                <div className="text-[11px] font-medium text-[#64737C]">Quem acionou</div>
                <div className="text-sm font-semibold text-[#162229] mt-0.5 break-words">
                  {record.quemAcionou}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-[#64737C]">Data início</div>
                <div className="text-sm font-mono font-semibold text-[#162229] mt-0.5">
                  {formatDateBR(record.dataRegistro)}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-[#64737C]">Data fim</div>
                <div className="text-sm font-mono font-semibold text-[#162229] mt-0.5">
                  {record.dataFim ? formatDateBR(record.dataFim) : '—'}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-[#64737C]">Acionamento</div>
                <div className="text-sm font-mono font-semibold text-[#162229] mt-0.5">
                  {record.horarioAcionamento || '—'}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-[#64737C]">Equipe acionada</div>
                <div className="text-sm font-mono font-semibold text-[#162229] mt-0.5">
                  {record.horarioEquipeAcionada || '—'}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-[#64737C]">Chegada campo</div>
                <div className="text-sm font-mono font-semibold text-[#162229] mt-0.5">
                  {record.horarioChegadaCampo || '—'}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-[#64737C]">Saída do local</div>
                <div className="text-sm font-mono font-semibold text-[#005C59] mt-0.5">
                  {record.horarioNormalizacao || '—'}
                </div>
              </div>
            </div>
          </section>

          <hr className={SURFACE_TOKENS.divider} />

          {/* Location */}
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#3e4e57] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#1F6E9C]" />
              <span>Localidade Operacional</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div>
                <div className="text-xs text-[#64737C]">Tipo de localidade</div>
                <div className="text-sm font-semibold text-[#162229] mt-0.5">
                  {record.tipoLocalidade}
                </div>
              </div>
              {record.nomeLocalidade && (
                <div>
                  <div className="text-xs text-[#64737C]">
                    {record.tipoLocalidade === 'Pátio' ? 'Nome do pátio' : 'Nome da estação'}
                  </div>
                  <div className="text-sm font-semibold text-[#162229] mt-0.5">
                    {record.nomeLocalidade}
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs text-[#64737C]">KM Ferroviário</div>
                <div className="text-sm font-mono font-semibold text-[#162229] mt-0.5">
                  {record.kmFerroviario || '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#64737C]">Housing / RH</div>
                <div className="text-sm font-semibold text-[#162229] mt-0.5">
                  {record.housingRh || '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#64737C]">Município</div>
                <div className="text-sm font-semibold text-[#162229] mt-0.5">
                  {record.municipio || '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#64737C]">Analista responsável</div>
                <div className="text-sm font-semibold text-[#162229] mt-0.5">
                  {record.analistaResponsavel || '—'}
                </div>
              </div>
            </div>
          </section>

          <hr className={SURFACE_TOKENS.divider} />

          {/* Description & Tactical Info */}
          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#3e4e57]">
              Descrição e Cronologia
            </h2>
            <div className="rounded-2xl bg-[#f7fafb] border border-[#d4dfe4] border-l-4 border-l-[#00807C] p-4 text-sm text-[#162229] whitespace-pre-wrap leading-relaxed">
              {record.descricaoCronologia}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <div className="text-xs text-[#64737C]">Tecnologia empregada</div>
                <div className="text-sm font-semibold text-[#162229] mt-0.5">
                  {record.tecnologiaEmpregada
                    ? `SIM — ${record.tecnologiaUtilizada || 'Não especificada'}`
                    : 'NÃO'}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#64737C]">Ações envolvidas</div>
                <div className="text-sm font-semibold text-[#162229] mt-0.5">
                  {record.acoesEnvolvidas.length > 0
                    ? record.acoesEnvolvidas.join(' · ')
                    : 'Nenhuma marcada'}
                </div>
              </div>
            </div>
          </section>

          <hr className={SURFACE_TOKENS.divider} />

          {/* Essential Details */}
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#3e4e57] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#00807C]" />
              <span>Detalhes Essenciais</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-[#64737C]">Equipe de Campo / Atendido por</div>
                <div className="text-sm font-semibold text-[#162229] mt-0.5">
                  {record.equipeCampo}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#64737C]">Vigilante(s)</div>
                <div className="text-sm font-semibold text-[#162229] mt-0.5">
                  {record.vigilantes || '—'}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <div className="text-xs text-[#64737C]">Material / Ativos envolvidos</div>
                <div className="text-sm font-semibold text-[#162229] mt-0.5">
                  {record.materialAtivos || '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#64737C]">Tipificação</div>
                <div className="text-sm font-semibold text-[#162229] mt-0.5">
                  {record.tipificacao || '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#64737C]">INC</div>
                <div className="mt-1">
                  <IncBadge inc={record.inc} status={record.statusOperacional} onNotify={onNotify} />
                </div>
              </div>
            </div>
          </section>

          <hr className={SURFACE_TOKENS.divider} />

          {/* Metadata */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#64737C]">
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-[#77787B] shrink-0 mt-0.5" />
              <div>
                <div>
                  Criado por <span className="font-semibold text-[#162229]">{record.createdByName}</span>{' '}
                  ({record.createdByEmail})
                </div>
                <div>em {formatDateTimeBR(record.createdAt)}</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-[#77787B] shrink-0 mt-0.5" />
              <div>
                <div>
                  Última atualização por{' '}
                  <span className="font-semibold text-[#162229]">{record.updatedByName}</span> (
                  {record.updatedByEmail})
                </div>
                <div>em {formatDateTimeBR(record.updatedAt)}</div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Audit History Card */}
      <div className={`${SURFACE_TOKENS.card} overflow-hidden`}>
        <div className="bg-[#f6f9fa] border-b border-[#e3ebee] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#3e4e57] flex items-center gap-1.5">
            <History className="w-4 h-4 text-[#1F6E9C]" />
            <span>Auditoria do Registro</span>
          </h2>
          <span className="text-xs text-[#64737C] font-mono">ID: {record.id}</span>
        </div>

        <div className="p-6">
          {recordAudit.length === 0 ? (
            <p className="text-xs text-[#64737C]">
              Nenhum evento de auditoria registrado para este acionamento.
            </p>
          ) : (
            <div className="divide-y divide-[#eef3f5]">
              {recordAudit.map((entry) => (
                <div
                  key={entry.idAuditoria}
                  className="py-2.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-[#162229] capitalize">
                      {entry.tipoOperacao}
                    </span>{' '}
                    <span className="text-[#64737C]">por</span>{' '}
                    <span className="font-medium text-[#154F73]">{entry.usuarioResponsavel}</span>{' '}
                    <span className="text-[#77787B]">({entry.emailUsuario})</span>
                    <div className="text-[#3e4e57]">{entry.camposAlterados}</div>
                  </div>
                  <div className="font-mono text-[#64737C] shrink-0">
                    {formatDateTimeBR(entry.dataHora)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
