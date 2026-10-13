// src/components/transparency/ElectoralContainer.tsx
import { useState, lazy, Suspense } from 'react';
import ParticipationTab from './crumbs/participation';
import ElectionResultsTab from './crumbs/electionres';

const Iconify = lazy(() =>
  import('@iconify/react').then(module => ({ default: module.Icon }))
);

interface LazyIconProps {
  name?: string;
  icon?: string;
  className?: string;
}

function LazyIcon({ name, icon, className }: LazyIconProps) {
  const iconIdentifier = icon || name || '';

  return (
    <Suspense fallback={<span className={`inline-block ${className || 'size-4'}`} />}>
      <Iconify icon={iconIdentifier} className={className} />
    </Suspense>
  );
}

type ActiveTab = 'turnout' | 'results';

export default function ElectoralContainer() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('turnout');

  return (
    <div className="space-y-6 text-start select-none">
      {/* 🧭 Top Tab Navigation Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 border border-slate-200">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('turnout')}
            className={`px-4 py-2 text-xs font-axis-navbar-focus uppercase tracking-wider transition-colors cursor-pointer border flex items-center gap-2 ${
              activeTab === 'turnout'
                ? 'bg-fantas-800 border-fantas-800 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Suspense fallback={<span className="size-4" />}>
              <LazyIcon name="lucide:users" className="h-4 w-4" />
            </Suspense>
            Voter Turnout & Participation
          </button>

          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 text-xs font-axis-navbar-focus uppercase tracking-wider transition-colors cursor-pointer border flex items-center gap-2 ${
              activeTab === 'results'
                ? 'bg-fantas-800 border-fantas-800 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Suspense fallback={<span className="size-4" />}>
              <LazyIcon name="lucide:vote" className="h-4 w-4" />
            </Suspense>
            Election Race Returns & Tandems
          </button>
        </div>

        <span className="text-[11px] font-axis-navbar-focus text-slate-400 uppercase tracking-wider">
          {activeTab === 'turnout'
            ? 'Infanta Clustered Precinct Turnout'
            : 'Infanta Mayoral & Vice-Mayoral Contests'}
        </span>
      </div>

      {/* 📦 Active Tab Content */}
      <div>
        {activeTab === 'turnout' ? (
          <ParticipationTab />
        ) : (
          <ElectionResultsTab />
        )}
      </div>
    </div>
  );
}
