import { FileSpreadsheet, LogOut, User } from 'lucide-react';
import { motion } from 'motion/react';
import type { OperatorIdentity } from '../types/acionamento';

export type NavSection = 'registros' | 'iniciativas' | 'historico' | 'protocolos';

interface HeaderProps {
  activeNav: NavSection;
  onNavigate: (section: NavSection) => void;
  operator: OperatorIdentity;
  pendingReportsCount?: number;
  spreadsheetId?: string;
  onOpenSpreadsheetSetup?: () => void;
  onSignOut: () => void;
}

export function Header({
  activeNav,
  onNavigate,
  operator,
  pendingReportsCount = 0,
  spreadsheetId,
  onOpenSpreadsheetSetup,
  onSignOut,
}: HeaderProps) {
  const navItems: Array<{ id: NavSection; label: string }> = [
    { id: 'registros', label: 'Registros' },
    { id: 'iniciativas', label: 'Iniciativas' },
    { id: 'historico', label: 'Histórico' },
    { id: 'protocolos', label: 'Protocolos' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 shadow-[0_2px_12px_rgba(0,62,60,0.14)]">
      {/* Subtle Vale-inspired top dual accent hairline */}
      <div className="h-[3px] w-full flex" aria-hidden="true">
        <div className="flex-1 bg-[#00807C]" />
        <div className="w-28 sm:w-44 bg-[#EEA722]" />
      </div>

      {/* Main Corporate Teal Navigation Bar */}
      <div className="relative bg-[#005C59] text-white overflow-hidden">
        {/* Discreet geometric curves inspired by corporate mining/engineering identity */}
        <svg
          className="pointer-events-none absolute right-0 top-0 h-full w-72 opacity-[0.12] hidden md:block"
          viewBox="0 0 280 56"
          fill="none"
          aria-hidden="true"
        >
          <path d="M120 56C165 56 190 12 245 0H280V56H120Z" fill="#00807C" />
          <path d="M185 56C215 56 235 24 280 14V56H185Z" fill="#EEA722" fillOpacity="0.45" />
        </svg>

        <div className="relative h-14 max-w-[1340px] mx-auto px-5 sm:px-7 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button
              type="button"
              onClick={() => onNavigate('registros')}
              className="flex items-center gap-2.5 text-left focus:outline-none cursor-pointer shrink-0 group"
            >
              <span
                className="w-2.5 h-2.5 rounded-full bg-[#EEA722] ring-2 ring-[#EEA722]/30 shrink-0"
                aria-hidden="true"
              />
              <span className="text-[16px] text-white font-semibold tracking-[-0.02em] whitespace-nowrap">
                Acionamentos
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-white/12 border border-white/20 text-[#FDE8BA] text-[11px] font-semibold tracking-[0.08em] whitespace-nowrap">
                CMS
              </span>
            </button>

            <nav
              className="hidden sm:flex items-center gap-6 ml-4 h-14"
              aria-label="Navegação principal"
            >
              {navItems.map((item) => {
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative h-full inline-flex items-center text-[14px] leading-5 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus:outline-none ${
                      isActive
                        ? 'text-white font-semibold'
                        : 'text-white/75 hover:text-white font-normal'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span>{item.label}</span>
                      {item.id === 'protocolos' && pendingReportsCount > 0 && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-[#EEA722] ring-2 ring-[#EEA722]/30 shrink-0"
                          aria-hidden="true"
                          title={`${pendingReportsCount} ocorrência(s) relevante(s) em Report`}
                        />
                      )}
                    </span>
                    {isActive && (
                      <motion.span
                        layoutId="cms-nav-indicator"
                        transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                        className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#EEA722] rounded-t-full"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {operator.mode === 'google' && onOpenSpreadsheetSetup && (
              <button
                type="button"
                onClick={onOpenSpreadsheetSetup}
                title={
                  spreadsheetId
                    ? `Planilha conectada: ${spreadsheetId}`
                    : 'Configurar planilha Google Sheets'
                }
                aria-label="Configurar planilha Google Sheets"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/95 hover:text-white bg-white/10 hover:bg-white/18 border border-white/18 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#FDE8BA]" />
                <span className="whitespace-nowrap">Planilha</span>
              </button>
            )}

            <div className="text-right hidden sm:block">
              <div className="text-[13.5px] font-semibold text-white leading-tight truncate max-w-[190px]">
                {operator.name}
              </div>
              <div className="text-[11.5px] text-white/75 leading-tight">
                {operator.mode === 'demo' ? 'Modo DEMO · Operador CMS' : 'Operador CMS'}
              </div>
            </div>

            <div
              className="w-8 h-8 rounded-full bg-white/15 border border-white/25 flex items-center justify-center text-white shrink-0"
              title={`${operator.name} (${operator.email})`}
            >
              <User className="w-4 h-4" />
            </div>

            <button
              type="button"
              onClick={onSignOut}
              title={operator.mode === 'demo' ? 'Sair do Modo DEMO' : 'Sair da conta Google'}
              aria-label={operator.mode === 'demo' ? 'Sair do Modo DEMO' : 'Sair da conta Google'}
              className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation strip */}
      <nav
        className="flex sm:hidden items-center justify-between border-b border-[#d4dfe4] bg-[#f4f7f9] px-3 py-1.5"
        aria-label="Navegação móvel"
      >
        <div className="flex items-center gap-1.5">
          {navItems.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`relative px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  isActive
                    ? 'text-white'
                    : 'text-[#3e4e57] hover:text-[#162229]'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="cms-mobile-nav-pill"
                    transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                    className="absolute inset-0 bg-[#00807C] rounded-xl shadow-2xs"
                    aria-hidden="true"
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Clear DEMO indicator banner when running in DEMO mode */}
      {operator.mode === 'demo' && (
        <div className="bg-[#FEF6E3] border-b border-[#F3D085] px-4 py-1.5 text-center text-xs text-[#7D4E03]">
          <span className="font-semibold">MODO DEMO</span> — Dados fictícios locais para demonstração.
          Não conectados à planilha oficial do Google Sheets.
        </div>
      )}
    </header>
  );
}
