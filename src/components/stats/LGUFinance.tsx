import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Building2,
  Percent,
  PieChart,
  Calendar,
  ChevronDown,
  Loader2,
  AlertCircle,
} from 'lucide-react';

import { BLGFRawRecord, getLocalRevenue, getNTADependency } from '@/types/blgf';
import { useBLGFParquet } from '@/hooks/useBLGFData';
import BanknoteSpendingTreemap from './crumbs/Tax1000PesosChart';
import NTALineChart from './crumbs/NTALineChart';
import NTABarChart from './crumbs/NTABarChart';
import BLGFTechnicalTable from './crumbs/BLGFTechnicalMesa';

interface BLGFFinanceTabProps {
  blgfDataset?: BLGFRawRecord[];
  targetLguName?: string; // Default: 'Infanta'
}

export default function BLGFFinanceTab({
  blgfDataset: propsData,
  targetLguName = 'Infanta',
}: BLGFFinanceTabProps) {
  const { data: hookData, loading, error } = useBLGFParquet();
  const rawDataset = propsData || hookData || [];

  // Available Years
  const availableYears = useMemo(() => {
    if (!rawDataset.length) return [];
    return Array.from(new Set(rawDataset.map((d) => d.YEAR))).sort((a, b) => b - a);
  }, [rawDataset]);

  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const activeYear = selectedYear ?? (availableYears[0] || 2024);

  // Active Record for the Target Municipality
  const targetRecord = useMemo(() => {
    if (!rawDataset.length) return null;
    return (
      rawDataset.find(
        (d) =>
          d.YEAR === activeYear &&
          d.LGU_NAME.toLowerCase() === targetLguName.toLowerCase()
      ) || rawDataset[0]
    );
  }, [rawDataset, activeYear, targetLguName]);

  // Loading State
  if (loading && rawDataset.length === 0) {
    return (
      <div className="bg-white border border-slate-200 p-12 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-fantas-700 animate-spin" />
        <p className="font-axis-navbar-focus uppercase tracking-wide text-xs text-slate-500">
          Loading & Parsing BLGF Parquet Data...
        </p>
      </div>
    );
  }

  // Error State
  if (error && rawDataset.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 flex items-start gap-3 text-red-700">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-axis-navbar-focus uppercase font-bold text-sm">Failed to Load BLGF Dataset</h4>
          <p className="text-xs font-axis-subtitular-focus mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (rawDataset.length === 0 || !targetRecord) return null;

  const targetNTADep = getNTADependency(targetRecord);
  const targetLocalRev = getLocalRevenue(targetRecord);

  return (
    <section className="relative space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-axis-titular-focus uppercase tracking-wide text-slate-900">
              {targetRecord.LGU_NAME} Public Finance & NTA Reliance
            </h2>
            <span className="px-2 py-0.5 text-[12px] text-center font-axis-navbar-focus uppercase bg-fantas-50 text-fantas-800 border border-fantas-200 leading-tight">
              FY {activeYear}
            </span>
          </div>
          <p className="text-sm font-axis-navbar-focus tracking-wide text-slate-500 mt-0.5">
            Official BLGF Statement of Receipts & Expenditures (SRE) vs. Provincial Benchmarks
          </p>
        </div>
      </div>

      {/* 4-Item KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="flex flex-col bg-white p-4 border border-slate-200">
          <div className="flex items-center gap-1.5 text-fantas-700 mb-1">
            <Percent className="w-4 h-4" />
            <span className="text-xs font-axis-navbar-focus uppercase tracking-wider">NTA Reliance</span>
          </div>
          <span className="text-2xl sm:text-3xl text-fantas-800 font-axis-sng-indlab-value">
            {targetNTADep.toFixed(1)}%
          </span>
          <span className="text-[10px] font-axis-subtitular-focus text-slate-400 mt-1 uppercase tracking-wide">
            Share of Operating Income
          </span>
        </div>

        <div className="flex flex-col bg-white p-4 border border-slate-200">
          <div className="flex items-center gap-1.5 text-blue-700 mb-1">
            <Wallet className="w-4 h-4" />
            <span className="text-xs font-axis-navbar-focus uppercase tracking-wider">Total Income</span>
          </div>
          <span className="text-2xl sm:text-3xl text-blue-900 font-axis-sng-indlab-value">
            ₱{(targetRecord.TOTAL_OPERATING_INCOME / 1_000_000).toFixed(1)}M
          </span>
          <span className="text-[10px] font-axis-subtitular-focus text-slate-400 mt-1 uppercase tracking-wide">
            FY {activeYear} Receipts
          </span>
        </div>

        <div className="flex flex-col bg-white p-4 border border-slate-200">
          <div className="flex items-center gap-1.5 text-emerald-700 mb-1">
            <Building2 className="w-4 h-4" />
            <span className="text-xs font-axis-navbar-focus uppercase tracking-wider">Local Sources</span>
          </div>
          <span className="text-2xl sm:text-3xl text-emerald-800 font-axis-sng-indlab-value">
            ₱{(targetLocalRev / 1_000_000).toFixed(1)}M
          </span>
          <span className="text-[10px] font-axis-subtitular-focus text-slate-400 mt-1 uppercase tracking-wide">
            RPT, Biz Tax & Fees
          </span>
        </div>

        <div className="flex flex-col bg-white p-4 border border-slate-200">
          <div className="flex items-center gap-1.5 text-purple-700 mb-1">
            <PieChart className="w-4 h-4" />
            <span className="text-xs font-axis-navbar-focus uppercase tracking-wider">NTA Share</span>
          </div>
          <span className="text-2xl sm:text-3xl text-purple-900 font-axis-sng-indlab-value">
            ₱{(targetRecord.REV_NTA_IRA / 1_000_000).toFixed(1)}M
          </span>
          <span className="text-[10px] font-axis-subtitular-focus text-slate-400 mt-1 uppercase tracking-wide">
            National Allotment
          </span>
        </div>
      </div>

      {/* 1. ₱1,000 Bill Spending Morphing Treemap */}
      <BanknoteSpendingTreemap record={targetRecord} />

      {/* 2. Multi-Year Trajectory Line Chart */}
      <NTALineChart
        dataset={rawDataset}
        selectedLguName={targetRecord.LGU_NAME}
      />

      {/* 3. Cross-Municipal Bar Chart Comparison (Key 10 Economic Hubs) */}
      <NTABarChart
        dataset={rawDataset}
        targetLguName={targetRecord.LGU_NAME}
        year={activeYear}
      />

      {/* 4. Infanta Historical SRE Timeseries Table (1992–2025) */}
      <BLGFTechnicalTable
        dataset={rawDataset}
        targetLguName={targetRecord.LGU_NAME}
        selectedYear={activeYear}
      />

      {/* ============================================================ */}
      {/* 🌟 FLOATING FISCAL YEAR SELECTOR (Visible on Scroll)          */}
      {/* ============================================================ */}
      <aside aria-label="Fiscal Year Selector" className="fixed bottom-6 right-6 z-40">
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-full border border-slate-300/80 shadow-xl ring-1 ring-slate-900/5 transition-all duration-200 hover:shadow-2xl hover:border-slate-400">
          <div className="flex items-center gap-1.5 text-fantas-800 shrink-0">
            <Calendar className="w-4 h-4 text-fantas-700" />
            <span className="text-[11px] font-axis-navbar-focus uppercase tracking-wider font-bold hidden xs:inline">
              Fiscal Year:
            </span>
          </div>

          <div className="relative">
            <select
              value={activeYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="appearance-none bg-slate-100/90 hover:bg-slate-200/80 text-slate-900 text-xs font-axis-navbar-focus uppercase font-bold pl-3 pr-7 py-1 rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-fantas-600 border border-slate-200"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  FY {year}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </aside>
    </section>
  );
}
