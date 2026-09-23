// src/components/home/WeatherCard.tsx
import Section from '../ui/Section';
import MeteoIcon from '../ui/WeatherIcon';
import LazyIcon from '../ui/Lazying';
import { useWeather, HourlyPoint } from '@/hooks/useWeather';

const DEFAULT_LOCATION = { lat: 14.7452, lon: 121.6492, name: 'INFANTA' };

function getWeatherConfig(code: number, isDay: boolean = true) {
  switch (code) {
    case 0:
    case 1:
      return { icon: isDay ? 'clear-day' : 'clear-night', label: 'Clear' };
    case 2:
      return {
        icon: isDay ? 'partly-cloudy-day' : 'partly-cloudy-night',
        label: 'Partly Cloudy',
      };
    case 3:
      return {
        icon: isDay ? 'overcast-day' : 'overcast-night',
        label: 'Overcast',
      };
    case 45:
    case 48:
      return { icon: isDay ? 'fog-day' : 'fog-night', label: 'Foggy' };
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return {
        icon: isDay
          ? 'partly-cloudy-day-drizzle'
          : 'partly-cloudy-night-drizzle',
        label: 'Drizzle',
      };
    case 61:
    case 80:
      return {
        icon: isDay ? 'partly-cloudy-day-rain' : 'partly-cloudy-night-rain',
        label: 'Light Rain',
      };
    case 63:
    case 65:
    case 66:
    case 67:
    case 81:
    case 82:
      return { icon: 'rain', label: 'Moderate / Heavy Rain' };
    case 95:
      return {
        icon: isDay ? 'thunderstorms-day-rain' : 'thunderstorms-night-rain',
        label: 'Thunderstorm',
      };
    case 96:
    case 99:
      return {
        icon: isDay
          ? 'thunderstorms-day-extreme-rain'
          : 'thunderstorms-night-extreme-rain',
        label: 'Severe Storm',
      };
    default:
      return { icon: isDay ? 'cloudy' : 'overcast-night', label: 'Cloudy' };
  }
}

function MetricItem({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="w-full flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2 min-w-0">
        <LazyIcon name={icon} className="h-4 w-4 sm:h-5 sm:w-5 text-fantas-100/90 shrink-0" />
        <span className="font-axis-navbar-focus text-[10px] sm:text-[11px] leading-tight tracking-wider uppercase text-fantas-100/75 truncate">
          {label}
        </span>
      </div>
      <span className="font-axis-navbar-focus text-xs sm:text-sm tracking-wider text-fantas-100 shrink-0 ml-2">
        {value}
      </span>
    </div>
  );
}

function HourlyChart({ hourly }: { hourly: HourlyPoint[] }) {
  const minTemp = hourly.length ? Math.min(...hourly.map(h => h.temp)) - 1 : 20;
  const maxTemp = hourly.length ? Math.max(...hourly.map(h => h.temp)) + 1 : 35;
  const tempRange = maxTemp - minTemp || 1;

  const points = hourly.map((item, index) => {
    const x = (index / Math.max(hourly.length - 1, 1)) * 500;
    const y = 75 - ((item.temp - minTemp) / tempRange) * 50;
    return { x, y, temp: item.temp, time: item.time };
  });

  // 💡 Pure math cubic spline interpolation (Zero bundle size, silky smooth curves)
  const getSmoothCurve = (pts: typeof points) => {
    if (!pts || pts.length < 2) return { linePath: '', areaPath: '' };

      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i === 0 ? i : i - 1];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2] || p2;

        // Catmull-Rom to Cubic Bezier control points
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
      }

      const areaPath = `${d} L ${pts[pts.length - 1].x} 100 L ${pts[0].x} 100 Z`;
      return { linePath: d, areaPath };
    };

  const { linePath, areaPath } = getSmoothCurve(points);

  return (
      <div className="w-full pt-6 pb-3 px-6 sm:px-8 flex flex-col select-none">
        {/* 💡 Container has ample vertical room for text and nodes */}
        <div className="relative h-24 sm:h-28 w-full">
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 500 100"
            preserveAspectRatio="none"
          >
            <defs>
              {/* Radiant atmospheric gradient fade */}
              <linearGradient id="weatherChartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#553001" stopOpacity="1" />
                <stop offset="50%" stopColor="#553001" stopOpacity="0.72" />
                <stop offset="100%" stopColor="#553001" stopOpacity="0.5" />
              </linearGradient>
            </defs>

            {/* Dotted vertical drop-guides */}
            {points.map((p, idx) => (
              <line
                key={`guide-${idx}`}
                x1={p.x}
                y1={p.y}
                x2={p.x}
                y2={100}
                stroke="#d97706"
                strokeOpacity="0.2"
                strokeWidth="1"
                strokeDasharray="2 3"
              />
            ))}

            {/* Smooth Curved Area Fill */}
            {areaPath && (
              <path d={areaPath} fill="url(#weatherChartGrad)" />
            )}

            {/* Smooth Curved Line */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="#b45309"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}
          </svg>

          {/* 💡 HTML Overlay: Markers + Text (Zero geometric distortion & consistent spacing) */}
          <div className="absolute inset-0 pointer-events-none">
            {points.map((p, idx) => (
              <div
                key={`node-anchor-${idx}`}
                className="absolute"
                style={{
                  left: `${(p.x / 500) * 100}%`,
                  top: `${(p.y / 100) * 100}%`,
                }}
              >
                {/* Temperature text: elevated with comfortable breathing room */}
                <span className="absolute -translate-x-1/2 bottom-2 text-[12px] sm:text-sm font-axis-sng-indlab-value tracking-wide text-fantas-950 whitespace-nowrap drop-shadow-2xs">
                  {p.temp}°
                </span>

                {/* Undistorted CSS dual-ring marker (stays a circle on all screen sizes) */}
                <div className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                  <span className="size-2.5 rounded-full bg-white border-2 border-amber-700 " />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Axis Labels */}
        <div className="relative w-full h-5 text-[10px] sm:text-[11px] mt-2 border-t border-fantas-800/10 pt-1">
          {points.map((p, idx) => (
            <div
              key={`time-${idx}`}
              className="absolute -translate-x-1/2 flex justify-center"
              style={{ left: `${(p.x / 500) * 100}%` }}
            >
              <span className="font-axis-navbar-focus uppercase tracking-wider text-fantas-900/60 whitespace-nowrap">
                {p.time}
              </span>
            </div>
          ))}
        </div>
      </div>
  );
}

export default function WeatherCardDetail() {
  const { data: weather, loading } = useWeather(DEFAULT_LOCATION);

  if (loading) {
    return (
      <div className="w-full max-w-4xl h-80 bg-fantas-900/80 flex items-center justify-center text-sky-400 mx-auto my-4">
        <LazyIcon name='line-md:loading-twotone-loop' />
      </div>
    );
  }

  if (!weather) return null;

  const currentWeatherConfig = getWeatherConfig(
    weather.weatherCode,
    weather.isDay
  );

  return (
    <Section className="flex flex-col justify-center items-center w-full bg-white">
      {/* SECTION HEADER */}
      <div className="w-full max-w-4xl flex items-center justify-between pb-2 mb-6 border-b border-fantas-900/20">
        <div className="flex items-center gap-2">
          <LazyIcon
            name="streamline-ultimate:weather-sun-cloud"
            className="h-5 w-5 text-fantas-800"
          />
          <h2 className="text-base sm:text-lg font-axis-sng-indlab-value tracking-wide uppercase text-fantas-800">
            Weather Forecast
          </h2>
        </div>
        <span className="text-xs font-axis-navbar-focus tracking-wider text-fantas-800/70 uppercase">
          12-Hr Wave & 4-Day Outlook
        </span>
      </div>

      {/* ROOT CONTAINER */}
      <div className="flex flex-col lg:flex-row w-full max-w-4xl mx-auto overflow-hidden font-sans select-none border border-slate-700/20">
        {/* LEFT PANEL */}
        <div className="w-full lg:w-[38%] bg-fantas-900/90 text-white pt-6 pb-5 px-6 flex flex-col justify-between">
          <div>
            <div className="w-full flex flex-row justify-between items-start">
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-axis-subtitular-focus text-fantas-100/90 leading-none tracking-wide">
                  {weather.name}
                </h1>
                <span className="text-5xl sm:text-6xl lg:text-7xl font-axis-sng-indlab-value tracking-wide text-white block mt-1">
                  {weather.temp}°C
                </span>
              </div>

              <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
                <MeteoIcon
                  name={currentWeatherConfig.icon}
                  className="w-14 h-14 sm:w-16 sm:h-16"
                />
              </div>
            </div>
          </div>

          {/* Metrics List */}
          <div className="w-full mt-5 flex flex-col">
            <MetricItem
              icon="streamline-ultimate:rain-umbrella-1-bold"
              label="Chance of Rain"
              value={`${weather.rainChance}%`}
            />
            <div className="w-full h-px bg-gray-500/40 my-1" />
            <MetricItem
              icon="material-symbols:humidity-percentage-outline"
              label="Humidity"
              value={`${weather.humidity}%`}
            />
            <div className="w-full h-px bg-gray-500/40 my-1" />
            <MetricItem
              icon="ph:wind-bold"
              label="Wind Speed"
              value={`${weather.windSpeed} KPH`}
            />
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full lg:w-[62%] bg-fantas-800/20 flex flex-col justify-between">
          {/* Top: Hourly Curve */}
          <HourlyChart hourly={weather.hourly} />

          {/* Bottom: 4-Day Forecast Grid */}
          <div className="w-full grid grid-cols-4 divide-x divide-fantas-900/10 pb-5 pt-3 border-t border-fantas-900/10">
            {weather.daily.map((item, index) => {
              const config = getWeatherConfig(item.weatherCode, true);
              return (
                <div
                  key={index}
                  className="flex flex-col items-center justify-between px-1 sm:px-2 pt-1 gap-1.5 min-w-0"
                >
                  {/* Day Header */}
                  <span className="text-[11px] sm:text-xs font-axis-navbar-focus text-fantas-800 tracking-wider truncate block uppercase">
                    {item.dayName}
                  </span>

                  {/* Weather Icon */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 flex justify-center items-center my-0.5">
                    <MeteoIcon
                      name={config.icon}
                      className="w-10 h-10 sm:w-12 sm:h-12"
                    />
                  </div>

                  {/* Temperatures:
                      - Mobile, Tablet & Half-Screen: Stacked vertically (Max on top in Red, Min below in Blue)
                      - Full Wide Screen (xl:): Side-by-side with divider line */}
                  <div className="w-full flex flex-col-reverse xl:flex-row justify-center items-center xl:divide-x xl:divide-gray-500/50 gap-0.5 xl:gap-0">
                    <span className="text-sm sm:text-base xl:text-xl font-axis-sng-indlab-value tracking-wider text-accent-700 xl:pr-2 leading-none">
                      {item.tempMin}°
                    </span>
                    <span className="text-base sm:text-lg xl:text-xl font-axis-sng-indlab-value tracking-wider text-flamengo-600 xl:pl-2 leading-none">
                      {item.tempMax}°
                    </span>
                  </div>

                  {/* Rain Badge:
                      - Mobile, Tablet & Half-Screen: Stacked vertically (Umbrella + % on top, MM below)
                      - Full Wide Screen (xl:): Horizontal row */}
                  <div className="w-full max-w-[70px] sm:max-w-[80px] xl:max-w-none flex flex-col xl:flex-row items-center justify-center gap-0.5 xl:gap-1.5 mt-1 px-1 sm:px-1.5 py-1 bg-fantas-900/15 text-center">
                    <div className="flex items-center gap-1 font-axis-navbar-focus leading-none">
                      <LazyIcon
                        name="streamline-ultimate:rain-umbrella-1-bold"
                        className="h-3 w-3 text-fantas-900/70 shrink-0"
                      />
                      <span className="text-[12px] sm:text-[13px] tracking-wide text-fantas-900/80">
                        {item.precipitationProb}%
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-fantas-900/70 font-axis-navbar-focus tracking-wide leading-none">
                      ({item.precipitationSum} MM)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Section>
  );
}
