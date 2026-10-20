import { useState, useMemo, useCallback } from 'react';
import hexCartoJson from '@/data/geog/turnout-map/infanta_hex_precincts.json';
import PrecinctSheet from './precinctSheet';
import { getJenksBreaks, downloadJson } from '@/utils/cartoUtils';
import {
  BarangaySearchBar,
  CartogramStage,
  CartogramHexGrid,
  normalizeName,
  useCartogramPanZoom,
  useGeoJsonProjection,
  useCartogramSelection,
  LazyIcon,
} from './cartogramStage';

export interface PrecinctTurnoutProps {
  barangay: string;
  precinct_id: string;
  registered_voters: number;
  actual_voters: number;
  turnout_pct: number;
}

export interface BarangayTurnoutSummary {
  barangay: string;
  totalPrecincts: number;
  registeredVoters: number;
  actualVoters: number;
  turnoutPct: number;
}

function PrecinctTurnoutCard({
  precinct,
  barangaySummary,
  onReset,
}: {
  precinct: PrecinctTurnoutProps;
  barangaySummary: BarangayTurnoutSummary | null;
  onReset: () => void;
}) {
  return (
    <div className="space-y-4 text-start">
      <div className="border-b border-slate-100 pb-3 pr-8 relative">
        <span className="text-xs font-axis-navbar-focus uppercase tracking-wider text-slate-400">Clustered Precinct</span>
        <h3 className="text-lg font-axis-wide-header uppercase text-fantas-900 mt-0.5">Precinct {precinct.precinct_id}</h3>
        <span className="text-xs uppercase tracking-wider text-white bg-fantas-900 font-axis-navbar-focus px-2 py-0.5 inline-block mt-1">
          BRGY. {precinct.barangay}
        </span>
        <button
          onClick={onReset}
          className="absolute right-0 top-0 size-7 bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex flex-row items-baseline gap-2">
          <span className="text-xs uppercase font-axis-navbar-focus text-slate-400 tracking-wide">Precinct Turnout</span>
          <span className="text-2xl tracking-wide font-axis-sng-indlab-value text-fantas-900">{precinct.turnout_pct}%</span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-row items-baseline gap-2">
            <span className="text-xs uppercase font-axis-navbar-focus text-slate-400 tracking-wide">Ballots</span>
            <span className="text-lg tracking-wide font-axis-sng-indlab-value text-fantas-900">{precinct.actual_voters.toLocaleString()}</span>
          </div>
          <div className="flex flex-row items-baseline gap-2">
            <span className="text-xs uppercase font-axis-navbar-focus text-slate-400 tracking-wide">Registered</span>
            <span className="text-lg tracking-wide font-axis-sng-indlab-value text-fantas-900">{precinct.registered_voters.toLocaleString()}</span>
          </div>
        </div>

        {barangaySummary && (
          <div className="pt-3 border-t border-slate-100 text-xs">
            <div className="text-[10px] uppercase font-axis-navbar-focus tracking-wider text-fantas-900 font-semibold mb-1">
              Barangay Total Context
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-row items-baseline gap-1.5">
                <span className="text-xs uppercase font-axis-navbar-focus text-slate-400 tracking-wide">Total Hexes:</span>
                <span className="text-sm font-axis-sng-indlab-value text-fantas-900">{barangaySummary.totalPrecincts}</span>
              </div>
              <div className="flex flex-row items-baseline gap-1.5">
                <span className="text-xs uppercase font-axis-navbar-focus text-slate-400 tracking-wide">Brgy Turnout:</span>
                <span className="text-sm font-axis-sng-indlab-value text-fantas-900">{barangaySummary.turnoutPct}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onReset}
        className="w-full mt-4 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-axis-navbar-focus uppercase tracking-wider transition-colors cursor-pointer"
      >
        Reset Map View
      </button>
    </div>
  );
}

export default function ParticipationTab() {
  const geoJson = hexCartoJson as any;

  const [colorblindMode, setColorblindMode] = useState(false);
  const [sortKey, setSortKey] = useState<'turnoutPct' | 'registeredVoters'>('turnoutPct');

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

  const { projectedFeatures, zoomToBarangay } = useGeoJsonProjection<PrecinctTurnoutProps>(
    geoJson,
    useCallback((p: any, idx: number) => ({
      barangay: p.barangay || `Barangay ${idx + 1}`,
      precinct_id: String(p.precinct_id || `P-${idx + 1}`),
      registered_voters: Number(p.registered_voters) || 0,
      actual_voters: Number(p.actual_voters) || 0,
      turnout_pct: Number(p.turnout_pct) || 0,
    }), [])
  );

  const {
    selectedFeature,
    hoveredPrecinctId,
    setHoveredPrecinctId,
    hoveredBrgy,
    setHoveredBrgy,
    selectPrecinct,
    selectBarangay,
    resetView,
  } = useCartogramSelection(
    projectedFeatures,
    zoomToBarangay,
    setTransform,
    hasMoved,
    handleResetTransform
  );

  const turnoutColorRamp = useMemo(() => {
    if (colorblindMode) return ['#fde725', '#5ec962', '#21918c', '#3b528b', '#440154'];
    return ['#feebd2', '#fdbf72', '#fb9618', '#b56603', '#553001'];
  }, [colorblindMode]);

  const jenksBreaks = useMemo(() => {
    if (!geoJson?.features) return [70, 75, 80, 85, 90, 95];
    const turnouts = geoJson.features.map((f: any) => Number(f.properties?.turnout_pct) || 0);
    return getJenksBreaks(turnouts, 5);
  }, [geoJson]);

  const getTurnoutColor = useCallback((pct: number) => {
    if (pct <= jenksBreaks[1]) return turnoutColorRamp[0];
    if (pct <= jenksBreaks[2]) return turnoutColorRamp[1];
    if (pct <= jenksBreaks[3]) return turnoutColorRamp[2];
    if (pct <= jenksBreaks[4]) return turnoutColorRamp[3];
    return turnoutColorRamp[4];
  }, [jenksBreaks, turnoutColorRamp]);

  const barangaySummaries = useMemo(() => {
    const map = new Map<string, BarangayTurnoutSummary>();

    geoJson.features.forEach((f: any) => {
      const p = f.properties || {};
      const brgy = p.barangay;
      if (!brgy) return;

      const reg = Number(p.registered_voters) || 0;
      const act = Number(p.actual_voters) || 0;

      if (!map.has(brgy)) {
        map.set(brgy, {
          barangay: brgy,
          totalPrecincts: 1,
          registeredVoters: reg,
          actualVoters: act,
          turnoutPct: 0,
        });
      } else {
        const item = map.get(brgy)!;
        item.totalPrecincts += 1;
        item.registeredVoters += reg;
        item.actualVoters += act;
      }
    });

    map.forEach(item => {
      item.turnoutPct = item.registeredVoters > 0
        ? Number(((item.actualVoters / item.registeredVoters) * 100).toFixed(2))
        : 0;
    });

    return Array.from(map.values());
  }, [geoJson]);

  const activeBrgySummary = useMemo(() => {
    if (!selectedFeature) return null;
    return barangaySummaries.find(
      b => normalizeName(b.barangay) === normalizeName(selectedFeature.barangay)
    ) || null;
  }, [selectedFeature, barangaySummaries]);

  const sortedTableData = useMemo(() => {
    return [...barangaySummaries].sort((a, b) => {
      if (sortKey === 'turnoutPct') return b.turnoutPct - a.turnoutPct;
      return b.registeredVoters - a.registeredVoters;
    });
  }, [barangaySummaries, sortKey]);

  return (
    <div className="space-y-8 animate-fade-in text-start select-none">
      {/* HEADER & REUSABLE SEARCH */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-axis-wide-header uppercase tracking-wide text-fantas-900">
            Voter Turnout & Participation
          </h2>
          <p className="text-md font-axis-subtitular-focus tracking-wide text-slate-500">
            Analyze clustered precinct turnout and voter engagement across all 36 barangays of Infanta.
          </p>
        </div>

        <BarangaySearchBar
          items={barangaySummaries}
          placeholder="Search barangay..."
          getBarangayName={b => b.barangay}
          renderSubtitle={b => (
            <span className="text-slate-500 font-axis-navbar-focus">{b.turnoutPct}% Turnout</span>
          )}
          onSelect={selectBarangay}
        />
      </div>

      {/* CARTOGRAM STAGE & INSPECTOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-7xl mx-auto">
        <CartogramStage
          className="lg:col-span-8"
          svgRef={svgRef}
          transform={transform}
          isPanning={isPanning}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onZoom={handleZoom}
          onReset={resetView}
          badgeText="1 Hex = 1 Clustered Precinct"
          subText="Drag map to pan • Click any hex tile to inspect precinct"
        >
          <CartogramHexGrid
            features={projectedFeatures}
            selectedId={selectedFeature?.precinct_id}
            hoveredId={hoveredPrecinctId}
            activeBarangay={hoveredBrgy || selectedFeature?.barangay}
            getFillColor={p => getTurnoutColor(p.turnout_pct)}
            getTitle={p => `Brgy. ${p.barangay} | Precinct ${p.precinct_id} (${p.turnout_pct}%)`}
            onSelect={selectPrecinct}
            onHover={(id, brgy) => {
              setHoveredPrecinctId(id);
              setHoveredBrgy(brgy);
            }}
          />
        </CartogramStage>

        {/* RIGHT 4 COLS: Turnout Inspector & Fisher-Jenks Legend */}
        <div className="lg:col-span-4 space-y-6 flex flex-col justify-start h-full pt-2 lg:pt-0">
          {selectedFeature ? (
            <div className="hidden lg:block bg-white border border-slate-200 p-6 animate-fade-in text-start">
              <PrecinctTurnoutCard
                precinct={selectedFeature}
                barangaySummary={activeBrgySummary}
                onReset={resetView}
              />
            </div>
          ) : (
            <div className="bg-white border border-slate-200 p-6 text-start space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-xl font-axis-wide-header uppercase text-fantas-900">Turnout Intensity</h3>
              </div>

              <div>
                <div className="flex items-center justify-between text-[12px] font-axis-subtitular-focus uppercase tracking-wider text-slate-500 pb-2">
                  <span>Lower Turnout</span>
                  <span>Higher Turnout</span>
                </div>

                <div className="grid grid-cols-5 w-full h-4 overflow-hidden">
                  {turnoutColorRamp.map((color, idx) => (
                    <div key={idx} style={{ backgroundColor: color }} className="w-full h-full" />
                  ))}
                </div>

                <div className="flex justify-between items-center text-[12px] font-axis-navbar-focus text-slate-600 pt-1.5 proportional-nums">
                  <span>{jenksBreaks[0]?.toFixed(0)}%</span>
                  <span>{jenksBreaks[1]?.toFixed(0)}%</span>
                  <span>{jenksBreaks[2]?.toFixed(0)}%</span>
                  <span>{jenksBreaks[3]?.toFixed(0)}%</span>
                  <span>{jenksBreaks[4]?.toFixed(0)}%</span>
                  <span>{jenksBreaks[5]?.toFixed(0)}%</span>
                </div>

                <span className="text-[10px] uppercase tracking-wide font-axis-subtitular-focus text-slate-400 block pt-1">
                  Fisher-Jenks Natural Breaks (5 bins)
                </span>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-4">
                <label className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                  <span className="flex items-center gap-2 text-xs font-axis-navbar-focus text-slate-700">
                    <LazyIcon name="lucide:eye" className="h-4 w-4 text-slate-500" />
                    Colorblind friendly (Viridis)
                  </span>
                  <input
                    type="checkbox"
                    checked={colorblindMode}
                    onChange={e => setColorblindMode(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-0 cursor-pointer h-4 w-4"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE SHEET */}
      <PrecinctSheet isOpen={Boolean(selectedFeature)} onClose={resetView}>
        {selectedFeature && (
          <PrecinctTurnoutCard
            precinct={selectedFeature}
            barangaySummary={activeBrgySummary}
            onReset={resetView}
          />
        )}
      </PrecinctSheet>

      {/* BOTTOM TABLE */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 border border-slate-200 text-xs">
          <span className="text-slate-700 font-axis-navbar-focus uppercase tracking-wider">
            Barangay Turnout Rankings ({sortedTableData.length} Barangays)
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 mr-1 sm:mr-3 border-r border-slate-200 pr-3">
              <button
                onClick={() => downloadJson('infanta_barangay_turnout_summary.json', sortedTableData)}
                className="px-2.5 py-1 text-[11px] uppercase tracking-wider font-axis-navbar-focus bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LazyIcon name="lucide:download" className="h-3.5 w-3.5 text-slate-500" />
                Summary JSON
              </button>
              <button
                onClick={() => downloadJson('infanta_hex_precincts_turnout.json', geoJson)}
                className="px-2.5 py-1 text-[11px] uppercase tracking-wider font-axis-navbar-focus bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LazyIcon name="lucide:file-json" className="h-3.5 w-3.5 text-slate-500" />
                GeoJSON
              </button>
            </div>

            <span className="text-slate-400">Sort by:</span>
            <button
              onClick={() => setSortKey('turnoutPct')}
              className={`px-2.5 py-1 uppercase tracking-wider font-axis-navbar-focus cursor-pointer ${
                sortKey === 'turnoutPct' ? 'bg-fantas-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Turnout %
            </button>
            <button
              onClick={() => setSortKey('registeredVoters')}
              className={`px-2.5 py-1 uppercase tracking-wider font-axis-navbar-focus cursor-pointer ${
                sortKey === 'registeredVoters' ? 'bg-fantas-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Voters
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-axis-navbar-focus uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">#</th>
                <th className="py-2.5 px-4">Barangay</th>
                <th className="py-2.5 px-4">Precincts</th>
                <th className="py-2.5 px-4">Registered</th>
                <th className="py-2.5 px-4">Actual Voters</th>
                <th className="py-2.5 px-4 min-w-[180px]">Turnout Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-axis-navbar-focus">
              {sortedTableData.map((row, idx) => (
                <tr
                  key={row.barangay}
                  onMouseEnter={() => setHoveredBrgy(row.barangay)}
                  onMouseLeave={() => setHoveredBrgy(null)}
                  onClick={() => selectBarangay(row.barangay)}
                  className={`cursor-pointer transition-colors ${
                    selectedFeature?.barangay === row.barangay ? 'bg-emerald-50 text-sm' : hoveredBrgy === row.barangay ? 'bg-slate-50' : ''
                  }`}
                >
                  <td className="py-2.5 px-4 text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 px-4 tracking-wide text-sm font-semibold text-fantas-900">{row.barangay}</td>
                  <td className="py-2.5 px-4 tracking-wide text-sm font-axis-number-focus text-slate-600">{row.totalPrecincts}</td>
                  <td className="py-2.5 px-4 tracking-wide text-sm font-axis-number-focus text-slate-700">{row.registeredVoters.toLocaleString()}</td>
                  <td className="py-2.5 px-4 tracking-wide text-sm font-axis-number-focus text-fantas-900">{row.actualVoters.toLocaleString()}</td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-axis-number-focus text-sm text-fantas-900 min-w-[45px]">{row.turnoutPct}%</span>
                      <div className="flex-1 h-3 bg-slate-200 overflow-hidden">
                        <div className="h-full transition-all duration-300" style={{ width: `${row.turnoutPct}%`, backgroundColor: getTurnoutColor(row.turnoutPct) }} />
                      </div>
                    </div>
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
