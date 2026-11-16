import type { ConfigCatalog, ConfigOption, StatusOperacional } from '../types/acionamento';

export const STATUS_OPTIONS: StatusOperacional[] = [
  'Encerrado',
  'Sem atendimento',
  'Cancelado',
  'Informação',
  'Em andamento',
  'Report',
];

export const INITIAL_CONFIG_OPTIONS: ConfigOption[] = [
  // Atalhos de quem acionou (apenas órgãos/centrais solicitantes)
  { chave: 'qa_cce', grupo: 'quem_acionou', valor: 'CCE', ativo: true, ordem: 1 },
  { chave: 'qa_ccs_vli', grupo: 'quem_acionou', valor: 'CCS VLI', ativo: true, ordem: 2 },
  { chave: 'qa_cpt', grupo: 'quem_acionou', valor: 'CPT', ativo: true, ordem: 3 },
  { chave: 'qa_ccm', grupo: 'quem_acionou', valor: 'CCM', ativo: true, ordem: 4 },
  { chave: 'qa_cpt_patio_tu', grupo: 'quem_acionou', valor: 'CPT PATIO TU', ativo: true, ordem: 5 },

  // Tipo de localidade
  { chave: 'loc_linha', grupo: 'tipo_localidade', valor: 'Linha Férrea', ativo: true, ordem: 1 },
  { chave: 'loc_patio', grupo: 'tipo_localidade', valor: 'Pátio', ativo: true, ordem: 2 },
  { chave: 'loc_estacao', grupo: 'tipo_localidade', valor: 'Estação', ativo: true, ordem: 3 },

  // Housing / RH
  { chave: 'rh_0103', grupo: 'housing_rh', valor: 'EH01/03', ativo: true, ordem: 1 },
  { chave: 'rh_0104', grupo: 'housing_rh', valor: 'EH01/04', ativo: true, ordem: 2 },
  { chave: 'rh_0201', grupo: 'housing_rh', valor: 'EH02/01', ativo: true, ordem: 3 },

  // Municípios (Dados Reais VLI CMS - ES e MG)
  { chave: 'mun_aimores', grupo: 'municipio', valor: 'Aimorés (MG)', ativo: true, ordem: 1 },
  { chave: 'mun_antonio_dias', grupo: 'municipio', valor: 'Antônio Dias (MG)', ativo: true, ordem: 2 },
  { chave: 'mun_aracruz', grupo: 'municipio', valor: 'Aracruz (ES)', ativo: true, ordem: 3 },
  { chave: 'mun_aricanga', grupo: 'municipio', valor: 'Aricanga (MG)', ativo: true, ordem: 4 },
  { chave: 'mun_aroaba', grupo: 'municipio', valor: 'Aroaba (MG)', ativo: true, ordem: 5 },
  { chave: 'mun_baguari', grupo: 'municipio', valor: 'Baguari (MG)', ativo: true, ordem: 6 },
  { chave: 'mun_baixo_guandu', grupo: 'municipio', valor: 'Baixo Guandu (ES)', ativo: true, ordem: 7 },
  { chave: 'mun_barao_cocais', grupo: 'municipio', valor: 'Barão de Cocais (MG)', ativo: true, ordem: 8 },
  { chave: 'mun_barra_liberdade', grupo: 'municipio', valor: 'Barra da Liberdade (MG)', ativo: true, ordem: 9 },
  { chave: 'mun_barra_cuiete', grupo: 'municipio', valor: 'Barra do Cuieté (MG)', ativo: true, ordem: 10 },
  { chave: 'mun_bela_vista', grupo: 'municipio', valor: 'Bela Vista de Minas (MG)', ativo: true, ordem: 11 },
  { chave: 'mun_bh', grupo: 'municipio', valor: 'Belo Horizonte (MG)', ativo: true, ordem: 12 },
  { chave: 'mun_belo_oriente', grupo: 'municipio', valor: 'Belo Oriente (MG)', ativo: true, ordem: 13 },
  { chave: 'mun_caete', grupo: 'municipio', valor: 'Caeté (MG)', ativo: true, ordem: 14 },
  { chave: 'mun_calogi', grupo: 'municipio', valor: 'Calogi (ES)', ativo: true, ordem: 15 },
  { chave: 'mun_capoeirana', grupo: 'municipio', valor: 'Capoeirana (MG)', ativo: true, ordem: 16 },
  { chave: 'mun_cariacica', grupo: 'municipio', valor: 'Cariacica (ES)', ativo: true, ordem: 17 },
  { chave: 'mun_catas_altas', grupo: 'municipio', valor: 'Catas Altas (MG)', ativo: true, ordem: 18 },
  { chave: 'mun_cavalinhos', grupo: 'municipio', valor: 'Cavalinhos (MG)', ativo: true, ordem: 19 },
  { chave: 'mun_colatina', grupo: 'municipio', valor: 'Colatina (ES)', ativo: true, ordem: 20 },
  { chave: 'mun_cons_pena', grupo: 'municipio', valor: 'Conselheiro Pena (MG)', ativo: true, ordem: 21 },
  { chave: 'mun_cel_fabriciano', grupo: 'municipio', valor: 'Coronel Fabriciano (MG)', ativo: true, ordem: 22 },
  { chave: 'mun_costa_lacerda', grupo: 'municipio', valor: 'Costa Lacerda (MG)', ativo: true, ordem: 23 },
  { chave: 'mun_krenaque', grupo: 'municipio', valor: 'Krenaque (MG)', ativo: true, ordem: 24 },
  { chave: 'mun_floralia', grupo: 'municipio', valor: 'Florália (MG)', ativo: true, ordem: 25 },
  { chave: 'mun_fundao', grupo: 'municipio', valor: 'Fundão (ES)', ativo: true, ordem: 26 },
  { chave: 'mun_gov_valadares', grupo: 'municipio', valor: 'Governador Valadares (MG)', ativo: true, ordem: 27 },
  { chave: 'mun_ibiracu', grupo: 'municipio', valor: 'Ibiraçu (ES)', ativo: true, ordem: 28 },
  { chave: 'mun_ipaba', grupo: 'municipio', valor: 'Ipaba (MG)', ativo: true, ordem: 29 },
  { chave: 'mun_ipatinga', grupo: 'municipio', valor: 'Ipatinga (MG)', ativo: true, ordem: 30 },
  { chave: 'mun_itabira', grupo: 'municipio', valor: 'Itabira (MG)', ativo: true, ordem: 31 },
  { chave: 'mun_itaciba', grupo: 'municipio', valor: 'Itacibá (ES)', ativo: true, ordem: 32 },
  { chave: 'mun_itapina', grupo: 'municipio', valor: 'Itapina (ES)', ativo: true, ordem: 33 },
  { chave: 'mun_itueta', grupo: 'municipio', valor: 'Ituêta (MG)', ativo: true, ordem: 34 },
  { chave: 'mun_joao_monlevade', grupo: 'municipio', valor: 'João Monlevade (MG)', ativo: true, ordem: 35 },
  { chave: 'mun_joao_neiva', grupo: 'municipio', valor: 'João Neiva (ES)', ativo: true, ordem: 36 },
  { chave: 'mun_maria_ortiz', grupo: 'municipio', valor: 'Maria Ortiz (ES)', ativo: true, ordem: 37 },
  { chave: 'mun_mariana', grupo: 'municipio', valor: 'Mariana (MG)', ativo: true, ordem: 38 },
  { chave: 'mun_mario_carvalho', grupo: 'municipio', valor: 'Mario Carvalho (MG)', ativo: true, ordem: 39 },
  { chave: 'mun_mascarenhas', grupo: 'municipio', valor: 'Mascarenhas (MG)', ativo: true, ordem: 40 },
  { chave: 'mun_naque', grupo: 'municipio', valor: 'Naque (MG)', ativo: true, ordem: 41 },
  { chave: 'mun_nova_era', grupo: 'municipio', valor: 'Nova Era (MG)', ativo: true, ordem: 42 },
  { chave: 'mun_ouro_preto', grupo: 'municipio', valor: 'Ouro Preto (MG)', ativo: true, ordem: 43 },
  { chave: 'mun_pedra_corrida', grupo: 'municipio', valor: 'Pedra Corrida (MG)', ativo: true, ordem: 44 },
  { chave: 'mun_pedro_palacios', grupo: 'municipio', valor: 'Pedro Palácios (MG)', ativo: true, ordem: 45 },
  { chave: 'mun_periquito', grupo: 'municipio', valor: 'Periquito (MG)', ativo: true, ordem: 46 },
  { chave: 'mun_resplendor', grupo: 'municipio', valor: 'Resplendor (MG)', ativo: true, ordem: 47 },
  { chave: 'mun_ribeirao_cima', grupo: 'municipio', valor: 'Ribeirão de Cima (MG)', ativo: true, ordem: 48 },
  { chave: 'mun_rio_piracicaba', grupo: 'municipio', valor: 'Rio Piracicaba (MG)', ativo: true, ordem: 49 },
  { chave: 'mun_sabara', grupo: 'municipio', valor: 'Sabará (MG)', ativo: true, ordem: 50 },
  { chave: 'mun_santa_barbara', grupo: 'municipio', valor: 'Santa Bárbara (MG)', ativo: true, ordem: 51 },
  { chave: 'mun_santa_leopoldina', grupo: 'municipio', valor: 'Santa Leopoldina (ES)', ativo: true, ordem: 52 },
  { chave: 'mun_santa_luzia', grupo: 'municipio', valor: 'Santa Luzia (MG)', ativo: true, ordem: 53 },
  { chave: 'mun_santana', grupo: 'municipio', valor: 'Santana (MG)', ativo: true, ordem: 54 },
  { chave: 'mun_santana_paraiso', grupo: 'municipio', valor: 'Santana do Paraíso (MG)', ativo: true, ordem: 55 },
  { chave: 'mun_sao_tome', grupo: 'municipio', valor: 'São Tomé (MG)', ativo: true, ordem: 56 },
  { chave: 'mun_sao_tome_rio_doce', grupo: 'municipio', valor: 'São Tomé do Rio Doce (MG)', ativo: true, ordem: 57 },
  { chave: 'mun_sao_tome_a_dias', grupo: 'municipio', valor: 'São Tomé e A. Dias (MG)', ativo: true, ordem: 58 },
  { chave: 'mun_serra', grupo: 'municipio', valor: 'Serra (ES)', ativo: true, ordem: 59 },
  { chave: 'mun_timbui', grupo: 'municipio', valor: 'Timbúi (ES)', ativo: true, ordem: 60 },
  { chave: 'mun_timoteo', grupo: 'municipio', valor: 'Timóteo (MG)', ativo: true, ordem: 61 },
  { chave: 'mun_tubarao', grupo: 'municipio', valor: 'Tubarão (ES)', ativo: true, ordem: 62 },
  { chave: 'mun_tumiritinga', grupo: 'municipio', valor: 'Tumiritinga (MG)', ativo: true, ordem: 63 },
  { chave: 'mun_turmalina', grupo: 'municipio', valor: 'Turmalina (MG)', ativo: true, ordem: 64 },
  { chave: 'mun_vila_velha', grupo: 'municipio', valor: 'Vila Velha (ES)', ativo: true, ordem: 65 },
  { chave: 'mun_vitoria', grupo: 'municipio', valor: 'Vitória (ES)', ativo: true, ordem: 66 },

  // Analistas
  { chave: 'ana_alberto', grupo: 'analista', valor: 'Alberto Castro', ativo: true, ordem: 1 },
  { chave: 'ana_warnio', grupo: 'analista', valor: 'Warnio Costa', ativo: true, ordem: 2 },
  { chave: 'ana_webert', grupo: 'analista', valor: 'Webert Dias', ativo: true, ordem: 3 },
  { chave: 'ana_anderson', grupo: 'analista', valor: 'Anderson Pilon', ativo: true, ordem: 4 },
  { chave: 'ana_joel', grupo: 'analista', valor: 'Joel Celestino', ativo: true, ordem: 5 },
  { chave: 'ana_andre', grupo: 'analista', valor: 'Andre Salvestroni', ativo: true, ordem: 6 },
  { chave: 'ana_carlos', grupo: 'analista', valor: 'Carlos Mendes', ativo: true, ordem: 7 },

  // Tecnologias Empregadas (Dados Reais VLI CMS)
  { chave: 'tec_cam_selva', grupo: 'tecnologia', valor: 'Câmera Selva', ativo: true, ordem: 1 },
  { chave: 'tec_tags', grupo: 'tecnologia', valor: 'Tags', ativo: true, ordem: 2 },
  { chave: 'tec_cam_ti', grupo: 'tecnologia', valor: 'Câmera (TI)', ativo: true, ordem: 3 },
  { chave: 'tec_cam_ta', grupo: 'tecnologia', valor: 'Câmera (TA)', ativo: true, ordem: 4 },
  { chave: 'tec_bateria_rastreada', grupo: 'tecnologia', valor: 'Bateria Rastreada', ativo: true, ordem: 5 },
  { chave: 'tec_fibra', grupo: 'tecnologia', valor: 'Sensor Fibra', ativo: true, ordem: 6 },
  { chave: 'tec_radar', grupo: 'tecnologia', valor: 'Radar Perimetral', ativo: true, ordem: 7 },
  { chave: 'tec_drone', grupo: 'tecnologia', valor: 'Drone Vigilância', ativo: true, ordem: 8 },

  // Ações envolvidas
  { chave: 'ac_abordagem', grupo: 'acoes_envolvidas', valor: 'Houve abordagem', ativo: true, ordem: 1 },
  { chave: 'ac_analista', grupo: 'acoes_envolvidas', valor: 'Envolvimento do Analista', ativo: true, ordem: 2 },
  { chave: 'ac_imagens', grupo: 'acoes_envolvidas', valor: 'Apuração de imagens', ativo: true, ordem: 3 },

  // Equipe de campo
  { chave: 'eq_ronda_rh07', grupo: 'equipe_campo', valor: 'Ronda RH07', ativo: true, ordem: 1 },
  { chave: 'eq_mot_bh', grupo: 'equipe_campo', valor: 'Motorizado BH', ativo: true, ordem: 2 },
  { chave: 'eq_mot_cpena', grupo: 'equipe_campo', valor: 'Motorizado Conselheiro Pena', ativo: true, ordem: 3 },
  { chave: 'eq_mot_gv', grupo: 'equipe_campo', valor: 'Motorizado Governador Valadares', ativo: true, ordem: 4 },
  { chave: 'eq_mot_vitoria', grupo: 'equipe_campo', valor: 'Motorizado Vitória', ativo: true, ordem: 5 },
  { chave: 'eq_mot_serra', grupo: 'equipe_campo', valor: 'Motorizado Serra / Tubarão', ativo: true, ordem: 6 },
  { chave: 'eq_posto_fixo', grupo: 'equipe_campo', valor: 'Posto Fixo', ativo: true, ordem: 7 },
  { chave: 'eq_tatica', grupo: 'equipe_campo', valor: 'Equipe Tática', ativo: true, ordem: 8 },
  { chave: 'eq_remoto_cms', grupo: 'equipe_campo', valor: 'Monitoramento Remoto CMS', ativo: true, ordem: 9 },
  { chave: 'eq_na', grupo: 'equipe_campo', valor: 'N/A', ativo: true, ordem: 10 },

  // Materiais / Pessoas / Ativos (Dados Reais VLI CMS)
  { chave: 'mat_alarme', grupo: 'material_ativos', valor: 'Alarme', ativo: true, ordem: 1 },
  { chave: 'mat_animal', grupo: 'material_ativos', valor: 'Animal', ativo: true, ordem: 2 },
  { chave: 'mat_bateria', grupo: 'material_ativos', valor: 'Bateria', ativo: true, ordem: 3 },
  { chave: 'mat_bobina', grupo: 'material_ativos', valor: 'Bobina', ativo: true, ordem: 4 },
  { chave: 'mat_buzina', grupo: 'material_ativos', valor: 'Buzina', ativo: true, ordem: 5 },
  { chave: 'mat_cabo', grupo: 'material_ativos', valor: 'Cabo', ativo: true, ordem: 6 },
  { chave: 'mat_calcario', grupo: 'material_ativos', valor: 'Calcário', ativo: true, ordem: 7 },
  { chave: 'mat_chapas', grupo: 'material_ativos', valor: 'Chapas', ativo: true, ordem: 8 },
  { chave: 'mat_combustivel', grupo: 'material_ativos', valor: 'Combustível', ativo: true, ordem: 9 },
  { chave: 'mat_dormente', grupo: 'material_ativos', valor: 'Dormente', ativo: true, ordem: 10 },
  { chave: 'mat_fertilizante', grupo: 'material_ativos', valor: 'Fertilizante', ativo: true, ordem: 11 },
  { chave: 'mat_freio', grupo: 'material_ativos', valor: 'Freio Manual Apertado', ativo: true, ordem: 12 },
  { chave: 'mat_graos', grupo: 'material_ativos', valor: 'Grãos', ativo: true, ordem: 13 },
  { chave: 'mat_gusa', grupo: 'material_ativos', valor: 'Gusa', ativo: true, ordem: 14 },
  { chave: 'mat_lona', grupo: 'material_ativos', valor: 'Lona', ativo: true, ordem: 15 },
  { chave: 'mat_outros', grupo: 'material_ativos', valor: 'Outros', ativo: true, ordem: 16 },
  { chave: 'mat_pessoa', grupo: 'material_ativos', valor: 'Pessoa', ativo: true, ordem: 17 },
  { chave: 'mat_torete', grupo: 'material_ativos', valor: 'Torete', ativo: true, ordem: 18 },
  { chave: 'mat_trilho', grupo: 'material_ativos', valor: 'Trilho', ativo: true, ordem: 19 },
  { chave: 'mat_magnesita', grupo: 'material_ativos', valor: 'Magnesita', ativo: true, ordem: 20 },
  { chave: 'mat_celulose', grupo: 'material_ativos', valor: 'Celulose', ativo: true, ordem: 21 },
  { chave: 'mat_trem', grupo: 'material_ativos', valor: 'Trem', ativo: true, ordem: 22 },
  { chave: 'mat_coque', grupo: 'material_ativos', valor: 'Coque Verde', ativo: true, ordem: 23 },
  { chave: 'mat_cabo_tracao', grupo: 'material_ativos', valor: 'Cabo de Tração', ativo: true, ordem: 24 },
  { chave: 'mat_cabo_jumper', grupo: 'material_ativos', valor: 'Cabo Jumper', ativo: true, ordem: 25 },
  { chave: 'mat_veiculos', grupo: 'material_ativos', valor: 'Veículos', ativo: true, ordem: 26 },

  // Tipificações / Ocorrências (Dados Reais VLI CMS)
  { chave: 'tip_abalroamento', grupo: 'tipificacao', valor: 'Abalroamento', ativo: true, ordem: 1 },
  { chave: 'tip_abandono', grupo: 'tipificacao', valor: 'Abandono/ Extravio/ Perda', ativo: true, ordem: 2 },
  { chave: 'tip_acao_inteligencia', grupo: 'tipificacao', valor: 'Ação de Inteligência', ativo: true, ordem: 3 },
  { chave: 'tip_acao_ preventiva', grupo: 'tipificacao', valor: 'Ação Preventiva', ativo: true, ordem: 4 },
  { chave: 'tip_acesso_irregular', grupo: 'tipificacao', valor: 'Acesso Irregular', ativo: true, ordem: 5 },
  { chave: 'tip_acidente_transito', grupo: 'tipificacao', valor: 'Acidente de Trânsito', ativo: true, ordem: 6 },
  { chave: 'tip_acidente_fatal', grupo: 'tipificacao', valor: 'Acidente Fatal', ativo: true, ordem: 7 },
  { chave: 'tip_acidente_pessoal', grupo: 'tipificacao', valor: 'Acidente Pessoal', ativo: true, ordem: 8 },
  { chave: 'tip_agregacao_fisica', grupo: 'tipificacao', valor: 'Agregação Física', ativo: true, ordem: 9 },
  { chave: 'tip_ameaca_paralisacao', grupo: 'tipificacao', valor: 'Ameaça de Paralisação', ativo: true, ordem: 10 },
  { chave: 'tip_arrombamento', grupo: 'tipificacao', valor: 'Arrombamento', ativo: true, ordem: 11 },
  { chave: 'tip_atendimento_seguranca', grupo: 'tipificacao', valor: 'Atendimento de Segurança', ativo: true, ordem: 12 },
  { chave: 'tip_atitude_inconveniente', grupo: 'tipificacao', valor: 'Atitude Inconveniente', ativo: true, ordem: 13 },
  { chave: 'tip_atropelamento', grupo: 'tipificacao', valor: 'Atropelamento', ativo: true, ordem: 14 },
  { chave: 'tip_cobertura_trem', grupo: 'tipificacao', valor: 'Cobertura de Trem', ativo: true, ordem: 15 },
  { chave: 'tip_dano_patrimonio', grupo: 'tipificacao', valor: 'Dano ao Patrimônio', ativo: true, ordem: 16 },
  { chave: 'tip_descarrilamento', grupo: 'tipificacao', valor: 'Descarrilamento', ativo: true, ordem: 17 },
  { chave: 'tip_encontro_cadaver', grupo: 'tipificacao', valor: 'Encontro de Cadáver', ativo: true, ordem: 18 },
  { chave: 'tip_travessia_irregular_estrut', grupo: 'tipificacao', valor: 'Estrutura de Travessia Irregular', ativo: true, ordem: 19 },
  { chave: 'tip_explosao', grupo: 'tipificacao', valor: 'Explosão', ativo: true, ordem: 20 },
  { chave: 'tip_furto', grupo: 'tipificacao', valor: 'Furto', ativo: true, ordem: 21 },
  { chave: 'tip_garimpagem', grupo: 'tipificacao', valor: 'Garimpagem Clandestina', ativo: true, ordem: 22 },
  { chave: 'tip_homicidio', grupo: 'tipificacao', valor: 'Homicídio', ativo: true, ordem: 23 },
  { chave: 'tip_incendio', grupo: 'tipificacao', valor: 'Incêndio', ativo: true, ordem: 24 },
  { chave: 'tip_interceptacao_viajante', grupo: 'tipificacao', valor: 'Interceptação de viajante clandestino', ativo: true, ordem: 25 },
  { chave: 'tip_intrusao', grupo: 'tipificacao', valor: 'Intrusão', ativo: true, ordem: 26 },
  { chave: 'tip_invasao_propriedade', grupo: 'tipificacao', valor: 'Invasão de Propriedade', ativo: true, ordem: 27 },
  { chave: 'tip_manifestacao_social', grupo: 'tipificacao', valor: 'Manifestação Social', ativo: true, ordem: 28 },
  { chave: 'tip_movimentacao_trabalhista', grupo: 'tipificacao', valor: 'Movimentação Trabalhista', ativo: true, ordem: 29 },
  { chave: 'tip_ocorrencia_ambiental', grupo: 'tipificacao', valor: 'Ocorrência Ambiental', ativo: true, ordem: 30 },
  { chave: 'tip_roubo', grupo: 'tipificacao', valor: 'Roubo', ativo: true, ordem: 31 },
  { chave: 'tip_sequestro', grupo: 'tipificacao', valor: 'Sequestro/Rapto', ativo: true, ordem: 32 },
  { chave: 'tip_suicidio', grupo: 'tipificacao', valor: 'Suicídio', ativo: true, ordem: 33 },
  { chave: 'tip_tombamento', grupo: 'tipificacao', valor: 'Tombamento', ativo: true, ordem: 34 },
  { chave: 'tip_travessia_irregular', grupo: 'tipificacao', valor: 'Travessia Irregular', ativo: true, ordem: 35 },
  { chave: 'tip_treinamento_simulado', grupo: 'tipificacao', valor: 'Treinamento Simulado', ativo: true, ordem: 36 },
  { chave: 'tip_vandalismo', grupo: 'tipificacao', valor: 'Vandalismo', ativo: true, ordem: 37 },
];

export function buildCatalogFromOptions(options: ConfigOption[]): ConfigCatalog {
  const activeSorted = (grupo: ConfigOption['grupo']) =>
    options
      .filter((opt) => opt.grupo === grupo && opt.ativo && opt.valor.trim() !== '')
      .sort((a, b) => a.ordem - b.ordem)
      .map((opt) => opt.valor.trim());

  const fallback = buildDefaultCatalogUnsafe();

  const pick = (grupo: ConfigOption['grupo'], fb: string[]) => {
    const items = activeSorted(grupo);
    return items.length > 0 ? items : fb;
  };

  return {
    quemAcionouAtalhos: pick('quem_acionou', fallback.quemAcionouAtalhos),
    tiposLocalidade: pick('tipo_localidade', fallback.tiposLocalidade),
    housingsRh: pick('housing_rh', fallback.housingsRh),
    municipios: pick('municipio', fallback.municipios),
    analistas: pick('analista', fallback.analistas),
    tecnologias: pick('tecnologia', fallback.tecnologias),
    acoesEnvolvidas: pick('acoes_envolvidas', fallback.acoesEnvolvidas),
    equipesCampo: pick('equipe_campo', fallback.equipesCampo),
    materiaisAtivos: pick('material_ativos', fallback.materiaisAtivos),
    tipificacoes: pick('tipificacao', fallback.tipificacoes),
  };
}

function buildDefaultCatalogUnsafe(): ConfigCatalog {
  const activeSorted = (grupo: ConfigOption['grupo']) =>
    INITIAL_CONFIG_OPTIONS.filter((opt) => opt.grupo === grupo && opt.ativo)
      .sort((a, b) => a.ordem - b.ordem)
      .map((opt) => opt.valor);

  return {
    quemAcionouAtalhos: activeSorted('quem_acionou'),
    tiposLocalidade: activeSorted('tipo_localidade'),
    housingsRh: activeSorted('housing_rh'),
    municipios: activeSorted('municipio'),
    analistas: activeSorted('analista'),
    tecnologias: activeSorted('tecnologia'),
    acoesEnvolvidas: activeSorted('acoes_envolvidas'),
    equipesCampo: activeSorted('equipe_campo'),
    materiaisAtivos: activeSorted('material_ativos'),
    tipificacoes: activeSorted('tipificacao'),
  };
}

export const DEFAULT_CATALOG: ConfigCatalog = buildDefaultCatalogUnsafe();
