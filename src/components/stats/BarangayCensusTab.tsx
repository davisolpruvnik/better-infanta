import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
} from 'recharts';
import {
  Users,
  Home,
  TrendingUp,
  Award,
  Search,
  BarChart3,
} from 'lucide-react';
import LazyIcon from '../ui/Lazying';

import {
  getCensusMetrics,
  calculate100PeopleDistribution,
  getHistoricalTimeline,
} from '../../utils/censusUtils';
import { CENSUS_YEAR_END, CENSUS_YEAR_START, INFANTA_BARANGAYS } from '@/data/censusDataInfanta';
import Town100PeopleChart from './crumbs/Town100PeopleChart';

export default function BarangayCensusTab() {
  const [barangaySearch, setBarangaySearch] = useState('');
  const [selectedBarangayId, setSelectedBarangayId] = useState<number | 'all'>('all');

  // Filter List for Left Sidebar
  const filteredBarangays = useMemo(() => {
    return INFANTA_BARANGAYS.filter(
      (b) =>
        b.name.toLowerCase().includes(barangaySearch.toLowerCase()) ||
        b.district.toLowerCase().includes(barangaySearch.toLowerCase()) ||
        b.captain.toLowerCase().includes(barangaySearch.toLowerCase())
    );
  }, [barangaySearch]);

  // Reactive Calculated Statistics
  const activeCensusData = useMemo(() => {
    return getCensusMetrics(selectedBarangayId, INFANTA_BARANGAYS);
  }, [selectedBarangayId]);

  const people100Data = useMemo(() => {
    return calculate100PeopleDistribution(INFANTA_BARANGAYS);
  }, []);

  const historicalTimeline = useMemo(() => {
    return getHistoricalTimeline(selectedBarangayId, INFANTA_BARANGAYS);
  }, [selectedBarangayId]);

  // Calculate Net Growth for Footer
  const overallGrowth = useMemo(() => {
    if (historicalTimeline.length < 2) return null;
    const startPop = historicalTimeline[0].population;
    const endPop = historicalTimeline[historicalTimeline.length - 1].population;
    if (!startPop) return null;
    return (((endPop - startPop) / startPop) * 100).toFixed(1);
  }, [historicalTimeline]);

  return (
    <section className="space-y-6">
      {/* Header & Municipal Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-axis-titular-focus uppercase tracking-wide text-slate-900">
            Barangay Census & Population
          </h2>
          <p className="text-sm font-axis-navbar-focus tracking-wide text-slate-500">
            Select a barangay to analyze localized demographics, growth trends ({CENSUS_YEAR_START}–{CENSUS_YEAR_END}), and land ratios.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSelectedBarangayId('all')}
          className={`px-4 py-2 text-xs font-axis-navbar-focus uppercase tracking-wide transition-colors border cursor-pointer ${
            selectedBarangayId === 'all'
              ? 'bg-fantas-700 text-white border-fantas-700 shadow-xs'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
          }`}
        >
          View Municipal Totals
        </button>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Scrollable Selector List */}
        <div className="lg:col-span-4 bg-white border border-slate-200 p-4 flex flex-col h-[480px]">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Barangay, District, Captain..."
              value={barangaySearch}
              onChange={(e) => setBarangaySearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs md:text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-fantas-500 bg-slate-50/50"
            />
          </div>

          <span className="text-[11px] font-axis-navbar-focus uppercase tracking-wide text-slate-400 mb-2 px-1">
            {filteredBarangays.length} Barangays Listed
          </span>

          <div className="space-y-2.5 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-x-4 gap-y-1">
            {filteredBarangays.map((brgy) => {
              const isSelected = selectedBarangayId === brgy.id;
              return (
                <div
                  key={brgy.id}
                  onClick={() => setSelectedBarangayId(brgy.id)}
                  className={`p-3.5 border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'border-fantas-600 bg-fantas-50/40 ring-1 ring-fantas-600'
                      : 'border-slate-100 hover:border-slate-300 bg-white hover:bg-slate-50'
                  }`}
                >
                  <h4
                    className={`font-axis-navbar-focus uppercase tracking-wide text-sm ${
                      isSelected ? 'text-fantas-800 font-bold' : 'text-slate-800'
                    }`}
                  >
                    {brgy.name}
                  </h4>

                  <p className="text-xs text-slate-500 font-axis-subtitular-focus tracking-wide mt-0.5 truncate">
                    Capt. {brgy.captain} <span className="text-slate-400">({brgy.term} term)</span>
                  </p>

                  <div className="mt-2.5 flex items-center justify-between text-xs text-slate-600">
                    <span className="bg-slate-100/80 px-2 py-0.5 text-[10px] text-slate-600 font-axis-navbar-focus tracking-wide">
                      {brgy.district}
                    </span>
                    <div className="flex items-center gap-1">
                      <LazyIcon name="fa7-solid:people-group" className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-700 tracking-wide font-axis-sng-indlab-value text-sm">
                        {brgy.population.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Demographic KPIs + Charts */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Profile Summary & Historical Chart Container */}
          <div className="bg-white border border-slate-200 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between xs:justify-center items-center pb-4 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-lg font-axis-titular-focus text-slate-900 uppercase tracking-wide leading-snug text-center md:text-start lg:text-start pb-0.5">
                  {activeCensusData.title}
                </h3>
                <p className="text-sm font-axis-subtitular-focus text-slate-500 uppercase tracking-wide leading-snug text-center md:text-start lg:text-start">
                  {activeCensusData.subtitle}
                </p>
              </div>
            </div>

            {/* 4-Item KPI Metrics */}
            <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4 mb-4">
              <div className="flex flex-col bg-gradient-to-br from-slate-50 to-white p-4 border border-slate-200/80">
                <div className="flex items-start gap-2 text-fantas-700 mb-1">
                  <Users className="w-4 h-4 text-fantas-700" />
                  <span className="text-xs font-axis-navbar-focus uppercase tracking-wider">Population</span>
                </div>
                <span className="text-3xl text-fantas-700 font-axis-sng-indlab-value tracking-wide">
                  {activeCensusData.population.toLocaleString()}
                </span>
              </div>

              <div className="flex flex-col bg-gradient-to-br from-slate-50 to-white p-4 border border-slate-200/80">
                <div className="flex items-start gap-2 text-blue-700 mb-1">
                  <Home className="w-4 h-4 text-blue-700" />
                  <span className="text-xs font-axis-navbar-focus uppercase tracking-wider">Households</span>
                </div>
                <span className="text-3xl text-blue-700 font-axis-sng-indlab-value tracking-wide">
                  {activeCensusData.households.toLocaleString()}
                </span>
              </div>

              <div className="flex flex-col bg-gradient-to-br from-slate-50 to-white p-4 border border-slate-200/80">
                <div className="flex items-start gap-2 text-emerald-600 mb-1">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-axis-navbar-focus uppercase tracking-wider">5-Yr Growth*</span>
                </div>
                <span className="text-3xl font-axis-sng-indlab-value tracking-wide text-emerald-600 mb-1">
                  {activeCensusData.relativeGrowth}%
                </span>
              </div>

              <div className="flex flex-col bg-gradient-to-br from-slate-50 to-white p-4 border border-slate-200/80">
                <div className="flex items-start gap-2 text-purple-600 mb-1">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-axis-navbar-focus uppercase tracking-wider">Yearly Growth*</span>
                </div>
                <span className="text-3xl font-axis-sng-indlab-value text-purple-600">
                  {activeCensusData.cagr}%
                </span>
              </div>
            </div>

            <div className="font-axis-subtitular-focus text-xs uppercase tracking-wide text-slate-500">
              * Note: From 2020 to 2024.
            </div>

            {/* RECHARTS HISTORICAL CENSUS BAR CHART */}
            <div className="pt-5 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row justify-start items-center mb-3 gap-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-fantas-600" />
                  <h4 className="text-lg font-axis-titular-focus uppercase tracking-wide text-slate-900">
                    Historical Population
                  </h4>
                </div>
              </div>

              {/* Recharts Bar Chart Canvas */}
              <div className="w-full h-56 select-none">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={historicalTimeline}
                    margin={{ top: 22, right: 8, left: -22, bottom: 4 }}
                  >
                    {/* SVG Gradients for Bars */}
                    <defs>
                      <linearGradient id="censusLatestBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(85, 48, 1)" stopOpacity={1} />
                        <stop offset="100%" stopColor="rgb(85, 48, 1)" stopOpacity={0.8} />
                      </linearGradient>
                      <linearGradient id="censusHistoricalBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#cbd5e1" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

                    <XAxis
                      dataKey="year"
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                      tick={
                        <CustomCensusXAxisTick className="font-axis-subtitular-focus uppercase fill-slate-500" />
                      }
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={
                        <CustomCensusYAxisTick className="font-axis-navbar-focus fill-slate-400" />
                      }
                    />

                    <Tooltip
                      content={<CustomCensusTooltip scopeName={activeCensusData.name} />}
                      cursor={{ fill: 'rgba(241, 245, 249, 0.65)' }}
                    />

                    <Bar
                      dataKey="population"
                      name="Population"
                      radius={[0, 0, 0, 0]}
                      maxBarSize={48}
                    >
                      {/* Top Label for each bar */}
                      <LabelList
                        dataKey="population"
                        position="top"
                        content={<CustomBarTopLabel />}
                      />

                      {/* Highlight latest year differently */}
                      {historicalTimeline.map((_, index) => {
                        const isLatest = index === historicalTimeline.length - 1;
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              isLatest
                                ? 'url(#censusLatestBarGrad)'
                                : 'url(#censusHistoricalBarGrad)'
                            }
                            className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Footer Net Growth Info */}
              <div className="mt-3 flex flex-row justify-between items-center text-xs text-slate-500 gap-2">
                {overallGrowth !== null && (
                  <span className="text-emerald-600 font-axis-subtitular-focus uppercase tracking-wide bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <span className="font-axis-titular-focus">+{overallGrowth}%</span> Overall Growth
                  </span>
                )}
                <span className="text-xs font-axis-subtitular-focus uppercase tracking-wide text-slate-400 ml-auto">
                  Scope: <strong className="text-fantas-700 font-axis-navbar-focus uppercase">{activeCensusData.name}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* 2. Sub-Component: 100-People Isotype Section */}
          <Town100PeopleChart
            totalPopulation={people100Data.totalPop}
            slices={people100Data.slices}
            peopleGrid={people100Data.peopleGrid}
          />
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 🎨 RECHARTS SVG CUSTOM COMPONENT HELPERS
// ==========================================

// 1. Custom Value Label Positioned Above Each Bar
function CustomBarTopLabel(props: any) {
  const { x, y, width, value } = props;
  if (!value) return null;

  return (
    <text
      x={x + width / 2}
      y={y - 6}
      textAnchor="middle"
      className="text-[10px] sm:text-xs font-axis-sng-indlab-value uppercase fill-fantas-900 tracking-wide select-none"
    >
      {Number(value).toLocaleString()}
    </text>
  );
}

// 2. Custom X-Axis Year Tick
function CustomCensusXAxisTick({ x, y, payload, className }: any) {
  return (
    <text
      x={x}
      y={y + 12}
      textAnchor="middle"
      className={`text-[11px] sm:text-xs tracking-wide ${className}`}
    >
      {payload.value}
    </text>
  );
}

// 3. Custom Y-Axis Count Tick
function CustomCensusYAxisTick({ x, y, payload, className }: any) {
  return (
    <text
      x={x - 4}
      y={y + 3}
      textAnchor="end"
      className={`text-[10px] sm:text-[11px] ${className}`}
    >
      {Number(payload.value) >= 1000
        ? `${(Number(payload.value) / 1000).toFixed(0)}k`
        : payload.value}
    </text>
  );
}

// 4. Custom Hover / Touch Tooltip
function CustomCensusTooltip({ active, payload, label, scopeName }: any) {
  if (!active || !payload || !payload.length) return null;
  const popValue = payload[0].value;

  return (
    <div className="bg-fantas-950/95 text-white backdrop-blur-xs p-2.5 rounded-lg shadow-lg border border-fantas-900 text-xs space-y-1 min-w-[140px]">
      <div className="flex items-center justify-between border-b border-fantas-50/60 pb-1 font-axis-navbar-focus uppercase font-bold text-slate-200">
        <span>{label}</span>
        <span className="text-[10px] text-fantas-300 font-axis-subtitular-focus tracking-wider truncate max-w-[80px]">
          {scopeName}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 pt-0.5">
        <span className="text-[11px] font-axis-subtitular-focus uppercase text-slate-300">
          Population:
        </span>
        <span className="font-axis-sng-indlab-value text-amber-400 text-sm font-bold">
          {Number(popValue).toLocaleString()}
        </span>
      </div>
    </div>
  );
}
