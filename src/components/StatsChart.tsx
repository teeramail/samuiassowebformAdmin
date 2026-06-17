'use client';

import { useMemo, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { StatsChartPoint, StatsRegistrationRecord } from '@/types/stats';

const HOUR_MS = 60 * 60 * 1000;
const FORECAST_PRESETS = [
  { label: '3 Days', value: 3 },
  { label: '1 Week', value: 7 },
  { label: '2 Weeks', value: 14 },
];

function padNumber(value: number): string {
  return value.toString().padStart(2, '0');
}

function startOfHour(value: Date): Date {
  const date = new Date(value);
  date.setMinutes(0, 0, 0);
  return date;
}

function addHours(value: Date, hours: number): Date {
  return new Date(value.getTime() + hours * HOUR_MS);
}

function getHourKey(value: Date): string {
  return `${value.getFullYear()}-${padNumber(value.getMonth() + 1)}-${padNumber(value.getDate())} ${padNumber(value.getHours())}:00`;
}

function getAxisLabel(value: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
  }).format(value);
}

function getFullLabel(value: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(value);
}

function formatMetricValue(value: number | string | Array<number | string> | undefined): string {
  if (Array.isArray(value)) {
    return value.join(', ');
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? value.toString() : value.toFixed(2);
  }

  return value == null ? '0' : String(value);
}

function getForecastDays(value: string): number {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return 0;
  }

  return Math.min(60, Math.floor(parsedValue));
}

type TooltipEntry = {
  color?: string;
  dataKey?: string | number;
  name?: string;
  value?: number | string | Array<number | string>;
  payload?: StatsChartPoint;
};

type CustomTooltipProps = {
  active?: boolean;
  label?: string;
  payload?: TooltipEntry[];
};

function buildChartData(
  sourceData: StatsRegistrationRecord[],
  forecastDays: number,
): {
  chartData: StatsChartPoint[];
  averagePeoplePerHour: number;
  projectedTotalPeople: number;
  trackedHours: number;
} {
  if (sourceData.length === 0) {
    return {
      chartData: [],
      averagePeoplePerHour: 0,
      projectedTotalPeople: 0,
      trackedHours: 0,
    };
  }

  const sortedData = [...sourceData].sort((left, right) => {
    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  });

  const hourlyPeopleMap = new Map<string, number>();

  for (const row of sortedData) {
    const hourDate = startOfHour(new Date(row.createdAt));
    const hourKey = getHourKey(hourDate);
    const currentPeople = hourlyPeopleMap.get(hourKey) ?? 0;

    hourlyPeopleMap.set(hourKey, currentPeople + 1 + row.companions);
  }

  const firstHour = startOfHour(new Date(sortedData[0]?.createdAt ?? new Date().toISOString()));
  const lastHour = startOfHour(new Date(sortedData.at(-1)?.createdAt ?? new Date().toISOString()));
  const trackedHours = Math.max(1, Math.floor((lastHour.getTime() - firstHour.getTime()) / HOUR_MS) + 1);
  const actualTotalPeople = sortedData.reduce((acc, row) => acc + 1 + row.companions, 0);
  const averagePeoplePerHour = actualTotalPeople / trackedHours;
  const chartData: StatsChartPoint[] = [];

  let cumulativePeople = 0;

  for (let hourIndex = 0; hourIndex < trackedHours; hourIndex += 1) {
    const hourDate = addHours(firstHour, hourIndex);
    const hourKey = getHourKey(hourDate);
    const actualNewPeople = hourlyPeopleMap.get(hourKey) ?? 0;
    cumulativePeople += actualNewPeople;

    chartData.push({
      hourKey,
      axisLabel: getAxisLabel(hourDate),
      fullLabel: getFullLabel(hourDate),
      actualNewPeople,
      actualCumulativePeople: cumulativePeople,
      forecastNewPeople: null,
      forecastCumulativePeople: null,
      isForecast: false,
    });
  }

  const forecastHours = forecastDays * 24;
  let projectedTotalPeople = cumulativePeople;

  if (forecastHours > 0) {
    const lastActualPoint = chartData.at(-1);

    if (lastActualPoint != null) {
      lastActualPoint.forecastCumulativePeople = lastActualPoint.actualCumulativePeople;
    }

    for (let forecastHourIndex = 1; forecastHourIndex <= forecastHours; forecastHourIndex += 1) {
      const forecastHour = addHours(lastHour, forecastHourIndex);
      projectedTotalPeople += averagePeoplePerHour;

      chartData.push({
        hourKey: getHourKey(forecastHour),
        axisLabel: getAxisLabel(forecastHour),
        fullLabel: getFullLabel(forecastHour),
        actualNewPeople: null,
        actualCumulativePeople: null,
        forecastNewPeople: Number(averagePeoplePerHour.toFixed(2)),
        forecastCumulativePeople: Number(projectedTotalPeople.toFixed(2)),
        isForecast: true,
      });
    }
  }

  return {
    chartData,
    averagePeoplePerHour,
    projectedTotalPeople,
    trackedHours,
  };
}

function CustomTooltip({
  active,
  label,
  payload,
}: CustomTooltipProps) {
  if (!active || payload == null || payload.length === 0) {
    return null;
  }

  const hasForecastSeries = payload.some((item) => {
    return item.dataKey === 'forecastCumulativePeople' || item.dataKey === 'forecastNewPeople';
  });

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm shadow-lg">
      <div className="mb-1 font-semibold text-gray-900">{label}</div>
      <div className="mb-2 text-xs text-gray-500">{hasForecastSeries ? 'Forecast data point' : 'Actual data point'}</div>
      <div className="space-y-1">
        {payload.map((item) => (
          <div key={String(item.dataKey ?? item.name)} className="flex items-center justify-between gap-6">
            <span className="text-gray-600" style={{ color: item.color ?? '#4b5563' }}>
              {String(item.name ?? item.dataKey ?? 'Value')}
            </span>
            <span className="font-semibold text-gray-900">{formatMetricValue(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StatsChart({ data }: { data: StatsRegistrationRecord[] }) {
  const [forecastDaysInput, setForecastDaysInput] = useState('3');

  const forecastDays = getForecastDays(forecastDaysInput);
  const { chartData, averagePeoplePerHour, projectedTotalPeople, trackedHours } = useMemo(() => {
    return buildChartData(data, forecastDays);
  }, [data, forecastDays]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white text-gray-500">
        No registration data available yet.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Tracked Hours</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{trackedHours}</div>
          </div>
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Average People / Hour</div>
            <div className="mt-1 text-2xl font-bold text-indigo-600">{averagePeoplePerHour.toFixed(2)}</div>
          </div>
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Projected Total</div>
            <div className="mt-1 text-2xl font-bold text-green-600">{projectedTotalPeople.toFixed(2)}</div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="text-sm font-medium text-gray-700">Forecast horizon</div>
          <div className="flex flex-wrap gap-2">
            {FORECAST_PRESETS.map((preset) => {
              const isActive = forecastDays === preset.value;

              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setForecastDaysInput(String(preset.value))}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
          <label className="flex items-center gap-3 text-sm text-gray-700">
            <span>Custom days</span>
            <input
              type="number"
              min="0"
              max="60"
              step="1"
              value={forecastDaysInput}
              onChange={(event) => setForecastDaysInput(event.target.value)}
              className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </label>
        </div>
      </div>

      <div className="h-[520px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 24, bottom: 20, left: 8 }}>
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
            <XAxis dataKey="axisLabel" tick={{ fontSize: 12 }} minTickGap={24} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} labelFormatter={(_label, payload) => payload?.[0]?.payload.fullLabel ?? ''} />
            <Legend />
            <Bar
              dataKey="actualNewPeople"
              name="Actual new people / hour"
              fill="#6366f1"
              radius={[6, 6, 0, 0]}
            />
            <Bar
              dataKey="forecastNewPeople"
              name="Projected new people / hour"
              fill="#c7d2fe"
              radius={[6, 6, 0, 0]}
            />
            <Line
              type="monotone"
              dataKey="actualCumulativePeople"
              name="Actual cumulative people"
              stroke="#16a34a"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="forecastCumulativePeople"
              name="Projected cumulative people"
              stroke="#22c55e"
              strokeWidth={3}
              strokeDasharray="8 4"
              dot={false}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
