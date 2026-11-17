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

export interface StatusStyleToken {
  dotClass: string;
  badgeClass: string;
  selectedButtonClass: string;
}

export const STATUS_DESIGN_TOKENS: Record<StatusOperacional, StatusStyleToken> = {
  Encerrado: {
    dotClass: 'bg-[#1F6E9C]',
    badgeClass:
      'bg-[#EBF4FA] border-[#B6D6EA] text-[#154F73]',
    selectedButtonClass:
      'border-[#1F6E9C] bg-[#1F6E9C] text-white font-semibold shadow-xs ring-2 ring-[#1F6E9C]/20',
  },
  Report: {
    dotClass: 'bg-[#00807C]',
    badgeClass:
      'bg-[#E7F4F3] border-[#B3DCD9] text-[#005451]',
    selectedButtonClass:
      'border-[#00807C] bg-[#00807C] text-white font-semibold shadow-xs ring-2 ring-[#00807C]/20',
  },
  'Em andamento': {
    dotClass: 'bg-[#B94A48]',
    badgeClass:
      'bg-[#FCEFEF] border-[#ECC4C3] text-[#8C3230]',
    selectedButtonClass:
      'border-[#B94A48] bg-[#B94A48] text-white font-semibold shadow-xs ring-2 ring-[#B94A48]/20',
  },
  Informação: {
    dotClass: 'bg-[#665494]',
    badgeClass:
      'bg-[#F4F2FA] border-[#D8D1EC] text-[#45366B]',
    selectedButtonClass:
      'border-[#665494] bg-[#665494] text-white font-semibold shadow-xs ring-2 ring-[#665494]/20',
  },
  'Sem atendimento': {
    dotClass: 'bg-[#EEA722]',
    badgeClass:
      'bg-[#FEF6E3] border-[#F3D085] text-[#8A5602]',
    selectedButtonClass:
      'border-[#D99114] bg-[#EEA722] text-[#162229] font-semibold shadow-xs ring-2 ring-[#EEA722]/30',
  },
  Cancelado: {
    dotClass: 'bg-[#77787B]',
    badgeClass:
      'bg-[#F0F1F2] border-[#D0D2D5] text-[#4E5053]',
    selectedButtonClass:
      'border-[#77787B] bg-[#77787B] text-white font-semibold shadow-xs ring-2 ring-[#77787B]/20',
  },
};

export const SURFACE_TOKENS = {
  pageContainer: 'max-w-[1340px] mx-auto px-5 sm:px-7 py-8',
  card: 'bg-white rounded-2xl border border-[#d4dfe4] shadow-[0_2px_10px_-2px_rgba(22,34,41,0.06)]',
  cardElevated:
    'bg-white rounded-3xl border border-[#d4dfe4] shadow-[0_6px_24px_-4px_rgba(22,34,41,0.08)]',
  panelTinted:
    'bg-[#f4f7f9] rounded-2xl border border-[#d4dfe4]',
  panelBlueTinted:
    'bg-[#eef4f8] rounded-2xl border border-[#c6dae6]',
  rowHover:
    'bg-white hover:bg-[#f1f6f7] transition-colors duration-150',
  divider: 'border-[#e3ebee]',
} as const;

export const BUTTON_VARIANTS = {
  primary:
    'inline-flex items-center justify-center gap-1.5 bg-[#00807C] hover:bg-[#006562] active:bg-[#005451] active:scale-[0.985] text-white font-semibold rounded-2xl shadow-xs transition-all duration-150 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed disabled:active:scale-100',
  secondary:
    'inline-flex items-center justify-center gap-1.5 bg-white hover:bg-[#f4f7f9] active:scale-[0.985] text-[#162229] border border-[#c8d5db] hover:border-[#9fb3bd] font-medium rounded-2xl shadow-2xs transition-all duration-150 cursor-pointer disabled:opacity-55 disabled:active:scale-100',
  mineralBlue:
    'inline-flex items-center justify-center gap-1.5 bg-[#ebf4fa] hover:bg-[#dcecf6] active:scale-[0.985] text-[#154f73] border border-[#b6d6ea] font-semibold rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-55 disabled:active:scale-100',
  ghost:
    'inline-flex items-center justify-center gap-1.5 text-[#52636d] hover:text-[#162229] hover:bg-[#e5edf0]/70 font-medium rounded-xl transition-colors duration-150 cursor-pointer disabled:opacity-55',
} as const;

export const FIELD_VARIANTS = {
  input:
    'w-full text-[13.5px] font-medium text-[#162229] bg-white border border-[#c8d5db] focus:border-[#00807C] rounded-xl px-3.5 py-2.5 shadow-2xs placeholder:text-[#77787B]/70',
  inputError:
    'w-full text-[13.5px] font-medium text-[#162229] bg-[#fdf7f7] border border-[#b94a48] rounded-xl px-3.5 py-2.5 shadow-2xs',
  select:
    'w-full text-[13.5px] font-medium text-[#162229] bg-white border border-[#c8d5db] focus:border-[#00807C] rounded-xl px-3.5 py-2.5 shadow-2xs cursor-pointer',
} as const;
