import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ClipboardList,
  Clock,
  Info,
  LogOut,
  MapPin,
  Radio,
  User,
  Users,
} from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { STATUS_OPTIONS } from '../config/defaultCatalog';
import {
  BUTTON_VARIANTS,
  FIELD_VARIANTS,
  STATUS_DESIGN_TOKENS,
  SURFACE_TOKENS,
} from '../design/tokens';
import { ClientApiError } from '../services/repository';
import type {
  Acionamento,
  AcionamentoInput,
  ConfigCatalog,
  OperatorIdentity,
  StatusOperacional,
  TipoLocalidade,
  ValidationErrors,
} from '../types/acionamento';
import {
  applyQuemAcionouShortcut,
  filterMunicipiosByUf,
  formatTimeMask,
  getCurrentTime24h,
  getTodayIsoDate,
  hasValidInc,
  inferUfFromMunicipio,
  isValidTime24h,
  normalizeTime24hOnBlur,
  sanitizeAcionamentoInput,
  type UnidadeFederativa,
  validateAcionamentoInput,
} from '../utils/validation';

interface AcionamentoFormPageProps {
  mode: 'create' | 'edit';
  initialRecord?: Acionamento | null;
  defaultStatus?: StatusOperacional;
  catalog: ConfigCatalog;
  operator: OperatorIdentity;
  nextReportNumber: number;
  lastReportNumber: number;
  saving: boolean;
  onSave: (
    input: AcionamentoInput,
    existingRecord?: Acionamento | null
  ) => Promise<void>;
  onCancel: () => void;
  onNotify: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  onReloadLatest?: () => Promise<void>;
}

function buildInitialInput(
  mode: 'create' | 'edit',
  record: Acionamento | null | undefined,
  catalog: ConfigCatalog,
  defaultStatus: StatusOperacional = 'Em andamento'
): AcionamentoInput {
  if (mode === 'edit' && record) {
    return {
      dataRegistro: record.dataRegistro,
      dataFim: record.dataFim,
      horarioAcionamento: record.horarioAcionamento,
      horarioEquipeAcionada: record.horarioEquipeAcionada,
      horarioChegadaCampo: record.horarioChegadaCampo,
      horarioNormalizacao: record.horarioNormalizacao,
      quemAcionou: record.quemAcionou,
      tipoLocalidade: record.tipoLocalidade,
      kmFerroviario: record.kmFerroviario,
      housingRh: record.housingRh,
      municipio: record.municipio,
      analistaResponsavel: record.analistaResponsavel,
      descricaoCronologia: record.descricaoCronologia,
      tecnologiaEmpregada: record.tecnologiaEmpregada,
      tecnologiaUtilizada: record.tecnologiaUtilizada,
      acoesEnvolvidas: [...record.acoesEnvolvidas],
      equipeCampo: record.equipeCampo,
      vigilantes: record.vigilantes,
      materialAtivos: record.materialAtivos,
      tipificacao: record.tipificacao,
      inc: record.inc,
      statusOperacional: record.statusOperacional,
    };
  }

  const defaultEsMunicipios = filterMunicipiosByUf(catalog.municipios, 'ES');

  return {
    dataRegistro: getTodayIsoDate(),
    dataFim: '',
    horarioAcionamento: getCurrentTime24h(),
    horarioEquipeAcionada: '',
    horarioChegadaCampo: '',
    horarioNormalizacao: '',
    quemAcionou: '',
    tipoLocalidade: (catalog.tiposLocalidade[0] as TipoLocalidade) ?? 'Linha Férrea',
    kmFerroviario: '',
    housingRh: '',
    municipio: defaultEsMunicipios[0] ?? catalog.municipios[0] ?? '',
    analistaResponsavel: catalog.analistas[0] ?? '',
    descricaoCronologia: '',
    tecnologiaEmpregada: false,
    tecnologiaUtilizada: '',
    acoesEnvolvidas: [],
    equipeCampo: '',
    vigilantes: '',
    materialAtivos: catalog.materiaisAtivos[0] ?? '',
    tipificacao: catalog.tipificacoes[0] ?? '',
    inc: '',
    statusOperacional: defaultStatus,
  };
}

function withPreservedOption(list: string[], currentValue: string): string[] {
  if (!currentValue || list.includes(currentValue)) return list;
  return [currentValue, ...list];
}

const FIELD_ELEMENT_IDS: Partial<Record<keyof AcionamentoInput, string>> = {
  quemAcionou: 'input-acionador',
  dataRegistro: 'input-data-registro',
  dataFim: 'input-data-fim',
  horarioAcionamento: 'input-horario-acionamento',
  horarioEquipeAcionada: 'input-horario-equipe',
  horarioChegadaCampo: 'input-horario-chegada',
  horarioNormalizacao: 'input-horario-saida',
  housingRh: 'housing-input',
  descricaoCronologia: 'textarea-cronologia',
  tecnologiaUtilizada: 'tech-select',
  equipeCampo: 'equipe-campo',
  vigilantes: 'input-vigilantes',
  inc: 'inc-input',
};

export function AcionamentoFormPage({
  mode,
  initialRecord,
  defaultStatus,
  catalog,
  operator,
  nextReportNumber,
  lastReportNumber,
  saving,
  onSave,
  onCancel,
  onNotify,
  onReloadLatest,
}: AcionamentoFormPageProps) {
  const initialSnapshot = useMemo(
    () => buildInitialInput(mode, initialRecord, catalog, defaultStatus),
    [mode, initialRecord, catalog, defaultStatus]
  );

  const [form, setForm] = useState<AcionamentoInput>(initialSnapshot);
  const [selectedUf, setSelectedUf] = useState<UnidadeFederativa>(() =>
    inferUfFromMunicipio(initialSnapshot.municipio)
  );
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [conflictRecord, setConflictRecord] = useState<Acionamento | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSheetsSaveConfirm, setShowSheetsSaveConfirm] = useState(false);
  const [pendingSanitized, setPendingSanitized] = useState<AcionamentoInput | null>(null);

  const acionadorInputRef = useRef<HTMLInputElement | null>(null);
  const cronologiaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (mode === 'create') {
      acionadorInputRef.current?.focus();
    }
  }, [mode]);

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initialSnapshot),
    [form, initialSnapshot]
  );

  const updateField = <K extends keyof AcionamentoInput>(
    field: K,
    value: AcionamentoInput[K]
  ) => {
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
    const nextMunicipios = filterMunicipiosByUf(catalog.municipios, uf);
    if (!form.municipio || !nextMunicipios.includes(form.municipio)) {
      updateField('municipio', nextMunicipios[0] ?? '');
    }
  };

  const handleQuemAcionouShortcut = (atalho: string) => {
    const composed = applyQuemAcionouShortcut(
      form.quemAcionou,
      atalho,
      catalog.quemAcionouAtalhos
    );
    updateField('quemAcionou', composed);
    window.requestAnimationFrame(() => {
      acionadorInputRef.current?.focus();
    });
  };

  const handleTimeBlur = (
    field:
      | 'horarioAcionamento'
      | 'horarioEquipeAcionada'
      | 'horarioChegadaCampo'
      | 'horarioNormalizacao',
    required: boolean
  ) => {
    const normalized = normalizeTime24hOnBlur(form[field]);
    if (normalized !== form[field]) {
      setForm((prev) => ({ ...prev, [field]: normalized }));
    }
    if (required && !normalized.trim()) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: 'Informe o horário do acionamento.',
      }));
      return;
    }
    if (normalized.trim() && !isValidTime24h(normalized.trim())) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: 'Horário inválido (HH:mm).',
      }));
    } else if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const stampCurrentTime = (
    field:
      | 'horarioAcionamento'
      | 'horarioEquipeAcionada'
      | 'horarioChegadaCampo'
      | 'horarioNormalizacao'
  ) => {
    const nowTime = getCurrentTime24h();
    if (field === 'horarioNormalizacao' && !form.dataFim.trim()) {
      setForm((prev) => ({
        ...prev,
        horarioNormalizacao: nowTime,
        dataFim: prev.dataFim.trim() ? prev.dataFim : getTodayIsoDate(),
      }));
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.horarioNormalizacao;
        delete next.dataFim;
        return next;
      });
      return;
    }
    updateField(field, nowTime);
  };

  const insertTimestampIntoCronologia = () => {
    const nowTime = getCurrentTime24h();
    const current = form.descricaoCronologia;
    const prefix = current.trim().length === 0 ? '' : current.endsWith('\n') ? '' : '\n';
    const nextValue = `${current}${prefix}${nowTime} - `;
    updateField('descricaoCronologia', nextValue);
    window.requestAnimationFrame(() => {
      const el = cronologiaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(nextValue.length, nextValue.length);
    });
  };

  const toggleAcao = (acao: string) => {
    setForm((prev) => {
      const exists = prev.acoesEnvolvidas.includes(acao);
      return {
        ...prev,
        acoesEnvolvidas: exists
          ? prev.acoesEnvolvidas.filter((a) => a !== acao)
          : [...prev.acoesEnvolvidas, acao],
      };
    });
  };

  const executeSave = useCallback(
    async (sanitized: AcionamentoInput) => {
      setSubmitError(null);
      setConflictRecord(null);
      try {
        await onSave(sanitized, initialRecord);
      } catch (err) {
        if (err instanceof ClientApiError) {
          if (err.fieldErrors) {
            setFieldErrors(err.fieldErrors);
          }
          if (err.status === 409 && err.latestRecord) {
            setConflictRecord(err.latestRecord);
          }
          setSubmitError(err.message);
          onNotify(err.message, 'error');
        } else {
          const msg =
            err instanceof Error
              ? err.message
              : 'Falha ao salvar o acionamento. A gravação não foi confirmada.';
          setSubmitError(msg);
          onNotify(msg, 'error');
        }
      } finally {
        setShowSheetsSaveConfirm(false);
        setPendingSanitized(null);
      }
    },
    [initialRecord, onNotify, onSave]
  );

  const focusFirstError = (errors: ValidationErrors) => {
    const firstKey = Object.keys(errors)[0] as keyof AcionamentoInput | undefined;
    if (!firstKey) return;
    const elementId = FIELD_ELEMENT_IDS[firstKey];
    if (!elementId) return;
    window.requestAnimationFrame(() => {
      const el = document.getElementById(elementId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    });
  };

  const handleAttemptSubmit = useCallback(() => {
    if (saving) return;

    const sanitized = sanitizeAcionamentoInput(form);
    const validation = validateAcionamentoInput(sanitized);

    if (!validation.valid) {
      setFieldErrors(validation.errors);
      setSubmitError('Verifique os campos obrigatórios destacados abaixo.');
      onNotify('Por favor, preencha todos os campos obrigatórios (*).', 'warning');
      focusFirstError(validation.errors);
      return;
    }

    if (operator.mode === 'google') {
      setPendingSanitized(sanitized);
      setShowSheetsSaveConfirm(true);
    } else {
      void executeSave(sanitized);
    }
  }, [executeSave, form, onNotify, operator.mode, saving]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        handleAttemptSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAttemptSubmit]);

  const handleRequestCancel = () => {
    if (isDirty) {
      setShowCancelConfirm(true);
    } else {
      onCancel();
    }
  };

  const ufMunicipios = filterMunicipiosByUf(catalog.municipios, selectedUf);
  const municipioOptions =
    form.municipio && inferUfFromMunicipio(form.municipio) === selectedUf
      ? withPreservedOption(ufMunicipios, form.municipio)
      : ufMunicipios;
  const analistaOptions = withPreservedOption(catalog.analistas, form.analistaResponsavel);
  const techOptions = withPreservedOption(catalog.tecnologias, form.tecnologiaUtilizada);
  const equipeOptions = withPreservedOption(catalog.equipesCampo, form.equipeCampo);
  const materialOptions = withPreservedOption(catalog.materiaisAtivos, form.materialAtivos);
  const tipificacaoOptions = withPreservedOption(catalog.tipificacoes, form.tipificacao);

  const isReportSelected = form.statusOperacional === 'Report';
  const existingReportNum = initialRecord?.numeroReport ?? null;
  const showEncerradoTimeHint =
    form.statusOperacional === 'Encerrado' && !form.horarioNormalizacao.trim();

  return (
    <div className={`${SURFACE_TOKENS.pageContainer} space-y-5`}>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <nav
            aria-label="Breadcrumb"
            className="flex items-center text-xs font-medium text-[#52636d] mb-1.5"
          >
            <button
              type="button"
              onClick={handleRequestCancel}
              className="inline-flex items-center hover:text-[#005C59] transition-colors cursor-pointer focus:outline-none"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              {mode === 'edit' ? 'Voltar para detalhes' : 'Voltar para Registros'}
            </button>
            <span className="mx-2 text-[#a7b7c0]">/</span>
            <span className="text-[#162229] font-semibold">
              {mode === 'edit' ? 'Editar Registro' : 'Novo Registro'}
            </span>
          </nav>

          <div className="flex flex-wrap items-baseline gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.015em] text-[#162229]">
              {mode === 'edit' ? 'Editar Acionamento' : 'Novo Acionamento'}
            </h1>
            <span className="text-xs text-[#64737C] font-normal">
              CMS — Monitoramento &amp; Segurança Operacional
            </span>
          </div>
        </div>

        {/* User Identification Badge */}
        <div className="flex items-center self-start sm:self-auto bg-white border border-[#c8d5db] shadow-2xs rounded-full py-1.5 px-3.5 gap-2.5 text-xs text-[#3e4e57]">
          <span className="w-2 h-2 rounded-full bg-[#00807C] shrink-0" aria-hidden="true" />
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#1F6E9C]" />
            <span className="font-semibold text-[#162229]">{operator.name}</span>
            <span className="text-[#64737C] text-[11px]">(Operador CMS)</span>
          </div>
        </div>
      </div>

      {/* Conflict or Submission Error Alert */}
      {submitError && (
        <div
          role="alert"
          className="rounded-2xl bg-[#FCEFEF] border border-[#ECC4C3] px-4 py-3 text-xs text-[#8C3230] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
        >
          <span>{submitError}</span>
          {conflictRecord && onReloadLatest && (
            <button
              type="button"
              onClick={() => void onReloadLatest()}
              className="px-3 py-1.5 rounded-xl bg-[#B94A48] text-white font-semibold hover:bg-[#9E3B39] shrink-0 cursor-pointer"
            >
              Recarregar versão mais recente
            </button>
          )}
        </div>
      )}

      {/* Main Operational Form Card */}
      <div className={`${SURFACE_TOKENS.cardElevated} overflow-hidden`}>
        {/* Vale institutional green + gold hairline accent */}
        <div className="h-[3px] flex" aria-hidden="true">
          <div className="w-[74%] bg-[#00807C]" />
          <div className="w-[26%] bg-[#EEA722]" />
        </div>

        <form
          id="form-acionamento"
          className="p-6 sm:p-8 space-y-7"
          onSubmit={(e) => {
            e.preventDefault();
            handleAttemptSubmit();
          }}
        >
          {/* SEÇÃO 1: QUEM ACIONOU (linha inteira) & DATAS E HORÁRIOS (abaixo) */}
          <section className="space-y-6">
            {/* Top full-width row: Quem Acionou */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="input-acionador"
                  className="block text-xs font-bold tracking-wider text-[#3e4e57] uppercase"
                >
                  QUEM ACIONOU <span className="text-[#00807C] font-bold">*</span>
                </label>
                <span className="text-[11px] text-[#64737C] font-medium">
                  Digite o nome e clique em um atalho para compor{' '}
                  <span className="font-semibold text-[#3e4e57]">Nome (Atalho)</span>
                </span>
              </div>

              <div>
                <input
                  ref={acionadorInputRef}
                  id="input-acionador"
                  type="text"
                  value={form.quemAcionou}
                  onChange={(e) => updateField('quemAcionou', e.target.value)}
                  placeholder="Ex: Jocimar — digite o nome e clique em um atalho abaixo para ficar Jocimar (CCE)"
                  aria-invalid={Boolean(fieldErrors.quemAcionou)}
                  className={
                    fieldErrors.quemAcionou
                      ? FIELD_VARIANTS.inputError
                      : FIELD_VARIANTS.input
                  }
                />
                {fieldErrors.quemAcionou && (
                  <p className="text-[11px] text-[#8C3230] mt-1">{fieldErrors.quemAcionou}</p>
                )}
              </div>

              {/* Atalhos */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] font-medium text-[#64737C] mr-0.5">Atalhos:</span>
                {catalog.quemAcionouAtalhos.map((atalho) => {
                  const normalized = form.quemAcionou.trim().toUpperCase();
                  const upperShortcut = atalho.toUpperCase();
                  const isMatch =
                    normalized === upperShortcut ||
                    normalized.endsWith(`(${upperShortcut})`);
                  return (
                    <button
                      key={atalho}
                      type="button"
                      onClick={() => handleQuemAcionouShortcut(atalho)}
                      className={`inline-flex items-center px-3 py-1 text-xs rounded-xl border transition-colors cursor-pointer ${
                        isMatch
                          ? 'font-semibold bg-[#00807C] border-[#00807C] text-white shadow-2xs'
                          : 'font-medium bg-[#eef3f5] border-[#d4dfe4] text-[#3e4e57] hover:bg-[#e1e9ed] hover:text-[#162229]'
                      }`}
                    >
                      {atalho}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom full-width row: Datas e Horários (Data início + Data fim + 4 marcos) */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="block text-xs font-bold tracking-wider text-[#3e4e57] uppercase">
                  DATAS E HORÁRIOS <span className="text-[#00807C] font-bold">*</span>
                </span>
                <span className="text-[11px] text-[#64737C] font-medium tracking-tight">
                  Cronologia 24h · Clique no ícone para preencher o horário atual
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 bg-[#f4f7f9] border border-[#d4dfe4] rounded-2xl p-3.5">
                {/* 1. Data início */}
                <div className="space-y-1 min-w-0">
                  <input
                    id="input-data-registro"
                    aria-label="Data início"
                    type="date"
                    value={form.dataRegistro}
                    onChange={(e) => updateField('dataRegistro', e.target.value)}
                    className={`w-full text-center text-[13px] font-semibold text-[#162229] bg-white border rounded-xl py-2 px-2 shadow-2xs ${
                      fieldErrors.dataRegistro ? 'border-[#B94A48]' : 'border-[#c8d5db]'
                    }`}
                  />
                  <div className="text-[11px] text-center font-medium text-[#52636d]">
                    Data início
                  </div>
                  {fieldErrors.dataRegistro && (
                    <p className="text-[10px] text-[#8C3230] text-center">
                      {fieldErrors.dataRegistro}
                    </p>
                  )}
                </div>

                {/* 2. Data fim */}
                <div className="space-y-1 min-w-0">
                  <input
                    id="input-data-fim"
                    aria-label="Data fim"
                    type="date"
                    value={form.dataFim}
                    onChange={(e) => updateField('dataFim', e.target.value)}
                    className={`w-full text-center text-[13px] font-semibold text-[#162229] bg-white border rounded-xl py-2 px-2 shadow-2xs ${
                      fieldErrors.dataFim ? 'border-[#B94A48]' : 'border-[#c8d5db]'
                    }`}
                  />
                  <div className="text-[11px] text-center font-medium text-[#52636d]">
                    Data fim
                  </div>
                  {fieldErrors.dataFim && (
                    <p className="text-[10px] text-[#8C3230] text-center">
                      {fieldErrors.dataFim}
                    </p>
                  )}
                </div>

                {/* 3. Acionamento */}
                <div className="space-y-1 min-w-0">
                  <div
                    className={`flex items-center justify-between gap-1 bg-white border rounded-xl px-2.5 py-2 shadow-2xs focus-within:border-[#00807C] ${
                      fieldErrors.horarioAcionamento ? 'border-[#B94A48]' : 'border-[#c8d5db]'
                    }`}
                  >
                    <input
                      id="input-horario-acionamento"
                      aria-label="Horário do acionamento"
                      type="text"
                      inputMode="numeric"
                      maxLength={5}
                      placeholder="00:00"
                      value={form.horarioAcionamento}
                      onChange={(e) =>
                        updateField('horarioAcionamento', formatTimeMask(e.target.value))
                      }
                      onBlur={() => handleTimeBlur('horarioAcionamento', true)}
                      className="w-full min-w-0 text-[13px] font-mono font-semibold text-[#162229] bg-transparent border-0 p-0 focus:ring-0 focus:shadow-none"
                    />
                    <button
                      type="button"
                      onClick={() => stampCurrentTime('horarioAcionamento')}
                      title="Preencher acionamento com horário atual"
                      aria-label="Preencher acionamento com horário atual"
                      className="inline-flex items-center justify-center p-1.5 rounded-lg bg-[#E7F4F3] hover:bg-[#d2ecea] text-[#005C59] border border-[#B3DCD9] shrink-0 cursor-pointer transition-colors"
                    >
                      <Radio className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-[11px] text-center font-medium text-[#52636d] truncate">
                    Acionamento
                  </div>
                  {fieldErrors.horarioAcionamento && (
                    <p className="text-[10px] text-[#8C3230] text-center">
                      {fieldErrors.horarioAcionamento}
                    </p>
                  )}
                </div>

                {/* 4. Equipe acionada */}
                <div className="space-y-1 min-w-0">
                  <div
                    className={`flex items-center justify-between gap-1 bg-white border rounded-xl px-2.5 py-2 shadow-2xs focus-within:border-[#00807C] ${
                      fieldErrors.horarioEquipeAcionada ? 'border-[#B94A48]' : 'border-[#c8d5db]'
                    }`}
                  >
                    <input
                      id="input-horario-equipe"
                      aria-label="Horário equipe acionada"
                      type="text"
                      inputMode="numeric"
                      maxLength={5}
                      placeholder="--:--"
                      value={form.horarioEquipeAcionada}
                      onChange={(e) =>
                        updateField('horarioEquipeAcionada', formatTimeMask(e.target.value))
                      }
                      onBlur={() => handleTimeBlur('horarioEquipeAcionada', false)}
                      className="w-full min-w-0 text-[13px] font-mono font-semibold text-[#162229] bg-transparent border-0 p-0 focus:ring-0 focus:shadow-none placeholder:text-[#9fb0b9]"
                    />
                    <button
                      type="button"
                      onClick={() => stampCurrentTime('horarioEquipeAcionada')}
                      title="Preencher equipe acionada com horário atual"
                      aria-label="Preencher equipe acionada com horário atual"
                      className="inline-flex items-center justify-center p-1.5 rounded-lg bg-[#EBF4FA] hover:bg-[#dcecf6] text-[#154F73] border border-[#B6D6EA] shrink-0 cursor-pointer transition-colors"
                    >
                      <Users className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-[11px] text-center font-medium text-[#52636d] truncate">
                    Equipe acionada
                  </div>
                  {fieldErrors.horarioEquipeAcionada && (
                    <p className="text-[10px] text-[#8C3230] text-center">
                      {fieldErrors.horarioEquipeAcionada}
                    </p>
                  )}
                </div>

                {/* 5. Chegada campo */}
                <div className="space-y-1 min-w-0">
                  <div
                    className={`flex items-center justify-between gap-1 bg-white border rounded-xl px-2.5 py-2 shadow-2xs focus-within:border-[#00807C] ${
                      fieldErrors.horarioChegadaCampo ? 'border-[#B94A48]' : 'border-[#c8d5db]'
                    }`}
                  >
                    <input
                      id="input-horario-chegada"
                      aria-label="Horário chegada em campo"
                      type="text"
                      inputMode="numeric"
                      maxLength={5}
                      placeholder="--:--"
                      value={form.horarioChegadaCampo}
                      onChange={(e) =>
                        updateField('horarioChegadaCampo', formatTimeMask(e.target.value))
                      }
                      onBlur={() => handleTimeBlur('horarioChegadaCampo', false)}
                      className="w-full min-w-0 text-[13px] font-mono font-semibold text-[#162229] bg-transparent border-0 p-0 focus:ring-0 focus:shadow-none placeholder:text-[#9fb0b9]"
                    />
                    <button
                      type="button"
                      onClick={() => stampCurrentTime('horarioChegadaCampo')}
                      title="Preencher chegada em campo com horário atual"
                      aria-label="Preencher chegada em campo com horário atual"
                      className="inline-flex items-center justify-center p-1.5 rounded-lg bg-[#EEF3F6] hover:bg-[#e1e9ee] text-[#364D5B] border border-[#C5D3DC] shrink-0 cursor-pointer transition-colors"
                    >
                      <MapPin className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-[11px] text-center font-medium text-[#52636d] truncate">
                    Chegada campo
                  </div>
                  {fieldErrors.horarioChegadaCampo && (
                    <p className="text-[10px] text-[#8C3230] text-center">
                      {fieldErrors.horarioChegadaCampo}
                    </p>
                  )}
                </div>

                {/* 6. Saída do local */}
                <div className="space-y-1 min-w-0">
                  <div
                    className={`flex items-center justify-between gap-1 bg-white border rounded-xl px-2.5 py-2 shadow-2xs focus-within:border-[#00807C] ${
                      fieldErrors.horarioNormalizacao ? 'border-[#B94A48]' : 'border-[#c8d5db]'
                    }`}
                  >
                    <input
                      id="input-horario-saida"
                      aria-label="Horário de saída do local"
                      type="text"
                      inputMode="numeric"
                      maxLength={5}
                      placeholder="--:--"
                      value={form.horarioNormalizacao}
                      onChange={(e) =>
                        updateField('horarioNormalizacao', formatTimeMask(e.target.value))
                      }
                      onBlur={() => handleTimeBlur('horarioNormalizacao', false)}
                      className="w-full min-w-0 text-[13px] font-mono font-semibold text-[#162229] bg-transparent border-0 p-0 focus:ring-0 focus:shadow-none placeholder:text-[#9fb0b9]"
                    />
                    <button
                      type="button"
                      onClick={() => stampCurrentTime('horarioNormalizacao')}
                      title="Preencher saída do local com horário atual"
                      aria-label="Preencher saída do local com horário atual"
                      className="inline-flex items-center justify-center p-1.5 rounded-lg bg-[#E7F4F3] hover:bg-[#d2ecea] text-[#005C59] border border-[#B3DCD9] shrink-0 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-[11px] text-center font-medium text-[#52636d] truncate">
                    Saída do local
                  </div>
                  {fieldErrors.horarioNormalizacao && (
                    <p className="text-[10px] text-[#8C3230] text-center">
                      {fieldErrors.horarioNormalizacao}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <hr className={SURFACE_TOKENS.divider} />

          {/* SEÇÃO 2: LOCALIDADE OPERACIONAL */}
          <section className="space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="block text-xs font-bold tracking-wider text-[#3e4e57] uppercase">
                LOCALIDADE OPERACIONAL <span className="text-[#00807C] font-bold">*</span>
              </span>

              <div
                className="inline-flex p-1 bg-[#e1e9ed] rounded-xl border border-[#cbd7dd] self-start sm:self-auto text-xs font-medium"
                role="group"
                aria-label="Tipo de localidade"
              >
                {catalog.tiposLocalidade.map((loc) => {
                  const isActive = form.tipoLocalidade === loc;
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => updateField('tipoLocalidade', loc as TipoLocalidade)}
                      className={`px-3.5 py-1 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-white text-[#005C59] font-semibold shadow-2xs border border-[#c8d5db]'
                          : 'text-[#485a64] hover:text-[#162229] border border-transparent'
                      }`}
                    >
                      {loc}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5">
              {/* KM Ferroviário */}
              <div className="lg:col-span-2 space-y-1.5">
                <label htmlFor="km-input" className="text-xs font-medium text-[#52636d]">
                  KM Ferroviário
                </label>
                <input
                  id="km-input"
                  type="text"
                  value={form.kmFerroviario}
                  onChange={(e) => updateField('kmFerroviario', e.target.value)}
                  placeholder="Ex: KM 12+400"
                  className={FIELD_VARIANTS.input}
                />
              </div>

              {/* Housing / RH */}
              <div className="lg:col-span-2 space-y-1.5">
                <label htmlFor="housing-input" className="text-xs font-medium text-[#52636d]">
                  Housing / RH
                </label>
                <input
                  id="housing-input"
                  type="text"
                  value={form.housingRh}
                  onChange={(e) => updateField('housingRh', e.target.value)}
                  placeholder="Digite o Housing / RH"
                  className={FIELD_VARIANTS.input}
                />
              </div>

              {/* Seletor Estado (ES / MG) */}
              <div className="lg:col-span-2 space-y-1.5">
                <span className="block text-xs font-medium text-[#52636d]">Estado (UF)</span>
                <div
                  className="grid grid-cols-2 p-1 bg-[#e1e9ed] rounded-xl border border-[#c8d5db] h-[42px]"
                  role="group"
                  aria-label="Filtrar municípios por estado"
                >
                  {(['ES', 'MG'] as const).map((uf) => {
                    const isActive = selectedUf === uf;
                    return (
                      <button
                        key={uf}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => handleSelectUf(uf)}
                        className={`rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#00807C] text-white shadow-2xs'
                            : 'text-[#485a64] hover:text-[#162229]'
                        }`}
                      >
                        {uf}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Município (filtrado por ES ou MG) */}
              <div className="lg:col-span-3 space-y-1.5">
                <label htmlFor="municipio-select" className="text-xs font-medium text-[#52636d]">
                  Município ({selectedUf})
                </label>
                <select
                  id="municipio-select"
                  value={form.municipio}
                  onChange={(e) => updateField('municipio', e.target.value)}
                  className={FIELD_VARIANTS.select}
                >
                  <option value="">Selecione...</option>
                  {municipioOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Analista responsável */}
              <div className="lg:col-span-3 space-y-1.5">
                <label htmlFor="analista-select" className="text-xs font-medium text-[#52636d]">
                  Analista responsável
                </label>
                <select
                  id="analista-select"
                  value={form.analistaResponsavel}
                  onChange={(e) => updateField('analistaResponsavel', e.target.value)}
                  className={FIELD_VARIANTS.select}
                >
                  <option value="">Selecione...</option>
                  {analistaOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <hr className={SURFACE_TOKENS.divider} />

          {/* SEÇÃO 3: DESCRIÇÃO E CRONOLOGIA */}
          <section className="space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="textarea-cronologia"
                className="block text-xs font-bold tracking-wider text-[#3e4e57] uppercase"
              >
                DESCRIÇÃO E CRONOLOGIA <span className="text-[#00807C] font-bold">*</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={insertTimestampIntoCronologia}
                  className={`${BUTTON_VARIANTS.mineralBlue} px-2.5 py-1 text-[11px]`}
                >
                  <Clock className="w-3 h-3" />
                  <span>Inserir horário atual</span>
                </button>
                <span className="text-[11px] font-mono tabular-nums font-medium text-[#64737C] bg-[#f4f7f9] border border-[#d4dfe4] px-2.5 py-0.5 rounded-lg">
                  {form.descricaoCronologia.length} caracteres
                </span>
              </div>
            </div>

            <div>
              <textarea
                ref={cronologiaRef}
                id="textarea-cronologia"
                rows={6}
                value={form.descricaoCronologia}
                onChange={(e) => updateField('descricaoCronologia', e.target.value)}
                placeholder="Descreva o histórico cronológico completo do atendimento (ex: 09:40 - Solicitação recebida...)"
                aria-invalid={Boolean(fieldErrors.descricaoCronologia)}
                className={`w-full text-[13.5px] leading-relaxed font-sans text-[#162229] bg-white border rounded-2xl p-4 shadow-2xs resize-y ${
                  fieldErrors.descricaoCronologia
                    ? 'border-[#B94A48] bg-[#fdf7f7]'
                    : 'border-[#c8d5db]'
                }`}
              />
              {fieldErrors.descricaoCronologia && (
                <p className="text-[11px] text-[#8C3230] mt-1">
                  {fieldErrors.descricaoCronologia}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1 items-end">
              {/* Tecnologia empregada? */}
              <div className="md:col-span-3 space-y-2">
                <span className="block text-xs font-medium text-[#52636d]">
                  Tecnologia empregada?
                </span>
                <div className="flex items-center space-x-4 bg-[#f4f7f9] border border-[#d4dfe4] rounded-xl px-3.5 py-2.5">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="tech-employed"
                      checked={form.tecnologiaEmpregada === true}
                      onChange={() => {
                        updateField('tecnologiaEmpregada', true);
                        if (!form.tecnologiaUtilizada && techOptions[0]) {
                          updateField('tecnologiaUtilizada', techOptions[0]);
                        }
                      }}
                      className="h-4 w-4 accent-[#00807C] border-[#c8d5db]"
                    />
                    <span className="ml-2 text-xs font-semibold text-[#162229]">SIM</span>
                  </label>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="tech-employed"
                      checked={form.tecnologiaEmpregada === false}
                      onChange={() => {
                        updateField('tecnologiaEmpregada', false);
                        updateField('tecnologiaUtilizada', '');
                      }}
                      className="h-4 w-4 accent-[#00807C] border-[#c8d5db]"
                    />
                    <span className="ml-2 text-xs font-medium text-[#52636d]">NÃO</span>
                  </label>
                </div>
              </div>

              {/* Qual? */}
              <div
                className={`md:col-span-3 space-y-2 transition-opacity ${
                  form.tecnologiaEmpregada ? 'opacity-100' : 'opacity-45'
                }`}
              >
                <label htmlFor="tech-select" className="block text-xs font-medium text-[#52636d]">
                  Qual? {form.tecnologiaEmpregada && <span className="text-[#00807C]">*</span>}
                </label>
                <select
                  id="tech-select"
                  disabled={!form.tecnologiaEmpregada}
                  value={form.tecnologiaUtilizada}
                  onChange={(e) => updateField('tecnologiaUtilizada', e.target.value)}
                  className={
                    fieldErrors.tecnologiaUtilizada
                      ? FIELD_VARIANTS.inputError
                      : `${FIELD_VARIANTS.select} disabled:cursor-not-allowed disabled:bg-[#f4f7f9]`
                  }
                >
                  <option value="">Selecione...</option>
                  {techOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {fieldErrors.tecnologiaUtilizada && (
                  <p className="text-[11px] text-[#8C3230]">
                    {fieldErrors.tecnologiaUtilizada}
                  </p>
                )}
              </div>

              {/* Marque as opções envolvidas */}
              <div className="md:col-span-6 space-y-2">
                <span className="block text-xs font-medium text-[#52636d]">
                  Marque as opções envolvidas
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {catalog.acoesEnvolvidas.map((acao) => {
                    const selected = form.acoesEnvolvidas.includes(acao);
                    return (
                      <button
                        key={acao}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleAcao(acao)}
                        className={`inline-flex items-center px-3.5 py-2 rounded-xl border text-xs transition-all cursor-pointer ${
                          selected
                            ? 'border-[#00807C] bg-[#00807C] font-semibold text-white shadow-2xs'
                            : 'border-[#c8d5db] bg-white font-medium text-[#3e4e57] hover:border-[#9fb3bd] hover:bg-[#f4f7f9]'
                        }`}
                      >
                        {selected && <Check className="w-3.5 h-3.5 mr-1.5 text-white" />}
                        <span>{acao}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <hr className={SURFACE_TOKENS.divider} />

          {/* SEÇÃO 4: DETALHES ESSENCIAIS */}
          <section className="space-y-3.5">
            <span className="block text-xs font-bold tracking-wider text-[#3e4e57] uppercase">
              DETALHES ESSENCIAIS
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Equipe de Campo (lista suspensa) */}
              <div className="space-y-1.5">
                <label htmlFor="equipe-campo" className="text-xs font-medium text-[#52636d]">
                  Equipe de Campo / Atendido por{' '}
                  <span className="text-[#00807C] font-bold">*</span>
                </label>
                <select
                  id="equipe-campo"
                  value={form.equipeCampo}
                  onChange={(e) => updateField('equipeCampo', e.target.value)}
                  aria-invalid={Boolean(fieldErrors.equipeCampo)}
                  className={
                    fieldErrors.equipeCampo ? FIELD_VARIANTS.inputError : FIELD_VARIANTS.select
                  }
                >
                  <option value="">Selecione a equipe...</option>
                  {equipeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {fieldErrors.equipeCampo && (
                  <p className="text-[11px] text-[#8C3230]">{fieldErrors.equipeCampo}</p>
                )}
              </div>

              {/* Nome do(s) Vigilante(s) ao lado */}
              <div className="space-y-1.5">
                <label htmlFor="input-vigilantes" className="text-xs font-medium text-[#52636d]">
                  Nome do(s) Vigilante(s)
                </label>
                <input
                  id="input-vigilantes"
                  type="text"
                  value={form.vigilantes}
                  onChange={(e) => updateField('vigilantes', e.target.value)}
                  placeholder="Ex: João Silva, Marcos Souza"
                  className={FIELD_VARIANTS.input}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Material / Ativos */}
              <div className="space-y-1.5">
                <label htmlFor="ativos-select" className="text-xs font-medium text-[#52636d]">
                  Material / Ativos envolvidos
                </label>
                <select
                  id="ativos-select"
                  value={form.materialAtivos}
                  onChange={(e) => updateField('materialAtivos', e.target.value)}
                  className={FIELD_VARIANTS.select}
                >
                  <option value="">Selecione...</option>
                  {materialOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipificação */}
              <div className="space-y-1.5">
                <label
                  htmlFor="tipificacao-select"
                  className="text-xs font-medium text-[#52636d]"
                >
                  Tipificação
                </label>
                <select
                  id="tipificacao-select"
                  value={form.tipificacao}
                  onChange={(e) => updateField('tipificacao', e.target.value)}
                  className={FIELD_VARIANTS.select}
                >
                  <option value="">Selecione...</option>
                  {tipificacaoOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* INC */}
              <div className="space-y-1.5">
                <label htmlFor="inc-input" className="text-xs font-medium text-[#52636d]">
                  INC <span className="text-[#77787B] font-normal">(opcional)</span>
                </label>
                <input
                  id="inc-input"
                  type="text"
                  value={form.inc}
                  onChange={(e) => updateField('inc', e.target.value)}
                  placeholder="Ex: INC2026000001"
                  aria-invalid={Boolean(fieldErrors.inc)}
                  className={`${
                    fieldErrors.inc ? FIELD_VARIANTS.inputError : FIELD_VARIANTS.input
                  } font-mono font-semibold tracking-tight`}
                />
                {fieldErrors.inc ? (
                  <p className="text-[11px] text-[#8C3230]">{fieldErrors.inc}</p>
                ) : (
                  (form.statusOperacional === 'Encerrado' ||
                    form.statusOperacional === 'Report') &&
                  !hasValidInc(form.inc) && (
                    <p className="text-[11px] text-[#64737c]">
                      Pode ficar em branco e ser preenchido depois (sinalizado como Sem INC).
                    </p>
                  )
                )}
              </div>
            </div>
          </section>

          <hr className={SURFACE_TOKENS.divider} />

          {/* SEÇÃO 5: STATUS OPERACIONAL & SEQUENCIAL */}
          <section className="space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="block text-xs font-bold tracking-wider text-[#3e4e57] uppercase">
                STATUS OPERACIONAL <span className="text-[#00807C] font-bold">*</span>
              </span>

              {/* Sequential REPORT Badge — Institutional Gold accent */}
              <div
                className={`inline-flex items-center text-xs font-semibold text-[#8A5602] bg-[#FEF6E3] border border-[#F3D085] rounded-full px-3 py-0.5 self-start sm:self-auto shadow-2xs transition-all ${
                  isReportSelected || existingReportNum !== null
                    ? 'opacity-100 ring-2 ring-[#EEA722]/35'
                    : 'opacity-60'
                }`}
              >
                {existingReportNum !== null ? (
                  <>
                    <span className="font-normal text-[#965F04] mr-1">Sequencial preservado:</span>
                    <span className="font-bold font-mono">REPORT #{existingReportNum}</span>
                  </>
                ) : (
                  <>
                    <span className="font-normal text-[#965F04] mr-1">Sequencial:</span>
                    <span className="font-bold font-mono">REPORT #{nextReportNumber}</span>
                    <span className="text-[#965F04] font-normal ml-1.5 text-[11px] font-mono">
                      (último: {lastReportNumber})
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {STATUS_OPTIONS.map((status) => {
                const isSelected = form.statusOperacional === status;
                const statusTokens = STATUS_DESIGN_TOKENS[status];
                const selectedIconColor = status === 'Sem atendimento' ? 'text-[#162229]' : 'text-white';
                return (
                  <button
                    key={status}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => updateField('statusOperacional', status)}
                    className={`w-full py-2.5 px-3 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? statusTokens.selectedButtonClass
                        : 'border-[#c8d5db] bg-white font-medium text-[#3e4e57] hover:border-[#9fb3bd] hover:bg-[#f4f7f9]'
                    }`}
                  >
                    {isSelected ? (
                      status === 'Report' ? (
                        <ClipboardList className={`w-3.5 h-3.5 ${selectedIconColor} shrink-0`} />
                      ) : (
                        <Check className={`w-3.5 h-3.5 ${selectedIconColor} shrink-0`} />
                      )
                    ) : (
                      <span
                        className={`w-2 h-2 rounded-full ${statusTokens.dotClass} shrink-0`}
                        aria-hidden="true"
                      />
                    )}
                    <span className="truncate">{status}</span>
                  </button>
                );
              })}
            </div>

            {showEncerradoTimeHint && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#FEF6E3] border border-[#F3D085] px-4 py-2.5 text-xs text-[#7A4B00]">
                <span className="inline-flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#965F04] shrink-0" />
                  <span>
                    Registro marcado como <strong>Encerrado</strong> sem horário de saída do local.
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => stampCurrentTime('horarioNormalizacao')}
                  className="font-semibold text-[#7A4B00] underline hover:text-[#162229] cursor-pointer"
                >
                  Preencher agora ({getCurrentTime24h()})
                </button>
              </div>
            )}
          </section>
        </form>
      </div>

      {/* Footer Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1 px-1">
        <span className="text-xs text-[#64737C] font-medium sm:mr-auto hidden sm:inline-block">
          Dica: use{' '}
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold text-[#3e4e57] bg-white border border-[#c8d5db] rounded-md shadow-2xs">
            Ctrl
          </kbd>{' '}
          +{' '}
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold text-[#3e4e57] bg-white border border-[#c8d5db] rounded-md shadow-2xs">
            Enter
          </kbd>{' '}
          para salvar
        </span>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={handleRequestCancel}
            className={`${BUTTON_VARIANTS.ghost} px-5 py-2.5 text-sm`}
          >
            Cancelar
          </button>

          <button
            type="submit"
            form="form-acionamento"
            disabled={saving}
            className={`${BUTTON_VARIANTS.primary} px-6 py-2.5 text-sm shadow-sm`}
          >
            <Check className="w-4 h-4 text-white" />
            <span>
              {saving
                ? 'Salvando...'
                : mode === 'edit'
                  ? 'Salvar alterações'
                  : 'Salvar acionamento'}
            </span>
          </button>
        </div>
      </div>

      {/* Unsaved changes confirmation dialog */}
      <ConfirmDialog
        open={showCancelConfirm}
        variant="warning"
        title="Descartar alterações?"
        description="Existem alterações não salvas neste formulário. Se voltar agora, esses dados serão perdidos."
        confirmLabel="Descartar e voltar"
        cancelLabel="Continuar editando"
        onConfirm={() => {
          setShowCancelConfirm(false);
          onCancel();
        }}
        onCancel={() => setShowCancelConfirm(false)}
      />

      {/* Explicit Google Sheets write confirmation dialog */}
      <ConfirmDialog
        open={showSheetsSaveConfirm}
        title={
          mode === 'edit'
            ? 'Confirmar atualização no Google Sheets?'
            : 'Confirmar gravação no Google Sheets?'
        }
        description={
          mode === 'edit'
            ? 'O registro existente será atualizado na aba Acionamentos e a modificação será registrada na aba Auditoria.'
            : 'Um novo registro será gravado na aba Acionamentos e registrado na aba Auditoria da planilha compartilhada.'
        }
        details={
          pendingSanitized
            ? [
                `Quem acionou: ${pendingSanitized.quemAcionou}`,
                `INC: ${pendingSanitized.inc || 'Sem INC'} · Status: ${pendingSanitized.statusOperacional}`,
                `Local: ${pendingSanitized.tipoLocalidade} · ${pendingSanitized.municipio || '—'} · ${pendingSanitized.kmFerroviario || '—'}`,
              ]
            : undefined
        }
        confirmLabel={mode === 'edit' ? 'Confirmar atualização' : 'Confirmar gravação'}
        busy={saving}
        onConfirm={() => {
          if (pendingSanitized) {
            void executeSave(pendingSanitized);
          }
        }}
        onCancel={() => {
          setShowSheetsSaveConfirm(false);
          setPendingSanitized(null);
        }}
      />
    </div>
  );
}
