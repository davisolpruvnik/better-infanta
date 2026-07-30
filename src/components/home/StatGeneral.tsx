// src/components/home/TownStats.tsx
import { useEffect, useRef } from 'react';
import L from 'leaflet';

// 💡 Authentic demographics for Infanta, Quezon (2020 Census / Official Data)
const INFANTA_STATS = {
  barangays: '36',
  area: '342.76 km²',
  population: '77,676',
  coordinates: {
    lat: 14.7452,
    lon: 121.6492,
  },
};

export default function TownStats() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // 💡 1. Initialize Leaflet Map centered over Infanta, Quezon
    mapRef.current = L.map(mapContainerRef.current, {
      zoomControl: false, // Clean, key-less visual
      attributionControl: false,
    }).setView(
      [INFANTA_STATS.coordinates.lat, INFANTA_STATS.coordinates.lon],
      12
    );

    // 💡 2. Mapbox-Style Free Tile Layer (CARTO Voyager: Clean, modern, high-contrast design)
    // If you have an active Mapbox token, you can swap this URL with Mapbox's static tiles
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapRef.current);

    // 💡 3. Premium Pulsing Pin (Bypasses Vite's default marker asset-bundling bugs)
    const customMarkerIcon = L.divIcon({
      className: 'custom-pulsing-marker',
      html: `
        <div class="relative flex items-center justify-center w-8 h-8">
          <div class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-60"></div>
          <div class="relative rounded-full h-4 w-4 bg-primary-600 border-2 border-white shadow-md"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    // 💡 4. Place Marker over Municipal Hall
    L.marker([INFANTA_STATS.coordinates.lat, INFANTA_STATS.coordinates.lon], {
      icon: customMarkerIcon,
    })
      .addTo(mapRef.current)
      .bindPopup(
        `<b class="font-axis-bold text-gray-900">Infanta Municipal Hall</b>`
      )
      .openPopup();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="container mx-auto px-4 bg-cream-50/20 my-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* 📊 LEFT COLUMN: Municipal Metrics Grid (cols-2) */}
        <div className="flex flex-col justify-start h-full space-y-6">
          <div className="text-start mb-8">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-axis-titular-focus uppercase text-gray-900 tracking-wide mt-3">
              General Statistics
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-2">
            {/* Stat 1: Barangays */}
            <div className="flex flex-col text-start border-l-2 border-primary-500 pl-4">
              <span className="block uppercase text-[12px] font-axis-sng-indlab-header text-gray-500 tracking-widest">
                Barangays
              </span>
              <span className="text-3xl font-axis-sng-indlab-value text-burgundy-950 mt-1 leading-none tabular-nums">
                {INFANTA_STATS.barangays}
              </span>
              <span className="text-[12px] text-gray-400 font-axis-thin mt-1">
                Urban & Rural Divisions
              </span>
            </div>

            {/* Stat 2: Area Size */}
            <div className="flex flex-col text-start border-l-2 border-primary-500 pl-4">
              <span className="block uppercase text-[12px] font-axis-sng-indlab-header text-gray-500 tracking-widest">
                Land Area
              </span>
              <span className="text-3xl font-axis-sng-indlab-value text-burgundy-950 mt-1 leading-none tabular-nums">
                {INFANTA_STATS.area}
              </span>
              <span className="text-[12px] text-gray-400 font-axis-thin mt-1">
                Total Administrative Size
              </span>
            </div>

            {/* Stat 3: Population (Spans full width for grid-cols-2 balance) */}
            <div className="col-span-2 flex flex-col text-start border-l-2 border-primary-500 pl-4 mt-2">
              <span className="block uppercase text-[12px] font-axis-sng-indlab-header text-gray-500 tracking-widest">
                Population Size
              </span>
              <span className="text-3xl font-axis-sng-indlab-value text-burgundy-950 mt-1 leading-none tabular-nums">
                {INFANTA_STATS.population}
              </span>
              <span className="text-[12px] text-gray-400 font-axis-thin mt-1">
                Based on Official 2020 National Census data
              </span>
            </div>
          </div>
        </div>

        {/* 🗺️ RIGHT COLUMN: Mapbox-style Leaflet Container */}
        <div className="relative w-full h-[320px] lg:h-[380px] rounded-2xl overflow-hidden border border-gray-200/80 shadow-xs z-10">
          <div ref={mapContainerRef} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}
