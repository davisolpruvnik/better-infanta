import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  AreaChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  Layers,
  Check,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { CmciRecord, INFANTA_CMCI_DATA } from '@/data/cmciDataInfanta';

// --- PILLARS CONFIGURATION ---
const PILLAR_CONFIG = [
  { key: 'economicDynamism', label: 'Economic Dynamism', color: '#0284c7' }, // Sky Blue
  { key: 'governmentEfficiency', label: 'Gov Efficiency', color: '#16a34a' }, // Green
  { key: 'infrastructure', label: 'Infrastructure', color: '#d97706' }, // Amber
  { key: 'resiliency', label: 'Resiliency', color: '#9333ea' }, // Purple
  { key: 'innovation', label: 'Innovation', color: '#e11d48' }, // Rose
] as const;

type PillarKey = typeof PILLAR_CONFIG[number]['key'];

interface CmciAnalyticsProps {
  data?: CmciRecord[];
}

export default function CmciAnalyticsSection({ data = INFANTA_CMCI_DATA }: CmciAnalyticsProps) {
  const [viewMode, setViewMode] = useState<'rankings' | 'scores'>('rankings');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activePillars, setActivePillars] = useState<Record<PillarKey, boolean>>({
    economicDynamism: true,
    governmentEfficiency: true,
    infrastructure: true,
    resiliency: true,
    innovation: true,
  });

  const [activeRecord, setActiveRecord] = useState<CmciRecord>(() => data[data.length - 1]);

  const togglePillar = (key: PillarKey) => {
    setActivePillars((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectAllPillars = () => {
    setActivePillars({
      economicDynamism: true,
      governmentEfficiency: true,
      infrastructure: true,
      resiliency: true,
      innovation: true,
    });
  };

  const deselectAllPillars = () => {
    setActivePillars({
      economicDynamism: false,
      governmentEfficiency: false,
      infrastructure: false,
      resiliency: false,
      innovation: false,
    });
  };

  const activeCount = useMemo(
    () => Object.values(activePillars).filter(Boolean).length,
    [activePillars]
  );

  // Flatten Data for Recharts
  const chartData = useMemo(() => {
    return data.map((d) => ({
      year: d.year,
      category: d.category,
      overallRank: d.overallRank,
      overallScore: Number(d.overallScore.toFixed(1)),
      economicDynamism_rank: d.pillars.economicDynamism?.rank,
      economicDynamism_score: d.pillars.economicDynamism?.score ?? 0,
      governmentEfficiency_rank: d.pillars.governmentEfficiency?.rank,
      governmentEfficiency_score: d.pillars.governmentEfficiency?.score ?? 0,
      infrastructure_rank: d.pillars.infrastructure?.rank,
      infrastructure_score: d.pillars.infrastructure?.score ?? 0,
      resiliency_rank: d.pillars.resiliency?.rank,
      resiliency_score: d.pillars.resiliency?.score ?? 0,
      innovation_rank: d.pillars.innovation?.rank,
      innovation_score: d.pillars.innovation?.score ?? 0,
      raw: d,
    }));
  }, [data]);

  // Sync active record when user hovers / touches chart
  const handleInteraction = (state: any) => {
    if (state?.activePayload?.[0]?.payload?.raw) {
      setActiveRecord(state.activePayload[0].payload.raw);
    }
  };

  return (
    <section
      aria-label="CMCI Competitiveness Index Section"
      className="bg-white border border-fantas-900/10   p-3.5 sm:p-5 md:p-6 space-y-4 md:space-y-5"
    >
      {/* 1. HEADER (font-axis-titular-focus & font-axis-subtitular-focus) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3.5 border-b border-fantas-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-axis-titular-focus uppercase tracking-wide text-fantas-900 leading-snug">
              CMCI Competitiveness (2015–2024)
            </h3>
          </div>
          <p className="text-xs sm:text-sm font-axis-subtitular-focus uppercase tracking-wide text-slate-500 mt-0.5">
            DTI National Municipal Competitiveness Rankings & Scores
          </p>
        </div>

        {/* View Segmented Control (font-axis-navbar-focus) */}
        <div
          role="tablist"
          className="inline-flex p-1 bg-slate-100 border border-fantas-900/10/80 w-full sm:w-auto gap-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'rankings'}
            onClick={() => setViewMode('rankings')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-axis-navbar-focus uppercase tracking-wider  transition-all cursor-pointer select-none ${
              viewMode === 'rankings'
                ? 'bg-fantas-900 text-white '
                : 'text-slate-600 hover:text-fantas-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Rankings</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'scores'}
            onClick={() => setViewMode('scores')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-axis-navbar-focus uppercase tracking-wider  transition-all cursor-pointer select-none ${
              viewMode === 'scores'
                ? 'bg-fantas-700 text-white '
                : 'text-slate-600 hover:text-fantas-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Scores</span>
          </button>
        </div>
      </div>

      {/* 2. COLLAPSIBLE PILLAR FILTER CONTROLS */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Collapsible Button Trigger */}
          <button
            type="button"
            aria-expanded={isFilterOpen}
            onClick={() => setIsFilterOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-100 hover:bg-slate-200/80 border border-fantas-900/10  text-xs font-axis-navbar-focus uppercase tracking-wider text-slate-800 transition-colors cursor-pointer select-none"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
            <span>Filter</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                isFilterOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {viewMode === 'rankings' && (
            <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold ml-auto">
              <span className="w-3.5 h-0.5 border-t-2 border-dashed border-fantas-900" />
              <span className="font-axis-navbar-focus uppercase text-[11px]">Overall Rank</span>
            </div>
          )}
        </div>

        {/* Expandable Multi-Select Panel */}
        {isFilterOpen && (
          <div className="p-3 bg-slate-50/90 border border-fantas-900/10  space-y-2.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-1.5 border-b border-fantas-900/10/80 text-xs">
              <span className="text-[10px] font-axis-subtitular-focus uppercase tracking-wide text-slate-500 font-bold">
                Select Dimensions to Plot
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllPillars}
                  className="text-[10px] font-axis-navbar-focus uppercase tracking-wider text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-slate-300 text-[10px]">•</span>
                <button
                  type="button"
                  onClick={deselectAllPillars}
                  className="text-[10px] font-axis-navbar-focus uppercase tracking-wider text-slate-500 hover:text-slate-700 font-bold cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Checkbox Grid (1 col on mobile, 2 on sm, 3 on md+) */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {PILLAR_CONFIG.map((pillar) => {
                const isEnabled = activePillars[pillar.key];
                return (
                  <button
                    key={pillar.key}
                    type="button"
                    role="checkbox"
                    aria-checked={isEnabled}
                    onClick={() => togglePillar(pillar.key)}
                    className={`flex items-center gap-2.5 p-2 border text-left cursor-pointer transition-all select-none ${
                      isEnabled
                        ? 'bg-white border-fantas-900/10 text-fantas-900 '
                        : 'bg-slate-100/50 border-fantas-900/10 text-slate-400 opacity-60'
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center text-white shrink-0 transition-colors"
                      style={{ backgroundColor: isEnabled ? pillar.color : '#cbd5e1' }}
                    >
                      {isEnabled && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span className="font-axis-navbar-focus uppercase text-[11px] tracking-wide font-medium truncate">
                      {pillar.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. RECHARTS CANVAS */}
      <div className="w-full h-64 sm:h-72 md:h-80 select-none">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'rankings' ? (
            <LineChart
              data={chartData}
              margin={{ top: 28, right: 12, left: -14, bottom: 0 }}
              onMouseMove={handleInteraction}
              onTouchMove={handleInteraction}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

              <XAxis
                dataKey="year"
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                tick={<CustomAxisTick className="font-axis-navbar-focus font-bold fill-slate-500" />}
              />

              <YAxis
                reversed
                domain={[1, 400]}
                ticks={[1, 100, 200, 300, 400]}
                axisLine={false}
                tickLine={false}
                tick={
                  <CustomAxisTick
                    isYAxis
                    prefix="#"
                    className="font-axis-navbar-focus fill-slate-400"
                  />
                }
              />

              <ReferenceLine
                x={2017}
                stroke="#d97706"
                strokeDasharray="4 3"
                strokeWidth={1.5}
                label={<MilestoneLabel text="★ 1st Class Shift, 2017" />}
              />

              <Tooltip
                content={<CustomTooltip viewMode="rankings" />}
                cursor={{ stroke: '#0f172a', strokeWidth: 1.2, strokeDasharray: '3 3' }}
              />

              {PILLAR_CONFIG.map((p) => {
                if (!activePillars[p.key]) return null;
                return (
                  <Line
                    key={p.key}
                    type="stepAfter"
                    dataKey={`${p.key}_rank`}
                    name={p.label}
                    stroke={p.color}
                    strokeWidth={1.5}
                    dot={{ r: 1.5, fill: p.color, stroke: p.color, strokeWidth: 1 }}
                    activeDot={{ r: 3, stroke: '#fff', strokeWidth: 1 }}
                    isAnimationActive={false}
                  />
                );
              })}

              <Line
                type="stepAfter"
                dataKey="overallRank"
                name="Overall Rank"
                stroke="#0f172a"
                strokeWidth={1.5}
                strokeDasharray="5 4"
                dot={{ r: 2, fill: '#000000' }}
                activeDot={{ r: 4.5, fill: '#000000' }}
                isAnimationActive={false}
              />
            </LineChart>
          ) : (
            <AreaChart
              data={chartData}
              margin={{ top: 28, right: 12, left: -14, bottom: 0 }}
              onMouseMove={handleInteraction}
              onTouchMove={handleInteraction}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

              <XAxis
                dataKey="year"
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                tick={<CustomAxisTick className="font-axis-navbar-focus font-bold fill-slate-500" />}
              />

              <YAxis
                domain={[0, 65]}
                ticks={[0, 15, 30, 45, 60]}
                axisLine={false}
                tickLine={false}
                tick={<CustomAxisTick isYAxis className="font-axis-navbar-focus fill-slate-400" />}
              />

              <ReferenceLine
                x={2017}
                stroke="#d97706"
                strokeDasharray="4 3"
                strokeWidth={1.1}
                label={<MilestoneLabel text="★ 1st Class Shift, 2017" />}
              />

              <Tooltip
                content={<CustomTooltip viewMode="scores" />}
                cursor={{ stroke: '#0f172a', strokeWidth: 1, strokeDasharray: '3 3' }}
              />

              {PILLAR_CONFIG.map((p) => {
                if (!activePillars[p.key]) return null;
                return (
                  <Area
                    key={p.key}
                    type="monotone"
                    stackId="1"
                    dataKey={`${p.key}_score`}
                    name={p.label}
                    stroke={p.color}
                    fill={p.color}
                    fillOpacity={0.65}
                    strokeWidth={1.5}
                    isAnimationActive={false}
                  />
                );
              })}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* 4. ACTIVE DATA BREAKDOWN CARD (font-axis-chunky & font-axis-navbar-focus) */}
      <div className="border border-fantas-900/10 bg-slate-50/80 p-3 sm:p-4  space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-3xl font-axis-titular-focus text-fantas-900 tracking-tight">
              {activeRecord.year}
            </span>
            <span
              className={`text-[10px] font-axis-navbar-focus uppercase tracking-wider px-2 py-0.5 font-bold ${
                activeRecord.year <= 2016
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}
            >
              {activeRecord.category} Category
            </span>
            {activeRecord.year === 2016 && (
              <span className="text-[10px] font-axis-navbar-focus uppercase bg-amber-500 text-white px-2 py-0.5 flex items-center gap-1 rounded ">
                <Sparkles className="w-3 h-3" /> #1 in Philippines
              </span>
            )}
          </div>

          <div className="text-xs font-axis-subtitular-focus uppercase tracking-wide text-slate-600">
            Overall Rank:{' '}
            <strong className="text-fantas-900 font-axis-sng-indlab-value">
              #{activeRecord.overallRank}
            </strong>{' '}
            &bull; Total Score:{' '}
            <strong className="text-fantas-900 font-axis-sng-indlab-value">
              {activeRecord.overallScore.toFixed(2)}
            </strong>
          </div>
        </div>

        {/* 5-Pillar Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
          {PILLAR_CONFIG.map((p, idx) => {
            const dataPillar = activeRecord.pillars[p.key];
            const isLastOrphan = idx === 4;

            return (
              <div
                key={p.key}
                className={`flex flex-row items-center justify-between bg-white p-2.5 border border-fantas-900/10/90 transition-all ${
                  isLastOrphan ? 'col-span-2 sm:col-span-1' : ''
                }`}
              >
                <span className="text-[10px] md:text-xs lg:text-xs text-fantas-900/60 text-start font-axis-navbar-focus uppercase tracking-wider block line-clamp-2 text-pretty">
                  {p.label}
                </span>
                <span
                  className="font-axis-sng-indlab-value text-lg md:text-xl lg:text-2xl mt-0.5 block"
                  style={{ color: p.color }}
                >
                  {dataPillar
                    ? viewMode === 'rankings'
                      ? `#${dataPillar.rank}`
                      : `${dataPillar.score.toFixed(2)}`
                    : 'N/A'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 🎨 SVG HELPERS (TAILWIND FONT VARIATION COMPATIBLE)
// ==========================================

function CustomAxisTick({ x, y, payload, isYAxis, prefix = '', className }: any) {
  return (
    <text
      x={x}
      y={y + (isYAxis ? 4 : 12)}
      textAnchor={isYAxis ? 'end' : 'middle'}
      className={`text-[11px] ${className}`}
    >
      {prefix}
      {payload.value}
    </text>
  );
}

function MilestoneLabel({ viewBox, text }: any) {
  if (!viewBox) return null;
  const { x, y } = viewBox;
  return (
    <g transform={`translate(${x}, ${y - 10})`}>
      <rect
        x="-58"
        y="-16"
        width="116"
        height="22"
        rx="4"
        fill="#fef3c7"
        stroke="#fde68a"
        strokeWidth="1"
      />
      <text
        x="0"
        y="-1"
        textAnchor="middle"
        className="font-axis-navbar-focus uppercase text-[10px] fill-amber-900 tracking-wide"
      >
        {text}
      </text>
    </g>
  );
}

function CustomTooltip({ active, payload, label, viewMode }: any) {
  if (!active || !payload || !payload.length) return null;
  const rawData: CmciRecord = payload[0]?.payload?.raw;

  return (
    <div className="bg-fantas-900/95 text-white backdrop-blur-xs p-2.5 border border-fantas-800 text-xs space-y-1.5 z-50 min-w-[150px]">
      <div className="flex items-center justify-between gap-3 border-b border-fantas-700/80 pb-1 font-axis-navbar-focus uppercase tracking-wider font-bold">
        <span>Year {label}</span>
        <span className="text-amber-400 text-[11px]">
          {viewMode === 'rankings' ? `#${rawData?.overallRank}` : `${rawData?.overallScore.toFixed(1)} pts`}
        </span>
      </div>

      <div className="space-y-1">
        {payload
          .filter((item: any) => item.dataKey !== 'overallRank')
          .map((item: any) => (
            <div
              key={item.dataKey}
              className="flex items-center justify-between gap-3 text-[11px] font-axis-subtitular-focus"
            >
              <span className="flex items-center gap-1.5 text-slate-300 truncate">
                <span className="w-2 h-2  shrink-0" style={{ backgroundColor: item.color }} />
                <span className="truncate max-w-[110px] uppercase">{item.name}</span>
              </span>
              <span className="font-axis-navbar-focus font-bold">
                {viewMode === 'rankings' ? `#${item.value}` : `${Number(item.value).toFixed(1)}`}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
