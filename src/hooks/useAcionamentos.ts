import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_CATALOG } from '../config/defaultCatalog';
import type { IClientAcionamentoRepository } from '../services/repository';
import { ClientApiError } from '../services/repository';
import type {
  Acionamento,
  AcionamentoInput,
  Iniciativa,
  IniciativaInput,
  OperatorIdentity,
  ShiftConfig,
  WorkspaceSnapshot,
} from '../types/acionamento';

const AUTO_REFRESH_INTERVAL_MS = 60_000;

export function useAcionamentos(
  repository: IClientAcionamentoRepository | null,
  operator: OperatorIdentity | null,
  onAuthExpired?: (msg: string) => void
) {
  const [workspace, setWorkspace] = useState<WorkspaceSnapshot>({
    acionamentos: [],
    iniciativas: [],
    catalog: DEFAULT_CATALOG,
    auditoria: [],
    lastReportNumber: 0,
    nextReportNumber: 1,
    lastIniciativaNumber: 0,
    nextIniciativaNumber: 1,
    syncedAt: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [shift, setShift] = useState<ShiftConfig>({
    inicio: '07:00',
    fim: '19:00',
  });

  const refresh = useCallback(
    async (silent = false) => {
      if (!repository) return;
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError(null);

      try {
        const snapshot = await repository.getWorkspace();
        setWorkspace(snapshot);
      } catch (err) {
        if (err instanceof ClientApiError && (err.status === 401 || err.status === 403)) {
          onAuthExpired?.(err.message);
        }
        setError(
          err instanceof Error
            ? err.message
            : 'Não foi possível carregar os acionamentos da planilha.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [repository, onAuthExpired]
  );

  useEffect(() => {
    if (!repository) return;
    void refresh(false);

    const interval = window.setInterval(() => {
      void refresh(true);
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [repository, refresh]);

  const createAcionamento = useCallback(
    async (input: AcionamentoInput): Promise<Acionamento> => {
      if (!repository || !operator) {
        throw new Error('Sessão de operador não disponível.');
      }
      setSaving(true);
      try {
        const res = await repository.createAcionamento(input, operator);
        setWorkspace(res.workspace);
        setError(null);
        return res.record;
      } finally {
        setSaving(false);
      }
    },
    [repository, operator]
  );

  const updateAcionamento = useCallback(
    async (
      id: string,
      input: AcionamentoInput,
      expectedUpdatedAt: string
    ): Promise<Acionamento> => {
      if (!repository || !operator) {
        throw new Error('Sessão de operador não disponível.');
      }
      setSaving(true);
      try {
        const res = await repository.updateAcionamento(id, input, expectedUpdatedAt, operator);
        setWorkspace(res.workspace);
        setError(null);
        return res.record;
      } finally {
        setSaving(false);
      }
    },
    [repository, operator]
  );

  const createIniciativa = useCallback(
    async (input: IniciativaInput): Promise<Iniciativa> => {
      if (!repository || !operator) {
        throw new Error('Sessão de operador não disponível.');
      }
      setSaving(true);
      try {
        const res = await repository.createIniciativa(input, operator);
        setWorkspace(res.workspace);
        setError(null);
        return res.record;
      } finally {
        setSaving(false);
      }
    },
    [repository, operator]
  );

  const updateIniciativa = useCallback(
    async (
      id: string,
      input: IniciativaInput,
      expectedUpdatedAt: string
    ): Promise<Iniciativa> => {
      if (!repository || !operator) {
        throw new Error('Sessão de operador não disponível.');
      }
      setSaving(true);
      try {
        const res = await repository.updateIniciativa(id, input, expectedUpdatedAt, operator);
        setWorkspace(res.workspace);
        setError(null);
        return res.record;
      } finally {
        setSaving(false);
      }
    },
    [repository, operator]
  );

  return {
    workspace,
    loading,
    refreshing,
    saving,
    error,
    shift,
    setShift,
    refresh,
    createAcionamento,
    updateAcionamento,
    createIniciativa,
    updateIniciativa,
  };
}
