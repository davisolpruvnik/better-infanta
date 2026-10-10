// src/pages/TransparencyPage.tsx
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { INFANTA_BARANGAYS } from '@/data/censusDataInfanta';
import InfrastructureTab from '@/components/transp/infra';
import ParticipationTab from '@/components/transp/participation';
import AuditsTab from '@/components/transp/audits';

export default function TransparencyPage() {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'infrastructure' | 'participation' | 'audits'>('infrastructure');

  // Quick summary aggregates
  const totalBarangays = useMemo(() => INFANTA_BARANGAYS.length, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* 1. HERO HEADER SECTION */}
      <div className="text-fantas-50 py-12 bg-fantas-900 md:py-16">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="max-w-2xl animate-fade-in">
            <h1 className="text-3xl md:text-5xl font-axis-wide-header mt-2 tracking-wide uppercase">
              {t('transparency.title', 'Public Accountability')}
            </h1>
            <p className="mt-4 text-fantas-100 tracking-wide font-axis-thin text-sm md:text-base leading-relaxed">
              {t(
                'transparency.subtitle',
                'Track public works progress, citizen voter engagement across all 36 barangays, and official Commission on Audit (COA) municipal financial audit findings.'
              )}
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 text-center">
            <div className="bg-white/10 border border-white/15 p-4">
              <span className="text-xs uppercase font-axis-wide-subheader tracking-wider text-fantas-200 block">
                Active Projects
              </span>
              <p className="text-4xl font-axis-sng-indlab-value tracking-wider mt-1.5">
                24
              </p>
              <p className="text-[11px] tracking-wide text-fantas-200 leading-snug mt-1.5">
                Infra & Public Works (2024–2026)
              </p>
            </div>

            <div className="bg-white/10 border border-white/15 p-4">
              <span className="text-xs uppercase font-axis-wide-subheader tracking-wider text-fantas-200 block">
                Average Turnout
              </span>
              <p className="text-4xl font-axis-sng-indlab-value tracking-wider mt-1.5">
                83.4%
              </p>
              <p className="text-[11px] text-fantas-200 tracking-wide leading-snug mt-1.5">
                Municipal Voter Participation
              </p>
            </div>

            <div className="bg-white/10 border border-white/15 p-4">
              <span className="text-xs uppercase font-axis-wide-subheader tracking-wider text-fantas-200 block">
                COA Audit Opinion
              </span>
              <p className="text-3xl md:text-4xl font-axis-sng-indlab-value tracking-wider mt-1.5 text-emerald-300">
                Qualified
              </p>
              <p className="text-[11px] text-fantas-200 tracking-wide leading-snug mt-1.5">
                Latest Annual Audit Report
              </p>
            </div>

            <div className="bg-white/10 border border-white/15 p-4">
              <span className="text-xs uppercase font-axis-wide-subheader tracking-wider text-fantas-200 block">
                Audited Barangays
              </span>
              <p className="text-4xl font-axis-sng-indlab-value tracking-wider mt-1.5">
                {totalBarangays}
              </p>
              <p className="text-[11px] text-fantas-200 tracking-wide leading-snug mt-1.5">
                Full Regulatory Coverage
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. STICKY TAB CONTROLS */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-20 shadow-sm">
        <div className="container mx-auto px-6 max-w-7xl flex gap-2 overflow-x-auto py-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('infrastructure')}
            className={`flex items-center gap-2 px-5 py-2.5 font-medium text-sm transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'infrastructure'
                ? 'bg-fantas-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Infrastructure Tracker
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('participation')}
            className={`flex items-center gap-2 px-5 py-2.5 font-medium text-sm transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'participation'
                ? 'bg-fantas-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Voter Participation by Barangay
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audits')}
            className={`flex items-center gap-2 px-5 py-2.5 font-medium text-sm transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'audits'
                ? 'bg-[#7c0902] text-white shadow-sm' // High-contrast audit accent
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            COA Annual Audits
          </button>
        </div>
      </div>

      {/* 3. TAB CONTENT BODY */}
      <main className="container mx-auto px-6 max-w-7xl py-8">
        {activeTab === 'infrastructure' && <InfrastructureTab />}
        {activeTab === 'participation' && <ParticipationTab />}
        {activeTab === 'audits' && <AuditsTab />}
      </main>
    </div>
  );
}
