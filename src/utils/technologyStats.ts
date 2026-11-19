import type { Acionamento } from '../types/acionamento';
import { getTodayIsoDate, isValidIsoDate } from './validation';

export type TechnologyStatsPeriod = 'last30days' | 'monthly';

export interface TechnologyStats {
  data: Array<Record<string, string | number>>;
  technologies: string[];
  total: number;
}

export function getTechnologyStats(
  acionamentos: Acionamento[],
  period: TechnologyStatsPeriod,
  now = new Date()
): TechnologyStats {
  const todayIso = getTodayIsoDate(now);
  const today = new Date(`${todayIso}T12:00:00`);
  const monthKeys = Array.from({ length: 12 }, (_, index) => {
    const month = new Date(today.getFullYear(), today.getMonth() - 11 + index, 1, 12);
    return `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
  });

  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 29);
  const startDateIso = getTodayIsoDate(startDate);
  const activeMonthKeys = new Set(monthKeys);
  const technologySet = new Set<string>();
  const countsByPeriod = new Map<string, Map<string, number>>();

  for (const item of acionamentos) {
    if (!item.tecnologiaEmpregada || !item.tecnologiaUtilizada.trim() || !isValidIsoDate(item.dataRegistro)) {
      continue;
    }

    const monthKey = item.dataRegistro.slice(0, 7);
    const periodKey =
      period === 'last30days'
        ? item.dataRegistro >= startDateIso && item.dataRegistro <= todayIso
          ? 'last30days'
          : null
        : activeMonthKeys.has(monthKey)
          ? monthKey
          : null;
    if (!periodKey) continue;

    const technology = item.tecnologiaUtilizada.trim();
    technologySet.add(technology);
    const counts = countsByPeriod.get(periodKey) ?? new Map<string, number>();
    counts.set(technology, (counts.get(technology) ?? 0) + 1);
    countsByPeriod.set(periodKey, counts);
  }

  const technologies = [...technologySet].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const data: TechnologyStats['data'] =
    period === 'last30days'
      ? technologies.map((technology) => ({
          label: technology,
          total: countsByPeriod.get('last30days')?.get(technology) ?? 0,
        }))
      : monthKeys.map((monthKey) => {
          const [year, month] = monthKey.split('-').map(Number);
          const monthLabel = new Date(year, month - 1, 1, 12)
            .toLocaleDateString('pt-BR', { month: 'short' })
            .replace('.', '');
          const counts = countsByPeriod.get(monthKey);
          return {
            label: `${monthLabel}/${String(year).slice(-2)}`,
            ...Object.fromEntries(
              technologies.map((technology) => [technology, counts?.get(technology) ?? 0])
            ),
          };
        });

  return {
    data,
    technologies,
    total: data.reduce(
      (sum, point) =>
        sum +
        (period === 'last30days'
          ? Number(point.total ?? 0)
          : technologies.reduce((monthSum, technology) => monthSum + Number(point[technology] ?? 0), 0)),
      0
    ),
  };
}
