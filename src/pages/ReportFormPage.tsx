import { useState } from 'react';
import { ArrowLeft, Clock, Edit3, Plus, User } from 'lucide-react';
import { BUTTON_VARIANTS, FIELD_VARIANTS, SURFACE_TOKENS } from '../design/tokens';
import type {
  ConfigCatalog,
  OperatorIdentity,
  Report,
  ReportInput,
  TipoLocalidade,
  ValidationErrors,
} from '../types/acionamento';
import {
  filterMunicipiosByUf,
  formatTimeMask,
  getCurrentTime24h,
  getTodayIsoDate,
  inferUfFromMunicipio,
  normalizeTime24hOnBlur,
  sanitizeReportInput,
  validateReportInput,
  type UnidadeFederativa,
} from '../utils/validation';

interface ReportFormPageProps {
  mode: 'create' | 'edit';
  initialRecord?: Report | null;
  catalog: ConfigCatalog;
  operator: OperatorIdentity;
  nextReportNumber: number;
  saving: boolean;
  onSave: (input: ReportInput, existing?: Report | null) => Promise<void>;
  onCancel: () => void;
  onNotify: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export function ReportFormPage({
  mode,
  initialRecord,
  catalog,
  operator,
  nextReportNumber,
  saving,
  onSave,
  onCancel,
  onNotify,
}: ReportFormPageProps) {
  const [form, setForm] = useState<ReportInput>(() =>
    sanitizeReportInput({
      inc: initialRecord?.inc,
      dataRegistro: initialRecord?.dataRegistro ?? getTodayIsoDate(),
      horario: initialRecord?.horario ?? getCurrentTime24h(),
      descricao: initialRecord?.descricao,
      tipificacao: initialRecord?.tipificacao ?? catalog.tipificacoes[0],
      analistaResponsavel: initialRecord?.analistaResponsavel ?? catalog.analistas[0],
      municipio:
        initialRecord?.municipio ??
        filterMunicipiosByUf(catalog.municipios, 'ES')[0] ??
        catalog.municipios[0] ??
        '',
      tipoLocalidade: initialRecord?.tipoLocalidade ?? catalog.tiposLocalidade[0] as TipoLocalidade,
      kmFerroviario: initialRecord?.kmFerroviario,
    })
  );
  const [selectedUf, setSelectedUf] = useState<UnidadeFederativa>(() =>
    inferUfFromMunicipio(form.municipio)
  );
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const numeroReport = mode === 'edit' && initialRecord ? initialRecord.numeroReport : nextReportNumber;

  const updateField = <K extends keyof ReportInput>(field: K, value: ReportInput[K]) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((previous) => {
        const next = { ...previous };
        delete next[field];
        return next;
      });
    }
  };

  const handleSelectUf = (uf: UnidadeFederativa) => {
    setSelectedUf(uf);
    const municipalities = filterMunicipiosByUf(catalog.municipios, uf);
    if (!form.municipio || !municipalities.includes(form.municipio)) {
      updateField('municipio', municipalities[0] ?? '');
    }
  };

  const ufMunicipios = filterMunicipiosByUf(catalog.municipios, selectedUf);
  const municipioOptions =
    form.municipio && inferUfFromMunicipio(form.municipio) === selectedUf
      ? [form.municipio, ...ufMunicipios.filter((municipio) => municipio !== form.municipio)]
      : ufMunicipios;

  const stampCurrentTime = () => updateField('horario', getCurrentTime24h());

  const handleSubmit = async () => {
    if (saving) return;
    const sanitized = sanitizeReportInput(form);
    const validation = validateReportInput(sanitized);
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      setSubmitError('Verifique os campos obrigatórios.');
      onNotify('Preencha os campos obrigatórios (*).', 'warning');
      return;
    }

    try {
      setSubmitError(null);
      await onSave(sanitized, initialRecord);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao salvar Report.';
      setSubmitError(message);
      onNotify(message, 'error');
    }
  };

  return (
    <div className={`${SURFACE_TOKENS.pageContainer} max-w-4xl mx-auto space-y-5`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center text-xs font-medium text-[#52636d] mb-1.5">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center hover:text-[#005C59] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Voltar para Reports
            </button>
            <span className="mx-2 text-[#a7b7c0]">/</span>
            <span className="text-[#162229] font-semibold">
              {mode === 'edit' ? `Editar Report #${numeroReport}` : `Novo Report (#${numeroReport})`}
            </span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#162229]">
            {mode === 'edit' ? `Editar Report #${numeroReport}` : `Cadastrar Report #${numeroReport}`}
          </h1>
        </div>

        <div className="flex items-center bg-white border border-[#c8d5db] rounded-full py-1.5 px-3.5 gap-2.5 text-xs text-[#3e4e57]">
          <span className="w-2 h-2 rounded-full bg-[#00807C]" />
          <User className="w-3.5 h-3.5 text-[#1F6E9C]" />
          <span className="font-semibold text-[#162229]">{operator.name}</span>
          <span className="text-[#64737C] text-[11px]">(Operador CMS)</span>
        </div>
      </div>

      {submitError && (
        <div role="alert" className="rounded-2xl bg-[#FCEFEF] border border-[#ECC4C3] px-4 py-3 text-xs text-[#8C3230]">
          {submitError}
        </div>
      )}

      <div className={`${SURFACE_TOKENS.cardElevated} overflow-hidden`}>
        <div className="h-[3px] flex" aria-hidden="true">
          <div className="w-[74%] bg-[#00807C]" />
          <div className="w-[26%] bg-[#EEA722]" />
        </div>
        <form
          className="p-6 sm:p-8 space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="report-data" className="text-xs font-bold text-[#3e4e57] uppercase tracking-wider">
                Data <span className="text-[#00807C]">*</span>
              </label>
              <input
                id="report-data"
                type="date"
                value={form.dataRegistro}
                onChange={(event) => updateField('dataRegistro', event.target.value)}
                className={fieldErrors.dataRegistro ? FIELD_VARIANTS.inputError : FIELD_VARIANTS.input}
              />
              {fieldErrors.dataRegistro && (
                <p className="text-[11px] text-[#8C3230]">{fieldErrors.dataRegistro}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="report-horario" className="text-xs font-bold text-[#3e4e57] uppercase tracking-wider">
                Horário (24h) <span className="text-[#00807C]">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="report-horario"
                  type="text"
                  maxLength={5}
                  value={form.horario}
                  onChange={(event) => updateField('horario', formatTimeMask(event.target.value))}
                  onBlur={() => updateField('horario', normalizeTime24hOnBlur(form.horario))}
                  placeholder="HH:mm"
                  className={fieldErrors.horario ? FIELD_VARIANTS.inputError : FIELD_VARIANTS.input}
                />
                <button
                  type="button"
                  onClick={stampCurrentTime}
                  title="Horário atual"
                  className="p-2 rounded-xl bg-[#E7F4F3] text-[#005C59] border border-[#B3DCD9] cursor-pointer"
                >
                  <Clock className="w-4 h-4" />
                </button>
              </div>
              {fieldErrors.horario && (
                <p className="text-[11px] text-[#8C3230]">{fieldErrors.horario}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="report-inc" className="text-xs font-bold text-[#3e4e57] uppercase tracking-wider">
                Número do INC
              </label>
              <input
                id="report-inc"
                type="text"
                value={form.inc}
                onChange={(event) => updateField('inc', event.target.value)}
                placeholder="Ex.: INC2026910000"
                className={FIELD_VARIANTS.input}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-bold text-[#3e4e57] uppercase tracking-wider">Localidade</div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="report-tipo-localidade" className="text-xs font-medium text-[#52636d]">
                  Tipo de Localidade
                </label>
                <select
                  id="report-tipo-localidade"
                  value={form.tipoLocalidade}
                  onChange={(event) =>
                    updateField('tipoLocalidade', event.target.value as TipoLocalidade)
                  }
                  className={FIELD_VARIANTS.select}
                >
                  {catalog.tiposLocalidade.map((localidade) => (
                    <option key={localidade} value={localidade}>
                      {localidade}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="report-km" className="text-xs font-medium text-[#52636d]">
                  KM Ferroviário
                </label>
                <input
                  id="report-km"
                  type="text"
                  value={form.kmFerroviario}
                  onChange={(event) => updateField('kmFerroviario', event.target.value)}
                  placeholder="Ex.: KM 15+200"
                  className={FIELD_VARIANTS.input}
                />
              </div>

              <div className="space-y-1.5">
                <span className="block text-xs font-medium text-[#52636d]">Estado (UF)</span>
                <div className="grid grid-cols-2 p-1 bg-[#e1e9ed] rounded-xl border border-[#c8d5db] h-[42px]">
                  {(['ES', 'MG'] as const).map((uf) => (
                    <button
                      key={uf}
                      type="button"
                      onClick={() => handleSelectUf(uf)}
                      className={`rounded-xl text-xs font-semibold cursor-pointer ${
                        selectedUf === uf ? 'bg-[#00807C] text-white shadow-2xs' : 'text-[#485a64]'
                      }`}
                    >
                      {uf}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="report-municipio" className="text-xs font-medium text-[#52636d]">
                  Município <span className="text-[#00807C]">*</span>
                </label>
                <select
                  id="report-municipio"
                  value={form.municipio}
                  onChange={(event) => updateField('municipio', event.target.value)}
                  className={
                    fieldErrors.municipio ? FIELD_VARIANTS.inputError : FIELD_VARIANTS.select
                  }
                >
                  <option value="">Selecione...</option>
                  {municipioOptions.map((municipio) => (
                    <option key={municipio} value={municipio}>
                      {municipio}
                    </option>
                  ))}
                </select>
                {fieldErrors.municipio && (
                  <p className="text-[11px] text-[#8C3230]">{fieldErrors.municipio}</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="report-analista" className="text-xs font-bold text-[#3e4e57] uppercase tracking-wider">
                Analista Responsável <span className="text-[#00807C]">*</span>
              </label>
              <select
                id="report-analista"
                value={form.analistaResponsavel}
                onChange={(event) => updateField('analistaResponsavel', event.target.value)}
                className={
                  fieldErrors.analistaResponsavel ? FIELD_VARIANTS.inputError : FIELD_VARIANTS.select
                }
              >
                <option value="">Selecione...</option>
                {catalog.analistas.map((analista) => (
                  <option key={analista} value={analista}>
                    {analista}
                  </option>
                ))}
              </select>
              {fieldErrors.analistaResponsavel && (
                <p className="text-[11px] text-[#8C3230]">{fieldErrors.analistaResponsavel}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="report-tipificacao" className="text-xs font-bold text-[#3e4e57] uppercase tracking-wider">
                Tipificação <span className="text-[#00807C]">*</span>
              </label>
              <select
                id="report-tipificacao"
                value={form.tipificacao}
                onChange={(event) => updateField('tipificacao', event.target.value)}
                className={fieldErrors.tipificacao ? FIELD_VARIANTS.inputError : FIELD_VARIANTS.select}
              >
                <option value="">Selecione...</option>
                {catalog.tipificacoes.map((tipificacao) => (
                  <option key={tipificacao} value={tipificacao}>
                    {tipificacao}
                  </option>
                ))}
              </select>
              {fieldErrors.tipificacao && (
                <p className="text-[11px] text-[#8C3230]">{fieldErrors.tipificacao}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="report-descricao" className="text-xs font-bold text-[#3e4e57] uppercase tracking-wider">
              Descrição do Report <span className="text-[#00807C]">*</span>
            </label>
            <textarea
              id="report-descricao"
              rows={5}
              value={form.descricao}
              onChange={(event) => updateField('descricao', event.target.value)}
              placeholder="Descreva os detalhes do Report..."
              className={fieldErrors.descricao ? FIELD_VARIANTS.inputError : FIELD_VARIANTS.input}
            />
            {fieldErrors.descricao && (
              <p className="text-[11px] text-[#8C3230]">{fieldErrors.descricao}</p>
            )}
            <p className="text-[11px] text-[#64737c]">
              O número do Report é gerado automaticamente e pode ser usado como referência nos registros.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EDF2F4]">
            <button
              type="button"
              onClick={onCancel}
              className={`${BUTTON_VARIANTS.secondary} px-5 py-2.5 text-xs`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`${BUTTON_VARIANTS.primary} px-6 py-2.5 text-xs`}
            >
              {mode === 'edit' ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{saving ? 'Salvando...' : mode === 'edit' ? 'Salvar alterações' : 'Cadastrar Report'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
