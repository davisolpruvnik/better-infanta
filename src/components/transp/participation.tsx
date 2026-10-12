// src/components/transparency/ParticipationTab.tsx
import { useState, useMemo, useRef, useCallback, lazy } from 'react';
import hexCartoJson from '@/data/geog/turnout-map/infanta_hex_precincts.json';

const LazyIcon = lazy(() =>
  import('@iconify/react').then(module => ({ default: module.Icon }))
);

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

const normalizeName = (name: string): string => {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
};

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

  const [searchQuery, setSearchQuery] = useState('');
  const [colorblindMode, setColorblindMode] = useState(false);
  const [sortKey, setSortKey] = useState<'turnoutPct' | 'registeredVoters'>('turnoutPct');

  const [transform, setTransform] = useState<{ x: number; y: number; k: number }>({ x: 0, y: 0, k: 1 });
  const [isPanning, setIsPanning] = useState(false);

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; initX: number; initY: number; moved: boolean }>({
    clientX: 0, clientY: 0, initX: 0, initY: 0, moved: false,
  });
  const svgRef = useRef<SVGSVGElement | null>(null);

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

  const { projectedHexes } = useMemo(() => {
    const width = 800, height = 600, padding = 45;
    const allCoords: [number, number][] = [];

    const extractCoords = (coords: any) => {
      if (!Array.isArray(coords)) return;
      if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
        allCoords.push([coords[0], coords[1]]);
        return;
      }
      coords.forEach(extractCoords);
    };

    geoJson.features.forEach((f: any) => {
      if (f.geometry?.coordinates) extractCoords(f.geometry.coordinates);
    });

    if (allCoords.length === 0) return { projectedHexes: [] };

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    allCoords.forEach(([x, y]) => {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });

    const xDiff = maxX - minX || 1;
    const yDiff = maxY - minY || 1;
    const scale = Math.min((width - padding * 2) / xDiff, (height - padding * 2) / yDiff);

    const pixelWidth = xDiff * scale;
    const pixelHeight = yDiff * scale;
    const offsetX = (width - pixelWidth) / 2;
    const offsetY = (height - pixelHeight) / 2;

    const project = (x: number, y: number) => [
      offsetX + (x - minX) * scale,
      height - offsetY - (y - minY) * scale,
    ];

    const hexes = geoJson.features.map((feature: any, idx: number) => {
      const props: PrecinctTurnoutProps = {
        barangay: feature.properties?.barangay || `Barangay ${idx + 1}`,
        precinct_id: String(feature.properties?.precinct_id || `P-${idx + 1}`),
        registered_voters: Number(feature.properties?.registered_voters) || 0,
        actual_voters: Number(feature.properties?.actual_voters) || 0,
        turnout_pct: Number(feature.properties?.turnout_pct) || 0,
      };

      const ringToD = (ring: [number, number][]) =>
        ring.map((c, rIdx) => {
          const [px, py] = project(c[0], c[1]);
          return `${rIdx === 0 ? 'M' : 'L'} ${px.toFixed(2)} ${py.toFixed(2)}`;
        }).join(' ') + ' Z';

      let pathD = '';
      if (feature.geometry?.type === 'Polygon') {
        pathD = feature.geometry.coordinates.map(ringToD).join(' ');
      } else if (feature.geometry?.type === 'MultiPolygon') {
        pathD = feature.geometry.coordinates.map((p: any) => p.map(ringToD).join(' ')).join(' ');
      }

      const pts: [number, number][] = [];
      const getPoints = (coords: any) => {
        if (!Array.isArray(coords)) return;
        if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
          pts.push(project(coords[0], coords[1]) as [number, number]);
          return;
        }
        coords.forEach(getPoints);
      };
      if (feature.geometry?.coordinates) getPoints(feature.geometry.coordinates);

      let fMinX = Infinity, fMaxX = -Infinity, fMinY = Infinity, fMaxY = -Infinity;
      pts.forEach(([px, py]) => {
        if (px < fMinX) fMinX = px;
        if (px > fMaxX) fMaxX = px;
        if (py < fMinY) fMinY = py;
        if (py > fMaxY) fMaxY = py;
      });

      return {
        props,
        pathD,
        bounds: {
          x: fMinX,
          y: fMinY,
          w: Math.max(fMaxX - fMinX, 20),
          h: Math.max(fMaxY - fMinY, 20),
          cx: fMinX + Math.max(fMaxX - fMinX, 20) / 2,
          cy: fMinY + Math.max(fMaxY - fMinY, 20) / 2,
        },
      };
    });

    return { projectedHexes: hexes };
  }, [geoJson]);

  const zoomToBarangay = useCallback((targetBrgy: string) => {
    const cluster = projectedHexes.filter(
      h => normalizeName(h.props.barangay) === normalizeName(targetBrgy)
    );
    if (cluster.length > 0) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      cluster.forEach(h => {
        if (h.bounds.x < minX) minX = h.bounds.x;
        if (h.bounds.x + h.bounds.w > maxX) maxX = h.bounds.x + h.bounds.w;
        if (h.bounds.y < minY) minY = h.bounds.y;
        if (h.bounds.y + h.bounds.h > maxY) maxY = h.bounds.y + h.bounds.h;
      });

      const w = maxX - minX, h = maxY - minY;
      const targetK = Math.min(Math.max(800 / (w + 140), 600 / (h + 140)), 3.5);
      const targetX = 400 - (minX + w / 2) * targetK;
      const targetY = 300 - (minY + h / 2) * targetK;

      if (isFinite(targetX) && isFinite(targetY) && isFinite(targetK)) {
        setTransform({ x: targetX, y: targetY, k: targetK });
      }
    }
  }, [projectedHexes]);

  const handleSelectPrecinct = (props: PrecinctTurnoutProps) => {
    if (dragStartRef.current.moved) return;
    setSelectedFeature(props);
    zoomToBarangay(props.barangay);
  };

  const handleResetView = () => {
    setSelectedFeature(null);
    setHoveredBrgy(null);
    setHoveredPrecinctId(null);
    setTransform({ x: 0, y: 0, k: 1 });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
    dragStartRef.current = {
      clientX: e.clientX, clientY: e.clientY, initX: transform.x, initY: transform.y, moved: false,
    };
    isDraggingRef.current = true;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragStartRef.current.moved = true;
      setIsPanning(true);
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setTransform(prev => ({
          ...prev,
          x: dragStartRef.current.initX + dx * (800 / (rect.width || 800)),
          y: dragStartRef.current.initY + dy * (600 / (rect.height || 600)),
        }));
      }
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    setIsPanning(false);
  };

  const handleZoom = (factor: number) => {
    setTransform(prev => {
      const newK = Math.min(Math.max(prev.k * factor, 0.7), 5.0);
      const ratio = newK / prev.k;
      return { x: 400 - (400 - prev.x) * ratio, y: 300 - (300 - prev.y) * ratio, k: newK };
    });
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return barangaySummaries.filter(b => b.barangay.toLowerCase().includes(q)).slice(0, 5);
  }, [searchQuery, barangaySummaries]);

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
      {/* 🔍 Search Input & Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-axis-wide-header uppercase tracking-wide text-slate-900">
            Voter Turnout & Participation
          </h2>
          <p className="text-md font-axis-subtitular-focus tracking-wide text-slate-500">
            Analyze clustered precinct turnout and voter engagement across all 36 barangays of Infanta.
          </p>
        </div>

        <div className="w-full md:w-80 relative">
          <div className="flex flex-row items-center gap-2.5 px-3.5 py-2 bg-white border border-slate-300 focus-within:border-slate-900 transition-all">
            <LazyIcon name="lucide:search" className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search barangay..."
              className="w-full text-xs font-axis-navbar-focus text-slate-800 placeholder-slate-400 bg-transparent outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer">
                ×
              </button>
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-1.5 bg-white border border-slate-200 z-50 overflow-hidden divide-y divide-slate-100 shadow-sm">
              {searchResults.map(b => (
                <button
                  key={b.barangay}
                  onClick={() => {
                    zoomToBarangay(b.barangay);
                    const firstTile = projectedHexes.find(h => normalizeName(h.props.barangay) === normalizeName(b.barangay));
                    if (firstTile) setSelectedFeature(firstTile.props);
                    setSearchQuery('');
                  }}
                  className="w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-slate-50 transition-colors text-xs font-axis-navbar-focus cursor-pointer"
                >
                  <span className="font-semibold text-slate-900">{b.barangay}</span>
                  <span className="text-slate-500 font-mono">{b.turnoutPct}% Turnout</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🗺️ Main 2-Column Cartogram Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-7xl mx-auto">
        <div className="lg:col-span-8 w-full bg-white border border-slate-200 flex flex-col p-4 relative select-none">
          <div className="absolute top-6 left-6 z-20 pointer-events-none">
            <span className="inline-flex items-center gap-1.5 px-2 py-1.5 bg-[#0f172a] text-white text-[12px] font-axis-navbar-focus uppercase tracking-wider">
              <span>⬡</span> 1 Hex = 1 Clustered Precinct
            </span>
          </div>

          <div className="absolute top-6 right-6 z-20 flex flex-col gap-1.5">
            <button onClick={() => handleZoom(1.35)} className="size-8 bg-[#334155] hover:bg-[#0f172a] text-white flex items-center justify-center text-base font-bold transition-colors cursor-pointer">+</button>
            <button onClick={() => handleZoom(0.74)} className="size-8 bg-[#334155] hover:bg-[#0f172a] text-white flex items-center justify-center text-base font-bold transition-colors cursor-pointer">−</button>
            {(transform.k !== 1 || transform.x !== 0 || transform.y !== 0) && (
              <button onClick={handleResetView} className="size-8 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer mt-1" title="Reset view">
                <LazyIcon name="lucide:rotate-ccw" className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className={`w-full h-[400px] sm:h-[480px] lg:h-[520px] flex items-center justify-center relative overflow-hidden touch-none ${
              isPanning ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            <svg ref={svgRef} className="w-full h-full overflow-visible" viewBox="0 0 800 600">
              <g style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`, transition: isPanning ? 'none' : 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1)' }}>
                {projectedHexes.map((hex, idx) => {
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
              </g>
            </svg>
          </div>

          <div className="border-t border-slate-100 pt-2 flex justify-between items-center text-[12px] tracking-wider font-axis-footer-focus uppercase text-slate-400">
            <span>Infanta Electoral Return Cartogram</span>
            <span>Drag map to pan • Click any hex tile to inspect precinct</span>
          </div>
        </div>

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

      {/* 📋 BOTTOM TABLE: Rankings & JSON Exporter */}
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
                    zoomToBarangay(row.barangay);
                    const tile = projectedHexes.find(h => normalizeName(h.props.barangay) === normalizeName(row.barangay));
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
