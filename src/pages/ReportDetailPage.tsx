import { ArrowLeft, Calendar, Clock, Edit3, User } from 'lucide-react';
import { BUTTON_VARIANTS, SURFACE_TOKENS } from '../design/tokens';
import { IncBadge } from '../components/IncBadge';
import type { Report } from '../types/acionamento';
import { getOperatorInitials } from '../components/OperatorCell';
import { formatDateBR } from '../utils/validation';

interface ReportDetailPageProps {
  report: Report;
  onBack: () => void;
  onEdit: (report: Report) => void;
  onNotify: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export function ReportDetailPage({ report, onBack, onEdit, onNotify }: ReportDetailPageProps) {
  const operatorName = report.createdByName.trim() || 'Operador';

  return (
    <div className={`${SURFACE_TOKENS.pageContainer} max-w-4xl mx-auto space-y-5`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center text-xs font-medium text-[#52636d] mb-1.5">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center hover:text-[#005C59] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Voltar para Reports
            </button>
            <span className="mx-2 text-[#a7b7c0]">/</span>
            <span className="text-[#162229] font-semibold">Report #{report.numeroReport}</span>
          </nav>
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#162229]">
              {report.tipificacao || 'Report'}
            </h1>
            <span className="text-xs font-mono font-bold text-[#005C59] bg-[#E7F4F3] border border-[#B3DCD9] px-2.5 py-1 rounded-lg">
              REPORT #{report.numeroReport}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onEdit(report)}
          className={`${BUTTON_VARIANTS.primary} px-4 py-2 text-xs`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Editar Report</span>
        </button>
      </div>

      <div className={`${SURFACE_TOKENS.cardElevated} overflow-hidden`}>
        <div className="h-[3px] flex" aria-hidden="true">
          <div className="w-[74%] bg-[#00807C]" />
          <div className="w-[26%] bg-[#EEA722]" />
        </div>
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#f4f7f9] border border-[#d4dfe4] rounded-2xl">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-[#ebf4fa] border border-[#b6d6ea] text-[#154f73] flex items-center justify-center text-xs font-bold">
                {getOperatorInitials(operatorName)}
              </span>
              <div>
                <div className="text-xs text-[#64737c]">Operador responsável</div>
                <div className="text-sm font-semibold text-[#162229]">{operatorName}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-[#52636d]">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#00807C]" />
                <span>{formatDateBR(report.dataRegistro)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#00807C]" />
                <span>{report.horario}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-white border border-[#d4dfe4] rounded-2xl space-y-1">
              <span className="text-xs text-[#64737c]">Município e Localidade</span>
              <div className="font-semibold text-[#162229]">{report.municipio}</div>
              <div className="text-xs text-[#52636d]">
                {report.tipoLocalidade} {report.kmFerroviario ? `· ${report.kmFerroviario}` : ''}
              </div>
            </div>

            <div className="p-4 bg-white border border-[#d4dfe4] rounded-2xl space-y-1">
              <span className="text-xs text-[#64737c]">Analista responsável</span>
              <div className="font-semibold text-[#162229]">{report.analistaResponsavel}</div>
              <div className="inline-flex items-center gap-1.5 text-xs text-[#52636d]">
                <User className="w-3.5 h-3.5" />
                Equipe CMS
              </div>
            </div>

            <div className="p-4 bg-white border border-[#d4dfe4] rounded-2xl space-y-1">
              <span className="text-xs text-[#64737c]">Código INC</span>
              <div className="pt-1">
                <IncBadge inc={report.inc} onNotify={onNotify} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold text-[#3e4e57] uppercase tracking-wider">
              Descrição do Report
            </div>
            <div className="p-5 bg-white border border-[#d4dfe4] rounded-2xl text-sm leading-relaxed text-[#162229] whitespace-pre-wrap">
              {report.descricao || 'Sem descrição.'}
            </div>
          </div>

          <div className="pt-4 border-t border-[#EDF2F4] text-xs text-[#64737c] flex flex-wrap items-center justify-between gap-2">
            <div>
              Cadastrado por {report.createdByName || 'Operador'} em{' '}
              {new Date(report.createdAt).toLocaleString('pt-BR')}
            </div>
            {report.updatedAt !== report.createdAt && (
              <div>
                Última edição por {report.updatedByName || 'Operador'} em{' '}
                {new Date(report.updatedAt).toLocaleString('pt-BR')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
