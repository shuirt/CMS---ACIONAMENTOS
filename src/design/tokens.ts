import type { StatusOperacional } from '../types/acionamento';

/**
 * Central Design System — Central de Acionamentos CMS
 * Inspirado na identidade visual corporativa Vale S.A. (Verde #00807C, Amarelo #EEA722,
 * Cinza Corporativo #77787B e paletas minerais complementares adaptadas a software operacional).
 */

export const VALE_PALETTE = {
  green: '#00807C',
  greenDeep: '#005C59',
  greenDark: '#004744',
  greenSoft: '#E7F4F3',
  gold: '#EEA722',
  goldDeep: '#965F04',
  goldSoft: '#FEF6E3',
  grayCorporate: '#77787B',
  ink: '#162229',
  body: '#3E4E57',
  muted: '#64737C',
  canvas: '#EAF0F2',
  surface: '#FFFFFF',
  surfaceAlt: '#F4F7F9',
  surfaceSubtle: '#EEF3F5',
  border: '#D4DFE4',
  mineralBlue: '#1F6E9C',
  mineralBlueSoft: '#EBF4FA',
  slateBlue: '#4E6B7C',
  slateBlueSoft: '#EEF3F6',
  crimsonMuted: '#B94A48',
  crimsonSoft: '#FCEFEF',
} as const;

/**
 * Vale Dark Mode Palette — Luminous, high-contrast, non-glare mineral palette
 * specifically engineered for 24/7 mission-critical operations centers.
 */
export const VALE_DARK_PALETTE = {
  canvas: '#0D151A',
  surface: '#162229',
  surfaceAlt: '#111B21',
  surfaceElevated: '#1A262E',
  surfaceSubtle: '#10191F',
  border: '#263640',
  borderSubtle: '#1F2E37',
  borderStrong: '#354854',
  ink: '#F1F5F8',
  body: '#CFD9DE',
  muted: '#8D9FA9',
  subtle: '#718490',
  green: '#00A39E',
  greenBright: '#00C2BB',
  greenGlow: 'rgba(0, 163, 158, 0.22)',
  gold: '#FFBE3B',
  goldGlow: 'rgba(238, 167, 34, 0.25)',
} as const;

export interface StatusStyleToken {
  dotClass: string;
  badgeClass: string;
  selectedButtonClass: string;
}

export const STATUS_DESIGN_TOKENS: Record<StatusOperacional, StatusStyleToken> = {
  Encerrado: {
    dotClass: 'bg-[#1F6E9C] dark:bg-[#4CA3D9]',
    badgeClass:
      'bg-[#EBF4FA] dark:bg-[#122B3D] border-[#B6D6EA] dark:border-[#224A63] text-[#154F73] dark:text-[#78BBE6]',
    selectedButtonClass:
      'border-[#1F6E9C] dark:border-[#4CA3D9] bg-[#1F6E9C] dark:bg-[#184463] text-white font-semibold shadow-xs ring-2 ring-[#1F6E9C]/20',
  },
  Report: {
    dotClass: 'bg-[#00807C] dark:bg-[#00C2BB]',
    badgeClass:
      'bg-[#E7F4F3] dark:bg-[#0A2E2C] border-[#B3DCD9] dark:border-[#145754] text-[#005451] dark:text-[#4DD4CF]',
    selectedButtonClass:
      'border-[#00807C] dark:border-[#00C2BB] bg-[#00807C] dark:bg-[#006E6A] text-white font-semibold shadow-xs ring-2 ring-[#00807C]/20',
  },
  'Em andamento': {
    dotClass: 'bg-[#B94A48] dark:bg-[#EF4444]',
    badgeClass:
      'bg-[#FCEFEF] dark:bg-[#341517] border-[#ECC4C3] dark:border-[#6B2629] text-[#8C3230] dark:text-[#F87171]',
    selectedButtonClass:
      'border-[#B94A48] dark:border-[#EF4444] bg-[#B94A48] dark:bg-[#7D292B] text-white font-semibold shadow-xs ring-2 ring-[#B94A48]/20',
  },
  Informação: {
    dotClass: 'bg-[#665494] dark:bg-[#A78BFA]',
    badgeClass:
      'bg-[#F4F2FA] dark:bg-[#261A38] border-[#D8D1EC] dark:border-[#523A73] text-[#45366B] dark:text-[#C4B5FD]',
    selectedButtonClass:
      'border-[#665494] dark:border-[#A78BFA] bg-[#665494] dark:bg-[#4C386E] text-white font-semibold shadow-xs ring-2 ring-[#665494]/20',
  },
  'Sem atendimento': {
    dotClass: 'bg-[#EEA722] dark:bg-[#FBBF24]',
    badgeClass:
      'bg-[#FEF6E3] dark:bg-[#332209] border-[#F3D085] dark:border-[#6E4912] text-[#8A5602] dark:text-[#FCD34D]',
    selectedButtonClass:
      'border-[#D99114] dark:border-[#FBBF24] bg-[#EEA722] dark:bg-[#78500C] text-[#162229] dark:text-[#FCD34D] font-semibold shadow-xs ring-2 ring-[#EEA722]/30',
  },
  Cancelado: {
    dotClass: 'bg-[#77787B] dark:bg-[#8D9FA9]',
    badgeClass:
      'bg-[#F0F1F2] dark:bg-[#1B242A] border-[#D0D2D5] dark:border-[#35434D] text-[#4E5053] dark:text-[#A6B5BD]',
    selectedButtonClass:
      'border-[#77787B] dark:border-[#8D9FA9] bg-[#77787B] dark:bg-[#35434D] text-white font-semibold shadow-xs ring-2 ring-[#77787B]/20',
  },
};

export const SURFACE_TOKENS = {
  pageContainer: 'max-w-[1340px] mx-auto px-5 sm:px-7 py-8',
  card: 'bg-white dark:bg-[#162229] rounded-2xl border border-[#d4dfe4] dark:border-[#263640] shadow-[0_2px_10px_-2px_rgba(22,34,41,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.35)]',
  cardElevated:
    'bg-white dark:bg-[#1A262E] rounded-3xl border border-[#d4dfe4] dark:border-[#2C3E4A] shadow-[0_6px_24px_-4px_rgba(22,34,41,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.45)]',
  panelTinted:
    'bg-[#f4f7f9] dark:bg-[#111B21] rounded-2xl border border-[#d4dfe4] dark:border-[#263640]',
  panelBlueTinted:
    'bg-[#eef4f8] dark:bg-[#12232E] rounded-2xl border border-[#c6dae6] dark:border-[#1E3B4D]',
  rowHover:
    'bg-white dark:bg-[#162229] hover:bg-[#f1f6f7] dark:hover:bg-[#1C2B34] transition-colors duration-150',
  divider: 'border-[#e3ebee] dark:border-[#263640]',
} as const;

export const BUTTON_VARIANTS = {
  primary:
    'inline-flex items-center justify-center gap-1.5 bg-[#00807C] hover:bg-[#006562] active:bg-[#005451] dark:bg-[#009E99] dark:hover:bg-[#008B86] dark:active:bg-[#007672] active:scale-[0.985] text-white font-semibold rounded-2xl shadow-xs transition-all duration-150 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed disabled:active:scale-100',
  secondary:
    'inline-flex items-center justify-center gap-1.5 bg-white hover:bg-[#f4f7f9] dark:bg-[#162229] dark:hover:bg-[#1E2D36] active:scale-[0.985] text-[#162229] dark:text-[#F1F5F8] border border-[#c8d5db] hover:border-[#9fb3bd] dark:border-[#2E424F] dark:hover:border-[#3D5564] font-medium rounded-2xl shadow-2xs transition-all duration-150 cursor-pointer disabled:opacity-55 disabled:active:scale-100',
  mineralBlue:
    'inline-flex items-center justify-center gap-1.5 bg-[#ebf4fa] hover:bg-[#dcecf6] dark:bg-[#133045] dark:hover:bg-[#1A3F5B] active:scale-[0.985] text-[#154f73] dark:text-[#78BBE6] border border-[#b6d6ea] dark:border-[#22577A] font-semibold rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-55 disabled:active:scale-100',
  ghost:
    'inline-flex items-center justify-center gap-1.5 text-[#52636d] hover:text-[#162229] hover:bg-[#e5edf0]/70 dark:text-[#8D9FA9] dark:hover:text-[#F1F5F8] dark:hover:bg-[#1C2B34] font-medium rounded-xl transition-colors duration-150 cursor-pointer disabled:opacity-55',
} as const;

export const FIELD_VARIANTS = {
  input:
    'w-full text-[13.5px] font-medium text-[#162229] dark:text-[#F1F5F8] bg-white dark:bg-[#111B21] border border-[#c8d5db] dark:border-[#2A3C47] focus:border-[#00807C] dark:focus:border-[#00A39E] rounded-xl px-3.5 py-2.5 shadow-2xs placeholder:text-[#77787B]/70 dark:placeholder:text-[#718490]',
  inputError:
    'w-full text-[13.5px] font-medium text-[#162229] dark:text-[#F1F5F8] bg-[#fdf7f7] dark:bg-[#2B1416] border border-[#b94a48] dark:border-[#EF4444] rounded-xl px-3.5 py-2.5 shadow-2xs',
  select:
    'w-full text-[13.5px] font-medium text-[#162229] dark:text-[#F1F5F8] bg-white dark:bg-[#111B21] border border-[#c8d5db] dark:border-[#2A3C47] focus:border-[#00807C] dark:focus:border-[#00A39E] rounded-xl px-3.5 py-2.5 shadow-2xs cursor-pointer',
} as const;
