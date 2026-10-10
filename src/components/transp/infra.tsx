// src/components/transparency/InfrastructureTab.tsx
import { useState, useMemo, useEffect, useRef } from 'react';
import { Map as MapLibreMap, Marker, NavigationControl, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// 💡 Direct static import of your DPWH dataset
import dpwhProjectsData from '@/data/geog/infra-map/infanta_projects.json';

export interface InfraProject {
  contractId: string;
  description: string;
  category: string;
  componentCategories: string;
  status: string;
  budget: number;
  amountPaid: number;
  progress: number;
  contractor: string;
  startDate: string;
  completionDate: string;
  infraYear: number;
  programName: string;
  sourceOfFunds: string;
  isLive: boolean;
  livestreamUrl: string;
  livestreamVideoId: string;
  livestreamDetectedAt: string;
  latitude: number;
  longitude: number;
  reportCount: number;
  hasSatelliteImage: boolean;
  fundingAgencyProgram: string;
  fundingCluster: string;
  contractorNameClean: string;
  contractorLicenseId: string;
  isJointVenture: boolean;
  isByAdmin: boolean;
  categoryClean: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Buildings and Facilities": "bg-blue-50 text-blue-700 border-blue-200",
  "Roads": "bg-amber-50 text-amber-800 border-amber-200",
  "Flood Control and Drainage": "bg-emerald-50 text-emerald-800 border-emerald-200",
  "Bridges": "bg-purple-50 text-purple-700 border-purple-200",
};

export default function InfrastructureTab() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);

  const rawProjects = dpwhProjectsData as InfraProject[];

  // Filter projects based on category and search query
  const filteredProjects = useMemo(() => {
    return rawProjects.filter((p) => {
      const matchesCategory = selectedCategory === 'All' || p.categoryClean === selectedCategory || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.contractId.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.contractorNameClean.toLowerCase().includes(q) ||
        p.contractor.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [rawProjects, selectedCategory, searchQuery]);

  // Aggregate summary values
  const stats = useMemo(() => {
    const totalBudget = filteredProjects.reduce((acc, p) => acc + p.budget, 0);
    const avgProgress = Math.round(
      filteredProjects.reduce((acc, p) => acc + p.progress, 0) / (filteredProjects.length || 1)
    );
    return { totalBudget, avgProgress };
  }, [filteredProjects]);

  // 💡 Initialize MapLibre GL with a 100% offline-safe inline style object
    useEffect(() => {
      if (!mapContainerRef.current || mapRef.current) return;

      const map = new MapLibreMap({
        container: mapContainerRef.current,
        // 💡 INLINE STYLE: Zero external style.json or font dependencies (Guaranteed to load)
        style: {
          version: 8,
          sources: {
            'osm-tiles': {
              type: 'raster',
              tiles: [
                'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              ],
              tileSize: 256,
              attribution: '&copy; OpenStreetMap contributors',
            },
          },
          layers: [
            {
              id: 'osm-tiles-layer',
              type: 'raster',
              source: 'osm-tiles',
              minzoom: 0,
              maxzoom: 19,
            },
          ],
        },
        center: [121.64, 14.68],
        zoom: 9.5,
        attributionControl: false,
      });

      map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
      mapRef.current = map;

      // 💡 Force immediate resize as soon as the DOM settles
      map.on('load', () => {
        map.resize();
      });

      const timer = setTimeout(() => {
        map.resize();
      }, 150);

      const resizeObserver = new ResizeObserver(() => {
        map.resize();
      });
      resizeObserver.observe(mapContainerRef.current);

      return () => {
        clearTimeout(timer);
        resizeObserver.disconnect();
        map.remove();
        mapRef.current = null;
      };
    }, []);

    // Synchronize Map Markers (With interactive lift on hover & sticking pin state on click/zoom)
      useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        // Clear existing markers
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        filteredProjects.forEach((proj) => {
          if (!proj.latitude || !proj.longitude) return;

          const isSelected = selectedContractId === proj.contractId;

          // 💡 Physical Pin DOM structure with responsive hover lift and stuck states
          const el = document.createElement('div');
          el.className = `group relative flex flex-col items-center cursor-pointer select-none transition-transform duration-300 ${
            isSelected
              ? 'z-50 -translate-y-2.5 scale-110' // 📌 Stays stuck elevated when selected
              : 'z-20 hover:-translate-y-2 hover:scale-105' // 🚀 Changes position on hover
          }`;

          el.innerHTML = `
            <!-- 1. Elevated Pin Head -->
            <div class="flex items-center justify-center size-6 rounded-full border-2 transition-all duration-300 shadow-md ${
              isSelected
                ? 'bg-fantas-900 border-amber-400 ring-4 ring-amber-400/30'
                : 'bg-white border-fantas-800 shadow-xs group-hover:border-fantas-950 group-hover:shadow-md'
            }">
              <div class="size-2 rounded-full transition-colors duration-300 ${
                isSelected ? 'bg-amber-400' : 'bg-fantas-800'
              }"></div>
            </div>

            <!-- 2. Pin Stem Needle connecting head to GPS anchor point -->
            <div class="w-0.5 h-2 transition-colors duration-300 ${
              isSelected ? 'bg-fantas-900' : 'bg-fantas-800/40 group-hover:bg-fantas-900'
            }"></div>

            <!-- 3. Ground Anchor Dot (Always fixed to true coordinates) -->
            <div class="relative size-2 flex items-center justify-center">
              ${isSelected ? '<span class="animate-ping absolute size-4 rounded-full bg-amber-400 opacity-75 pointer-events-none"></span>' : ''}
              <div class="size-1.5 rounded-full ${isSelected ? 'bg-amber-500 ring-2 ring-white' : 'bg-fantas-900/60'}"></div>
            </div>
          `;

          // 💡 Popup configured with closeOnClick: false so it stays stuck open when zooming out
          const popup = new Popup({
            offset: [0, -32], // Floating above the elevated pin head
            closeButton: true,
            closeOnClick: false, // 💡 STAYS STUCK while zooming out or panning
            className: 'font-sans shadow-lg',
          }).setHTML(`
            <div class="p-1 font-sans text-left max-w-[200px]">
              <span class="text-[9px] font-mono text-gray-400 block">${proj.contractId}</span>
              <span class="text-xs font-bold text-gray-900 leading-tight block mt-0.5 line-clamp-2">${proj.description}</span>
              <span class="text-[11px] font-bold text-emerald-700 block mt-1">₱${(proj.budget / 1_000_000).toFixed(2)}M</span>
            </div>
          `);

          popup.on('close', () => {
            if (selectedContractId === proj.contractId) {
              setSelectedContractId(null);
            }
          });

          const marker = new Marker({
            element: el,
            anchor: 'bottom', // Anchors the bottom ground dot to the exact coordinate
          })
            .setLngLat([proj.longitude, proj.latitude])
            .setPopup(popup)
            .addTo(map);

          // Handle marker click
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            setSelectedContractId(proj.contractId);
            map.flyTo({ center: [proj.longitude, proj.latitude], zoom: 13, speed: 1.2 });
          });

          // 💡 If this project is currently selected, keep its popup stuck open
          if (isSelected) {
            marker.togglePopup();
          }

          markersRef.current.push(marker);
        });
      }, [filteredProjects, selectedContractId]);

  // Click row: fly map camera to project coordinates
  const handleRowClick = (proj: InfraProject) => {
    setSelectedContractId(proj.contractId);
    if (mapRef.current && proj.latitude && proj.longitude) {
      mapRef.current.flyTo({
        center: [proj.longitude, proj.latitude],
        zoom: 13,
        speed: 1.2,
      });
    }
  };

  return (
    <div className="space-y-6 text-start select-none">

      {/* 📊 SUMMARY TILES BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-start font-mono">
        <div className="bg-white border border-slate-200 p-4">
          <span className="text-[10px] uppercase text-slate-400 tracking-wider block font-sans">
            Filtered Projects
          </span>
          <span className="text-2xl font-bold text-slate-900 block mt-1">
            {filteredProjects.length} <span className="text-xs font-normal text-slate-500">contracts</span>
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4">
          <span className="text-[10px] uppercase text-slate-400 tracking-wider block font-sans">
            Total Allocated Cost
          </span>
          <span className="text-2xl font-bold text-fantas-900 block mt-1">
            ₱{(stats.totalBudget / 1_000_000).toFixed(2)}M
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4">
          <span className="text-[10px] uppercase text-slate-400 tracking-wider block font-sans">
            Average Progress
          </span>
          <span className="text-2xl font-bold text-emerald-700 block mt-1">
            {stats.avgProgress}%
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4">
          <span className="text-[10px] uppercase text-slate-400 tracking-wider block font-sans">
            Auditing Agency
          </span>
          <span className="text-sm font-bold text-slate-800 block mt-1 leading-tight font-sans">
            Quezon 1st DEO (DPWH)
          </span>
        </div>
      </div>

      {/* 🗺️ MAPLIBRE GL GEOGRAPHIC STAGE */}
      <div className="w-full bg-white border border-slate-200 overflow-hidden relative shadow-2xs">
        <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-axis-navbar-focus uppercase tracking-wider text-slate-700">
              Interactive Geotagged Public Works Map
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            OpenFreeMap Positron (Quezon 1st District)
          </span>
        </div>

        <div ref={mapContainerRef} className="w-full h-80 sm:h-96" />
      </div>

      {/* 🔍 FILTER & SEARCH CONTROLS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-3 border border-slate-200">
        <div className="flex flex-wrap items-center gap-1.5">
          {['All', 'Buildings and Facilities', 'Roads', 'Flood Control and Drainage', 'Bridges'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-[11px] font-axis-navbar-focus uppercase tracking-wider transition-colors cursor-pointer rounded-xs border ${
                selectedCategory === cat
                  ? 'bg-fantas-800 border-fantas-800 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat === 'Buildings and Facilities' ? 'Buildings' : cat === 'Flood Control and Drainage' ? 'Flood Control' : cat}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ID, contractor, scope..."
            className="w-full px-3 py-1 text-xs border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-1 focus:ring-fantas-800 font-sans"
          />
        </div>
      </div>

      {/* 📋 THE TRANSPARENCY DATA TABLE */}
      <div className="bg-white border border-slate-200 overflow-x-auto shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100 text-slate-700 font-axis-navbar-focus uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3">Contract ID</th>
              <th className="py-2.5 px-3">Scope / Description</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3">Contractor (PCAB Lic.)</th>
              <th className="py-2.5 px-3 text-right">Approved Budget</th>
              <th className="py-2.5 px-3 text-center">Status / Progress</th>
              <th className="py-2.5 px-3 text-center">Fund Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {filteredProjects.map((proj) => {
              const isSelected = selectedContractId === proj.contractId;
              const catClass = CATEGORY_COLORS[proj.categoryClean || proj.category] || "bg-slate-50 text-slate-700 border-slate-200";

              return (
                <tr
                  key={proj.contractId}
                  onClick={() => handleRowClick(proj)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'bg-fantas-50/70 font-medium' : 'hover:bg-slate-50/70'
                  }`}
                >
                  {/* Contract ID */}
                  <td className="py-3 px-3 font-mono font-bold text-[11px] text-fantas-900 whitespace-nowrap">
                    {proj.contractId}
                  </td>

                  {/* Description */}
                  <td className="py-3 px-3 max-w-sm">
                    <span className="font-semibold text-slate-900 block leading-tight line-clamp-2">
                      {proj.description}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5 font-mono">
                      FY {proj.infraYear} • {proj.programName}
                    </span>
                  </td>

                  {/* Category Badge */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className={`inline-block px-2 py-0.5 text-[9px] uppercase font-axis-navbar-focus tracking-wider border rounded-xs ${catClass}`}>
                      {(proj.categoryClean || proj.category).split(' ')[0]}
                    </span>
                  </td>

                  {/* Contractor */}
                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-800 block text-[11px] leading-snug">
                      {proj.contractorNameClean || proj.contractor}
                    </span>
                    {proj.contractorLicenseId && (
                      <span className="text-[10px] font-mono text-slate-400 block">
                        Lic. #{proj.contractorLicenseId}
                      </span>
                    )}
                  </td>

                  {/* Budget */}
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                    ₱{proj.budget.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </td>

                  {/* Status / Progress Bar */}
                  <td className="py-3 px-3 min-w-[120px]">
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="text-emerald-700 font-bold uppercase">{proj.status}</span>
                      <span>{proj.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 transition-all duration-300"
                        style={{ width: `${proj.progress}%` }}
                      />
                    </div>
                  </td>

                  {/* Fund Source */}
                  <td className="py-3 px-3 text-center font-mono text-[10px] text-slate-500 whitespace-nowrap">
                    {proj.sourceOfFunds}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
