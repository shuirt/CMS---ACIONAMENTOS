import { DEFAULT_CATALOG, INITIAL_CONFIG_OPTIONS } from '../config/defaultCatalog';
import type { WorkspaceSnapshot } from '../types/acionamento';

export function createDemoWorkspace(): WorkspaceSnapshot {
  return {
    acionamentos: [],
    iniciativas: [],
    reports: [],
    configOptions: INITIAL_CONFIG_OPTIONS.map((option) => ({ ...option })),
    catalog: DEFAULT_CATALOG,
    auditoria: [],
    lastReportNumber: 0,
    nextReportNumber: 1,
    nextReportRecordNumber: 1,
    lastIniciativaNumber: 0,
    nextIniciativaNumber: 1,
    syncedAt: new Date().toISOString(),
  };
}
