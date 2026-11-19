import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Acionamento } from '../types/acionamento';
import { getTechnologyStats, type TechnologyStatsPeriod } from '../utils/technologyStats';

interface TechnologyUsageChartProps {
  acionamentos: Acionamento[];
  loading: boolean;
}

const SERIES_COLORS = ['#00807C', '#28658A', '#D18B24', '#8A5E9E', '#4E8B56', '#C25D50', '#498C9A', '#77787B'];

export function TechnologyUsageChart({ acionamentos, loading }: TechnologyUsageChartProps) {
  const [period, setPeriod] = useState<TechnologyStatsPeriod>('last30days');
  const stats = useMemo(
    () => getTechnologyStats(acionamentos, period),
    [acionamentos, period]
  );

  return (
    <section
      aria-label="Acionamentos por tecnologia"
      className="bg-white border border-[#D4DFE4] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#162229]">Acionamentos por tecnologia</h2>
          <p className="mt-1 text-sm text-[#52636D]">
            {period === 'last30days'
              ? 'Quantidade por tecnologia nos últimos 30 dias'
              : 'Quantidade mensal por tecnologia nos últimos 12 meses'}
          </p>
        </div>
        <div
          role="tablist"
          aria-label="Período do gráfico"
          className="inline-flex p-1 rounded-xl bg-[#EDF2F4] gap-1 self-start"
        >
          {([
            { id: 'last30days', label: 'Últimos 30 dias' },
            { id: 'monthly', label: 'Por mês' },
          ] as const).map((option) => (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={period === option.id}
              onClick={() => setPeriod(option.id)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                period === option.id
                  ? 'bg-white text-[#005451] font-semibold shadow-xs'
                  : 'text-[#52636D] hover:text-[#162229]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-[340px] animate-pulse rounded-xl bg-[#F4F7F9]" aria-label="Carregando gráfico" />
      ) : stats.technologies.length === 0 ? (
        <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-[#D4DFE4] text-center text-sm text-[#64737C]">
          Não há acionamentos com tecnologia empregada neste período.
        </div>
      ) : (
        <>
          <div className="h-[360px] min-w-0" role="img" aria-label={`${stats.total} acionamentos com tecnologia no período selecionado`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.data} margin={{ top: 8, right: 12, left: 0, bottom: 42 }}>
                <CartesianGrid stroke="#E8EEF1" vertical={false} />
                <XAxis
                  dataKey="label"
                  interval={0}
                  angle={period === 'last30days' ? -25 : 0}
                  textAnchor={period === 'last30days' ? 'end' : 'middle'}
                  height={period === 'last30days' ? 70 : 36}
                  tick={{ fill: '#52636D', fontSize: 11 }}
                  axisLine={{ stroke: '#D4DFE4' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  width={38}
                  tick={{ fill: '#64737C', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: '#F4F7F9' }}
                  formatter={(value) => [`${value ?? 0}`, 'Acionamentos']}
                />
                {period === 'monthly' && (
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    iconType="circle"
                  />
                )}
                {period === 'last30days' ? (
                  <Bar dataKey="total" name="Acionamentos" fill="#00807C" radius={[5, 5, 0, 0]} maxBarSize={56} />
                ) : (
                  stats.technologies.map((technology, index) => (
                    <Bar
                      key={technology}
                      dataKey={technology}
                      name={technology}
                      fill={SERIES_COLORS[index % SERIES_COLORS.length]}
                      radius={[3, 3, 0, 0]}
                      maxBarSize={36}
                    />
                  ))
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-[#64737C]">
            Total no período: <strong className="text-[#162229]">{stats.total}</strong>{' '}
            {stats.total === 1 ? 'acionamento' : 'acionamentos'}
          </p>
        </>
      )}
    </section>
  );
}
