import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { BLGFRawRecord, getNTADependency } from '@/types/blgf';

interface NTABarChartProps {
  dataset: BLGFRawRecord[];
  targetLguName?: string; // Default: 'Infanta'
  year: number;
}

// 10 Key Economic Hubs of Quezon Province
const ECONOMIC_PEER_LGUS = [
  'lucena',
  'pagbilao',
  'lucban',
  'tayabas',
  'candelaria',
  'gumaca',
  'catanauan',
  'lopez',
  'atimonan',
  'infanta',
];

function CustomYAxisTownTick({ x, y, payload, targetLguName }: any) {
  const isTarget = payload.value.toLowerCase().includes(targetLguName.toLowerCase());

  return (
    <text
      x={x - 6}
      y={y + 3}
      textAnchor="end"
      className={`text-[11px] font-axis-navbar-focus uppercase tracking-wider select-none ${
        isTarget ? 'fill-fantas-950 font-bold' : 'fill-slate-600/80'
      }`}
    >
      {payload.value}
    </text>
  );
}

// 2. Percentage numbers along the bottom X-Axis
function CustomXAxisNumberTick({ x, y, payload }: any) {
  return (
    <text
      x={x}
      y={y + 12}
      textAnchor="middle"
      className="text-[10.5px] tracking-wide font-axis-sng-indlab-value fill-slate-600/80 select-none"
    >
      {payload.value}%
    </text>
  );
}

// 3. Vertical Reference Line Label on top
function CustomVerticalReferenceLineLabel(props: any) {
  const { viewBox, value } = props;
  const x = viewBox.x - 55;
  const y = viewBox.y - 5;

  return (
    <g>
      <text
        x={x}
        y={y}
        textAnchor="middle"
        className="font-axis-subtitular-focus uppercase text-[10px] tracking-wide fill-fantas-700 font-bold select-none"
      >
        Typical Quezon LGU: <tspan className="font-axis-titular-focus text-fantas-700 text-[12px] tracking-wide">{value}%</tspan>
      </text>
    </g>
  );
}

export default function NTABarChart({
  dataset,
  targetLguName = 'Infanta',
  year,
}: NTABarChartProps) {
  const { peerData, provincialMedian } = useMemo(() => {
    const yearRecords = dataset.filter((d) => d.YEAR === year);

    // 1. Calculate true Provincial Median across ALL municipalities in the province
    const allDependencies = yearRecords
      .map((r) => getNTADependency(r))
      .filter((v) => !isNaN(v) && v > 0)
      .sort((a, b) => a - b);

    const mid = Math.floor(allDependencies.length / 2);
    const median =
      allDependencies.length % 2 !== 0
        ? allDependencies[mid]
        : (allDependencies[mid - 1] + allDependencies[mid]) / 2;

    // 2. Filter down strictly to the 10 Key Economic Hubs
    const filteredPeers = yearRecords
      .filter((r) =>
        ECONOMIC_PEER_LGUS.some((name) =>
          r.LGU_NAME.toLowerCase().includes(name)
        )
      )
      .map((r) => ({
        name: r.LGU_NAME,
        type: r.LGU_TYPE,
        ntaDependency: Number(getNTADependency(r).toFixed(2)),
        ntaAmount: r.REV_NTA_IRA,
        totalIncome: r.TOTAL_OPERATING_INCOME,
      }))
      .sort((a, b) => b.ntaDependency - a.ntaDependency);

    return {
      peerData: filteredPeers,
      provincialMedian: Number((median || 0).toFixed(2)),
    };
  }, [dataset, year]);

  return (
      <div className="bg-white border border-slate-200 p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-slate-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-axis-titular-focus text-slate-900 uppercase tracking-wide leading-snug text-center md:text-start lg:text-start pb-0.5">
                NTA Reliance vs. Key Economic Hubs ({year})
              </h3>
            </div>
            <p className="text-sm font-axis-subtitular-focus text-slate-500 uppercase tracking-wide leading-snug text-center md:text-start lg:text-start">
              Comparing Infanta against Quezon's top commercial and district centers
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-xs font-axis-subtitular-focus uppercase tracking-wide">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-fantas-700  inline-block" />
              <strong className="text-slate-800">{targetLguName}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-slate-300  inline-block" />
              <span className="text-slate-400">Economic Peers</span>
            </span>
          </div>
        </div>

        {/* Horizontal Bar Canvas */}
        <div className="w-full h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical" // 🔄 INVERTS AXES
              data={peerData}
              margin={{ top: 18, right: 28, left: 16, bottom: 6 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />

              {/* X-Axis is now Numerical (%) */}
              <XAxis
                type="number"
                domain={[0, 100]}
                stroke="#94a3b8"
                tickLine={true}
                tick={<CustomXAxisNumberTick />}
              />

              {/* Y-Axis is now Categorical (Town Names) */}
              <YAxis
                type="category"
                dataKey="name"
                stroke="#94a3b8"
                tickLine={true}
                width={80}
                tick={<CustomYAxisTownTick targetLguName={targetLguName} />}
              />

              <Tooltip
                content={<CustomBarTooltip targetLguName={targetLguName} />}
                cursor={{ fill: 'rgba(241, 245, 249, 0.7)' }}
              />

              {/* Vertical Reference Line for Provincial Median */}
              <ReferenceLine
                x={provincialMedian} // 🔄 Uses X coordinate for vertical line
                stroke="#b56603"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={<CustomVerticalReferenceLineLabel value={provincialMedian} />}
              />

              {/* Horizontal Bar with right-side rounded corners */}
              <Bar
                dataKey="ntaDependency"
                radius={[0, 0, 0, 0]} // 🔄 Rounds right corners
                maxBarSize={22}
              >
                {peerData.map((entry) => {
                  const isTarget = entry.name.toLowerCase().includes(targetLguName.toLowerCase());
                  return (
                    <Cell
                      key={`bar-${entry.name}`}
                      fill={isTarget ? 'rgb(85, 48, 1)' : '#cbd5e1'}
                      className="transition-colors duration-150 hover:opacity-85"
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

function CustomBarTooltip({ active, payload, targetLguName }: any) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  const isTarget = data.name.toLowerCase().includes(targetLguName.toLowerCase());

  return (
    <div className="bg-slate-900/95 backdrop-blur-xs text-white p-3  shadow-xl border border-slate-700 text-xs space-y-1 z-50 min-w-[170px]">
      <div className="flex items-center justify-between border-b border-slate-800 pb-1 gap-2">
        <p className={`font-axis-navbar-focus uppercase tracking-wider ${isTarget ? 'text-amber-400' : 'text-slate-200'}`}>
          {data.name}
        </p>
        <span className="text-[10px] font-axis-subtitular-focus tracking-wide text-slate-400 uppercase">
          {data.type}
        </span>
      </div>

      <div className="pt-1 space-y-0.5">
        <div className="flex justify-between gap-3">
          <span className="font-axis-subtitular-focus tracking-wide uppercase text-slate-400">NTA Dependency</span>
          <span className="font-axis-navbar-focus tracking-wide text-amber-400">{data.ntaDependency}%</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="font-axis-subtitular-focus tracking-wide uppercase text-slate-400">NTA / IRA Amount</span>
          <span className="font-axis-navbar-focus tracking-wide text-slate-200">₱{(data.ntaAmount / 1_000_000).toFixed(1)}M</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="font-axis-subtitular-focus tracking-wide uppercase text-slate-400">Total Revenue</span>
          <span className="font-axis-navbar-focus tracking-wide text-slate-300">₱{(data.totalIncome / 1_000_000).toFixed(1)}M</span>
        </div>
      </div>
    </div>
  );
}
