import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import BarangayCensusTab from '@/components/stats/BarangayCensusTab';
import { INFANTA_BARANGAYS } from '@/data/censusDataInfanta';
import CmciAnalyticsSection from '@/components/stats/crumbs/CmciAnalytics';
import BLGFFinanceTab from '@/components/stats/LGUFinance';
import { useBLGFParquet } from '@/hooks/useBLGFData';
import SolarBulletinTab from '@/components/stats/SolarBulletinTab';

export default function StatsPage() {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'census' | 'cmci' | 'blgf' | 'solar'>('census');

  const { data: blgfDataset } = useBLGFParquet();

  // Dynamically extract the latest available financial record for Infanta
  const latestFinance = useMemo(() => {
    if (!blgfDataset || blgfDataset.length === 0) return null;

    const infantaRows = blgfDataset
      .filter((d) => d.LGU_NAME.toLowerCase().includes('infanta'))
      .sort((a, b) => b.YEAR - a.YEAR);

    return infantaRows[0] || null;
  }, [blgfDataset]);

  // Helper to format currency (e.g. ₱451.8M or ₱1.20B)
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
            <h1 className="text-3xl md:text-5xl font-axis-wide-header mt-2 tracking-wide uppercase">
              {t('stats.title', 'Infanta by Numbers')}
            </h1>
            <p className="mt-4 text-fantas-100 tracking-wide font-axis-thin text-sm md:text-base leading-relaxed">
              {t(
                'stats.subtitle',
                'Explore real-time demographic census, DTI competitiveness metrics, BLGF financial records, and daily municipal solar yield models.'
              )}
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 text-center">
            <div className="bg-white/10 border border-white/15 p-4">
              <span className="text-xs uppercase font-axis-wide-subheader tracking-wider text-fantas-200 block">
                Total Population
              </span>
              <p className="text-4xl font-axis-sng-indlab-value tracking-wider mt-1.5">
                {totalPop.toLocaleString()}
              </p>
              <p className="text-[11px] tracking-wide text-fantas-200 leading-snug mt-1.5">
                Official Census Projection
              </p>
            </div>

            <div className="bg-white/10 border border-white/15 p-4">
              <span className="text-xs uppercase font-axis-wide-subheader tracking-wider text-fantas-200 block">
                Barangays
              </span>
              <p className="text-4xl font-axis-sng-indlab-value tracking-wider mt-1.5">
                {INFANTA_BARANGAYS.length}
              </p>
              <p className="text-[11px] text-fantas-200 tracking-wide leading-snug mt-1.5">
                100% Monitored & Profiled
              </p>
            </div>

            <div className="bg-white/10 border border-white/15 p-4">
              <span className="text-xs uppercase font-axis-wide-subheader tracking-wider text-fantas-200 block">
                {latestFinance ? `FY ${latestFinance.YEAR} Operating Income` : 'Annual Budget'}
              </span>
              <p className="text-4xl font-axis-sng-indlab-value tracking-wider mt-1.5">
                {formattedBudget}
              </p>
              <p className="text-[11px] text-fantas-200 tracking-wide leading-snug mt-1.5">
                National Tax + Local Revenues
              </p>
            </div>

            <div className="bg-white/10 border border-white/15 p-4">
              <span className="text-xs uppercase font-axis-wide-subheader tracking-wider text-fantas-200 block">
                Income Class
              </span>
              <p className="text-4xl font-axis-sng-indlab-value tracking-wider mt-1.5">
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
        <div className="container mx-auto px-6 max-w-7xl flex gap-2 overflow-x-auto py-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('census')}
            className={`flex items-center gap-2 px-5 py-2.5 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'census'
                ? 'bg-fantas-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Barangay Census
          </button>

          <button
            type="button"
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
            type="button"
            onClick={() => setActiveTab('blgf')}
            className={`flex items-center gap-2 px-5 py-2.5 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'blgf'
                ? 'bg-fantas-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            BLGF Financials (1992–2026)
          </button>

          {/* SOLAR TAB BUTTON */}
          <button
            type="button"
            onClick={() => setActiveTab('solar')}
            className={`flex items-center gap-2 px-5 py-2.5 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'solar'
                ? 'bg-[#7c0902] text-white shadow-sm' // Uses Dugo red accent when active
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            Solar Potential Bulletin
          </button>
        </div>
      </div>

      {/* 3. MAIN CONTENT BODY */}
      <main className="container mx-auto px-6 max-w-7xl py-8">
        {activeTab === 'census' && <BarangayCensusTab />}
        {activeTab === 'cmci' && <CmciAnalyticsSection />}
        {activeTab === 'blgf' && <BLGFFinanceTab />}
        {activeTab === 'solar' && <SolarBulletinTab />}
      </main>
    </div>
  );
}
