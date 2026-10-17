import { useState, useMemo, useCallback } from 'react';
import hexCartoJson from '@/data/geog/turnout-map/infanta_hex_precincts.json';
import { BarangaySearchBar, CartogramStage, normalizeName, useCartogramPanZoom, useGeoJsonProjection } from './CartogramStage';
import LazyIcon from '@/components/ui/Lazying';
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

function getJenksBreaks(data: number[], nClasses = 5): number[] {
  const valid = data.filter(d => typeof d === 'number' && !isNaN(d) && d > 0);
  if (valid.length === 0) return [70, 75, 80, 85, 90, 95];

  const sorted = [...valid].sort((a, b) => a - b);
  const n = sorted.length;
  if (n <= nClasses) {
    const unique = Array.from(new Set(sorted));
    while (unique.length < nClasses + 1) unique.push(unique[unique.length - 1] + 1);
    return unique;
  }

  const mat1: number[][] = Array.from({ length: n + 1 }, () => Array(nClasses + 1).fill(0));
  const mat2: number[][] = Array.from({ length: n + 1 }, () => Array(nClasses + 1).fill(0));

  for (let y = 1; y <= nClasses; y++) {
    mat1[1][y] = 1;
    mat2[1][y] = 0;
    for (let t = 2; t <= n; t++) mat2[t][y] = Infinity;
  }

  let v = 0;
  for (let l = 2; l <= n; l++) {
    let s1 = 0, s2 = 0, w = 0;
    for (let m = 1; m <= l; m++) {
      const i3 = l - m + 1;
      const val = sorted[i3 - 1];
      s2 += val * val;
      s1 += val;
      w++;
      v = s2 - (s1 * s1) / w;
      const i4 = i3 - 1;
      if (i4 !== 0) {
        for (let j = 2; j <= nClasses; j++) {
          if (mat2[l][j] >= v + mat2[i4][j - 1]) {
            mat1[l][j] = i3;
            mat2[l][j] = v + mat2[i4][j - 1];
          }
        }
      }
    }
    mat1[l][1] = 1;
    mat2[l][1] = v;
  }

  const kclass: number[] = Array(nClasses + 1).fill(0);
  kclass[nClasses] = sorted[n - 1];
  let count = nClasses, cur = n;
  while (count >= 2) {
    const id = mat1[cur][count] - 2;
    kclass[count - 1] = sorted[id];
    cur = mat1[cur][count] - 1;
    count--;
  }
  kclass[0] = sorted[0];
  return kclass;
}

export default function ParticipationTab() {
  const geoJson = hexCartoJson as any;

  const [selectedFeature, setSelectedFeature] = useState<PrecinctTurnoutProps | null>(null);
  const [hoveredPrecinctId, setHoveredPrecinctId] = useState<string | null>(null);
  const [hoveredBrgy, setHoveredBrgy] = useState<string | null>(null);
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

  // 🧮 1-line coordinate projection hook
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

  const handleSelectPrecinct = (props: PrecinctTurnoutProps) => {
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

  const handleDownloadJson = useCallback((type: 'barangays' | 'precincts') => {
    const isPrecinct = type === 'precincts';
    const data = isPrecinct ? geoJson : sortedTableData;
    const filename = isPrecinct
      ? 'infanta_hex_precincts_turnout.json'
      : 'infanta_barangay_turnout_summary.json';

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [geoJson, sortedTableData]);

  return (
    <div className="space-y-8 animate-fade-in text-start select-none">
      {/* HEADER & REUSABLE SEARCH */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-axis-wide-header uppercase tracking-wide text-slate-900">
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
          onSelect={bName => {
            zoomToBarangay(bName, setTransform);
            const firstTile = projectedFeatures.find(h => normalizeName(h.props.barangay) === normalizeName(bName));
            if (firstTile) setSelectedFeature(firstTile.props);
          }}
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
          onReset={handleResetView}
          badgeText="1 Hex = 1 Clustered Precinct"
          subText="Drag map to pan • Click any hex tile to inspect precinct"
        >
          {projectedFeatures.map((hex, idx) => {
            const { props, pathD } = hex;
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
                fill={getTurnoutColor(props.turnout_pct)}
                stroke={isSelected ? '#000000' : isHovered ? '#0f172a' : isSameBrgy ? '#334155' : '#ffffff'}
                strokeWidth={isSelected ? 2.5 : isHovered ? 2.5 : isSameBrgy ? 1.5 : 1}
                className="transition-colors duration-150 cursor-pointer outline-none"
              >
                <title>{`Brgy. ${props.barangay} | Precinct ${props.precinct_id} (${props.turnout_pct}%)`}</title>
              </path>
            );
          })}
        </CartogramStage>

        {/* RIGHT 4 COLS: Turnout Inspector & Fisher-Jenks Legend */}
        <div className="lg:col-span-4 space-y-6 flex flex-col justify-start h-full pt-2 lg:pt-0">
          {selectedFeature ? (
            <div className="bg-white border border-slate-200 p-6 relative animate-fade-in text-start space-y-4">
              <button onClick={handleResetView} className="absolute right-4 top-4 size-7 bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer" aria-label="Close">
                ×
              </button>

              <div className="border-b border-slate-100 pb-3 pr-8">
                <span className="text-xs font-axis-navbar-focus uppercase tracking-wider text-slate-400">Clustered Precinct</span>
                <h3 className="text-lg font-axis-wide-header uppercase text-slate-900 mt-0.5">Precinct {selectedFeature.precinct_id}</h3>
                <span className="text-xs uppercase tracking-wider text-fantas-50 bg-fantas-800 font-axis-navbar-focus px-2 py-0.5 inline-block mt-1">
                  BRGY. {selectedFeature.barangay}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex flex-row items-baseline gap-2">
                  <span className="text-xs uppercase font-axis-navbar-focus text-slate-400 tracking-wide">Precinct Turnout</span>
                  <span className="text-2xl tracking-wide font-axis-sng-indlab-value text-slate-900">{selectedFeature.turnout_pct}%</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex flex-row items-baseline gap-2">
                    <span className="text-xs uppercase font-axis-navbar-focus text-slate-400">Ballots</span>
                    <span className="text-lg tracking-wide font-axis-sng-indlab-value text-slate-900">{selectedFeature.actual_voters.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-row items-baseline gap-2">
                    <span className="text-xs uppercase font-axis-navbar-focus text-slate-400">Registered</span>
                    <span className="text-lg tracking-wide font-axis-sng-indlab-value text-slate-900">{selectedFeature.registered_voters.toLocaleString()}</span>
                  </div>
                </div>

                {activeBrgySummary && (
                  <div className="pt-3 border-t border-slate-100 text-xs">
                    <div className="text-[10px] uppercase font-axis-navbar-focus tracking-wider text-fantas-800 mb-1">Barangay Total Context</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-row items-baseline gap-1.5">
                        <span className="text-xs uppercase font-axis-navbar-focus text-slate-400">Total Hexes:</span>
                        <span className="text-sm font-axis-sng-indlab-value text-slate-900">{activeBrgySummary.totalPrecincts}</span>
                      </div>
                      <div className="flex flex-row items-baseline gap-1.5">
                        <span className="text-xs uppercase font-axis-navbar-focus text-slate-400">Avg Turnout:</span>
                        <span className="text-sm font-axis-sng-indlab-value text-slate-900">{activeBrgySummary.turnoutPct}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button onClick={handleResetView} className="w-full mt-4 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-axis-navbar-focus uppercase tracking-wider transition-colors cursor-pointer">
                Reset Map View
              </button>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 p-6 text-start space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-xl font-axis-wide-header uppercase text-slate-900">Turnout Intensity</h3>
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

      {/* BOTTOM TABLE */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 border border-slate-200 text-xs">
          <span className="text-slate-700 font-axis-navbar-focus uppercase tracking-wider">
            Barangay Turnout Rankings ({sortedTableData.length} Barangays)
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 mr-1 sm:mr-3 border-r border-slate-200 pr-3">
              <button
                onClick={() => handleDownloadJson('barangays')}
                className="px-2.5 py-1 text-[11px] uppercase tracking-wider font-axis-navbar-focus bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LazyIcon name="lucide:download" className="h-3.5 w-3.5 text-slate-500" />
                Summary JSON
              </button>
              <button
                onClick={() => handleDownloadJson('precincts')}
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
                sortKey === 'turnoutPct' ? 'bg-fantas-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Turnout %
            </button>
            <button
              onClick={() => setSortKey('registeredVoters')}
              className={`px-2.5 py-1 uppercase tracking-wider font-axis-navbar-focus cursor-pointer ${
                sortKey === 'registeredVoters' ? 'bg-fantas-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
                  <td className="py-2.5 px-4 tracking-wide text-sm font-axis-number-focus text-slate-700">{row.registeredVoters.toLocaleString()}</td>
                  <td className="py-2.5 px-4 tracking-wide text-sm font-axis-number-focus text-slate-900">{row.actualVoters.toLocaleString()}</td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-axis-number-focus text-sm text-slate-900 min-w-[45px]">{row.turnoutPct}%</span>
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
