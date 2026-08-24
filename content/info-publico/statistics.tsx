import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import BarangayCensusTab from '@/components/stats/BarangayCensusTab';
import { INFANTA_BARANGAYS } from '@/data/censusDataInfanta';
import CmciAnalyticsSection from '@/components/stats/crumbs/CmciAnalytics';
import BLGFFinanceTab from '@/components/stats/LGUFinance';
import { useBLGFParquet } from '@/hooks/useBLGFData';

// BLGF records (1992 - 2026)
const MOCK_BLGF_YEARS = Array.from({ length: 2026 - 1992 + 1 }, (_, i) => {
  const year = 1992 + i;
  return {
    year,
    iraNta: (15 + i * 8.5).toFixed(2),
    locallySourced: (5 + i * 4.2).toFixed(2),
    totalRevenue: (20 + i * 12.7).toFixed(2),
    totalExpenditure: (18 + i * 11.9).toFixed(2),
    dependencyRate: Math.max(40, 85 - i * 0.8).toFixed(1) + '%',
  };
}).reverse();

export default function StatsPage() {
  const { t } = useTranslation();

  // 1. Added 'cmci' to the activeTab state union
  const [activeTab, setActiveTab] = useState<'census' | 'cmci' | 'blgf' | 'local'>('census');
  const [selectedBlgfYear, setSelectedBlgfYear] = useState(2026);

  const activeBlgfRecord = useMemo(() => {
    return MOCK_BLGF_YEARS.find((b) => b.year === Number(selectedBlgfYear)) || MOCK_BLGF_YEARS[0];
  }, [selectedBlgfYear]);

  const { data: blgfDataset, loading: financeLoading } = useBLGFParquet();

    // 2. Dynamically extract the latest available financial record for Infanta
    const latestFinance = useMemo(() => {
      if (!blgfDataset || blgfDataset.length === 0) return null;

      const infantaRows = blgfDataset
        .filter((d) => d.LGU_NAME.toLowerCase().includes('infanta'))
        .sort((a, b) => b.YEAR - a.YEAR);

      return infantaRows[0] || null;
    }, [blgfDataset]);

    // Helper to format currency (e.g. ₱451.8M or ₱451.8 million)
    const formattedBudget = useMemo(() => {
      if (!latestFinance) return '₱451.8M';
      const amount = latestFinance.TOTAL_OPERATING_INCOME;
      if (amount >= 1_000_000_000) {
        return `₱${(amount / 1_000_000_000).toFixed(2)}B`;
      }
      return `₱${(amount / 1_000_000).toFixed(1)}M`;
    }, [latestFinance]);

  const totalPop = useMemo(() => {
    return INFANTA_BARANGAYS.reduce((acc, b) => acc + b.population, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* 1. HERO HEADER SECTION */}
      <div className="text-fantas-50 py-12 bg-fantas-900 md:py-16">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="max-w-2xl animate-fade-in">
            <h1 className="text-3xl md:text-5xl font-axis-sng-indlab-value mt-2 tracking-wide uppercase">
              {t('stats.title', 'Infanta by Numbers')}
            </h1>
            <p className="mt-4 text-fantas-100 text-sm md:text-base leading-relaxed">
              {t(
                'stats.subtitle',
                'Explore real-time demographic census, DTI competitiveness metrics, 1992–2026 BLGF financial records, and sectoral LGU public data.'
              )}
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 text-center">
            <div className="bg-white/10 border border-white/15 p-4">
              <div className="flex justify-center items-center gap-3">
                <span className="text-sm uppercase font-axis-navbar-focus tracking-wider text-fantas-200">
                  Total Population
                </span>
              </div>
              <p className="text-4xl font-axis-sng-indlab-value tracking-wide mt-1">
                {totalPop.toLocaleString()}
              </p>
              <p className="text-[11px] tracking-wide text-fantas-200 leading-snug mt-1.5">
                Official Census Projection
              </p>
            </div>

            <div className="bg-white/10 border border-white/15 p-4">
              <div className="flex justify-center items-center gap-3">
                <span className="text-sm uppercase font-axis-navbar-focus tracking-wider text-fantas-200">
                  Barangays
                </span>
              </div>
              <p className="text-4xl font-axis-sng-indlab-value tracking-wide mt-1">
                {INFANTA_BARANGAYS.length}
              </p>
              <p className="text-[11px] text-fantas-200 tracking-wide leading-snug mt-1.5">
                100% Monitored & Profiled
              </p>
            </div>

            <div className="bg-white/10 border border-white/15 p-4">
              <div className="flex justify-center items-center gap-3">
                <span className="text-sm uppercase font-axis-navbar-focus tracking-wider text-fantas-200">
                  {latestFinance ? `FY ${latestFinance.YEAR} Total Annual Revenue` : 'Annual Budget'}
                </span>
              </div>
              <p className="text-4xl font-axis-sng-indlab-value tracking-wide mt-1">
                {formattedBudget}
              </p>
              <p className="text-[11px] text-fantas-200 tracking-wide leading-snug mt-1.5">
                {latestFinance
                            ? `NTA (${((latestFinance.REV_NTA_IRA / latestFinance.TOTAL_OPERATING_INCOME) * 100).toFixed(0)}%) + Local Sources`
                            : 'NTA + Local Revenues'}
              </p>
            </div>

            <div className="bg-white/10 border border-white/15 p-4">
              <div className="flex justify-center items-center gap-3">
                <span className="text-sm uppercase font-axis-navbar-focus tracking-wider text-fantas-200">
                  Income Class
                </span>
              </div>
              <p className="text-4xl font-axis-sng-indlab-value tracking-wide mt-1">
                1st Class
              </p>
              <p className="text-[11px] text-fantas-200 tracking-wide leading-snug mt-1.5">
                Municipality Category
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TAB CONTROLS */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-20 shadow-sm">
        <div className="container mx-auto px-6 max-w-7xl flex gap-2 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab('census')}
            className={`flex items-center gap-2 px-5 py-2.5 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'census'
                ? 'bg-fantas-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Barangay Census
          </button>

          {/* NEW: CMCI TAB BUTTON */}
          <button
            onClick={() => setActiveTab('cmci')}
            className={`flex items-center gap-2 px-5 py-2.5 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'cmci'
                ? 'bg-fantas-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            CMCI Competitiveness
          </button>

          <button
            onClick={() => setActiveTab('blgf')}
            className={`flex items-center gap-2 px-5 py-2.5 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'blgf'
                ? 'bg-fantas-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            BLGF Financials (1992–2026)
          </button>
        </div>
      </div>

      {/* 3. MAIN CONTENT BODY */}
      <main className="container mx-auto px-6 max-w-7xl py-8">
        {/* TAB 1: CENSUS COMPONENT */}
        {activeTab === 'census' && <BarangayCensusTab />}

        {/* TAB 2: CMCI COMPETITIVENESS (STEP LINE & STACKED SCORES) */}
        {activeTab === 'cmci' && <CmciAnalyticsSection />}

        {/* TAB 3: BLGF FINANCIAL STATS (1992 - 2026) */}
        {activeTab === 'blgf' && <BLGFFinanceTab />}
      </main>
    </div>
  );
}
