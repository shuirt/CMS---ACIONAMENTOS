import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { MotionConfig, motion } from 'motion/react';
import { AuthGate } from './components/AuthGate';
import { Footer } from './components/Footer';
import { Header, type NavSection } from './components/Header';
import { SpreadsheetSetupModal } from './components/SpreadsheetSetupModal';
import { ToastContainer, type ToastMessage } from './components/ToastContainer';
import { useAcionamentos } from './hooks/useAcionamentos';
import {
  getInMemoryAccessToken,
  initGoogleAuth,
  signInWithGoogleSheets,
  signOutGoogle,
} from './services/authService';
import {
  ApiSheetsRepository,
  DemoAcionamentoRepository,
  verifyServerSession,
  type IClientAcionamentoRepository,
} from './services/repository';
import type {
  Acionamento,
  AcionamentoInput,
  HistoricoFilters,
  IncFilter,
  Iniciativa,
  IniciativaInput,
  OperatorIdentity,
  Report,
  ReportInput,
  RegistrosDateFilter,
  RegistrosTab,
  StatusOperacional,
} from './types/acionamento';

const AcionamentoDetailPage = lazy(() =>
  import('./pages/AcionamentoDetailPage').then((m) => ({ default: m.AcionamentoDetailPage }))
);
const AcionamentoFormPage = lazy(() =>
  import('./pages/AcionamentoFormPage').then((m) => ({ default: m.AcionamentoFormPage }))
);
const HistoricoPage = lazy(() =>
  import('./pages/HistoricoPage').then((m) => ({ default: m.HistoricoPage }))
);
const ReportsPage = lazy(() =>
  import('./pages/ReportsPage').then((m) => ({ default: m.ReportsPage }))
);
const ReportFormPage = lazy(() =>
  import('./pages/ReportFormPage').then((m) => ({ default: m.ReportFormPage }))
);
const ReportDetailPage = lazy(() =>
  import('./pages/ReportDetailPage').then((m) => ({ default: m.ReportDetailPage }))
);
const RegistrosPage = lazy(() =>
  import('./pages/RegistrosPage').then((m) => ({ default: m.RegistrosPage }))
);
const IniciativasPage = lazy(() =>
  import('./pages/IniciativasPage').then((m) => ({ default: m.IniciativasPage }))
);
const IniciativaFormPage = lazy(() =>
  import('./pages/IniciativaFormPage').then((m) => ({ default: m.IniciativaFormPage }))
);
const IniciativaDetailPage = lazy(() =>
  import('./pages/IniciativaDetailPage').then((m) => ({ default: m.IniciativaDetailPage }))
);
const ConfigPage = lazy(() =>
  import('./pages/ConfigPage').then((m) => ({ default: m.ConfigPage }))
);

const DEFAULT_HISTORICO_FILTERS: HistoricoFilters = {
  dateFrom: '',
  dateTo: '',
  statusFilter: 'Todos',
  operatorFilter: 'Todos',
  incFilter: 'todos',
  quemAcionouFilter: 'Todos',
  tipoLocalidadeFilter: 'Todas',
  municipioFilter: 'Todos',
  tipificacaoFilter: 'Todos',
  analistaFilter: 'Todos',
  tecnologiaFilter: 'todas',
  reportFilter: 'todos',
  search: '',
};

type ActiveView =
  | { type: 'list' }
  | { type: 'create'; defaultStatus?: StatusOperacional }
  | { type: 'detail'; recordId: string }
  | { type: 'edit'; recordId: string }
  | { type: 'iniciativa_create' }
  | { type: 'iniciativa_detail'; iniciativaId: string }
  | { type: 'iniciativa_edit'; iniciativaId: string }
  | { type: 'report_create' }
  | { type: 'report_detail'; reportId: string }
  | { type: 'report_edit'; reportId: string };

export default function App() {
  const [operator, setOperator] = useState<OperatorIdentity | null>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === '1') {
      return {
        name: 'Operador Demo CMS',
        email: 'demo.operador@cms.local',
        mode: 'demo',
      };
    }
    return null;
  });

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string>('');
  const [envSpreadsheetPinned, setEnvSpreadsheetPinned] = useState<boolean>(false);
  const [showSpreadsheetModal, setShowSpreadsheetModal] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeNav, setActiveNav] = useState<NavSection>('registros');
  const [activeView, setActiveView] = useState<ActiveView>({ type: 'list' });
  const [returnNavAfterDetail, setReturnNavAfterDetail] = useState<NavSection>('registros');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Preserved list filter states across detail/edit/create transitions
  const [registrosDateFilter, setRegistrosDateFilter] =
    useState<RegistrosDateFilter>('todas');
  const [registrosTab, setRegistrosTab] = useState<RegistrosTab>('todos');
  const [registrosIncFilter, setRegistrosIncFilter] = useState<IncFilter>('todos');
  const [registrosSearch, setRegistrosSearch] = useState('');
  const [registrosOperator, setRegistrosOperator] = useState('Todos');

  const [historicoFilters, setHistoricoFilters] = useState<HistoricoFilters>(
    DEFAULT_HISTORICO_FILTERS
  );

  const notify = useCallback(
    (message: string, type: ToastMessage['type'] = 'info') => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      async (_user, token) => {
        try {
          const session = await verifyServerSession(token);
          setAccessToken(token);
          setOperator({
            name: session.operator.name,
            email: session.operator.email,
            mode: 'google',
          });
          if (session.envSpreadsheetId) {
            setSpreadsheetId(session.envSpreadsheetId);
            setEnvSpreadsheetPinned(true);
          }
          setAuthError(null);
        } catch (err) {
          setAccessToken(null);
          setOperator(null);
          setAuthError(
            err instanceof Error ? err.message : 'Usuário não autorizado a acessar o sistema.'
          );
          await signOutGoogle();
        }
      },
      () => {
        setAccessToken(null);
        setOperator((prev) => (prev?.mode === 'demo' ? prev : null));
      }
    );
    return unsubscribe;
  }, []);

  const repository: IClientAcionamentoRepository | null = useMemo(() => {
    if (!operator) return null;
    if (operator.mode === 'demo') {
      return new DemoAcionamentoRepository();
    }
    if (!accessToken || !spreadsheetId) {
      return null;
    }
    return new ApiSheetsRepository(
      () => getInMemoryAccessToken() ?? accessToken,
      () => spreadsheetId
    );
  }, [operator, accessToken, spreadsheetId]);

  const handleAuthExpired = useCallback(
    (msg: string) => {
      setAuthError(msg);
      setAccessToken(null);
      setOperator(null);
      notify(msg, 'error');
    },
    [notify]
  );

  const {
    workspace,
    loading,
    refreshing,
    saving,
    error,
    refresh,
    createAcionamento,
    updateAcionamento,
    createIniciativa,
    updateIniciativa,
    createReport,
    updateReport,
    createConfigOption,
    updateConfigOption,
  } = useAcionamentos(repository, operator, handleAuthExpired);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const { accessToken: token } = await signInWithGoogleSheets();
      const session = await verifyServerSession(token);
      setAccessToken(token);
      setOperator({
        name: session.operator.name,
        email: session.operator.email,
        mode: 'google',
      });
      if (session.envSpreadsheetId) {
        setSpreadsheetId(session.envSpreadsheetId);
        setEnvSpreadsheetPinned(true);
      } else {
        setShowSpreadsheetModal(true);
      }
      setActiveNav('registros');
      setActiveView({ type: 'list' });
      notify(`Bem-vindo(a), ${session.operator.name}.`, 'success');
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Não foi possível concluir a autenticação Google.';
      setAuthError(msg);
      setAccessToken(null);
      setOperator(null);
      await signOutGoogle().catch(() => {});
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleEnterDemo = () => {
    setAuthError(null);
    setAccessToken(null);
    setSpreadsheetId('');
    setOperator({
      name: 'Operador Demo CMS',
      email: 'demo.operador@cms.local',
      mode: 'demo',
    });
    setActiveNav('registros');
    setActiveView({ type: 'list' });
  };

  const handleSignOut = async () => {
    if (operator?.mode === 'google') {
      await signOutGoogle().catch(() => {});
    }
    setAccessToken(null);
    setOperator(null);
    setSpreadsheetId('');
    setEnvSpreadsheetPinned(false);
    setActiveView({ type: 'list' });
    setActiveNav('registros');
  };

  const handleNavigate = (section: NavSection) => {
    setActiveNav(section);
    setActiveView({ type: 'list' });
  };

  const handleSaveForm = async (
    input: AcionamentoInput,
    existingRecord?: Acionamento | null
  ) => {
    if (existingRecord) {
      const updated = await updateAcionamento(
        existingRecord.id,
        input,
        existingRecord.updatedAt
      );
      notify(
        updated.numeroReport !== null
          ? `Acionamento atualizado (REPORT #${updated.numeroReport}).`
          : 'Acionamento atualizado com sucesso.',
        'success'
      );
      setActiveView({ type: 'detail', recordId: updated.id });
    } else {
      const created = await createAcionamento(input);
      notify(
        created.numeroReport !== null
          ? `Acionamento salvo com sucesso (REPORT #${created.numeroReport})!`
          : 'Acionamento salvo com sucesso no CMS!',
        'success'
      );
      setActiveNav('registros');
      setActiveView({ type: 'list' });
    }
  };

  const handleSaveIniciativa = async (
    input: IniciativaInput,
    existingRecord?: Iniciativa | null
  ) => {
    if (existingRecord) {
      const updated = await updateIniciativa(
        existingRecord.id,
        input,
        existingRecord.updatedAt
      );
      notify(`Iniciativa #${updated.numeroIniciativa} atualizada com sucesso.`, 'success');
      setActiveView({ type: 'iniciativa_detail', iniciativaId: updated.id });
    } else {
      const created = await createIniciativa(input);
      notify(`Iniciativa #${created.numeroIniciativa} registrada com sucesso!`, 'success');
      setActiveNav('iniciativas');
      setActiveView({ type: 'list' });
    }
  };

  const handleSaveReport = async (
    input: ReportInput,
    existingReport?: Report | null
  ) => {
    if (existingReport) {
      const updated = await updateReport(existingReport.id, input, existingReport.updatedAt);
      notify(`Report #${updated.numeroReport} atualizado com sucesso.`, 'success');
      setActiveView({ type: 'report_detail', reportId: updated.id });
    } else {
      const created = await createReport(input);
      notify(`Report #${created.numeroReport} cadastrado com sucesso!`, 'success');
      setActiveNav('reports');
      setActiveView({ type: 'list' });
    }
  };

  if (!operator) {
    return (
      <MotionConfig reducedMotion="user">
        <AuthGate
          onGoogleSignIn={() => void handleGoogleSignIn()}
          onEnterDemo={handleEnterDemo}
          isSigningIn={isSigningIn}
          authError={authError}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </MotionConfig>
    );
  }

  const selectedRecord =
    activeView.type === 'detail' || activeView.type === 'edit'
      ? workspace.acionamentos.find((a) => a.id === activeView.recordId) ?? null
      : null;

  const selectedIniciativa =
    activeView.type === 'iniciativa_detail' || activeView.type === 'iniciativa_edit'
      ? workspace.iniciativas.find((i) => i.id === activeView.iniciativaId) ?? null
      : null;

  const selectedReport =
    activeView.type === 'report_detail' || activeView.type === 'report_edit'
      ? workspace.reports.find((report) => report.id === activeView.reportId) ?? null
      : null;

  const needsSpreadsheet = operator.mode === 'google' && !spreadsheetId;
  const headerOffsetClass =
    operator.mode === 'demo' ? 'pt-[144px] sm:pt-[90px]' : 'pt-[104px] sm:pt-[60px]';

  const viewTransitionKey = needsSpreadsheet
    ? 'needs-spreadsheet'
    : activeView.type === 'detail' || activeView.type === 'edit'
      ? `${activeView.type}:${activeView.recordId}`
      : activeView.type === 'create'
        ? 'create'
        : activeView.type === 'iniciativa_detail' || activeView.type === 'iniciativa_edit'
          ? `${activeView.type}:${activeView.iniciativaId}`
          : activeView.type === 'iniciativa_create'
            ? 'iniciativa_create'
            : activeView.type === 'report_detail' || activeView.type === 'report_edit'
              ? `${activeView.type}:${activeView.reportId}`
              : activeView.type === 'report_create'
                ? 'report_create'
                : `list:${activeNav}`;

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col bg-[#eaf0f2] text-[#162229]">
      {activeView.type !== 'create' &&
        activeView.type !== 'edit' &&
        activeView.type !== 'iniciativa_create' &&
        activeView.type !== 'iniciativa_edit' &&
        activeView.type !== 'report_create' &&
        activeView.type !== 'report_edit' && (
        <Header
          activeNav={activeNav}
          onNavigate={handleNavigate}
          operator={operator}
          reportsCount={workspace.reports.length}
          spreadsheetId={spreadsheetId}
          onOpenSpreadsheetSetup={() => setShowSpreadsheetModal(true)}
          onSignOut={() => void handleSignOut()}
        />
      )}

      <main
        className={`flex-1 w-full ${
          activeView.type === 'create' ||
          activeView.type === 'edit' ||
          activeView.type === 'iniciativa_create' ||
          activeView.type === 'iniciativa_edit' ||
          activeView.type === 'report_create' ||
          activeView.type === 'report_edit'
            ? ''
            : headerOffsetClass
        }`}
      >
        <motion.div
          key={viewTransitionKey}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
        <Suspense fallback={
          <div className="min-h-[40vh] flex items-center justify-center text-sm text-[#647780]">
            Carregando área do sistema...
          </div>
        }>
        {needsSpreadsheet ? (
          <div className="max-w-lg mx-auto px-5 py-16">
            <div className="bg-white rounded-3xl border border-[#d4dfe4] shadow-[0_6px_24px_-4px_rgba(22,34,41,0.08)] overflow-hidden text-center">
              <div className="h-[3px] flex" aria-hidden="true">
                <div className="w-[74%] bg-[#00807C]" />
                <div className="w-[26%] bg-[#EEA722]" />
              </div>
              <div className="p-8 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#E7F4F3] border border-[#B3DCD9] text-[#005C59] flex items-center justify-center mx-auto">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h1 className="text-xl font-semibold text-[#162229]">
                  Conecte a Planilha do CMS
                </h1>
                <p className="text-sm text-[#3e4e57] leading-relaxed">
                  Para iniciar o uso em produção, informe o ID de uma planilha Google Sheets
                  compartilhada ou crie uma nova planilha estruturada com as abas Acionamentos,
                  Config, Auditoria e Reports.
                </p>
                <button
                  type="button"
                  onClick={() => setShowSpreadsheetModal(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#00807C] hover:bg-[#006562] text-white text-sm font-semibold shadow-sm cursor-pointer transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Configurar Planilha Google Sheets</span>
                </button>
              </div>
            </div>
          </div>
        ) : activeView.type === 'create' ? (
          <AcionamentoFormPage
            mode="create"
            defaultStatus={activeView.defaultStatus}
            catalog={workspace.catalog}
            operator={operator}
            nextReportNumber={workspace.nextReportNumber}
            lastReportNumber={workspace.lastReportNumber}
            saving={saving}
            onSave={handleSaveForm}
            onCancel={() => setActiveView({ type: 'list' })}
            onNotify={notify}
          />
        ) : activeView.type === 'edit' && selectedRecord ? (
          <AcionamentoFormPage
            mode="edit"
            initialRecord={selectedRecord}
            catalog={workspace.catalog}
            operator={operator}
            nextReportNumber={workspace.nextReportNumber}
            lastReportNumber={workspace.lastReportNumber}
            saving={saving}
            onSave={handleSaveForm}
            onCancel={() => setActiveView({ type: 'detail', recordId: selectedRecord.id })}
            onNotify={notify}
            onReloadLatest={async () => {
              await refresh(false);
              notify('Dados mais recentes carregados da planilha.', 'info');
            }}
          />
        ) : activeView.type === 'detail' && selectedRecord ? (
          <AcionamentoDetailPage
            record={selectedRecord}
            auditoria={workspace.auditoria}
            backLabel={
              returnNavAfterDetail === 'historico'
                ? 'Voltar para Histórico'
                : returnNavAfterDetail === 'reports'
                  ? 'Voltar para Reports'
                  : 'Voltar para Registros'
            }
            onBack={() => {
              setActiveNav(returnNavAfterDetail);
              setActiveView({ type: 'list' });
            }}
            onEdit={(rec) => setActiveView({ type: 'edit', recordId: rec.id })}
            onNotify={notify}
          />
        ) : activeNav === 'historico' ? (
          <HistoricoPage
            acionamentos={workspace.acionamentos}
            catalog={workspace.catalog}
            loading={loading}
            refreshing={refreshing}
            filters={historicoFilters}
            onFiltersChange={setHistoricoFilters}
            onClearFilters={() => setHistoricoFilters(DEFAULT_HISTORICO_FILTERS)}
            onRefresh={() => void refresh(true)}
            onSelectAcionamento={(item) => {
              setReturnNavAfterDetail('historico');
              setActiveView({ type: 'detail', recordId: item.id });
            }}
            onNotify={notify}
          />
        ) : activeNav === 'reports' && activeView.type === 'list' ? (
          <ReportsPage
            reports={workspace.reports}
            loading={loading}
            refreshing={refreshing}
            error={error}
            onRefresh={() => void refresh(true)}
            onNewReport={() => setActiveView({ type: 'report_create' })}
            onSelectReport={(report) => setActiveView({ type: 'report_detail', reportId: report.id })}
            onNotify={notify}
          />
        ) : activeNav === 'iniciativas' && activeView.type === 'list' ? (
          <IniciativasPage
            iniciativas={workspace.iniciativas}
            loading={loading}
            error={error}
            onNewIniciativa={() => setActiveView({ type: 'iniciativa_create' })}
            onSelectIniciativa={(item) => setActiveView({ type: 'iniciativa_detail', iniciativaId: item.id })}
            onNotify={notify}
            onRefresh={() => void refresh(true)}
          />
        ) : activeView.type === 'iniciativa_create' ? (
          <IniciativaFormPage
            mode="create"
            catalog={workspace.catalog}
            operator={operator}
            nextIniciativaNumber={workspace.nextIniciativaNumber}
            saving={saving}
            onSave={handleSaveIniciativa}
            onCancel={() => {
              setActiveNav('iniciativas');
              setActiveView({ type: 'list' });
            }}
            onNotify={notify}
          />
        ) : activeView.type === 'iniciativa_edit' && selectedIniciativa ? (
          <IniciativaFormPage
            mode="edit"
            initialRecord={selectedIniciativa}
            catalog={workspace.catalog}
            operator={operator}
            nextIniciativaNumber={workspace.nextIniciativaNumber}
            saving={saving}
            onSave={handleSaveIniciativa}
            onCancel={() => setActiveView({ type: 'iniciativa_detail', iniciativaId: selectedIniciativa.id })}
            onNotify={notify}
          />
        ) : activeView.type === 'iniciativa_detail' && selectedIniciativa ? (
          <IniciativaDetailPage
            item={selectedIniciativa}
            onBack={() => {
              setActiveNav('iniciativas');
              setActiveView({ type: 'list' });
            }}
            onEdit={(item) => setActiveView({ type: 'iniciativa_edit', iniciativaId: item.id })}
            onNotify={notify}
          />
        ) : activeView.type === 'report_create' ? (
          <ReportFormPage
            mode="create"
            catalog={workspace.catalog}
            operator={operator}
            nextReportNumber={workspace.nextReportRecordNumber}
            saving={saving}
            onSave={handleSaveReport}
            onCancel={() => {
              setActiveNav('reports');
              setActiveView({ type: 'list' });
            }}
            onNotify={notify}
          />
        ) : activeView.type === 'report_edit' && selectedReport ? (
          <ReportFormPage
            mode="edit"
            initialRecord={selectedReport}
            catalog={workspace.catalog}
            operator={operator}
            nextReportNumber={workspace.nextReportRecordNumber}
            saving={saving}
            onSave={handleSaveReport}
            onCancel={() => setActiveView({ type: 'report_detail', reportId: selectedReport.id })}
            onNotify={notify}
          />
        ) : activeView.type === 'report_detail' && selectedReport ? (
          <ReportDetailPage
            report={selectedReport}
            onBack={() => {
              setActiveNav('reports');
              setActiveView({ type: 'list' });
            }}
            onEdit={(report) => setActiveView({ type: 'report_edit', reportId: report.id })}
            onNotify={notify}
          />
        ) : activeNav === 'configuracoes' && activeView.type === 'list' ? (
          <ConfigPage
            options={workspace.configOptions}
            loading={loading}
            refreshing={refreshing}
            saving={saving}
            error={error}
            onRefresh={() => void refresh(true)}
            onCreate={createConfigOption}
            onUpdate={updateConfigOption}
            onNotify={notify}
          />
        ) : (
          <RegistrosPage
            acionamentos={workspace.acionamentos}
            loading={loading}
            refreshing={refreshing}
            error={error}
            syncedAt={workspace.syncedAt}
            isDemoMode={operator.mode === 'demo'}
            dateFilter={registrosDateFilter}
            onDateFilterChange={setRegistrosDateFilter}
            activeTab={registrosTab}
            incFilter={registrosIncFilter}
            search={registrosSearch}
            operatorFilter={registrosOperator}
            onTabChange={setRegistrosTab}
            onIncFilterChange={setRegistrosIncFilter}
            onSearchChange={setRegistrosSearch}
            onOperatorFilterChange={setRegistrosOperator}
            onRefresh={() => void refresh(true)}
            onNewAcionamento={() => setActiveView({ type: 'create' })}
            onSelectAcionamento={(item) => {
              setReturnNavAfterDetail('registros');
              setActiveView({ type: 'detail', recordId: item.id });
            }}
            onNotify={notify}
          />
        )}
        </Suspense>
        </motion.div>
      </main>

      {activeView.type !== 'create' &&
        activeView.type !== 'edit' &&
        activeView.type !== 'iniciativa_create' &&
        activeView.type !== 'iniciativa_edit' &&
        activeView.type !== 'report_create' &&
        activeView.type !== 'report_edit' && <Footer />}

      {operator.mode === 'google' && accessToken && (
        <SpreadsheetSetupModal
          open={showSpreadsheetModal}
          accessToken={accessToken}
          currentSpreadsheetId={spreadsheetId}
          envSpreadsheetPinned={envSpreadsheetPinned}
          onSelectSpreadsheet={(sid) => {
            setSpreadsheetId(sid);
            setShowSpreadsheetModal(false);
            notify('Planilha Google Sheets conectada ao CMS.', 'success');
          }}
          onClose={() => setShowSpreadsheetModal(false)}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    </MotionConfig>
  );
}
