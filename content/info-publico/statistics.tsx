import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  Building2,
  Wheat,
} from 'lucide-react';
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

          <button
            onClick={() => setActiveTab('local')}
            className={`flex items-center gap-2 px-5 py-2.5 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'local'
                ? 'bg-fantas-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Local Sectoral Stats
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

        {/* TAB 4: LOCAL SECTORAL LGU STATS */}
        {activeTab === 'local' && (
          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Local LGU Sectoral Statistics
              </h2>
              <p className="text-sm text-slate-500">
                Key metrics from Health, Agriculture, Business & Licensing, and Public Services.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-5 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-100 text-rose-600">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Health & Nutrition
                    </h3>
                    <p className="text-xs text-slate-500">
                      RHU & Barangay Health Stations
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">
                      Rural Health Units (RHU)
                    </span>
                    <span className="font-semibold text-slate-800">2</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">
                      Barangay Health Stations
                    </span>
                    <span className="font-semibold text-slate-800">6</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">
                      Child Immunization Rate
                    </span>
                    <span className="font-semibold text-emerald-600">
                      94.2%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-600">
                    <Wheat className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Agriculture & Fisheries
                    </h3>
                    <p className="text-xs text-slate-500">
                      Municipal Agriculture Office
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">
                      Agricultural Land
                    </span>
                    <span className="font-semibold text-slate-800">
                      1,240 ha
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">
                      Registered Farmers (RSBSA)
                    </span>
                    <span className="font-semibold text-slate-800">1,480</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">
                      Annual Rice Yield
                    </span>
                    <span className="font-semibold text-slate-800">
                      4.8 MT / ha
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-fantas-100 text-fantas-600">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Business & Commerce
                    </h3>
                    <p className="text-xs text-slate-500">BPLO Registry</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Registered MSMEs</span>
                    <span className="font-semibold text-slate-800">624</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">
                      New Permits (Current Year)
                    </span>
                    <span className="font-semibold text-slate-800">88</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">
                      e-BPLO Compliance
                    </span>
                    <span className="font-semibold text-emerald-600">
                      Active / 100%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
