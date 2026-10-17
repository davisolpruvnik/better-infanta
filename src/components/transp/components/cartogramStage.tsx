// src/components/transp/crumbs/CartogramStage.tsx
import { useState, useRef, useCallback, lazy, Suspense, useMemo, type ReactNode, type RefObject } from 'react';

const Iconify = lazy(() =>
  import('@iconify/react').then(module => ({ default: module.Icon }))
);

export function LazyIcon({ name, icon, className }: { name?: string; icon?: string; className?: string }) {
  const iconIdentifier = icon || name || '';
  return (
    <Suspense fallback={<span className={`inline-block ${className || 'size-4'}`} />}>
      <Iconify icon={iconIdentifier} className={className} />
    </Suspense>
  );
}

export const normalizeName = (name: string): string => {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
};

export function useCartogramPanZoom() {
  const [transform, setTransform] = useState<{ x: number; y: number; k: number }>({ x: 0, y: 0, k: 1 });
  const [isPanning, setIsPanning] = useState(false);

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; initX: number; initY: number; moved: boolean }>({
    clientX: 0, clientY: 0, initX: 0, initY: 0, moved: false,
  });
  const svgRef = useRef<SVGSVGElement | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
    dragStartRef.current = {
      clientX: e.clientX, clientY: e.clientY, initX: transform.x, initY: transform.y, moved: false,
    };
    isDraggingRef.current = true;
  }, [transform.x, transform.y]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
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
  }, []);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
    setIsPanning(false);
  }, []);

  const handleZoom = useCallback((factor: number) => {
    setTransform(prev => {
      const newK = Math.min(Math.max(prev.k * factor, 0.7), 5.0);
      const ratio = newK / prev.k;
      return { x: 400 - (400 - prev.x) * ratio, y: 300 - (300 - prev.y) * ratio, k: newK };
    });
  }, []);

  const handleResetTransform = useCallback(() => {
    setTransform({ x: 0, y: 0, k: 1 });
  }, []);

  const hasMoved = useCallback(() => dragStartRef.current.moved, []);

  return {
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
  };
}

// 🧮 Shared Projection & Zoom Engine
export function useGeoJsonProjection<T extends { barangay: string }>(
  geoJson: any,
  mapProps: (properties: any, idx: number) => T
) {
  const projectedFeatures = useMemo(() => {
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

    geoJson?.features?.forEach((f: any) => {
      if (f.geometry?.coordinates) extractCoords(f.geometry.coordinates);
    });

    if (allCoords.length === 0) return [];

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

    const ringToD = (ring: [number, number][]) =>
      ring.map((c, rIdx) => {
        const [px, py] = project(c[0], c[1]);
        return `${rIdx === 0 ? 'M' : 'L'} ${px.toFixed(2)} ${py.toFixed(2)}`;
      }).join(' ') + ' Z';

    return (geoJson?.features || []).map((feature: any, idx: number) => {
      const props = mapProps(feature.properties || {}, idx);

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
  }, [geoJson, mapProps]);

  const zoomToBarangay = useCallback((targetBrgy: string, setTransform: (updater: any) => void) => {
    const cluster = projectedFeatures.filter(
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
  }, [projectedFeatures]);

  return { projectedFeatures, zoomToBarangay };
}

// 🔍 Shared Barangay Search Bar with Dropdown
interface BarangaySearchBarProps<T> {
  placeholder?: string;
  items: T[];
  getBarangayName: (item: T) => string;
  renderSubtitle: (item: T) => ReactNode;
  onSelect: (barangayName: string) => void;
}

export function BarangaySearchBar<T>({
  placeholder = 'Search barangay...',
  items,
  getBarangayName,
  renderSubtitle,
  onSelect,
}: BarangaySearchBarProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return items.filter(b => getBarangayName(b).toLowerCase().includes(q)).slice(0, 5);
  }, [searchQuery, items, getBarangayName]);

  return (
    <div className="w-full md:w-80 relative">
      <div className="flex flex-row items-center gap-2.5 px-3.5 py-2 bg-white border border-slate-300 focus-within:border-slate-900 transition-all">
        <LazyIcon name="lucide:search" className="h-4 w-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={placeholder}
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
          {searchResults.map(item => {
            const bName = getBarangayName(item);
            return (
              <button
                key={bName}
                onClick={() => {
                  onSelect(bName);
                  setSearchQuery('');
                }}
                className="w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-slate-50 transition-colors text-xs font-axis-navbar-focus cursor-pointer"
              >
                <span className="font-semibold text-slate-900">{bName}</span>
                {renderSubtitle(item)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// 🗺️ Shared Stage Wrapper
interface CartogramStageProps {
  svgRef: RefObject<SVGSVGElement | null>;
  transform: { x: number; y: number; k: number };
  isPanning: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: () => void;
  onZoom: (factor: number) => void;
  onReset: () => void;
  badgeText?: string;
  subText?: string;
  className?: string;
  children: ReactNode;
}

export function CartogramStage({
  svgRef,
  transform,
  isPanning,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onZoom,
  onReset,
  badgeText = '1 hex = 1 Clustered Precinct',
  subText = 'Drag map to pan • Click any tile to inspect',
  className = '',
  children,
}: CartogramStageProps) {
  const isTransformed = transform.k !== 1 || transform.x !== 0 || transform.y !== 0;

  return (
    <div className={`w-full bg-white border border-slate-200 flex flex-col p-4 relative select-none ${className}`}>
      <div className="absolute top-6 left-6 z-20 pointer-events-none">
        <span className="inline-flex items-center gap-1.5 px-2 py-1.5 bg-[#0f172a] text-white text-[12px] font-axis-navbar-focus uppercase tracking-wider">
          <span>⬡</span> {badgeText}
        </span>
      </div>

      <div className="absolute top-6 right-6 z-20 flex flex-col gap-1.5">
        <button
          onClick={() => onZoom(1.35)}
          className="size-8 bg-[#334155] hover:bg-[#0f172a] text-white flex items-center justify-center text-base font-bold transition-colors cursor-pointer"
        >
          +
        </button>
        <button
          onClick={() => onZoom(0.74)}
          className="size-8 bg-[#334155] hover:bg-[#0f172a] text-white flex items-center justify-center text-base font-bold transition-colors cursor-pointer"
        >
          −
        </button>
        {isTransformed && (
          <button
            onClick={onReset}
            className="size-8 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer mt-1"
            title="Reset view"
          >
            <LazyIcon name="lucide:rotate-ccw" className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className={`w-full h-[400px] sm:h-[480px] lg:h-[520px] flex items-center justify-center relative overflow-hidden touch-none ${
          isPanning ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <svg ref={svgRef} className="w-full h-full overflow-visible" viewBox="0 0 800 600">
          <g
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`,
              transition: isPanning ? 'none' : 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {children}
          </g>
        </svg>
      </div>

      <div className="border-t border-slate-100 pt-2 flex justify-between items-center text-[12px] tracking-wider font-axis-footer-focus uppercase text-slate-400">
        <span>Infanta Electoral Return Cartogram</span>
        <span>{subText}</span>
      </div>
    </div>
  );
}
