import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { BLGFRawRecord, getNTADependency } from '@/types/blgf';

interface NTALineChartProps {
  dataset: BLGFRawRecord[];
  selectedLguName: string;
}

// 1. Year labels along the bottom X-Axis
function CustomLineXAxisYearTick({ x, y, payload }: any) {
  return (
    <text
      x={x}
      y={y + 12}
      textAnchor="middle"
      className="text-[10.5px] tracking-wide font-axis-sng-indlab-value fill-slate-600/80 select-none"
    >
      {payload.value}
    </text>
  );
}

// 2. Percentage numbers along the left Y-Axis
function CustomLineYAxisPercentTick({ x, y, payload }: any) {
  return (
    <text
      x={x - 6}
      y={y + 3}
      textAnchor="end"
      className="text-[10.5px] tracking-wide font-axis-sng-indlab-value fill-slate-600/80 select-none"
    >
      {payload.value}%
    </text>
  );
}

export default function NTALineChart({ dataset, selectedLguName }: NTALineChartProps) {
  const { chartData, allLguNames } = useMemo(() => {
    const years = Array.from(new Set(dataset.map((d) => d.YEAR))).sort((a, b) => a - b);
    const lguNames = Array.from(new Set(dataset.map((d) => d.LGU_NAME)));

    const transformed = years.map((year) => {
      const row: Record<string, number> = { year };
      const yearlyDependencies: number[] = [];

      lguNames.forEach((name) => {
        const record = dataset.find((d) => d.YEAR === year && d.LGU_NAME === name);
        if (record) {
          const dep = getNTADependency(record);
          row[name] = Number(dep.toFixed(2));
          yearlyDependencies.push(dep);
        }
      });

      // Calculate Provincial Median for this specific year
      if (yearlyDependencies.length > 0) {
        yearlyDependencies.sort((a, b) => a - b);
        const mid = Math.floor(yearlyDependencies.length / 2);
        const median =
          yearlyDependencies.length % 2 !== 0
            ? yearlyDependencies[mid]
            : (yearlyDependencies[mid - 1] + yearlyDependencies[mid]) / 2;
        row['__PROVINCIAL_MEDIAN__'] = Number(median.toFixed(2));
      }

      return row;
    });

    return { chartData: transformed, allLguNames: lguNames };
  }, [dataset]);

  return (
    <div className="bg-white border border-slate-200 p-6 space-y-4">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-fantas-700" />
          <h3 className="text-lg font-axis-titular-focus uppercase tracking-wide text-slate-900 leading-tight">
            NTA Dependency Trajectory
          </h3>
        </div>

        <div className="flex items-center gap-4 text-xs font-axis-subtitular-focus uppercase tracking-wide">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-fantas-700 inline-block" />
            <strong className="text-slate-900">{selectedLguName}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 border-t-2 border-dashed border-red-500 inline-block" />
            <span className="text-red-700">Typical Quezon LGU</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-slate-300 inline-block" />
            <span className="text-slate-400">Other LGUs</span>
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 18, right: 28, left: 8, bottom: 8 }}
          >
            {/* Subtle Gridlines */}
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

            {/* X-Axis: Years with Custom Typography Tick */}
            <XAxis
              dataKey="year"
              stroke="#94a3b8"
              tickLine={{ stroke: '#cbd5e1' }}
              tick={<CustomLineXAxisYearTick />}
            />

            {/* Y-Axis: Percentages with Custom Typography Tick */}
            <YAxis
              domain={[30, 100]}
              stroke="#94a3b8"
              tickLine={{ stroke: '#cbd5e1' }}
              width={42}
              tick={<CustomLineYAxisPercentTick />}
            />

            <Tooltip content={<CustomLineTooltip selectedLguName={selectedLguName} />} />

            {/* 1. Muted gray lines for background LGUs */}
            {allLguNames.map((name) => {
              if (name === selectedLguName) return null;
              return (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke="#cbd5e1"
                  strokeWidth={1}
                  strokeOpacity={0.6}
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                />
              );
            })}

            {/* 2. Provincial Median (Broken/Dashed Line) */}
            <Line
              type="monotone"
              dataKey="__PROVINCIAL_MEDIAN__"
              name="Typical Quezon LGU"
              stroke="#ff6467"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              activeDot={{ r: 4, stroke: '#ff6467', fill: '#ffffff' }}
            />

            {/* 3. Selected LGU Highlighted */}
            <Line
              type="monotone"
              dataKey={selectedLguName}
              name={selectedLguName}
              stroke="rgb(85, 48, 1)"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4, stroke: 'rgb(85, 48, 1)', fill: '#ffffff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CustomLineTooltip({ active, payload, label, selectedLguName }: any) {
  if (!active || !payload || !payload.length) return null;

  const selectedEntry = payload.find((p: any) => p.dataKey === selectedLguName);
  const medianEntry = payload.find((p: any) => p.dataKey === '__PROVINCIAL_MEDIAN__');

  return (
    <div className="bg-slate-900 text-white p-3 rounded shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[175px]">
      <div className="font-axis-navbar-focus uppercase font-bold text-slate-300 border-b border-slate-700 pb-1">
        FY {label} Dependency
      </div>
      {selectedEntry && (
        <div className="flex justify-between items-center gap-2 text-amber-400">
          <span className="font-axis-navbar-focus uppercase">{selectedLguName}:</span>
          <span className="font-axis-sng-indlab-value font-bold text-sm">{selectedEntry.value}%</span>
        </div>
      )}
      {medianEntry && (
        <div className="flex justify-between items-center gap-2 text-red-400 border-t border-slate-800 pt-1">
          <span className="font-axis-navbar-focus uppercase">Typical Quezon LGU:</span>
          <span className="font-axis-sng-indlab-value">{medianEntry.value}%</span>
        </div>
      )}
    </div>
  );
}
