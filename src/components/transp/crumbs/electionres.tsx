// src/components/transparency/ElectionResultsTab.tsx
import { useState, useMemo, useRef, useCallback, lazy, Suspense } from 'react';
import precinctCartoJson from '@/data/geog/turnout-map/infanta_hex_precincts.json';
import PrecinctSheet from './precinctSheet';

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
  tandemSegments: TandemSegment[]; // 💡 Added
  leadMayor: string;
  mayorLeadPct: number;
  leadVM: string;
  vmLeadPct: number;
  splitTicketCount: number;
}

const normalizeName = (name: string): string => {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
};

const TANDEM_COLORS: Record<string, string> = {
  'Ruanto-America (Mannie)': '#7c3aed', // Violet
  'Escueta-America (Grace)': '#10b981', // Green
  'Ruanto-America (Grace)': '#f59e0b',  // Amber (Split Ticket)
  'Escueta-America (Mannie)': '#06b6d4', // Cyan (Split Ticket)
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
  if (pct >= c.c2) return '#6d28d9'; // Deep Violet
  if (pct >= c.c1) return '#8b5cf6'; // Medium Violet
  if (pct > 50) return '#c4b5fd';   // Light Violet
  if (pct === 50) return '#f1f5f9';  // Tie
  if (pct > 100 - c.c1) return '#6ee7b7'; // Light Green
  if (pct > 100 - c.c2) return '#10b981'; // Medium Green
  return '#047857';                      // Deep Green
}

export default function ElectionResultsTab() {
  const geoJson = precinctCartoJson as any;

  const [mode, setMode] = useState<ResultsMode>('tandem');
  const [selectedFeature, setSelectedFeature] = useState<PrecinctResultProps | null>(null);
  const [hoveredPrecinctId, setHoveredPrecinctId] = useState<string | null>(null);
  const [hoveredBrgy, setHoveredBrgy] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [transform, setTransform] = useState<{ x: number; y: number; k: number }>({ x: 0, y: 0, k: 1 });
  const [isPanning, setIsPanning] = useState(false);

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; initX: number; initY: number; moved: boolean }>({
    clientX: 0, clientY: 0, initX: 0, initY: 0, moved: false,
  });
  const svgRef = useRef<SVGSVGElement | null>(null);

  // 💡 Check if election results exist in the GeoJSON
  const hasElectionData = useMemo(() => {
    if (!geoJson?.features || geoJson.features.length === 0) return false;
    return geoJson.features.some((f: any) => {
      const p = f.properties || {};
      return p.mayor_winner || p.mayor_vice_winners || p.diverging_mayor_pct !== undefined;
    });
  }, [geoJson]);

  // 💡 Compute Dynamic Symmetric Maximum and Ticks (nearest 5%)
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

  // 💡 Aggregate Barangay Summaries with numbers
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

      // Extract precinct percentages
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
          // Find top tandem
          let topTandem = '—', maxTCount = 0;
          for (const [k, count] of Object.entries(item.tandems)) {
            if (count > maxTCount) { maxTCount = count; topTandem = k; }
          }

          // 💡 Build sorted stacked bar segments (highest count first)
          const tandemSegments: TandemSegment[] = Object.entries(item.tandems)
            .sort((a, b) => b[1] - a[1])
            .map(([tandem, count]) => ({
              tandem,
              count,
              color: getTandemColor(tandem),
            }));

      // Find top mayor
      let topMayor = '—', maxMCount = 0, mAvgPct = 0;
      for (const [k, data] of Object.entries(item.mayors)) {
        if (data.count > maxMCount) {
          maxMCount = data.count;
          topMayor = k;
          mAvgPct = Number((data.totalPct / data.count).toFixed(1));
        }
      }

      // Find top VM
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
              tandemSegments, // 💡 Added
              leadMayor: topMayor,
              mayorLeadPct: mAvgPct,
              leadVM: topVM,
              vmLeadPct: vmAvgPct,
              splitTicketCount: item.splitCount,
            });
    });

    return summaries.sort((a, b) => a.barangay.localeCompare(b.barangay));
  }, [geoJson]);

  // 💡 Overall KPI Statistics
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

  // Coordinate Projection Engine
  const { projectedprecincts } = useMemo(() => {
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

    if (allCoords.length === 0) return { projectedprecincts: [] };

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

    const precincts = geoJson.features.map((feature: any, idx: number) => {
      const p = feature.properties || {};
      const props: PrecinctResultProps = {
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
        pathD = feature.geometry.coordinates.map((poly: any) => poly.map(ringToD).join(' ')).join(' ');
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

    return { projectedprecincts: precincts };
  }, [geoJson]);

  const zoomToBarangay = useCallback((targetBrgy: string) => {
    const cluster = projectedprecincts.filter(
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
  }, [projectedprecincts]);

  const handleSelectPrecinct = (props: PrecinctResultProps) => {
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

  // Detailed precinct percentage calculator
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

    return {
      ruantoPct,
      escuetaPct,
      mayorMargin,
      manniePct,
      gracePct,
      vmMargin,
    };
  }, [selectedFeature]);

  return (
    <div className="space-y-8 animate-fade-in text-start select-none">
      {/* Warning if GeoJSON lacks election results */}
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

      {/* 📊 SUMMARY KPI TILES BAR (WITH NUMBERS) */}
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

      {/* 🔍 Header & Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-axis-wide-header uppercase tracking-wide text-slate-900">
            Electoral Race Returns
          </h2>
          <p className="text-md font-axis-subtitular-focus tracking-wide text-slate-500">
            Explore Mayoral, Vice-Mayoral, and straight vs. split-ticket tandem results by precinct precinct.
          </p>
        </div>

        <div className="w-full md:w-80 relative">
          <div className="flex flex-row items-center gap-2.5 px-3.5 py-2 bg-white border border-slate-300 focus-within:border-slate-900 transition-all">
            <LazyIcon name="lucide:search" className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search barangay results..."
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
                    const firstTile = projectedprecincts.find(h => normalizeName(h.props.barangay) === normalizeName(b.barangay));
                    if (firstTile) setSelectedFeature(firstTile.props);
                    setSearchQuery('');
                  }}
                  className="w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-slate-50 transition-colors text-xs font-axis-navbar-focus cursor-pointer"
                >
                  <span className="font-semibold text-slate-900">{b.barangay}</span>
                  <span className="text-slate-500 font-axis-number-focus text-[11px]">{b.leadTandem} ({b.tandemCount}/{b.totalPrecincts})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🎛️ CONTEST TOGGLE BAR */}
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

      {/* 🗺️ Main Cartogram Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-7xl mx-auto">

              {/* 🗺️ MAP: Mobile 2nd (order-2) | Desktop Left 8 Cols (lg:order-1) */}
              <div className="order-2 lg:order-1 lg:col-span-8 w-full bg-white border border-slate-200 flex flex-col p-4 relative select-none">
                <div className="absolute top-6 left-6 z-20 pointer-events-none">
                  <span className="inline-flex items-center gap-1.5 px-2 py-1.5 bg-[#0f172a] text-white text-[12px] font-axis-navbar-focus uppercase tracking-wider">
                    <span>⬡</span> 1 hex = 1 Clustered Precinct
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
                      {projectedprecincts.map((precinct, idx) => {
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
                    </g>
                  </svg>
                </div>

                <div className="border-t border-slate-100 pt-2 flex justify-between items-center text-[12px] tracking-wider font-axis-footer-focus uppercase text-slate-400">
                  <span>Infanta Electoral Return Cartogram</span>
                  <span>Drag map to pan • Click any precinct tile to inspect precinct vote shares</span>
                </div>
              </div>

              {/* 🏷️ LEGEND / INSPECTOR: Mobile 1st (order-1) | Desktop Right 4 Cols (lg:order-2) */}
              <div className="order-2 lg:order-2 lg:col-span-4 space-y-6 flex flex-col justify-start h-full pt-2 lg:pt-0">
                              {selectedFeature ? (
                                /* 🖥️ DESKTOP ONLY: Shows on desktop (lg:), hidden on mobile */
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

                                  {/* 🗳️ DETAILED RACE PERCENTAGES & VOTE BREAKDOWNS */}
                                  <div className="bg-slate-50 border border-slate-200 p-3.5 space-y-3 text-xs">
                                    <div className="text-[10px] font-axis-navbar-focus uppercase tracking-wider text-slate-400">
                                      Precinct Vote Breakdown
                                    </div>

                                    {/* MAYOR RACE */}
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between text-sm uppercase tracking-wide">
                                        <span className="font-axis-navbar-focus text-slate-600">Mayor:</span>

                                        <span
                                          className={`font-semibold font-axis-navbar-focus ${
                                            selectedFeature.mayor_winner === 'Ruanto'
                                              ? 'text-purple-800'
                                              : selectedFeature.mayor_winner === 'Escueta'
                                              ? 'text-emerald-700'
                                              : 'text-slate-900'
                                          }`}
                                        >
                                          {selectedFeature.mayor_winner || 'N/A'}{' '}
                                          <span className="font-axis-number-focus font-bold">
                                            ({selectedFeature.mayor_winner === 'Ruanto'
                                              ? selectedDetails?.ruantoPct
                                              : selectedDetails?.escuetaPct}%)
                                          </span>
                                        </span>
                                      </div>

                                      {selectedDetails && (
                                        <div className="w-full bg-slate-200 h-2 flex overflow-hidden">
                                          <div
                                            style={{ width: `${selectedDetails.escuetaPct}%` }}
                                            className="bg-[#10b981]"
                                            title={`Escueta: ${selectedDetails.escuetaPct}%`}
                                          />
                                          <div
                                            style={{ width: `${selectedDetails.ruantoPct}%` }}
                                            className="bg-[#6e11b0]"
                                            title={`Ruanto: ${selectedDetails.ruantoPct}%`}
                                          />
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

                                    {/* VICE MAYOR RACE */}
                                    <div className="space-y-1 pt-2 border-t border-slate-200/60">
                                      <div className="flex items-center justify-between text-sm uppercase tracking-wide">
                                        <span className="font-axis-navbar-focus text-slate-600">Vice Mayor:</span>

                                        <span
                                          className={`font-semibold font-axis-navbar-focus ${
                                            selectedFeature.vice_mayor_winner?.includes('Mannie')
                                              ? 'text-purple-800'
                                              : selectedFeature.vice_mayor_winner?.includes('Grace')
                                              ? 'text-emerald-700'
                                              : 'text-slate-900'
                                          }`}
                                        >
                                          {selectedFeature.vice_mayor_winner || 'N/A'}{' '}
                                          <span className="font-axis-number-focus font-bold">
                                            ({selectedFeature.vice_mayor_winner?.includes('Mannie')
                                              ? selectedDetails?.manniePct
                                              : selectedDetails?.gracePct}%)
                                          </span>
                                        </span>
                                      </div>

                                      {selectedDetails && (
                                        <div className="w-full bg-slate-200 h-2 flex overflow-hidden">
                                          <div
                                            style={{ width: `${selectedDetails.gracePct}%` }}
                                            className="bg-[#10b981]"
                                            title={`Grace: ${selectedDetails.gracePct}%`}
                                          />
                                          <div
                                            style={{ width: `${selectedDetails.manniePct}%` }}
                                            className="bg-[#6e11b0]"
                                            title={`Mannie: ${selectedDetails.manniePct}%`}
                                          />
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
                                      <div className="text-lg font-axis-sng-indlab-value text-slate-900">
                                        {selectedFeature.actual_voters.toLocaleString()}{' '}
                                        <span className="text-[11px] text-slate-400 tracking-wide">/ {selectedFeature.registered_voters.toLocaleString()}</span>
                                      </div>
                                    </div>
                                    <div className="flex flex-row items-baseline gap-2">
                                      <span className="text-[11px] uppercase tracking-wider font-axis-navbar-focus text-slate-400">Turnout %</span>
                                      <div className="text-lg font-axis-sng-indlab-value text-slate-900">
                                        {selectedFeature.turnout_pct}%
                                      </div>
                                    </div>
                                  </div>

                                  <button onClick={handleResetView} className="w-full mt-4 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-axis-navbar-focus uppercase tracking-wider transition-colors cursor-pointer">
                                    Reset Map View
                                  </button>
                                </div>
                              ) : (
                                /* STATE 2: DYNAMIC LEGEND WITH NUMBERS */
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

                                        {/* DIVERGING BAR WITH DYNAMIC MIRRORED CUTOFFS */}
                                        <div className="grid grid-cols-6 w-full h-4 overflow-hidden border border-slate-200">
                                          <div className="bg-[#047857]" title={`Escueta/Grace Stronghold (>${scaleMetrics.c2}%)`} />
                                          <div className="bg-[#10b981]" title={`Escueta/Grace Solid (${scaleMetrics.c1}-${scaleMetrics.c2}%)`} />
                                          <div className="bg-[#6ee7b7]" title={`Escueta/Grace Lean (50-${scaleMetrics.c1}%)`} />
                                          <div className="bg-[#c4b5fd]" title={`Ruanto/Mannie Lean (50-${scaleMetrics.c1}%)`} />
                                          <div className="bg-[#8b5cf6]" title={`Ruanto/Mannie Solid (${scaleMetrics.c1}-${scaleMetrics.c2}%)`} />
                                          <div className="bg-[#6d28d9]" title={`Ruanto/Mannie Stronghold (>${scaleMetrics.c2}%)`} />
                                        </div>

                                        {/* NUMBERS ON THE COLORBAR */}
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

                          {/* 📱 MOBILE BOTTOM SHEET (Appears only on mobile viewports when a precinct is selected) */}
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

                                {/* 🗳️ DETAILED RACE PERCENTAGES & VOTE BREAKDOWNS (Mobile Sheet) */}
                                <div className="bg-slate-50 border border-slate-200 p-3 space-y-3 text-xs">
                                  {/* MAYOR RACE */}
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

                                  {/* VICE MAYOR RACE */}
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

                                  {/* TANDEM OUTCOME */}
                                  {selectedFeature.mayor_vice_winners && (
                                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                                      <span className="text-slate-600 font-axis-navbar-focus uppercase tracking-wide text-[10px]">Tandem:</span>
                                      <span className="px-1.5 py-0.5 font-semibold text-[10px] font-axis-navbar-focus uppercase tracking-wide border bg-white">
                                        {selectedFeature.mayor_vice_winners}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* PARTICIPATION FIGURES */}
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

      {/* 📋 BOTTOM TABLE: Barangay Contest Summary with NUMBERS */}
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
                      {/* 💡 Widened column header for the stacked bar */}
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
                          zoomToBarangay(row.barangay);
                          const tile = projectedprecincts.find(h => normalizeName(h.props.barangay) === normalizeName(row.barangay));
                          if (tile) setSelectedFeature(tile.props);
                        }}
                        className={`cursor-pointer transition-colors ${
                          selectedFeature?.barangay === row.barangay ? 'bg-emerald-50 text-sm' : hoveredBrgy === row.barangay ? 'bg-slate-50' : ''
                        }`}
                      >
                        <td className="py-2.5 px-4 text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-4 tracking-wide text-sm font-semibold text-slate-900">{row.barangay}</td>
                        <td className="py-2.5 px-4 tracking-wide text-sm font-axis-number-focus text-slate-600">{row.totalPrecincts}</td>

                        {/* 💡 STACKED BAR CELL HERE */}
                        <td className="py-2.5 px-4 min-w-[220px]">
                          <div className="flex flex-col gap-1">
                            {/* Name & Count Header */}
                            <div className="flex items-center justify-between text-[11px] font-axis-navbar-focus">
                              <span className="font-semibold tracking-wide text-slate-800 truncate max-w-[140px]">
                                {row.leadTandem}
                              </span>
                              <span className="text-slate-500 font-axis-number-focus text-[10px]">
                                {row.tandemCount}/{row.totalPrecincts} precinct{row.totalPrecincts > 1 ? 's' : ''}
                              </span>
                            </div>

                            {/* Stacked Colored Bar */}
                            <div className="w-full h-2.5 bg-slate-100 flex overflow-hidden border border-slate-200">
                              {row.tandemSegments?.map((seg, sIdx) => {
                                const pct = (seg.count / row.totalPrecincts) * 100;
                                return (
                                  <div
                                    key={sIdx}
                                    style={{
                                      width: `${pct}%`,
                                      backgroundColor: seg.color,
                                    }}
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
