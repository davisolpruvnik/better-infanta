import { useState, useMemo, useCallback } from 'react';
import precinctCartoJson from '@/data/geog/turnout-map/infanta_hex_precincts.json';
import PrecinctSheet from './precinctSheet';
import {
  CartogramStage,
  BarangaySearchBar,
  useCartogramPanZoom,
  useGeoJsonProjection,
  LazyIcon,
  normalizeName,
} from './cartogramStage';

export type ResultsMode = 'tandem' | 'mayor' | 'vice_mayor';

export interface PrecinctResultProps {
  barangay: string;
  precinct_id: string;
  registered_voters: number;
  actual_voters: number;
  turnout_pct: number;
  mayor_winner?: string;
  vice_mayor_winner?: string;
  mayor_vice_winners?: string;
  diverging_mayor_pct?: number;
  diverging_vice_mayor_pct?: number;
  winner_mayor_pct?: number;
  winner_vice_mayor_pct?: number;
}

export interface TandemSegment {
  tandem: string;
  count: number;
  color: string;
}

export interface BarangayResultSummary {
  barangay: string;
  totalPrecincts: number;
  leadTandem: string;
  tandemCount: number;
  tandemSegments: TandemSegment[];
  leadMayor: string;
  mayorLeadPct: number;
  leadVM: string;
  vmLeadPct: number;
  splitTicketCount: number;
}

const TANDEM_COLORS: Record<string, string> = {
  'Ruanto-America (Mannie)': '#7c3aed',
  'Escueta-America (Grace)': '#10b981',
  'Ruanto-America (Grace)': '#f59e0b',
  'Escueta-America (Mannie)': '#06b6d4',
};

function getTandemColor(winnerStr?: string): string {
  if (!winnerStr || winnerStr === '—') return '#cbd5e1';
  if (winnerStr in TANDEM_COLORS) return TANDEM_COLORS[winnerStr];
  const s = winnerStr.toLowerCase();
  if (s.includes('ruanto') && s.includes('mannie')) return '#7c3aed';
  if (s.includes('escueta') && s.includes('grace')) return '#10b981';
  if (s.includes('ruanto') && s.includes('grace')) return '#f59e0b';
  if (s.includes('escueta') && s.includes('mannie')) return '#06b6d4';
  return '#94a3b8';
}

function getDivergingColor(pct?: number, cutoffs?: { c1: number; c2: number; c3: number }): string {
  if (pct === undefined || isNaN(pct) || pct <= 0) return '#cbd5e1';
  const c = cutoffs || { c1: 54, c2: 59, c3: 65 };
  if (pct >= c.c2) return '#6d28d9';
  if (pct >= c.c1) return '#8b5cf6';
  if (pct > 50) return '#c4b5fd';
  if (pct === 50) return '#f1f5f9';
  if (pct > 100 - c.c1) return '#6ee7b7';
  if (pct > 100 - c.c2) return '#10b981';
  return '#047857';
}

export default function ElectionResultsTab() {
  const geoJson = precinctCartoJson as any;

  const [mode, setMode] = useState<ResultsMode>('tandem');
  const [selectedFeature, setSelectedFeature] = useState<PrecinctResultProps | null>(null);
  const [hoveredPrecinctId, setHoveredPrecinctId] = useState<string | null>(null);
  const [hoveredBrgy, setHoveredBrgy] = useState<string | null>(null);

  const {
    transform,
    setTransform,
    isPanning,
    svgRef,
    hasMoved,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleZoom,
    handleResetTransform,
  } = useCartogramPanZoom();

  // 🧮 1-line coordinate projection hook
  const { projectedFeatures, zoomToBarangay } = useGeoJsonProjection<PrecinctResultProps>(
    geoJson,
    useCallback((p: any, idx: number) => ({
      barangay: p.barangay || `Barangay ${idx + 1}`,
      precinct_id: String(p.precinct_id || `P-${idx + 1}`),
      registered_voters: Number(p.registered_voters) || 0,
      actual_voters: Number(p.actual_voters) || 0,
      turnout_pct: Number(p.turnout_pct) || 0,
      mayor_winner: p.mayor_winner,
      vice_mayor_winner: p.vice_mayor_winner,
      mayor_vice_winners: p.mayor_vice_winners,
      diverging_mayor_pct: p.diverging_mayor_pct !== undefined ? Number(p.diverging_mayor_pct) : undefined,
      diverging_vice_mayor_pct: p.diverging_vice_mayor_pct !== undefined ? Number(p.diverging_vice_mayor_pct) : undefined,
      winner_mayor_pct: p.winner_mayor_pct !== undefined ? Number(p.winner_mayor_pct) : undefined,
      winner_vice_mayor_pct: p.winner_vice_mayor_pct !== undefined ? Number(p.winner_vice_mayor_pct) : undefined,
    }), [])
  );

  const hasElectionData = useMemo(() => {
    if (!geoJson?.features || geoJson.features.length === 0) return false;
    return geoJson.features.some((f: any) => {
      const p = f.properties || {};
      return p.mayor_winner || p.mayor_vice_winners || p.diverging_mayor_pct !== undefined;
    });
  }, [geoJson]);

  const scaleMetrics = useMemo(() => {
    if (!geoJson?.features) return { baseMax: 65, c1: 55, c2: 60 };
    const targetKey = mode === 'vice_mayor' ? 'diverging_vice_mayor_pct' : 'diverging_mayor_pct';
    const values = geoJson.features
      .map((f: any) => Number(f.properties?.[targetKey]))
      .filter((v: number) => !isNaN(v) && v > 0);

    if (values.length === 0) return { baseMax: 65, c1: 55, c2: 60 };
    const peaks = values.map((v: number) => Math.max(v, 100 - v));
    const highest = Math.max(...peaks);

    const baseMax = Math.max(Math.round(highest / 5) * 5, 55);
    const step = (baseMax - 50) / 3;
    const c1 = Number((50 + step).toFixed(1));
    const c2 = Number((50 + step * 2).toFixed(1));

    return { baseMax, c1, c2 };
  }, [geoJson, mode]);

  const getprecinctFillColor = useCallback((props: PrecinctResultProps) => {
    if (mode === 'tandem') return getTandemColor(props.mayor_vice_winners);
    if (mode === 'mayor') return getDivergingColor(props.diverging_mayor_pct, { c1: scaleMetrics.c1, c2: scaleMetrics.c2, c3: scaleMetrics.baseMax });
    return getDivergingColor(props.diverging_vice_mayor_pct, { c1: scaleMetrics.c1, c2: scaleMetrics.c2, c3: scaleMetrics.baseMax });
  }, [mode, scaleMetrics]);

  const barangaySummaries = useMemo(() => {
    const map = new Map<string, {
      total: number;
      tandems: Record<string, number>;
      mayors: Record<string, { count: number; totalPct: number }>;
      vms: Record<string, { count: number; totalPct: number }>;
      splitCount: number;
    }>();

    geoJson.features.forEach((f: any) => {
      const p = f.properties || {};
      const brgy = p.barangay;
      if (!brgy) return;

      if (!map.has(brgy)) {
        map.set(brgy, { total: 0, tandems: {}, mayors: {}, vms: {}, splitCount: 0 });
      }
      const item = map.get(brgy)!;
      item.total += 1;

      const tan = p.mayor_vice_winners || p.MAYOR_VICE_WINNERS;
      const m = p.mayor_winner || p.MAYOR_WINNER;
      const vm = p.vice_mayor_winner || p.VICE_MAYOR_WINNER;

      const mPct = p.diverging_mayor_pct !== undefined
        ? (p.diverging_mayor_pct >= 50 ? Number(p.diverging_mayor_pct) : 100 - Number(p.diverging_mayor_pct))
        : (Number(p.winner_mayor_pct) || 50);

      const vmPct = p.diverging_vice_mayor_pct !== undefined
        ? (p.diverging_vice_mayor_pct >= 50 ? Number(p.diverging_vice_mayor_pct) : 100 - Number(p.diverging_vice_mayor_pct))
        : (Number(p.winner_vice_mayor_pct) || 50);

      if (tan) {
        item.tandems[tan] = (item.tandems[tan] || 0) + 1;
        if (tan.includes('Ruanto-America (Grace)') || tan.includes('Escueta-America (Mannie)')) {
          item.splitCount += 1;
        }
      }

      if (m) {
        if (!item.mayors[m]) item.mayors[m] = { count: 0, totalPct: 0 };
        item.mayors[m].count += 1;
        item.mayors[m].totalPct += mPct;
      }

      if (vm) {
        if (!item.vms[vm]) item.vms[vm] = { count: 0, totalPct: 0 };
        item.vms[vm].count += 1;
        item.vms[vm].totalPct += vmPct;
      }
    });

    const summaries: BarangayResultSummary[] = [];
    map.forEach((item, brgy) => {
      let topTandem = '—', maxTCount = 0;
      for (const [k, count] of Object.entries(item.tandems)) {
        if (count > maxTCount) { maxTCount = count; topTandem = k; }
      }

      const tandemSegments: TandemSegment[] = Object.entries(item.tandems)
        .sort((a, b) => b[1] - a[1])
        .map(([tandem, count]) => ({
          tandem,
          count,
          color: getTandemColor(tandem),
        }));

      let topMayor = '—', maxMCount = 0, mAvgPct = 0;
      for (const [k, data] of Object.entries(item.mayors)) {
        if (data.count > maxMCount) {
          maxMCount = data.count;
          topMayor = k;
          mAvgPct = Number((data.totalPct / data.count).toFixed(1));
        }
      }

      let topVM = '—', maxVMCount = 0, vmAvgPct = 0;
      for (const [k, data] of Object.entries(item.vms)) {
        if (data.count > maxVMCount) {
          maxVMCount = data.count;
          topVM = k;
          vmAvgPct = Number((data.totalPct / data.count).toFixed(1));
        }
      }

      summaries.push({
        barangay: brgy,
        totalPrecincts: item.total,
        leadTandem: topTandem,
        tandemCount: maxTCount,
        tandemSegments,
        leadMayor: topMayor,
        mayorLeadPct: mAvgPct,
        leadVM: topVM,
        vmLeadPct: vmAvgPct,
        splitTicketCount: item.splitCount,
      });
    });

    return summaries.sort((a, b) => a.barangay.localeCompare(b.barangay));
  }, [geoJson]);

  const overallStats = useMemo(() => {
    let ruantoWins = 0, escuetaWins = 0;
    let mannieWins = 0, graceWins = 0;
    let straightTickets = 0, splitTickets = 0;
    const total = geoJson.features?.length || 0;

    geoJson.features?.forEach((f: any) => {
      const p = f.properties || {};
      if (p.mayor_winner === 'Ruanto') ruantoWins++;
      else if (p.mayor_winner === 'Escueta') escuetaWins++;

      if (p.vice_mayor_winner?.includes('Mannie')) mannieWins++;
      else if (p.vice_mayor_winner?.includes('Grace')) graceWins++;

      const tan = p.mayor_vice_winners || '';
      if (tan.includes('Ruanto-America (Mannie)') || tan.includes('Escueta-America (Grace)')) {
        straightTickets++;
      } else if (tan) {
        splitTickets++;
      }
    });

    return {
      total,
      ruantoWins,
      escuetaWins,
      mannieWins,
      graceWins,
      straightTickets,
      splitTickets,
      splitPct: total > 0 ? ((splitTickets / total) * 100).toFixed(1) : '0',
    };
  }, [geoJson]);

  const handleSelectPrecinct = (props: PrecinctResultProps) => {
    if (hasMoved()) return;
    setSelectedFeature(props);
    zoomToBarangay(props.barangay, setTransform);
  };

  const handleResetView = () => {
    setSelectedFeature(null);
    setHoveredBrgy(null);
    setHoveredPrecinctId(null);
    handleResetTransform();
  };

  const selectedDetails = useMemo(() => {
    if (!selectedFeature) return null;
    const mDiverge = selectedFeature.diverging_mayor_pct ?? 50;
    const ruantoPct = Number(mDiverge.toFixed(1));
    const escuetaPct = Number((100 - mDiverge).toFixed(1));
    const mayorMargin = Number(Math.abs(ruantoPct - escuetaPct).toFixed(1));

    const vmDiverge = selectedFeature.diverging_vice_mayor_pct ?? 50;
    const manniePct = Number(vmDiverge.toFixed(1));
    const gracePct = Number((100 - vmDiverge).toFixed(1));
    const vmMargin = Number(Math.abs(manniePct - gracePct).toFixed(1));

    return { ruantoPct, escuetaPct, mayorMargin, manniePct, gracePct, vmMargin };
  }, [selectedFeature]);

  return (
    <div className="space-y-8 animate-fade-in text-start select-none">
      {!hasElectionData && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LazyIcon name="lucide:alert-triangle" className="size-4 shrink-0 text-amber-600" />
            <span>
              <strong>Notice:</strong> Your GeoJSON file currently lacks election columns. Please run the Python export step with <code className="font-axis-number-focus bg-amber-100 px-1 py-0.5">mayor_winner</code> and <code className="font-axis-number-focus bg-amber-100 px-1 py-0.5">diverging_mayor_pct</code>.
            </span>
          </div>
        </div>
      )}

      {/* KPI TILES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-start">
        <div className="flex flex-col justify-center bg-white border border-slate-200 p-4">
          <span className="text-xs uppercase text-slate-400 tracking-wider font-axis-navbar-focus">
            Mayoral Lead (Ruanto)
          </span>
          <span className="text-3xl font-axis-sng-indlab-value text-purple-800 tracking-wide mt-1">
            {overallStats.ruantoWins} <span className="text-xs font-axis-subtitular-focus uppercase tracking-wider text-slate-500">precincts</span>
          </span>
          <span className="text-[11px] text-slate-400 font-axis-subtitular-focus mt-0.5">
            Escueta: {overallStats.escuetaWins} precincts
          </span>
        </div>

        <div className="flex flex-col justify-center bg-white border border-slate-200 p-4">
          <span className="text-xs uppercase text-slate-400 tracking-wider font-axis-navbar-focus">
            Vice Mayoral Lead
          </span>
          <span className="text-3xl font-axis-sng-indlab-value text-slate-900 tracking-wide mt-1">
            {overallStats.mannieWins >= overallStats.graceWins ? overallStats.mannieWins : overallStats.graceWins}{' '}
            <span className="text-xs font-axis-subtitular-focus uppercase tracking-wider text-slate-500">
              {overallStats.mannieWins >= overallStats.graceWins ? 'Mannie' : 'Grace'}
            </span>
          </span>
          <span className="text-[11px] text-slate-400 font-axis-subtitular-focus mt-0.5">
            {overallStats.mannieWins >= overallStats.graceWins ? `Grace: ${overallStats.graceWins} wins` : `Mannie: ${overallStats.mannieWins} wins`}
          </span>
        </div>

        <div className="flex flex-col justify-center bg-white border border-slate-200 p-4">
          <span className="text-xs uppercase text-slate-400 tracking-wider font-axis-navbar-focus">
            Straight-Ticket Rate
          </span>
          <span className="text-3xl font-axis-sng-indlab-value text-emerald-700 mt-1">
            {overallStats.straightTickets}{' '}
            <span className="text-xs font-axis-subtitular-focus uppercase tracking-wider text-slate-500">
              ({overallStats.total > 0 ? ((overallStats.straightTickets / overallStats.total) * 100).toFixed(0) : 0}%)
            </span>
          </span>
          <span className="text-[11px] text-slate-400 font-axis-subtitular-focus mt-0.5">
            Pure party slate dominance
          </span>
        </div>

        <div className="flex flex-col justify-center bg-white border border-slate-200 p-4">
          <span className="text-xs uppercase text-slate-400 tracking-wider font-axis-navbar-focus">
            Split-Ticket Precincts
          </span>
          <span className="text-3xl font-axis-sng-indlab-value text-amber-600 mt-1">
            {overallStats.splitTickets}{' '}
            <span className="text-xs font-axis-subtitular-focus uppercase tracking-wider text-slate-500">
              ({overallStats.splitPct}%)
            </span>
          </span>
          <span className="text-[11px] text-slate-400 font-axis-subtitular-focus mt-0.5">
            Cross-slate split voting
          </span>
        </div>
      </div>

      {/* HEADER & REUSABLE SEARCH */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-axis-wide-header uppercase tracking-wide text-slate-900">
            Electoral Race Returns
          </h2>
          <p className="text-md font-axis-subtitular-focus tracking-wide text-slate-500">
            Explore Mayoral, Vice-Mayoral, and straight vs. split-ticket tandem results by precinct.
          </p>
        </div>

        <BarangaySearchBar
          items={barangaySummaries}
          placeholder="Search barangay results..."
          getBarangayName={b => b.barangay}
          renderSubtitle={b => (
            <span className="text-slate-500 font-axis-number-focus text-[11px]">
              {b.leadTandem} ({b.tandemCount}/{b.totalPrecincts})
            </span>
          )}
          onSelect={bName => {
            zoomToBarangay(bName, setTransform);
            const firstTile = projectedFeatures.find(h => normalizeName(h.props.barangay) === normalizeName(bName));
            if (firstTile) setSelectedFeature(firstTile.props);
          }}
        />
      </div>

      {/* CONTEST TOGGLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-axis-navbar-focus uppercase tracking-wider text-slate-400">Contest View:</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'tandem', label: 'Tandem Outcomes' },
              { id: 'mayor', label: 'Mayoral Contest' },
              { id: 'vice_mayor', label: 'Vice Mayoral Contest' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setMode(tab.id as ResultsMode)}
                className={`px-3 py-1.5 text-[11px] font-axis-navbar-focus uppercase tracking-wider transition-colors cursor-pointer border ${
                  mode === tab.id
                    ? 'bg-fantas-800 border-fantas-800 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <span className="text-[11px] font-axis-navbar-focus text-slate-400 uppercase tracking-wider">
          {mode === 'tandem' && 'Straight Tickets (Violet/Green) vs. Split-Tickets (Amber)'}
          {mode === 'mayor' && `Escueta (Green) vs. Ruanto (Violet) — Max ${scaleMetrics.baseMax}%`}
          {mode === 'vice_mayor' && `America G. (Green) vs. America M. (Violet) — Max ${scaleMetrics.baseMax}%`}
        </span>
      </div>

      {/* CARTOGRAM STAGE & INSPECTOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-7xl mx-auto">
        <CartogramStage
          className="order-2 lg:order-1 lg:col-span-8"
          svgRef={svgRef}
          transform={transform}
          isPanning={isPanning}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onZoom={handleZoom}
          onReset={handleResetView}
          badgeText="1 hex = 1 Clustered Precinct"
          subText="Drag map to pan • Click any precinct tile to inspect precinct vote shares"
        >
          {projectedFeatures.map((precinct, idx) => {
            const { props, pathD } = precinct;
            if (!pathD) return null;

            const isSelected = selectedFeature?.precinct_id === props.precinct_id;
            const isHovered = hoveredPrecinctId === props.precinct_id;
            const isSameBrgy = (hoveredBrgy && hoveredBrgy === props.barangay) ||
                               (selectedFeature && selectedFeature.barangay === props.barangay);

            return (
              <path
                key={idx}
                d={pathD}
                onClick={() => handleSelectPrecinct(props)}
                onMouseEnter={() => { setHoveredPrecinctId(props.precinct_id); setHoveredBrgy(props.barangay); }}
                onMouseLeave={() => { setHoveredPrecinctId(null); setHoveredBrgy(null); }}
                fill={getprecinctFillColor(props)}
                stroke={isSelected ? '#000000' : isHovered ? '#0f172a' : isSameBrgy ? '#334155' : '#ffffff'}
                strokeWidth={isSelected ? 2.5 : isHovered ? 2.5 : isSameBrgy ? 1.5 : 1}
                className="transition-colors duration-150 cursor-pointer outline-none"
              >
                <title>{`Brgy. ${props.barangay} | Precinct ${props.precinct_id} | Mayor: ${props.mayor_winner || 'N/A'} | Tandem: ${props.mayor_vice_winners || 'N/A'}`}</title>
              </path>
            );
          })}
        </CartogramStage>

        {/* LEGEND / INSPECTOR */}
        <div className="order-2 lg:order-2 lg:col-span-4 space-y-6 flex flex-col justify-start h-full pt-2 lg:pt-0">
          {selectedFeature ? (
            <div className="hidden lg:block bg-white border border-slate-200 p-6 relative animate-fade-in text-start space-y-4">
              <button onClick={handleResetView} className="absolute right-4 top-4 size-7 bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer" aria-label="Close">
                ×
              </button>

              <div className="border-b border-slate-100 pb-3 pr-8">
                <span className="text-xs font-axis-navbar-focus uppercase tracking-wider text-slate-400">Precinct Inspector</span>
                <h3 className="text-lg font-axis-wide-header uppercase text-slate-900 mt-0.5">Precinct {selectedFeature.precinct_id}</h3>
                <span className="text-xs uppercase tracking-wider text-fantas-50 bg-fantas-800 font-axis-navbar-focus px-2 py-0.5 inline-block mt-1">
                  BRGY. {selectedFeature.barangay}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3.5 space-y-3 text-xs">
                <div className="text-[10px] font-axis-navbar-focus uppercase tracking-wider text-slate-400">
                  Precinct Vote Breakdown
                </div>

                {/* MAYOR */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm uppercase tracking-wide">
                    <span className="font-axis-navbar-focus text-slate-600">Mayor:</span>
                    <span
                      className={`font-axis-number-focus normal-case tracking-normal ${
                        selectedFeature.mayor_winner === 'Ruanto'
                          ? 'text-purple-800'
                          : selectedFeature.mayor_winner === 'Escueta'
                          ? 'text-emerald-700'
                          : 'text-slate-900'
                      }`}
                    >
                      {selectedFeature.mayor_winner || 'N/A'}{' '}
                      <span className="font-axis-number-focus tracking-wide">
                        +{selectedDetails?.mayorMargin}
                      </span>
                    </span>
                  </div>

                  {selectedDetails && (
                    <div className="w-full bg-slate-200 h-2 flex overflow-hidden">
                      <div style={{ width: `${selectedDetails.escuetaPct}%` }} className="bg-[#10b981]" title={`Escueta: ${selectedDetails.escuetaPct}%`} />
                      <div style={{ width: `${selectedDetails.ruantoPct}%` }} className="bg-[#6e11b0]" title={`Ruanto: ${selectedDetails.ruantoPct}%`} />
                    </div>
                  )}

                  <div className="flex justify-between text-[11px] font-axis-number-focus">
                    <span className={selectedFeature.mayor_winner === 'Escueta' ? 'font-bold text-emerald-700' : 'text-slate-400'}>
                      Escueta: {selectedDetails?.escuetaPct}%
                    </span>
                    <span className={selectedFeature.mayor_winner === 'Ruanto' ? 'font-bold text-purple-800' : 'text-slate-400'}>
                      Ruanto: {selectedDetails?.ruantoPct}%
                    </span>
                  </div>
                </div>

                {/* VICE MAYOR */}
                <div className="space-y-1 pt-2 border-t border-slate-200/60">
                  <div className="flex items-center justify-between text-sm uppercase tracking-wide">
                    <span className="font-axis-navbar-focus text-slate-600">Vice Mayor:</span>
                    <span
                      className={`normal-case font-axis-number-focus tracking-normal ${
                        selectedFeature.vice_mayor_winner?.includes('Mannie')
                          ? 'text-purple-800'
                          : selectedFeature.vice_mayor_winner?.includes('Grace')
                          ? 'text-emerald-700'
                          : 'text-slate-900'
                      }`}
                    >
                      {selectedFeature.vice_mayor_winner || 'N/A'}{' '}
                      <span className="font-axis-number-focus font-bold tracking-wide">
                        +{selectedDetails?.vmMargin}
                      </span>
                    </span>
                  </div>

                  {selectedDetails && (
                    <div className="w-full bg-slate-200 h-2 flex overflow-hidden">
                      <div style={{ width: `${selectedDetails.gracePct}%` }} className="bg-[#10b981]" title={`Grace: ${selectedDetails.gracePct}%`} />
                      <div style={{ width: `${selectedDetails.manniePct}%` }} className="bg-[#6e11b0]" title={`Mannie: ${selectedDetails.manniePct}%`} />
                    </div>
                  )}

                  <div className="flex justify-between text-[11px] font-axis-number-focus">
                    <span className={selectedFeature.vice_mayor_winner?.includes('Grace') ? 'font-bold text-emerald-700' : 'text-slate-400'}>
                      Grace: {selectedDetails?.gracePct}%
                    </span>
                    <span className={selectedFeature.vice_mayor_winner?.includes('Mannie') ? 'font-bold text-purple-800' : 'text-slate-400'}>
                      Mannie: {selectedDetails?.manniePct}%
                    </span>
                  </div>
                </div>

                {/* TANDEM OUTCOME */}
                {selectedFeature.mayor_vice_winners && (
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-slate-600 font-axis-navbar-focus uppercase tracking-wide">Tandem Outcome:</span>
                    <span className={`px-2 py-0.5 font-semibold text-[11px] font-axis-navbar-focus uppercase tracking-wide border ${
                      selectedFeature.mayor_vice_winners.includes('Grace') && selectedFeature.mayor_vice_winners.includes('Ruanto')
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : selectedFeature.mayor_vice_winners.includes('Ruanto')
                        ? 'bg-purple-50 text-purple-900 border-purple-900'
                        : 'bg-emerald-50 text-emerald-900 border-emerald-900'
                    }`}>
                      {selectedFeature.mayor_vice_winners}
                    </span>
                  </div>
                )}
              </div>

              {/* PARTICIPATION FIGURES */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-100">
                <div className="flex flex-row items-baseline gap-2">
                  <span className="text-[11px] uppercase tracking-wider font-axis-navbar-focus text-slate-400">Ballots Cast</span>
                  <div className="text-lg font-axis-sng-indlab-value text-slate-900 tracking-wider">
                    {selectedFeature.actual_voters.toLocaleString()}{' '}
                    <span className="text-[11px] text-slate-400 tracking-wider">/ {selectedFeature.registered_voters.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex flex-row items-baseline gap-2">
                  <span className="text-[11px] uppercase font-axis-navbar-focus text-slate-400">Turnout %</span>
                  <div className="text-lg font-axis-sng-indlab-value tracking-wider text-slate-900">
                    {selectedFeature.turnout_pct}%
                  </div>
                </div>
              </div>

              <button onClick={handleResetView} className="w-full mt-4 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-axis-navbar-focus uppercase tracking-wider transition-colors cursor-pointer">
                Reset Map View
              </button>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 p-6 text-start space-y-6">
              {mode === 'tandem' ? (
                <>
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-xl font-axis-wide-header uppercase text-slate-900">Tandem Outcomes</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="size-4.5 bg-[#6e11b0] border border-white shrink-0 shadow-xs" />
                      <div className="flex flex-col gap-0.5">
                        <div className="text-xs font-semibold text-slate-900 font-axis-navbar-focus">Ruanto & America (Mannie)</div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-axis-subtitular-focus">
                          Straight Slate • {overallStats.ruantoWins} precincts
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="size-4.5 bg-[#10b981] border border-white shrink-0 shadow-xs" />
                      <div className="flex flex-col gap-0.5">
                        <div className="text-xs font-semibold text-slate-900 font-axis-navbar-focus">Escueta & America (Grace)</div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-axis-subtitular-focus">
                          Straight Slate • {overallStats.escuetaWins} precincts
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="size-4.5 bg-[#f59e0b] border border-white shrink-0 shadow-xs" />
                      <div className="flex flex-col gap-0.5">
                        <div className="text-xs font-semibold text-slate-900 font-axis-navbar-focus">Ruanto & America (Grace)</div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-axis-subtitular-focus">
                          Split-Ticket • {overallStats.splitTickets} precincts ({overallStats.splitPct}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-xl font-axis-wide-header uppercase text-slate-900">
                      {mode === 'mayor' ? 'Mayoral Vote Share' : 'Vice Mayoral Vote Share'}
                    </h3>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-axis-navbar-focus uppercase tracking-wider text-slate-700 pb-2">
                      <span className="text-emerald-700 font-semibold">{mode === 'mayor' ? 'Escueta' : 'America (Grace)'}</span>
                      <span className="text-purple-800 font-semibold">{mode === 'mayor' ? 'Ruanto' : 'America (Mannie)'}</span>
                    </div>
                    <div className="grid grid-cols-6 w-full h-4 overflow-hidden border border-slate-200">
                      <div className="bg-[#047857]" title={`Escueta/Grace Stronghold (>${scaleMetrics.c2}%)`} />
                      <div className="bg-[#10b981]" title={`Escueta/Grace Solid (${scaleMetrics.c1}-${scaleMetrics.c2}%)`} />
                      <div className="bg-[#6ee7b7]" title={`Escueta/Grace Lean (50-${scaleMetrics.c1}%)`} />
                      <div className="bg-[#c4b5fd]" title={`Ruanto/Mannie Lean (50-${scaleMetrics.c1}%)`} />
                      <div className="bg-[#8b5cf6]" title={`Ruanto/Mannie Solid (${scaleMetrics.c1}-${scaleMetrics.c2}%)`} />
                      <div className="bg-[#6d28d9]" title={`Ruanto/Mannie Stronghold (>${scaleMetrics.c2}%)`} />
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-axis-navbar-focus text-slate-600 pt-1.5 proportional-nums font-axis-number-focus">
                      <span>{scaleMetrics.baseMax}%</span>
                      <span>{scaleMetrics.c2}%</span>
                      <span>50%</span>
                      <span>{scaleMetrics.c2}%</span>
                      <span>{scaleMetrics.baseMax}%</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wide font-axis-subtitular-focus text-slate-400 block pt-1.5">
                      Symmetric Scale (Max Observed: {scaleMetrics.baseMax}%)
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MOBILE SHEET */}
      <PrecinctSheet
        isOpen={Boolean(selectedFeature)}
        onClose={handleResetView}
      >
        {selectedFeature && (
          <div className="space-y-4">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-axis-navbar-focus uppercase tracking-wider text-slate-400">
                  Precinct Inspector
                </span>
                <h3 className="text-lg font-axis-wide-header uppercase text-slate-900 mt-0.5">
                  Precinct {selectedFeature.precinct_id}
                </h3>
                <span className="text-xs uppercase tracking-wider text-fantas-50 bg-fantas-800 font-axis-navbar-focus px-2 py-0.5 inline-block mt-1">
                  BRGY. {selectedFeature.barangay}
                </span>
              </div>
              <button
                onClick={handleResetView}
                className="size-7 rounded-none border border-slate-300 bg-white text-slate-700 flex items-center justify-center text-sm font-bold cursor-pointer"
                aria-label="Close inspector"
              >
                ×
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3 space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs uppercase tracking-wide">
                  <span className="font-axis-navbar-focus text-slate-600">Mayor:</span>
                  <span className={`font-semibold font-axis-navbar-focus ${selectedFeature.mayor_winner === 'Ruanto' ? 'text-purple-800' : 'text-emerald-700'}`}>
                    {selectedFeature.mayor_winner}{' '}
                    <span className="font-axis-number-focus font-bold">
                      ({selectedFeature.mayor_winner === 'Ruanto' ? selectedDetails?.ruantoPct : selectedDetails?.escuetaPct}%)
                    </span>
                  </span>
                </div>
                {selectedDetails && (
                  <div className="w-full bg-slate-200 h-2 flex overflow-hidden">
                    <div style={{ width: `${selectedDetails.escuetaPct}%` }} className="bg-[#10b981]" />
                    <div style={{ width: `${selectedDetails.ruantoPct}%` }} className="bg-[#6e11b0]" />
                  </div>
                )}
                <div className="flex justify-between text-[10px] font-axis-number-focus">
                  <span className={selectedFeature.mayor_winner === 'Escueta' ? 'font-bold text-emerald-700' : 'text-slate-400'}>
                    Escueta: {selectedDetails?.escuetaPct}%
                  </span>
                  <span className={selectedFeature.mayor_winner === 'Ruanto' ? 'font-bold text-purple-800' : 'text-slate-400'}>
                    Ruanto: {selectedDetails?.ruantoPct}%
                  </span>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-200/60">
                <div className="flex items-center justify-between text-xs uppercase tracking-wide">
                  <span className="font-axis-navbar-focus text-slate-600">Vice Mayor:</span>
                  <span className={`font-semibold font-axis-navbar-focus ${selectedFeature.vice_mayor_winner?.includes('Mannie') ? 'text-purple-800' : 'text-emerald-700'}`}>
                    {selectedFeature.vice_mayor_winner}{' '}
                    <span className="font-axis-number-focus font-bold">
                      ({selectedFeature.vice_mayor_winner?.includes('Mannie') ? selectedDetails?.manniePct : selectedDetails?.gracePct}%)
                    </span>
                  </span>
                </div>
                {selectedDetails && (
                  <div className="w-full bg-slate-200 h-2 flex overflow-hidden">
                    <div style={{ width: `${selectedDetails.gracePct}%` }} className="bg-[#10b981]" />
                    <div style={{ width: `${selectedDetails.manniePct}%` }} className="bg-[#6e11b0]" />
                  </div>
                )}
                <div className="flex justify-between text-[10px] font-axis-number-focus">
                  <span className={selectedFeature.vice_mayor_winner?.includes('Grace') ? 'font-bold text-emerald-700' : 'text-slate-400'}>
                    Grace: {selectedDetails?.gracePct}%
                  </span>
                  <span className={selectedFeature.vice_mayor_winner?.includes('Mannie') ? 'font-bold text-purple-800' : 'text-slate-400'}>
                    Mannie: {selectedDetails?.manniePct}%
                  </span>
                </div>
              </div>

              {selectedFeature.mayor_vice_winners && (
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600 font-axis-navbar-focus uppercase tracking-wide text-[10px]">Tandem:</span>
                  <span className="px-1.5 py-0.5 font-semibold text-[10px] font-axis-navbar-focus uppercase tracking-wide border bg-white">
                    {selectedFeature.mayor_vice_winners}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-axis-navbar-focus text-slate-400 block">Ballots Cast</span>
                <span className="text-base font-axis-sng-indlab-value text-slate-900">
                  {selectedFeature.actual_voters.toLocaleString()} <span className="text-[10px] text-slate-400">/ {selectedFeature.registered_voters.toLocaleString()}</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-axis-navbar-focus text-slate-400 block">Turnout</span>
                <span className="text-base font-axis-sng-indlab-value text-slate-900">
                  {selectedFeature.turnout_pct}%
                </span>
              </div>
            </div>

            <button
              onClick={handleResetView}
              className="w-full mt-2 py-2 px-4 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-axis-navbar-focus uppercase tracking-wider rounded-none cursor-pointer"
            >
              Reset Map View
            </button>
          </div>
        )}
      </PrecinctSheet>

      {/* SUMMARY TABLE */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 border border-slate-200 text-xs">
          <span className="text-slate-700 font-axis-navbar-focus uppercase tracking-wider">
            Barangay Contest Summary ({barangaySummaries.length} Barangays)
          </span>
        </div>

        <div className="bg-white border border-slate-200 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-axis-navbar-focus uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">#</th>
                <th className="py-2.5 px-4">Barangay</th>
                <th className="py-2.5 px-4">Total precincts</th>
                <th className="py-2.5 px-4 min-w-[220px]">Lead Tandem (precinct Count)</th>
                <th className="py-2.5 px-4">Mayor Leader (% Share)</th>
                <th className="py-2.5 px-4 min-w-[200px]">Vice Mayor Leader (% Share)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-axis-navbar-focus">
              {barangaySummaries.map((row, idx) => (
                <tr
                  key={row.barangay}
                  onMouseEnter={() => setHoveredBrgy(row.barangay)}
                  onMouseLeave={() => setHoveredBrgy(null)}
                  onClick={() => {
                    zoomToBarangay(row.barangay, setTransform);
                    const tile = projectedFeatures.find(h => normalizeName(h.props.barangay) === normalizeName(row.barangay));
                    if (tile) setSelectedFeature(tile.props);
                  }}
                  className={`cursor-pointer transition-colors ${
                    selectedFeature?.barangay === row.barangay ? 'bg-emerald-50 text-sm' : hoveredBrgy === row.barangay ? 'bg-slate-50' : ''
                  }`}
                >
                  <td className="py-2.5 px-4 text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 px-4 tracking-wide text-sm font-semibold text-slate-900">{row.barangay}</td>
                  <td className="py-2.5 px-4 tracking-wide text-sm font-axis-number-focus text-slate-600">{row.totalPrecincts}</td>
                  <td className="py-2.5 px-4 min-w-[220px]">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[11px] font-axis-navbar-focus">
                        <span className="font-semibold tracking-wide text-slate-800 truncate max-w-[140px]">
                          {row.leadTandem}
                        </span>
                        <span className="text-slate-500 font-axis-number-focus text-[10px]">
                          {row.tandemCount}/{row.totalPrecincts} precinct{row.totalPrecincts > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 flex overflow-hidden border border-slate-200">
                        {row.tandemSegments?.map((seg, sIdx) => {
                          const pct = (seg.count / row.totalPrecincts) * 100;
                          return (
                            <div
                              key={sIdx}
                              style={{ width: `${pct}%`, backgroundColor: seg.color }}
                              className="h-full transition-all"
                              title={`${seg.tandem}: ${seg.count} of ${row.totalPrecincts} precincts (${Math.round(pct)}%)`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 border font-axis-navbar-focus uppercase tracking-wide text-xs ${
                      row.leadMayor === 'Ruanto'
                        ? 'bg-purple-50 text-purple-800 border-purple-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      <span>{row.leadMayor}</span>
                      <span className="font-axis-number-focus">({row.mayorLeadPct}%)</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 border font-axis-navbar-focus uppercase tracking-wide text-xs ${
                      row.leadVM?.includes('Mannie')
                        ? 'bg-purple-50 text-purple-800 border-purple-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      <span>{row.leadVM}</span>
                      <span className="font-axis-number-focus">({row.vmLeadPct}%)</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
