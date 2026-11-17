export function Footer() {
  return (
    <footer className="w-full border-t border-[#d4dfe4] bg-[#f4f7f9] mt-auto">
      <div className="max-w-[1340px] mx-auto px-5 sm:px-7 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[12px] text-[#566670]">
          <span className="inline-flex items-center gap-1" aria-hidden="true">
            <span className="w-2 h-2 rounded-full bg-[#00807C]" />
            <span className="w-2 h-2 rounded-full bg-[#EEA722]" />
          </span>
          <span>Centro de Monitoramento de Segurança · Central de Acionamentos — CMS</span>
        </div>
        <span className="text-[12px] font-medium text-[#4e6b7c]">CMS Operacional</span>
      </div>
    </footer>
  );
}
