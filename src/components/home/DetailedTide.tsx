// src/components/home/TideCard.tsx
import { useState, useEffect, useMemo } from 'react';

interface ExtremaEvent {
  type: 'HIGH' | 'LOW';
  timeStr: string;
  height: number;
  label: string; // e.g. "Peak 1", "Peak 2"
}

interface TidePoint {
  x: number;
  y: number;
  height: number;
  timeStr: string;
}

// 💡 1. Coastal waters off Infanta / Lamon Bay (Water grid cell)
const MARINE_COORDS = {
  lat: 14.745,
  lon: 121.685,
  station: "Infanta / Lamon Bay Coast",
};

export default function TideCard({ className = '' }: { className?: string }) {
  const [hourlyData, setHourlyData] = useState<{ times: string[]; heights: number[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  // 💡 Real-time ticker state for continuous current-time marker animation
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchTides() {
      const now = new Date();
      const manilaTimeStr = now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Manila',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      });
      const [hourStr, minStr] = manilaTimeStr.split(':');
      const currentHour = parseInt(hourStr, 10);
      const currentMinute = parseInt(minStr, 10);

      const startHourOffset = currentMinute >= 30 ? currentHour + 1 : currentHour;

      try {
        const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${MARINE_COORDS.lat}&longitude=${MARINE_COORDS.lon}&hourly=sea_level_height_msl&cell_selection=sea&timezone=Asia%2FManila&forecast_days=3`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Marine API responded with status ${res.status}`);
        const data = await res.json();

        if (!data?.hourly?.time || !data?.hourly?.sea_level_height_msl) {
          throw new Error("Invalid API payload structure");
        }

        const rawHeights: (number | null)[] = data.hourly.sea_level_height_msl;
        const rawTimes: string[] = data.hourly.time;

        const validValuesCount = rawHeights.filter(v => v !== null).length;
        if (validValuesCount === 0) {
          throw new Error("API returned null for sea_level_height_msl at this coordinate");
        }

        const startIdx = Math.max(0, startHourOffset);
        const endIdx = startIdx + 26;

        const cleanTimes = rawTimes.slice(startIdx, endIdx);
        const cleanHeights = rawHeights.slice(startIdx, endIdx).map((h, i, arr) => {
          if (h !== null && typeof h === 'number') return h;
          return (arr[i - 1] as number) ?? (arr[i + 1] as number) ?? 0;
        });

        console.log(`🌊 Live Marine tide data loaded starting from hour ${startHourOffset}:00!`);
        setIsLive(true);
        setHourlyData({ times: cleanTimes, heights: cleanHeights });
      } catch (err) {
        console.warn("⚠️ Marine API failed. Using rolling offline fallback for Infanta.", err);
        setIsLive(false);

        const baseHeights = [
          0.15, 0.45, 0.85, 1.25, 1.42, 1.22, 0.75, 0.25,
          -0.25, -0.45, -0.35, 0.05, 0.55, 0.95, 1.28, 1.36,
          1.10, 0.65, 0.15, -0.22, -0.40, -0.30, 0.02, 0.35
        ];

        const mockHeights: number[] = [];
        const mockTimes: string[] = [];

        for (let i = 0; i < 26; i++) {
          const hIdx = (startHourOffset + i) % 24;
          mockHeights.push(baseHeights[hIdx]);

          const d = new Date(now);
          d.setHours(startHourOffset + i, 0, 0, 0);
          mockTimes.push(d.toISOString());
        }

        setHourlyData({ times: mockTimes, heights: mockHeights });
      } finally {
        setLoading(false);
      }
    }

    fetchTides();
  }, []);

  // 💡 1. Calculate Tidal Extrema
  const extrema = useMemo(() => {
    if (!hourlyData || hourlyData.heights.length < 3) {
      return [];
    }

    const { heights, times } = hourlyData;
    const allEvents: { type: 'HIGH' | 'LOW'; timeStr: string; height: number; idx: number }[] = [];

    for (let i = 1; i < heights.length - 1; i++) {
      const prev = heights[i - 1];
      const curr = heights[i];
      const next = heights[i + 1];

      if (curr > prev && curr > next) {
        const denom = prev - 2 * curr + next;
        const delta = denom !== 0 ? (prev - next) / (2 * denom) : 0;
        const exactHeight = denom !== 0 ? curr - ((prev - next) ** 2) / (8 * denom) : curr;

        const baseDate = new Date(times[i]);
        baseDate.setMinutes(baseDate.getMinutes() + Math.round(delta * 60));

        allEvents.push({
          type: 'HIGH',
          timeStr: baseDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          height: Number(exactHeight.toFixed(2)),
          idx: i,
        });
      } else if (curr < prev && curr < next) {
        const denom = prev - 2 * curr + next;
        const delta = denom !== 0 ? (prev - next) / (2 * denom) : 0;
        const exactHeight = denom !== 0 ? curr - ((prev - next) ** 2) / (8 * denom) : curr;

        const baseDate = new Date(times[i]);
        baseDate.setMinutes(baseDate.getMinutes() + Math.round(delta * 60));

        allEvents.push({
          type: 'LOW',
          timeStr: baseDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          height: Number(exactHeight.toFixed(2)),
          idx: i,
        });
      }
    }

    let peakCount = 0;
    return allEvents.map(e => {
      if (e.type === 'HIGH') {
        peakCount++;
        return { ...e, label: `Peak ${peakCount}` };
      }
      return { ...e, label: 'Low Tide' };
    }).slice(0, 4);
  }, [hourlyData]);

  // 💡 2. Smooth Wave Path & Geometry
  const { linePath, points, zeroY, peakPoints, liveMarker } = useMemo(() => {
    if (!hourlyData || hourlyData.heights.length < 2) {
      return { linePath: '', points: [], zeroY: 50, peakPoints: [], liveMarker: null };
    }

    const { heights, times } = hourlyData;
    const minH = Math.min(...heights, -0.4);
    const maxH = Math.max(...heights, 1.4);
    const range = maxH - minH || 1;

    const scaleY = (val: number) => 75 - ((val - minH) / range) * 50;

    const calculatedPoints: TidePoint[] = heights.map((h, idx) => {
      const x = (idx / (heights.length - 1)) * 500;
      const y = scaleY(h);
      const date = new Date(times[idx]);
      const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: false });
      return { x, y, height: h, timeStr };
    });

    let d = `M ${calculatedPoints[0].x.toFixed(1)} ${calculatedPoints[0].y.toFixed(1)}`;
    for (let i = 0; i < calculatedPoints.length - 1; i++) {
      const p0 = calculatedPoints[i === 0 ? i : i - 1];
      const p1 = calculatedPoints[i];
      const p2 = calculatedPoints[i + 1];
      const p3 = calculatedPoints[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }

    const stepX = 500 / (heights.length - 1);
    const peaks = extrema
      .filter(e => e.type === 'HIGH')
      .slice(0, 2)
      .map((e) => {
        const i = (e as any).idx;
        const prev = heights[i - 1];
        const curr = heights[i];
        const next = heights[i + 1];
        const denom = prev - 2 * curr + next;
        const delta = denom !== 0 ? (prev - next) / (2 * denom) : 0;
        const exactX = (i + delta) * stepX;

        return {
          label: e.label,
          timeStr: e.timeStr,
          height: e.height,
          x: Math.min(Math.max(exactX, 10), 490),
          y: scaleY(e.height),
        };
      });

    // 💡 3. Dynamic Current Time Interpolation
    let computedLiveMarker = null;
    const startTimeMs = new Date(times[0]).getTime();
    const endTimeMs = new Date(times[times.length - 1]).getTime();
    const currTimeMs = currentTime.getTime();

    if (currTimeMs >= startTimeMs && currTimeMs <= endTimeMs) {
      const totalDuration = endTimeMs - startTimeMs;
      const elapsed = currTimeMs - startTimeMs;
      const fraction = elapsed / totalDuration;
      const liveX = fraction * 500;

      const totalSegments = heights.length - 1;
      const indexFloat = fraction * totalSegments;
      const segIndex = Math.min(Math.floor(indexFloat), totalSegments - 1);
      const segFraction = indexFloat - segIndex;

      const h1 = heights[segIndex];
      const h2 = heights[segIndex + 1];
      const interpolatedHeight = h1 + (h2 - h1) * segFraction;
      const liveY = scaleY(interpolatedHeight);

      computedLiveMarker = {
        x: Math.min(Math.max(liveX, 0), 500),
        y: liveY,
        height: interpolatedHeight,
        timeStr: currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
      };
    }

    return {
      linePath: d,
      points: calculatedPoints,
      zeroY: scaleY(0),
      peakPoints: peaks,
      liveMarker: computedLiveMarker,
    };
  }, [hourlyData, extrema, currentTime]);

  if (loading) {
    return (
      <div className="w-full lg:w-96 xl:w-[420px] border-t-2 border-b-2 border-fantas-900/90 py-10 px-4 flex flex-col justify-center items-center bg-transparent">
        <span className="text-xs uppercase tracking-widest text-fantas-900/80 animate-pulse font-mono">
          Reading Tidal Data...
        </span>
      </div>
    );
  }

  return (
    <div className={`w-full lg:flex-1 border-t-2 border-b-2 border-fantas-900/90 py-4 px-2 flex flex-col justify-between select-none bg-transparent text-fantas-900/90 ${className}`}>
      {/* 📰 Broadsheet Masthead Header */}
      <div className="border-b border-fantas-900/90 pb-2.5 text-start">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] sm:text-xs uppercase tracking-wider font-axis-plantao-num-focus">
            Tidal Bulletin
          </span>

        </div>
        <h3 className="text-base sm:text-xl lg:text-2xl font-axis-titular-focus uppercase tracking-wide mt-0.5">
          {MARINE_COORDS.station}
        </h3>
        <span className='mt-0.5'>
          <span className="text-[10px] sm:text-xs uppercase tracking-wide font-axis-navbar-focus">
            Nearest Reference Point: {' '}
          </span>
          <span className='text-[10px] sm:text-xs uppercase tracking-wide font-axis-subtitular-focus'>
             Port of Real station 660/024
          </span>
        </span>
      </div>

      {/* 📈 RESPONSIVE WAVE STAGE */}
      <div className="py-4 relative w-full my-2 sm:my-3">
        <div className="relative h-24 sm:h-28 w-full">
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 500 100"
            preserveAspectRatio="none"
          >
            {/* 0.00m Mean Sea Level Reference Rule */}
            <line
              x1="0"
              y1={zeroY}
              x2="500"
              y2={zeroY}
              stroke="#a3a3a3"
              strokeWidth="1"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
            <text
              x="500"
              y={zeroY - 4}
              textAnchor="end"
              className="fill-fantas-900/60 text-[9px] font-axis-subtitular-focus tracking-wide uppercase select-none"
            >
              0.0m MSL
            </text>

            {/* Dotted vertical drop guides at each peak */}
            {peakPoints.map((item, idx) => (
              <line
                key={`guide-${idx}`}
                x1={item.x}
                y1={item.y}
                x2={item.x}
                y2={zeroY}
                stroke="#171717"
                strokeOpacity="0.25"
                strokeWidth="1"
                strokeDasharray="2 3"
              />
            ))}

            {/* Smooth Curved Line */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="#553001"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}
          </svg>

          {/* HTML Overlay: Peak Markers + Elevation Tags */}
          <div className="absolute inset-0 pointer-events-none">
            {peakPoints.map((item, idx) => (
              <div
                key={`peak-node-${idx}`}
                className="absolute"
                style={{
                  left: `${(item.x / 500) * 100}%`,
                  top: `${(item.y / 100) * 100}%`,
                }}
              >
                <div className="absolute -translate-x-1/2 bottom-2.5 flex flex-col items-center whitespace-nowrap leading-tight">
                  <span className="text-[14px] font-axis-plantao-num-focus text-fantas-900/90 tracking-wide proportional-nums">
                    {item.height > 0 ? `+${item.height.toFixed(2)}m` : `${item.height.toFixed(2)}m`}
                  </span>
                  <span className="text-[11px] font-axis-navbar-focus uppercase tracking-wide text-fantas-900/70 mt-0.25">
                    Est. time: <span className="text-fantas-900/90 font-axis-plantao-num-focus">{item.timeStr}</span>
                  </span>
                </div>

                <div className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                  <span className="size-2.5 rounded-full bg-white border-2 border-neutral-900" />
                </div>
              </div>
            ))}

            {/* Live Changing Current Time Node */}
            {liveMarker && (
              <div
                className="absolute transition-all duration-300 ease-linear"
                style={{
                  left: `${(liveMarker.x / 500) * 100}%`,
                  top: `${(liveMarker.y / 100) * 100}%`,
                }}
              >
                <div className="absolute -translate-x-1/2 top-3 flex flex-col items-center whitespace-nowrap leading-tight">
                  <span className="text-[10px] font-bold font-axis-navbar-focus bg-flamengo-600 text-white px-1.5 py-0.5 uppercase tracking-wider">
                    NOW {liveMarker.height > 0 ? `+${liveMarker.height.toFixed(2)}m` : `${liveMarker.height.toFixed(2)}m`}
                  </span>
                  <span className="text-[9px] font-axis-plantao-num-focus text-flamengo-600/90 mt-0.5 font-bold">
                    {liveMarker.timeStr}
                  </span>
                </div>

                <div className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                  <span className="absolute size-4 rounded-full bg-flamengo-500/40 animate-ping" />
                  <span className="size-2.5 rounded-full bg-flamengo-600 border-2 border-white shadow-xs" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 6-Hour Timeline Legend below wave */}
        <div className="w-full flex justify-between text-[11px] text-fantas-900/70 px-1 mt-3 border-t border-fantas-800/10 pt-1 font-axis-navbar-focus tracking-wide">
          {points.filter((_, idx) => idx % 6 === 0).map((p, idx) => (
            <span key={idx} className="proportional-nums">{p.timeStr}</span>
          ))}
        </div>
      </div>

      {/* 📋 Daily Extrema Table */}
      <div className="pt-3 border-t border-fantas-900/40 mt-4">
        <div className="grid grid-cols-3 text-[12px] sm:text-[12px] uppercase tracking-wider text-fantas-900/80 border-b border-fantas-900/90 pb-1 mb-1 text-start font-axis-navbar-focus">
          <span>Event</span>
          <span className="text-center">Est. Time</span>
          <span className="text-right">Water Level</span>
        </div>

        <div className="divide-y divide-fantas-900/30 text-xs sm:text-sm font-axis-plantao-num-focus">
          {extrema.map((tide, i) => (
            <div
              key={i}
              className={`grid grid-cols-3 items-center py-1.5 text-start tracking-wide uppercase ${
                tide.type === 'HIGH' ? 'font-bold text-fantas-900/90' : 'text-fantas-900/60'
              }`}
            >
              <span className="flex items-center gap-1 text-[12px]">
                <span className="text-[8px] sm:text-[9px]">
                  {tide.type === 'HIGH' ? '▲' : '▼'}
                </span>
                {/* Displays "High Tide" or "Low Tide" instead of "Peak 1 / Peak 2" */}
                {tide.type === 'HIGH' ? 'High Tide' : 'Low Tide'}
              </span>
              <span className="text-center proportional-nums text-[12px]">
                {tide.timeStr}
              </span>
              <span className="text-right proportional-nums text-[12px]">
                {tide.height > 0 ? `+${tide.height.toFixed(2)}` : tide.height.toFixed(2)} m
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 🏷️ Broadsheet Footer */}
      <div className="border-t border-fantas-900 pt-1.5 mt-2 flex justify-between items-center text-[10px] font-axis-subtitular-focus uppercase tracking-wider text-fantas-950/80">
        <div className='flex flex-col justify-between'>
          <span>Figures for <span className='font-axis-navbar-focus'>Port of Real</span></span>
          <span>Coastline and station code 660/024</span>
        </div>
        <span className="flex items-center gap-1 font-axis-subtitular-focus text-[10px]">
          <span className={`size-1.5 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          {isLive ? 'Live Marine Model / Open-Meteo' : 'Cached Model'}
        </span>
      </div>
      <div className="text-center mt-1">
        <span className='text-xs font-axis-subtitular-focus tracking-wide text-fantas-950/70'>
          Model estimate at ~8 km resolution. Local river-mouth conditions may vary. Not for navigation.
        </span>
      </div>
    </div>
  );
}
