export function Footer() {
  return (
    <footer className="w-full border-t border-[#d4dfe4] dark:border-[#1F2E37] bg-[#f4f7f9] dark:bg-[#0D151A] mt-auto transition-colors duration-200">
      <div className="max-w-[1340px] mx-auto px-5 sm:px-7 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[12px] text-[#566670] dark:text-[#8D9FA9]">
          <span className="inline-flex items-center gap-1" aria-hidden="true">
            <span className="w-2 h-2 rounded-full bg-[#00807C] dark:bg-[#00A39E]" />
            <span className="w-2 h-2 rounded-full bg-[#EEA722] dark:bg-[#FFBE3B]" />
          </span>
          <span>Centro de Monitoramento de Segurança · Central de Acionamentos — CMS</span>
        </div>
        <span className="text-[12px] font-medium text-[#4e6b7c] dark:text-[#718490]">CMS Operacional</span>
      </div>
    </footer>
  );
}
