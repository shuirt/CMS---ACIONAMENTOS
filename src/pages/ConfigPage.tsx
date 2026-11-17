import { useMemo, useState } from 'react';
import {
  Check,
  ListChecks,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { BUTTON_VARIANTS, FIELD_VARIANTS, SURFACE_TOKENS } from '../design/tokens';
import type { ConfigGrupo, ConfigOption, ConfigOptionInput, ConfigOptionUpdate } from '../types/acionamento';

interface ConfigPageProps {
  options: ConfigOption[];
  loading: boolean;
  refreshing: boolean;
  saving: boolean;
  error: string | null;
  onRefresh: () => void;
  onCreate: (input: ConfigOptionInput) => Promise<void>;
  onUpdate: (chave: string, input: ConfigOptionUpdate) => Promise<void>;
  onNotify: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const GROUPS: Array<{ value: ConfigGrupo; label: string }> = [
  { value: 'quem_acionou', label: 'Quem acionou' },
  { value: 'tipo_localidade', label: 'Tipo de localidade' },
  { value: 'housing_rh', label: 'Housing / RH' },
  { value: 'municipio', label: 'Municípios' },
  { value: 'analista', label: 'Analistas' },
  { value: 'tecnologia', label: 'Tecnologias' },
  { value: 'acoes_envolvidas', label: 'Ações envolvidas' },
  { value: 'equipe_campo', label: 'Equipe de campo' },
  { value: 'material_ativos', label: 'Materiais / ativos' },
  { value: 'tipificacao', label: 'Tipificações' },
];

export function ConfigPage({
  options,
  loading,
  refreshing,
  saving,
  error,
  onRefresh,
  onCreate,
  onUpdate,
  onNotify,
}: ConfigPageProps) {
  const [selectedGroup, setSelectedGroup] = useState<ConfigGrupo>('quem_acionou');
  const [search, setSearch] = useState('');
  const [newValue, setNewValue] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editOrder, setEditOrder] = useState('1');
  const [actionError, setActionError] = useState<string | null>(null);

  const groupOptions = useMemo(
    () =>
      options
        .filter((option) => option.grupo === selectedGroup)
        .sort((a, b) => a.ordem - b.ordem || a.valor.localeCompare(b.valor, 'pt-BR')),
    [options, selectedGroup]
  );
  const visibleOptions = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return term
      ? groupOptions.filter((option) => option.valor.toLocaleLowerCase('pt-BR').includes(term))
      : groupOptions;
  }, [groupOptions, search]);

  const startEditing = (option: ConfigOption) => {
    setActionError(null);
    setEditingKey(option.chave);
    setEditValue(option.valor);
    setEditOrder(String(option.ordem));
  };

  const handleCreate = async () => {
    const value = newValue.trim();
    if (!value) {
      setActionError('Informe o valor para adicionar à lista.');
      return;
    }

    setActionError(null);
    try {
      await onCreate({ grupo: selectedGroup, valor: value });
      setNewValue('');
      onNotify('Opção adicionada à lista suspensa.', 'success');
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : 'Não foi possível adicionar a opção.';
      setActionError(message);
      onNotify(message, 'error');
    }
  };

  const handleUpdate = async (option: ConfigOption, update: ConfigOptionUpdate) => {
    setActionError(null);
    try {
      await onUpdate(option.chave, update);
      setEditingKey(null);
      onNotify('Lista suspensa atualizada.', 'success');
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : 'Não foi possível atualizar a opção.';
      setActionError(message);
      onNotify(message, 'error');
    }
  };

  const handleSaveEdit = (option: ConfigOption) => {
    const order = Number(editOrder);
    if (!editValue.trim()) {
      setActionError('O valor não pode ficar vazio.');
      return;
    }
    if (!Number.isInteger(order) || order < 1) {
      setActionError('A ordem deve ser um número inteiro maior que zero.');
      return;
    }
    void handleUpdate(option, { valor: editValue.trim(), ativo: option.ativo, ordem: order });
  };

  const selectedLabel = GROUPS.find((group) => group.value === selectedGroup)?.label ?? '';
  const activeCount = groupOptions.filter((option) => option.ativo).length;

  return (
    <div className={SURFACE_TOKENS.pageContainer}>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#00807C] mb-1">
              Administração
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#162229] tracking-[-0.015em]">
              Cadastros base
            </h1>
            <p className="text-sm text-[#52636D] mt-1">
              Gerencie as opções usadas nos campos de lista suspensa.
            </p>
          </div>
          <button
            type="button"
            disabled={refreshing || loading}
            onClick={onRefresh}
            className={`${BUTTON_VARIANTS.secondary} px-4 py-2 text-xs`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Atualizando...' : 'Atualizar'}</span>
          </button>
        </div>

        {(error || actionError) && (
          <div
            role="alert"
            className="rounded-2xl bg-[#FCEFEF] border border-[#ECC4C3] px-4 py-3 text-xs text-[#8C3230]"
          >
            {actionError || error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <aside className="lg:col-span-4">
            <div className={`${SURFACE_TOKENS.card} p-3 bg-white`}>
              <div className="px-3 pt-2 pb-3 text-[11px] font-bold text-[#64737C] uppercase tracking-wider">
                Listas disponíveis
              </div>
              <nav className="space-y-1" aria-label="Categorias de cadastros base">
                {GROUPS.map((group) => {
                  const count = options.filter((option) => option.grupo === group.value).length;
                  const active = group.value === selectedGroup;
                  return (
                    <button
                      key={group.value}
                      type="button"
                      onClick={() => {
                        setSelectedGroup(group.value);
                        setSearch('');
                        setEditingKey(null);
                        setActionError(null);
                      }}
                      aria-current={active ? 'page' : undefined}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#E7F4F3] text-[#005451] font-semibold'
                          : 'text-[#3e4e57] hover:bg-[#F4F7F9]'
                      }`}
                    >
                      <span>{group.label}</span>
                      <span className="text-[11px] font-mono text-[#64737C]">{count}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          <section className="lg:col-span-8 min-w-0">
            <div className={`${SURFACE_TOKENS.cardElevated} overflow-hidden bg-white`}>
              <div className="h-[3px] flex" aria-hidden="true">
                <div className="w-[74%] bg-[#00807C]" />
                <div className="w-[26%] bg-[#EEA722]" />
              </div>
              <div className="p-5 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-[#162229]">{selectedLabel}</h2>
                    <p className="text-xs text-[#64737C] mt-0.5">
                      {activeCount} ativa(s) de {groupOptions.length} opção(ões)
                    </p>
                  </div>
                  <div className="relative w-full sm:max-w-[230px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64737C]" />
                    <input
                      type="search"
                      aria-label={`Pesquisar em ${selectedLabel}`}
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Pesquisar opção..."
                      className={`${FIELD_VARIANTS.input} pl-9 text-xs`}
                    />
                  </div>
                </div>

                <form
                  className="flex flex-col sm:flex-row gap-2 p-3 rounded-2xl bg-[#F4F7F9] border border-[#D4DFE4]"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleCreate();
                  }}
                >
                  <input
                    type="text"
                    value={newValue}
                    onChange={(event) => setNewValue(event.target.value)}
                    aria-label={`Nova opção para ${selectedLabel}`}
                    placeholder={`Adicionar em ${selectedLabel.toLocaleLowerCase('pt-BR')}...`}
                    className={`${FIELD_VARIANTS.input} min-w-0 flex-1 text-sm`}
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className={`${BUTTON_VARIANTS.primary} px-4 py-2 text-xs justify-center`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar</span>
                  </button>
                </form>

                {loading ? (
                  <div className="py-12 text-center text-sm text-[#64737C]">Carregando cadastros...</div>
                ) : visibleOptions.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <ListChecks className="w-7 h-7 mx-auto text-[#8A9AA3]" />
                    <p className="text-sm font-semibold text-[#3e4e57]">
                      {groupOptions.length ? 'Nenhuma opção corresponde à busca.' : 'Esta lista ainda está vazia.'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#EDF2F4] border-y border-[#EDF2F4]">
                    {visibleOptions.map((option) => {
                      const editing = editingKey === option.chave;
                      return (
                        <div
                          key={option.chave}
                          className={`flex flex-col sm:flex-row sm:items-center gap-3 py-3 ${
                            option.ativo ? '' : 'opacity-65'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            {editing ? (
                              <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_88px] gap-2">
                                <input
                                  autoFocus
                                  value={editValue}
                                  onChange={(event) => setEditValue(event.target.value)}
                                  aria-label="Editar valor"
                                  className={`${FIELD_VARIANTS.input} text-sm`}
                                />
                                <input
                                  type="number"
                                  min={1}
                                  step={1}
                                  value={editOrder}
                                  onChange={(event) => setEditOrder(event.target.value)}
                                  aria-label="Ordem da opção"
                                  className={`${FIELD_VARIANTS.input} text-sm`}
                                />
                              </div>
                            ) : (
                              <>
                                <p className="text-sm font-semibold text-[#162229] break-words">
                                  {option.valor}
                                </p>
                                <p className="text-[11px] text-[#64737C] mt-0.5">
                                  Ordem {option.ordem} · {option.ativo ? 'Disponível nos formulários' : 'Inativa'}
                                </p>
                              </>
                            )}
                          </div>

                          <div className="flex items-center justify-end gap-2 shrink-0">
                            {editing ? (
                              <>
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => handleSaveEdit(option)}
                                  aria-label="Salvar opção"
                                  title="Salvar"
                                  className="w-9 h-9 inline-flex items-center justify-center rounded-xl bg-[#E7F4F3] border border-[#B3DCD9] text-[#005C59] hover:bg-[#D3EBE9] disabled:opacity-50 cursor-pointer"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingKey(null)}
                                  aria-label="Cancelar edição"
                                  title="Cancelar"
                                  className="w-9 h-9 inline-flex items-center justify-center rounded-xl border border-[#D4DFE4] text-[#52636D] hover:bg-[#F4F7F9] cursor-pointer"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => startEditing(option)}
                                  aria-label={`Editar ${option.valor}`}
                                  title="Editar valor e ordem"
                                  className="w-9 h-9 inline-flex items-center justify-center rounded-xl border border-[#D4DFE4] text-[#52636D] hover:bg-[#F4F7F9] hover:text-[#005C59] cursor-pointer"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() =>
                                    void handleUpdate(option, {
                                      valor: option.valor,
                                      ativo: !option.ativo,
                                      ordem: option.ordem,
                                    })
                                  }
                                  aria-label={option.ativo ? `Desativar ${option.valor}` : `Ativar ${option.valor}`}
                                  title={option.ativo ? 'Desativar opção' : 'Ativar opção'}
                                  className={`w-9 h-9 inline-flex items-center justify-center rounded-xl border cursor-pointer disabled:opacity-50 ${
                                    option.ativo
                                      ? 'border-[#B3DCD9] bg-[#E7F4F3] text-[#005C59] hover:bg-[#D3EBE9]'
                                      : 'border-[#D4DFE4] text-[#64737C] hover:bg-[#F4F7F9]'
                                  }`}
                                >
                                  <Power className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <p className="text-[11px] text-[#64737C] leading-relaxed">
                  Opções inativas deixam de aparecer em novos formulários. Os registros existentes não são alterados.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
