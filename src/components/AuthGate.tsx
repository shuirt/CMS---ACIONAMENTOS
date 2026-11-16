import { AlertCircle, Eye, ShieldCheck } from 'lucide-react';

interface AuthGateProps {
  onGoogleSignIn: () => void;
  onEnterDemo: () => void;
  isSigningIn: boolean;
  authError: string | null;
}

export function AuthGate({
  onGoogleSignIn,
  onEnterDemo,
  isSigningIn,
  authError,
}: AuthGateProps) {
  return (
    <div className="relative min-h-screen bg-[#e3ecef] flex flex-col justify-between px-4 py-10 overflow-hidden">
      {/* Subtle architectural background geometry */}
      <svg
        className="pointer-events-none absolute inset-0 w-full h-full opacity-45"
        preserveAspectRatio="none"
        viewBox="0 0 1440 900"
        fill="none"
        aria-hidden="true"
      >
        <path d="M0 0H1440V220C1140 165 780 280 0 190V0Z" fill="#d4e2e7" />
        <path d="M980 900C1140 720 1280 650 1440 610V900H980Z" fill="#d7e8e6" />
      </svg>

      <div className="relative max-w-md w-full mx-auto my-auto bg-white rounded-3xl border border-[#c8d5db] shadow-[0_20px_50px_-15px_rgba(0,62,60,0.18)] overflow-hidden">
        {/* Institutional Vale-inspired header band */}
        <div className="relative bg-[#005C59] px-7 sm:px-8 pt-7 pb-6 text-white overflow-hidden">
          <svg
            className="pointer-events-none absolute right-0 top-0 h-full w-48 opacity-25"
            viewBox="0 0 200 120"
            fill="none"
            aria-hidden="true"
          >
            <path d="M70 120C115 90 140 25 200 0V120H70Z" fill="#00807C" />
            <path d="M130 120C155 95 175 55 200 42V120H130Z" fill="#EEA722" fillOpacity="0.65" />
          </svg>

          <div className="relative space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EEA722]" aria-hidden="true" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#FDE8BA]">
                CMS — Centro de Monitoramento de Segurança
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-[-0.025em] text-white">
              Central de Acionamentos
            </h1>
            <p className="text-xs sm:text-[13px] text-white/80 leading-relaxed">
              Sistema operacional de registro, consulta e acompanhamento de acionamentos.
            </p>
          </div>
        </div>
        <div className="h-[3px] w-full flex" aria-hidden="true">
          <div className="flex-1 bg-[#00807C]" />
          <div className="w-24 bg-[#EEA722]" />
        </div>

        <div className="p-7 sm:p-8 space-y-6">
          <p className="text-sm text-[#3e4e57] leading-relaxed">
            Acesso restrito a operadores autorizados do CMS. Entre com sua conta Google corporativa
            para consultar e gravar registros na planilha oficial.
          </p>

          {authError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-2xl bg-[#fcefef] border border-[#ecc4c3] p-3.5 text-xs text-[#8c3230] leading-relaxed"
            >
              <AlertCircle className="w-4 h-4 text-[#b94a48] shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={onGoogleSignIn}
              disabled={isSigningIn}
              className="gsi-material-button w-full"
            >
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    style={{ display: 'block' }}
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                </div>
                <span className="gsi-material-button-contents">
                  {isSigningIn ? 'Autenticando...' : 'Sign in with Google'}
                </span>
              </div>
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-[#d4dfe4]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2.5 text-[#64737c]">ou para avaliação visual</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onEnterDemo}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-[#b6d6ea] bg-[#ebf4fa] hover:bg-[#dcecf6] text-xs font-semibold text-[#154f73] transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4 text-[#1f6e9c]" />
              <span>Explorar em Modo Demonstração (DEMO)</span>
            </button>
          </div>

          <div className="flex items-start gap-2.5 pt-3 border-t border-[#e3ebee] text-xs text-[#566670] leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-[#00807C] shrink-0 mt-0.5" />
            <span>
              Todas as leituras e gravações em produção são validadas no servidor contra a lista de
              e-mails autorizados do CMS e registradas na aba Auditoria.
            </span>
          </div>
        </div>
      </div>

      <p className="relative text-center text-xs text-[#566670] mt-6">
        Centro de Monitoramento de Segurança · Central de Acionamentos — CMS
      </p>
    </div>
  );
}
