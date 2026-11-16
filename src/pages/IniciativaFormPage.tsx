import { useState } from 'react';
import { ArrowLeft, Clock, Plus, User } from 'lucide-react';
import { BUTTON_VARIANTS, FIELD_VARIANTS, SURFACE_TOKENS } from '../design/tokens';
import type {
  ConfigCatalog,
  Iniciativa,
  IniciativaInput,
  OperatorIdentity,
  TipoLocalidade,
  ValidationErrors,
} from '../types/acionamento';
import {
  filterMunicipiosByUf,
  formatTimeMask,
  getCurrentTime24h,
  getTodayIsoDate,
  inferUfFromMunicipio,
  sanitizeIniciativaInput,
  type UnidadeFederativa,
  validateIniciativaInput,
} from '../utils/validation';

interface IniciativaFormPageProps {
  mode: 'create' | 'edit';
  initialRecord?: Iniciativa | null;
  catalog: ConfigCatalog;
  operator: OperatorIdentity;
  nextIniciativaNumber: number;
  saving: boolean;
  onSave: (input: IniciativaInput, existing?: Iniciativa | null) => Promise<void>;
  onCancel: () => void;
  onNotify: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

function buildInitialIniciativaInput(
  mode: 'create' | 'edit',
  record: Iniciativa | null | undefined,
  catalog: ConfigCatalog
): IniciativaInput {
  if (mode === 'edit' && record) {
    return {
      dataRegistro: record.dataRegistro,
      horario: record.horario,
      municipio: record.municipio,
      tipoLocalidade: record.tipoLocalidade,
      kmFerroviario: record.kmFerroviario,
      analistaResponsavel: record.analistaResponsavel,
      descricao: record.descricao,
      tipificacao: record.tipificacao,
      inc: record.inc,
    };
  }

  const defaultEsMun = filterMunicipiosByUf(catalog.municipios, 'ES');
  return {
    dataRegistro: getTodayIsoDate(),
    horario: getCurrentTime24h(),
    municipio: defaultEsMun[0] ?? catalog.municipios[0] ?? '',
    tipoLocalidade: (catalog.tiposLocalidade[0] as TipoLocalidade) ?? 'Linha Férrea',
    kmFerroviario: '',
    analistaResponsavel: catalog.analistas[0] ?? '',
    descricao: '',
    tipificacao: catalog.tipificacoes[0] ?? '',
    inc: '',
  };
}

export function IniciativaFormPage({
  mode,
  initialRecord,
  catalog,
  operator,
  nextIniciativaNumber,
  saving,
  onSave,
  onCancel,
  onNotify,
}: IniciativaFormPageProps) {
  const [form, setForm] = useState<IniciativaInput>(() =>
    buildInitialIniciativaInput(mode, initialRecord, catalog)
  );
  const [selectedUf, setSelectedUf] = useState<UnidadeFederativa>(() =>
    inferUfFromMunicipio(form.municipio)
  );
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateField = <K extends keyof IniciativaInput>(field: K, value: IniciativaInput[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSelectUf = (uf: UnidadeFederativa) => {
    setSelectedUf(uf);
    const nextMuns = filterMunicipiosByUf(catalog.municipios, uf);
    if (!form.municipio || !nextMuns.includes(form.municipio)) {
      updateField('municipio', nextMuns[0] ?? '');
    }
  };

  const stampCurrentTime = () => {
    updateField('horario', getCurrentTime24h());
  };

  const handleAttemptSubmit = async () => {
    if (saving) return;
    const sanitized = sanitizeIniciativaInput(form);
    const validation = validateIniciativaInput(sanitized);

    if (!validation.valid) {
      setFieldErrors(validation.errors);
      setSubmitError('Verifique os campos obrigatórios.');
      onNotify('Preencha todos os campos obrigatórios (*).', 'warning');
      return;
    }

    try {
      setSubmitError(null);
      await onSave(sanitized, initialRecord);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar iniciativa.';
      setSubmitError(msg);
      onNotify(msg, 'error');
    }
  };

  const ufMunicipios = filterMunicipiosByUf(catalog.municipios, selectedUf);
  const municipioOptions =
    form.municipio && inferUfFromMunicipio(form.municipio) === selectedUf
      ? [form.municipio, ...ufMunicipios.filter((m) => m !== form.municipio)]
      : ufMunicipios;

  const iniciativaNum = mode === 'edit' && initialRecord ? initialRecord.numeroIniciativa : nextIniciativaNumber;

  return (
    <div className={`${SURFACE_TOKENS.pageContainer} max-w-4xl mx-auto space-y-5`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center text-xs font-medium text-[#52636d] mb-1.5">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center hover:text-[#005C59] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Voltar para Iniciativas
            </button>
            <span className="mx-2 text-[#a7b7c0]">/</span>
            <span className="text-[#162229] font-semibold">
              {mode === 'edit' ? `Editar Iniciativa #${iniciativaNum}` : `Nova Iniciativa (#${iniciativaNum})`}
            </span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#162229]">
            {mode === 'edit' ? `Editar Iniciativa #${iniciativaNum}` : `Registrar Iniciativa #${iniciativaNum}`}
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

      {/* Form Card */}
      <div className={`${SURFACE_TOKENS.cardElevated} overflow-hidden`}>
        <div className="h-[3px] flex" aria-hidden="true">
          <div className="w-[74%] bg-[#00807C]" />
          <div className="w-[26%] bg-[#EEA722]" />
        </div>

        <form
          className="p-6 sm:p-8 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            void handleAttemptSubmit();
          }}
        >
          {/* Data, Horário e INC */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#3e4e57] uppercase tracking-wider">
                Data <span className="text-[#00807C]">*</span>
              </label>
              <input
                type="date"
                value={form.dataRegistro}
                onChange={(e) => updateField('dataRegistro', e.target.value)}
                className={fieldErrors.dataRegistro ? FIELD_VARIANTS.inputError : FIELD_VARIANTS.input}
              />
              {fieldErrors.dataRegistro && <p className="text-[11px] text-[#8C3230]">{fieldErrors.dataRegistro}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#3e4e57] uppercase tracking-wider">
                Horário (24h) <span className="text-[#00807C]">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  maxLength={5}
                  value={form.horario}
                  onChange={(e) => updateField('horario', formatTimeMask(e.target.value))}
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
              {fieldErrors.horario && <p className="text-[11px] text-[#8C3230]">{fieldErrors.horario}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#3e4e57] uppercase tracking-wider">
                Número do INC
              </label>
              <input
                type="text"
                value={form.inc}
                onChange={(e) => updateField('inc', e.target.value)}
                placeholder="Ex: INC2026910000"
                className={FIELD_VARIANTS.input}
              />
            </div>
          </div>

          {/* Localidade & Município */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#52636d]">Tipo de Localidade</label>
              <select
                value={form.tipoLocalidade}
                onChange={(e) => updateField('tipoLocalidade', e.target.value as TipoLocalidade)}
                className={FIELD_VARIANTS.select}
              >
                {catalog.tiposLocalidade.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#52636d]">KM Ferroviário</label>
              <input
                type="text"
                value={form.kmFerroviario}
                onChange={(e) => updateField('kmFerroviario', e.target.value)}
                placeholder="Ex: KM 15+200"
                className={FIELD_VARIANTS.input}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#52636d]">Estado (UF)</label>
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
              <label className="text-xs font-medium text-[#52636d]">
                Município <span className="text-[#00807C]">*</span>
              </label>
              <select
                value={form.municipio}
                onChange={(e) => updateField('municipio', e.target.value)}
                className={fieldErrors.municipio ? FIELD_VARIANTS.inputError : FIELD_VARIANTS.select}
              >
                <option value="">Selecione...</option>
                {municipioOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              {fieldErrors.municipio && <p className="text-[11px] text-[#8C3230]">{fieldErrors.municipio}</p>}
            </div>
          </div>

          {/* Analista & Tipificação */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#3e4e57] uppercase tracking-wider">
                Analista Responsável <span className="text-[#00807C]">*</span>
              </label>
              <select
                value={form.analistaResponsavel}
                onChange={(e) => updateField('analistaResponsavel', e.target.value)}
                className={fieldErrors.analistaResponsavel ? FIELD_VARIANTS.inputError : FIELD_VARIANTS.select}
              >
                <option value="">Selecione...</option>
                {catalog.analistas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              {fieldErrors.analistaResponsavel && <p className="text-[11px] text-[#8C3230]">{fieldErrors.analistaResponsavel}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#3e4e57] uppercase tracking-wider">
                Tipificação <span className="text-[#00807C]">*</span>
              </label>
              <select
                value={form.tipificacao}
                onChange={(e) => updateField('tipificacao', e.target.value)}
                className={fieldErrors.tipificacao ? FIELD_VARIANTS.inputError : FIELD_VARIANTS.select}
              >
                <option value="">Selecione...</option>
                {catalog.tipificacoes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {fieldErrors.tipificacao && <p className="text-[11px] text-[#8C3230]">{fieldErrors.tipificacao}</p>}
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#3e4e57] uppercase tracking-wider">
              Descrição da Iniciativa <span className="text-[#00807C]">*</span>
            </label>
            <textarea
              rows={5}
              value={form.descricao}
              onChange={(e) => updateField('descricao', e.target.value)}
              placeholder="Descreva os detalhes da iniciativa operacional..."
              className={fieldErrors.descricao ? FIELD_VARIANTS.inputError : FIELD_VARIANTS.input}
            />
            {fieldErrors.descricao && <p className="text-[11px] text-[#8C3230]">{fieldErrors.descricao}</p>}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EDF2F4]">
            <button
              type="button"
              onClick={onCancel}
              className={`${BUTTON_VARIANTS.secondary} px-5 py-2.5 text-xs`}
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleAttemptSubmit()}
              className={`${BUTTON_VARIANTS.primary} px-6 py-2.5 text-xs`}
            >
              <Plus className="w-4 h-4" />
              <span>{saving ? 'Salvando...' : mode === 'edit' ? 'Salvar alterações' : 'Registrar iniciativa'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
