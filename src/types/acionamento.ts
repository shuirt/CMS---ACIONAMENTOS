export type StatusOperacional =
  | 'Encerrado'
  | 'Sem atendimento'
  | 'Cancelado'
  | 'Informação'
  | 'Em andamento'
  | 'Report';

export type TipoLocalidade = 'Linha Férrea' | 'Pátio' | 'Estação';

export interface Acionamento {
  id: string;
  numeroReport: number | null;
  dataRegistro: string; // ISO YYYY-MM-DD
  dataFim: string; // ISO YYYY-MM-DD or ""
  horarioAcionamento: string; // HH:mm
  horarioEquipeAcionada: string; // HH:mm or ""
  horarioChegadaCampo: string; // HH:mm or ""
  horarioNormalizacao: string; // HH:mm or ""
  quemAcionou: string;
  tipoLocalidade: TipoLocalidade;
  kmFerroviario: string;
  housingRh: string;
  municipio: string;
  analistaResponsavel: string;
  descricaoCronologia: string;
  tecnologiaEmpregada: boolean;
  tecnologiaUtilizada: string;
  acoesEnvolvidas: string[];
  equipeCampo: string;
  vigilantes: string;
  materialAtivos: string;
  tipificacao: string;
  inc: string;
  statusOperacional: StatusOperacional;
  createdAt: string; // ISO datetime
  createdByName: string;
  createdByEmail: string;
  updatedAt: string; // ISO datetime
  updatedByName: string;
  updatedByEmail: string;
}

export interface AcionamentoInput {
  dataRegistro: string;
  dataFim: string;
  horarioAcionamento: string;
  horarioEquipeAcionada: string;
  horarioChegadaCampo: string;
  horarioNormalizacao: string;
  quemAcionou: string;
  tipoLocalidade: TipoLocalidade;
  kmFerroviario: string;
  housingRh: string;
  municipio: string;
  analistaResponsavel: string;
  descricaoCronologia: string;
  tecnologiaEmpregada: boolean;
  tecnologiaUtilizada: string;
  acoesEnvolvidas: string[];
  equipeCampo: string;
  vigilantes: string;
  materialAtivos: string;
  tipificacao: string;
  inc: string;
  statusOperacional: StatusOperacional;
}

export type ConfigGrupo =
  | 'quem_acionou'
  | 'tipo_localidade'
  | 'housing_rh'
  | 'municipio'
  | 'analista'
  | 'tecnologia'
  | 'acoes_envolvidas'
  | 'equipe_campo'
  | 'material_ativos'
  | 'tipificacao';

export interface ConfigOption {
  chave: string;
  grupo: ConfigGrupo;
  valor: string;
  ativo: boolean;
  ordem: number;
}

export interface ConfigOptionInput {
  grupo: ConfigGrupo;
  valor: string;
}

export interface ConfigOptionUpdate {
  valor: string;
  ativo: boolean;
  ordem: number;
}

export interface ConfigCatalog {
  quemAcionouAtalhos: string[];
  tiposLocalidade: string[];
  housingsRh: string[];
  municipios: string[];
  analistas: string[];
  tecnologias: string[];
  acoesEnvolvidas: string[];
  equipesCampo: string[];
  materiaisAtivos: string[];
  tipificacoes: string[];
}

export interface AuditoriaEntry {
  idAuditoria: string;
  dataHora: string; // ISO datetime
  idAcionamento: string;
  tipoOperacao: 'criação' | 'edição';
  usuarioResponsavel: string;
  emailUsuario: string;
  camposAlterados: string;
}

export interface OperatorIdentity {
  name: string;
  email: string;
  mode: 'google' | 'demo';
}

export interface ShiftConfig {
  inicio: string; // HH:mm
  fim: string; // HH:mm
}

export type RegistrosTab = 'aberto' | 'encerrado' | 'todos';

export type RegistrosDateFilter = 'hoje' | 'ontem' | 'todas' | string;

export type IncFilter = 'todos' | 'com_inc' | 'sem_inc';

export interface HistoricoFilters {
  dateFrom: string;
  dateTo: string;
  statusFilter: StatusOperacional | 'Todos';
  operatorFilter: string;
  incFilter: IncFilter;
  quemAcionouFilter: string;
  tipoLocalidadeFilter: TipoLocalidade | 'Todas';
  municipioFilter: string;
  tipificacaoFilter: string;
  analistaFilter: string;
  tecnologiaFilter: 'todas' | 'sim' | 'nao';
  reportFilter: 'todos' | 'com_report' | 'sem_report';
  search: string;
}

export interface Iniciativa {
  id: string;
  numeroIniciativa: number;
  dataRegistro: string; // ISO YYYY-MM-DD
  horario: string; // HH:mm
  municipio: string;
  tipoLocalidade: TipoLocalidade;
  kmFerroviario: string;
  analistaResponsavel: string;
  descricao: string;
  tipificacao: string;
  inc: string;
  createdAt: string;
  createdByName: string;
  createdByEmail: string;
  updatedAt: string;
  updatedByName: string;
  updatedByEmail: string;
}

export interface IniciativaInput {
  dataRegistro: string;
  horario: string;
  municipio: string;
  tipoLocalidade: TipoLocalidade;
  kmFerroviario: string;
  analistaResponsavel: string;
  descricao: string;
  tipificacao: string;
  inc: string;
}

export interface Report {
  id: string;
  numeroReport: number;
  inc: string;
  dataRegistro: string;
  horario: string;
  descricao: string;
  tipificacao: string;
  municipio: string;
  tipoLocalidade: TipoLocalidade;
  kmFerroviario: string;
  analistaResponsavel: string;
  createdAt: string;
  createdByName: string;
  createdByEmail: string;
  updatedAt: string;
  updatedByName: string;
  updatedByEmail: string;
}

export interface ReportInput {
  inc: string;
  dataRegistro: string;
  horario: string;
  descricao: string;
  tipificacao: string;
  municipio: string;
  tipoLocalidade: TipoLocalidade;
  kmFerroviario: string;
  analistaResponsavel: string;
}

export interface WorkspaceSnapshot {
  acionamentos: Acionamento[];
  iniciativas: Iniciativa[];
  reports: Report[];
  configOptions: ConfigOption[];
  catalog: ConfigCatalog;
  auditoria: AuditoriaEntry[];
  nextReportNumber: number;
  nextReportRecordNumber: number;
  lastReportNumber: number;
  nextIniciativaNumber: number;
  lastIniciativaNumber: number;
  syncedAt: string;
}

export type ValidationErrors = Partial<
  Record<keyof AcionamentoInput | keyof IniciativaInput | keyof ReportInput, string>
>;

