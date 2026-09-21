// src/pages/Barangays.tsx
import { useState, lazy, Suspense, useMemo, useRef, useCallback } from 'react';
import Section from '@/components/ui/Section';
import Breadcrumbsless from '@/components/ui/BreadcrumbsLess';
import SEO from '@/components/SEO';

// 💡 1. Imports
import { INFANTA_BARANGAYS } from '@/data/censusDataInfanta';
import infantaGeoJson from '@/data/geog/infanta_barangays.json';
import LazyIcon from '@/components/ui/Lazying';

interface BarangayDetail {
  name: string;
  captain: string;
  population: number;
  previousPopulation: number;
  households: number;
  area: number;
  term: string;
  district: string;
  history: { year: number; population: number }[];
}

interface InsetSector {
  name: string;
  shortCode: string;
}

// 4 Special Sectors excluded from main projection bounding box
const INSET_SECTORS: InsetSector[] = [
  { name: "Magsaysay", shortCode: "MAG" },
  { name: "Poblacion 1", shortCode: "P01" },
  { name: "Poblacion 38", shortCode: "P38" },
  { name: "Poblacion 39", shortCode: "P39" }
];

const normalizeName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/^brgy\.?\s*/i, '')
    .replace(/^barangay\s*/i, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

const findTSBarangay = (geoJsonName: string) => {
  const normGeo = normalizeName(geoJsonName);
  return INFANTA_BARANGAYS.find(b => normalizeName(b.name) === normGeo);
};

const isInsetSector = (name: string): boolean => {
  const norm = normalizeName(name);
  return INSET_SECTORS.some(s => normalizeName(s.name) === norm);
};

export default function Barangays() {
  const geoJson = infantaGeoJson as any;

  const [selectedBarangay, setSelectedBarangay] = useState<BarangayDetail | null>(null);
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [colorblindMode, setColorblindMode] = useState(false);

  // 💡 Pan & Zoom State
  const [transform, setTransform] = useState<{ x: number; y: number; k: number }>({ x: 0, y: 0, k: 1 });
  const [isPanning, setIsPanning] = useState(false);

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; initX: number; initY: number; moved: boolean }>({
    clientX: 0,
    clientY: 0,
    initX: 0,
    initY: 0,
    moved: false,
  });

  const svgRef = useRef<SVGSVGElement | null>(null);

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Government', href: '/government' },
    { label: 'Barangays', href: undefined },
  ];

  // High-contrast choropleth color scale
  const getChoroplethColor = (population: number) => {
    if (colorblindMode) {
      return population >= 4000 ? '#180f3d' : // Deep purple-black (Dense)
                 population >= 3000 ? '#51127c' : // Rich purple
                 population >= 2000 ? '#b73779' : // Berry magenta
                 population >= 1000 ? '#fb8861' : // Soft peach
                                      '#fcfdbf';  // Pale cream (Sparse)
    }
    return population >= 4000 ? '#402401' :
               population >= 3000 ? '#884c02' :
               population >= 2000 ? '#e27f04' :
               population >= 1000 ? '#fcab45' :
                                    '#fed6a5';
  };

  // 💡 Mathematical Mercator Projection Engine
  const { projectedFeatures } = useMemo(() => {
    const width = 800;
    const height = 600;
    const padding = 45;

    const validCoords: [number, number][] = [];
    const extractCoords = (coords: any) => {
      if (!Array.isArray(coords)) return;
      if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
        const [lon, lat] = coords;
        if (lon > 120 && lon < 123 && lat > 13 && lat < 16) {
          validCoords.push([lon, lat]);
        }
        return;
      }
      coords.forEach(extractCoords);
    };

    geoJson.features.forEach((f: any) => {
      const geoName = f.properties?.adm4_en || f.properties?.name || '';
      if (isInsetSector(geoName)) return;

      if (f.geometry?.coordinates) {
        extractCoords(f.geometry.coordinates);
      }
    });

    if (validCoords.length === 0) {
      return { projectedFeatures: [] };
    }

    let minLon = Infinity, maxLon = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;

    validCoords.forEach(([lon, lat]) => {
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    });

    const lonDiff = maxLon - minLon || 0.001;
    const latDiff = maxLat - minLat || 0.001;

    const latCorrection = Math.cos((14.75 * Math.PI) / 180);
    const geoWidth = lonDiff * latCorrection;
    const geoHeight = latDiff;

    const availableWidth = width - padding * 2;
    const availableHeight = height - padding * 2;

    const scale = Math.min(availableWidth / geoWidth, availableHeight / geoHeight);
    const mapPixelWidth = geoWidth * scale;
    const mapPixelHeight = geoHeight * scale;

    const offsetX = (width - mapPixelWidth) / 2;
    const offsetY = (height - mapPixelHeight) / 2;

    const project = (lon: number, lat: number) => {
      const x = offsetX + (lon - minLon) * latCorrection * scale;
      const y = height - offsetY - (lat - minLat) * scale;
      return [x, y];
    };

    const projected = geoJson.features.map((feature: any, idx: number) => {
      const geoName = feature.properties?.adm4_en || feature.properties?.name || `Barangay ${idx + 1}`;
      const areaKm2 = feature.properties?.area_km2 || 0;
      const tsData = findTSBarangay(geoName);
      const pop = tsData ? tsData.population : (feature.properties?.population || 1200);

      const ringToD = (ring: [number, number][]) => {
        return ring
          .map((coord, rIdx) => {
            const [x, y] = project(coord[0], coord[1]);
            return `${rIdx === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
          })
          .join(' ') + ' Z';
      };

      let pathD = '';
      const geom = feature.geometry;
      if (geom?.type === 'Polygon') {
        pathD = geom.coordinates.map(ringToD).join(' ');
      } else if (geom?.type === 'MultiPolygon') {
        pathD = geom.coordinates.map((poly: any) => poly.map(ringToD).join(' ')).join(' ');
      }

      // Feature bounding box & centroid calculation
      const featureCoords: [number, number][] = [];
      const extractFeaturePoints = (coords: any) => {
        if (!Array.isArray(coords)) return;
        if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
          featureCoords.push(project(coords[0], coords[1]) as [number, number]);
          return;
        }
        coords.forEach(extractFeaturePoints);
      };
      if (geom?.coordinates) extractFeaturePoints(geom.coordinates);

      let fMinX = Infinity, fMaxX = -Infinity, fMinY = Infinity, fMaxY = -Infinity;
      featureCoords.forEach(([px, py]) => {
        if (px < fMinX) fMinX = px;
        if (px > fMaxX) fMaxX = px;
        if (py < fMinY) fMinY = py;
        if (py > fMaxY) fMaxY = py;
      });

      if (!isFinite(fMinX) || !isFinite(fMinY)) {
        fMinX = 400; fMaxX = 400; fMinY = 300; fMaxY = 300;
      }

      const w = Math.max(fMaxX - fMinX, 30);
      const h = Math.max(fMaxY - fMinY, 30);
      const cx = fMinX + w / 2;
      const cy = fMinY + h / 2;

      return {
        geoName,
        pathD,
        pop,
        areaKm2,
        tsData,
        bounds: { x: fMinX, y: fMinY, w, h, cx, cy },
      };
    });

    return { projectedFeatures: projected };
  }, [geoJson]);

  // 💡 Safe Center On Barangay Animation
  const centerOnBarangay = useCallback((targetName: string) => {
    const active = projectedFeatures.find(
      f => normalizeName(f.geoName) === normalizeName(targetName)
    );

    if (active && active.bounds && isFinite(active.bounds.cx) && isFinite(active.bounds.cy) && !isInsetSector(active.geoName)) {
      const targetK = Math.min(
        Math.max(800 / (active.bounds.w + 140), 600 / (active.bounds.h + 140)),
        3.5
      );

      const targetX = 400 - active.bounds.cx * targetK;
      const targetY = 300 - active.bounds.cy * targetK;

      if (isFinite(targetX) && isFinite(targetY) && isFinite(targetK)) {
        setTransform({ x: targetX, y: targetY, k: targetK });
      }
    } else {
      // Inset sectors reset to clean standard zoom
      setTransform({ x: 0, y: 0, k: 1 });
    }
  }, [projectedFeatures]);

  // 💡 FIXED: Direct selection without drag-lock interference
  const handleSelect = (geoName: string, tsData: BarangayDetail | undefined, areaKm2: number) => {
    if (dragStartRef.current.moved) return;

    if (tsData) {
      setSelectedBarangay({
        name: tsData.name,
        captain: tsData.captain,
        population: tsData.population,
        previousPopulation: tsData.previousPopulation,
        households: tsData.households,
        area: tsData.area,
        term: tsData.term,
        district: tsData.district,
        history: tsData.history,
      });
    } else {
      setSelectedBarangay({
        name: geoName,
        captain: "Hon. Juan Dela Cruz",
        population: 1500,
        previousPopulation: 1400,
        households: 350,
        area: Math.round(areaKm2 * 100),
        term: "1st",
        district: "District 1",
        history: [],
      });
    }

    centerOnBarangay(geoName);
  };

  const handleResetView = () => {
    setSelectedBarangay(null);
    setTransform({ x: 0, y: 0, k: 1 });
  };

  // 💡 FIXED: Clean pointer event listeners (NO pointer capture swallowing clicks)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button')) return; // Ignore buttons in UI

    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      initX: transform.x,
      initY: transform.y,
      moved: false,
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
        const scaleFactorX = 800 / (rect.width || 800);
        const scaleFactorY = 600 / (rect.height || 600);

        setTransform(prev => ({
          ...prev,
          x: dragStartRef.current.initX + dx * scaleFactorX,
          y: dragStartRef.current.initY + dy * scaleFactorY,
        }));
      }
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    setIsPanning(false);
  };

  // Manual zoom (+ / -) controls around current viewport center (400, 300)
  const handleZoom = (factor: number) => {
    setTransform(prev => {
      const newK = Math.min(Math.max(prev.k * factor, 0.7), 5.0);
      const ratio = newK / prev.k;
      const newX = 400 - (400 - prev.x) * ratio;
      const newY = 300 - (300 - prev.y) * ratio;
      return { x: newX, y: newY, k: newK };
    });
  };

  // Compute growth rates
  const growthRate = useMemo(() => {
    if (!selectedBarangay || !selectedBarangay.previousPopulation) return null;
    const diff = selectedBarangay.population - selectedBarangay.previousPopulation;
    const pct = (diff / selectedBarangay.previousPopulation) * 100;
    return {
      value: pct.toFixed(1),
      isPositive: pct >= 0,
    };
  }, [selectedBarangay]);

  // Search filter results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return INFANTA_BARANGAYS.filter(
      b => b.name.toLowerCase().includes(q) || b.captain.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [searchQuery]);

  return (
    <>
      <SEO
        title="Barangays of Infanta"
        description="Interactive population map, land area, and officials directory for the 36 barangays of Infanta, Quezon."
        keywords="infanta barangays, barangay captains, population density map, geojson infanta, citizen charter"
      />
      <Section className="p-3 mb-16">
        <div className="flex justify-center mb-6">
          <Breadcrumbsless items={breadcrumbs} className="text-xs" />
        </div>

        {/* 📰 Editorial Header Section */}
        <div className="text-center max-w-4xl mx-auto mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-axis-titular-focus uppercase text-gray-900 tracking-wide">
            Infanta's Barangays
          </h1>
          <p className="text-sm sm:text-base text-gray-600 font-axis-subtitular-focus mt-3 leading-relaxed tracking-wide">
            Drag to move • Click any sector to inspect.
          </p>
        </div>

        {/* 🔍 Search Input */}
        <div className="max-w-xl mx-auto mb-6 relative">
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-gray-300 focus-within:border-gray-900 focus-within:ring-1 focus-within:ring-gray-900 transition-all">
            <LazyIcon name="lucide:search" className="h-4 w-4 text-gray-600 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Address, barangay name, or captain..."
              className="w-full text-xs sm:text-sm font-axis-navbar-focus text-gray-800 placeholder-gray-400 bg-transparent outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-xs text-gray-600 hover:text-gray-700 cursor-pointer">
                ×
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-1.5 bg-white border border-gray-200 z-50 overflow-hidden divide-y divide-gray-100">
              {searchResults.map(b => (
                <button
                  key={b.name}
                  onClick={() => {
                    handleSelect(b.name, b as any, 0);
                    setSearchQuery('');
                  }}
                  className="w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors text-xs font-axis-navbar-focus cursor-pointer"
                >
                  <span className="font-semibold text-gray-900">{b.name}</span>
                  <span className="text-gray-500">{b.population.toLocaleString()} Residents</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 🗺️ Main 2-Column Split Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start max-w-7xl mx-auto">

          {/* LEFT 8 COLS: Full Map Stage */}
          <div className="lg:col-span-8 w-full bg-white border border-gray-200 flex flex-col p-4 relative select-none">

            {/* Top-Right Zoom Controls & Reset */}
            <div className="absolute top-6 right-6 z-20 flex flex-col gap-1.5">
              <button
                onClick={(e) => { e.stopPropagation(); handleZoom(1.35); }}
                className="size-8 bg-[#4a5568] hover:bg-[#2d3748] text-white flex items-center justify-center text-base font-bold transition-colors cursor-pointer"
                aria-label="Zoom in"
              >
                +
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleZoom(0.74); }}
                className="size-8 bg-[#4a5568] hover:bg-[#2d3748] text-white flex items-center justify-center text-base font-bold transition-colors cursor-pointer"
                aria-label="Zoom out"
              >
                −
              </button>
              {(transform.k !== 1 || transform.x !== 0 || transform.y !== 0) && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleResetView(); }}
                  className="size-8 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer mt-1"
                  title="Reset view"
                  aria-label="Reset view"
                >
                  <LazyIcon name="tabler:restore" className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* 1. Main Movable Vector Map Canvas */}
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className={`w-full h-[420px] sm:h-[500px] lg:h-[580px] flex items-center justify-center relative overflow-hidden touch-none ${
                isPanning ? 'cursor-grabbing' : 'cursor-grab'
              }`}
            >
              <svg
                ref={svgRef}
                className="w-full h-full overflow-visible"
                viewBox="0 0 800 600"
              >
                {/* 💡 Smooth GPU-Accelerated Glide & Zoom Transform */}
                <g
                  style={{
                    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`,
                    transition: isPanning ? 'none' : 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {/* Render the 32 Mainland Barangays directly */}
                  {projectedFeatures.map((item, idx) => {
                    if (!item.pathD || isInsetSector(item.geoName)) return null;

                    const isSelected = selectedBarangay && normalizeName(selectedBarangay.name) === normalizeName(item.geoName);
                    const isHovered = hoveredName === item.geoName;

                    return (
                      <path
                        key={item.geoName || idx}
                        d={item.pathD}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(item.geoName, item.tsData, item.areaKm2);
                        }}
                        onMouseEnter={() => setHoveredName(item.geoName)}
                        onMouseLeave={() => setHoveredName(null)}
                        className="transition-colors duration-150 cursor-pointer outline-none pointer-events-auto"
                        fill={getChoroplethColor(item.pop)}
                        stroke={isSelected ? '#111827' : isHovered ? '#0ea5e9' : '#ffffff'}
                        strokeWidth={isSelected ? '2.5' : isHovered ? '2' : '0.5'}
                        vectorEffect="non-scaling-stroke"
                      />
                    );
                  })}
                </g>
              </svg>

              {/* 💡 2. BOTTOM-RIGHT FLOATING INSET CARD */}
              <div
                className="absolute bottom-4 right-4 z-30 bg-white/95 border border-gray-200/90 p-3 max-w-[260px] text-left pointer-events-auto"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className='items-center text-center mb-2'>
                  <span className='font-axis-navbar-focus uppercase text-md text-gray-700 tracking-wide block'>
                    Other Barangays
                  </span>
                </div>
                {/* 2x2 Grid of Inset Squares */}
                <div className="grid grid-cols-2 gap-2">
                  {INSET_SECTORS.map((item) => {
                    const tsData = findTSBarangay(item.name);
                    const pop = tsData ? tsData.population : 1500;
                    const isSelected = selectedBarangay && normalizeName(selectedBarangay.name) === normalizeName(item.name);
                    const isHovered = hoveredName === item.name;

                    return (
                      <button
                        key={item.name}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(item.name, tsData, 0);
                        }}
                        onMouseEnter={() => setHoveredName(item.name)}
                        onMouseLeave={() => setHoveredName(null)}
                        className={`flex items-center gap-2 p-1.5 border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-black-600 ring-1 ring-black-600'
                            : isHovered
                            ? 'border-gray-400'
                            : 'border-gray-200/80'
                          }`
                        }
                        style={{ backgroundColor: getChoroplethColor(pop) }}
                      >
                        <span className={`text-xs font-axis-navbar-focus uppercase tracking-wider ${
                          pop >= 3000 ? 'text-white' : 'text-gray-800'
                        }`}>
                          {item.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Municipal Coverage Footer Note */}
            <div className="border-t border-gray-100 pt-3 mt-1 text-center">
              <span className="text-[11px] font-axis-medium text-gray-600">
                Total Municipal Land Area: <strong>342.76 km²</strong> • Drag to pan • Click any barangay to zoom & inspect
              </span>
            </div>

          </div>

          {/* RIGHT 4 COLS: Le Monde Sidebar Legend & Detail Card */}
          <div className="lg:col-span-4 space-y-6 flex flex-col justify-start h-full pt-2 lg:pt-0">

          {selectedBarangay ? (
            /* STATE 1: BARANGAY SELECTED */
            <div className="bg-white border border-gray-200 p-5 sm:p-6 relative animate-fadeIn text-start">
              {/* Close Button */}
              <button
                onClick={handleResetView}
                className="absolute right-4 top-4 size-7 bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
                aria-label="Close details"
              >
                ×
              </button>

              {/* Header */}
              <div className="border-b border-gray-100 pb-4 mb-5 pr-8">
                <h3 className="text-xl sm:text-2xl font-axis-titular-focus tracking-wide uppercase text-gray-900 tracking-tight">
                  {selectedBarangay.name}
                </h3>
              </div>

              {/* 💡 FLATTENED RESPONSIVE METRICS GRID (1-col on phones, 2-col on larger screens) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">

                {/* 1. Barangay Captain */}
                <div className="flex flex-col">
                  <span className="text-[11px] sm:text-xs uppercase font-axis-navbar-focus text-gray-500 tracking-wider">
                    Barangay Captain
                  </span>
                  <span className="text-sm sm:text-base font-axis-navbar-focus tracking-wide text-gray-900 mt-0.5 block">
                    {selectedBarangay.captain}
                  </span>
                  <span className="text-[11px] sm:text-xs font-axis-navbar-focus tracking-wide uppercase text-gray-600 block">
                    ({selectedBarangay.term} Term)
                  </span>
                </div>

                {/* 2. Official Population */}
                <div className="flex flex-col">
                  <span className="text-[11px] sm:text-xs uppercase font-axis-navbar-focus text-gray-500 tracking-wider">
                    Official Population (2024)
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-lg sm:text-xl font-axis-sng-indlab-value text-gray-900 proportional-nums tracking-wide">
                      {selectedBarangay.population.toLocaleString()}
                    </span>
                    {growthRate && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 font-axis-plantao-num-focus ${
                          growthRate.isPositive
                            ? 'bg-arvore-50 text-arvore-800 border border-arvore-800/20'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {growthRate.isPositive ? '↑' : '↓'} {growthRate.value}%
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. Households */}
                <div className="flex flex-col">
                  <span className="text-[11px] sm:text-xs uppercase font-axis-navbar-focus text-gray-500 tracking-wider">
                    Households
                  </span>
                  <span className="text-lg sm:text-xl font-axis-sng-indlab-value text-gray-900 mt-0.5 proportional-nums tracking-wide">
                    {selectedBarangay.households.toLocaleString()}
                  </span>
                </div>

                {/* 4. Land Area */}
                {selectedBarangay.area > 0 && (
                  <div className="flex flex-col">
                    <span className="text-[11px] sm:text-xs uppercase font-axis-navbar-focus text-gray-500 tracking-wider">
                      Land Area
                    </span>
                    <span className="text-lg sm:text-xl font-axis-sng-indlab-value text-gray-900 mt-0.5 proportional-nums">
                      {selectedBarangay.area} ha
                    </span>
                  </div>
                )}

              </div>

              {/* Reset Button */}
              <button
                onClick={handleResetView}
                className="w-full mt-6 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-axis-navbar-focus uppercase tracking-wider transition-colors cursor-pointer"
              >
                See Full Municipal Map
              </button>
            </div>
            ) : (
              /* STATE 2: GENERAL LEGEND */
              <div className="bg-white border border-gray-200 p-6 text-start space-y-6">

                <div className="border-b border-gray-100 pb-3">
                  <h3 className="text-lg font-axis-titular-focus uppercase text-gray-900 tracking-wide">
                    Barangays by Population
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-y-3.5 gap-x-4">
                  <div className="flex items-center gap-2.5">
                    <div className="size-3 shrink-0" style={{ backgroundColor: getChoroplethColor(4500) }} />
                    <span className="text-xs font-axis-navbar-focus text-gray-700">
                      &gt;= 4,000
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="size-3 shrink-0" style={{ backgroundColor: getChoroplethColor(3500) }} />
                    <span className="text-xs font-axis-navbar-focus text-gray-700">
                      3,000 – 3,999
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="size-3 shrink-0" style={{ backgroundColor: getChoroplethColor(2500) }} />
                    <span className="text-xs font-axis-navbar-focus text-gray-700">
                      2,000 – 2,999
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="size-3 shrink-0" style={{ backgroundColor: getChoroplethColor(1500) }} />
                    <span className="text-xs font-axis-navbar-focus text-gray-700">
                      1,000 – 1,999
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="size-3 shrink-0" style={{ backgroundColor: getChoroplethColor(500) }} />
                    <span className="text-xs font-axis-navbar-focus text-gray-700">
                      &lt; 1,000
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-600 font-axis-medium block mb-4">
                    Drag map to move • Click a barangay to zoom.
                  </span>

                  {/* 👁️ Colorblind Friendly Toggle */}
                  <label className="flex items-center justify-between p-2.5 bg-gray-50 cursor-pointer border border-gray-200/80 hover:bg-gray-100 transition-colors">
                    <span className="flex items-center gap-2 text-xs font-axis-navbar-focus text-gray-700">
                      <LazyIcon name="lucide:eye" className="h-4 w-4 text-gray-500" />
                      Colorblind friendly
                    </span>
                    <input
                      type="checkbox"
                      checked={colorblindMode}
                      onChange={e => setColorblindMode(e.target.checked)}
                      className="rounded text-primary-600 focus:ring-0 cursor-pointer h-4 w-4"
                    />
                  </label>
                </div>

              </div>
            )}

          </div>

        </div>
      </Section>
    </>
  );
}
