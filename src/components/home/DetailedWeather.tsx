// src/components/home/WeatherCard.tsx
import { Loader2 } from 'lucide-react';
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
      return {
        icon: isDay
          ? 'partly-cloudy-day-drizzle'
          : 'partly-cloudy-night-drizzle',
        label: 'Drizzle',
      };
    case 56:
    case 57:
    case 66:
    case 67:
      return { icon: 'sleet', label: 'Freezing Rain' };
    case 61:
    case 80:
      return {
        icon: isDay ? 'partly-cloudy-day-rain' : 'partly-cloudy-night-rain',
        label: 'Light Rain',
      };
    case 63:
    case 81:
      return { icon: 'rain', label: 'Moderate Rain' };
    case 65:
    case 82:
      return { icon: 'extreme-rain', label: 'Heavy Rain' };
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return {
        icon: isDay ? 'partly-cloudy-day-snow' : 'partly-cloudy-night-snow',
        label: 'Snow',
      };
    case 95:
      return {
        icon: isDay ? 'thunderstorms-day-rain' : 'thunderstorms-night-rain',
        label: 'Stormy',
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
      {/* Left side: Icon + Label grouped together */}
      <div className="flex items-center gap-2.5 min-w-0">
        <LazyIcon name={icon} className="h-5 w-5 text-fantas-100/90 shrink-0" />
        <span className="font-axis-navbar-focus text-[11px] leading-tight tracking-wider uppercase text-fantas-100/75 truncate">
          {label}
        </span>
      </div>

      {/* Right side: Value */}
      <span className="font-axis-navbar-focus text-sm sm:text-base tracking-wider text-fantas-100 shrink-0 ml-3">
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

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');
  const polygonPoints = points.length
    ? `0,100 0,${points[0].y} ${polylinePoints} 500,${points[points.length - 1].y} 500,100`
    : '';

  return (
    <div className="w-full pt-4 px-4 sm:px-8 flex flex-col">
      <div className="relative h-28 w-full">
        <svg
          className="w-full h-full overflow-visible"
          viewBox="0 0 500 100"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="weatherChartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#884c02" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#884c02" stopOpacity="0.65" />
            </linearGradient>
          </defs>

          {polygonPoints && (
            <polygon points={polygonPoints} fill="url(#weatherChartGrad)" />
          )}
          {polylinePoints && (
            <polyline
              points={polylinePoints}
              fill="none"
              stroke="#884c02"
              strokeWidth="2.5"
            />
          )}
        </svg>

        <div className="absolute inset-0 pointer-events-none text-xs font-axis-sng-indlab-value text-fantas-800">
          {points.map((p, idx) => (
            <div
              key={idx}
              className="absolute -translate-x-1/2"
              style={{
                left: `${(p.x / 500) * 100}%`,
                top: `${Math.max(p.y - 18, 2)}px`,
              }}
            >
              <span>{p.temp}°</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative w-full h-6 text-xs text-[#0f384d] font-bold mt-1">
        {points.map((p, idx) => (
          <div
            key={idx}
            className="absolute -translate-x-1/2 flex justify-center"
            style={{ left: `${(p.x / 500) * 100}%` }}
          >
            <span className="font-axis-navbar-focus tracking-wider text-fantas-800/80">
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
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!weather) return null;

  const currentWeatherConfig = getWeatherConfig(
    weather.weatherCode,
    weather.isDay
  );

  return (
    <Section className="flex flex-col justify-center items-center w-full">
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

      {/* ROOT CONTAINER (Flat sharp borders, no shadow, no rounded corners) */}
      <div className="flex flex-col md:flex-row w-full max-w-4xl mx-auto overflow-hidden font-sans select-none border border-slate-700/20">
        {/* LEFT PANEL */}
        <div className="w-full md:w-[38%] bg-fantas-900/90 text-white pt-7 pb-5 px-7 flex flex-col justify-between">
          <div>
            <div className="w-full flex flex-row justify-between items-start">
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl lg:text-4xl font-axis-subtitular-focus text-fantas-100/90 leading-none tracking-wide">
                  {weather.name}
                </h1>
                <span className="text-6xl lg:text-7xl font-axis-sng-indlab-value tracking-wide text-white block mt-2">
                  {weather.temp}°C
                </span>
              </div>

              <div className="w-16 h-16 flex items-center justify-center">
                <MeteoIcon
                  name={currentWeatherConfig.icon}
                  className="w-16 h-16"
                />
              </div>
            </div>
          </div>

          {/* Metrics List with independent divider lines */}
          <div className="w-full mt-6 flex flex-col">
            <MetricItem
              icon="streamline-ultimate:rain-umbrella-1-bold"
              label="Chance of Rain"
              value={`${weather.rainChance}%`}
            />

            {/* Standalone Divider 1 */}
            <div className="w-full h-px bg-gray-500/40 my-1" />

            <MetricItem
              icon="material-symbols:humidity-percentage-outline"
              label="Humidity"
              value={`${weather.humidity}%`}
            />

            {/* Standalone Divider 2 */}
            <div className="w-full h-px bg-gray-500/40 my-1" />

            <MetricItem
              icon="ph:wind-bold"
              label="Wind Speed"
              value={`${weather.windSpeed} KPH`}
            />
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full md:w-[62%] bg-fantas-800/20 flex flex-col justify-between">
          {/* Top: Hourly Curve */}
          <HourlyChart hourly={weather.hourly} />

          {/* Bottom: 4-Day Forecast Grid */}
          <div className="w-full grid grid-cols-4 divide-x divide-fantas-900/10 pb-6 pt-4 border-t border-fantas-900/10">
            {weather.daily.map((item, index) => {
              const config = getWeatherConfig(item.weatherCode, true);
              return (
                <div
                  key={index}
                  className="flex flex-col items-center justify-between px-1 pt-1 gap-2"
                >
                  {/* Day Header */}
                  <span className="text-xs sm:text-sm font-axis-navbar-focus text-fantas-800 tracking-wider truncate block">
                    {item.dayName}
                  </span>

                  {/* Weather Icon */}
                  <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-18 md:h-18 flex justify-center items-center my-1">
                    <MeteoIcon
                      name={config.icon}
                      className="w-12 h-12 sm:w-16 sm:h-16 md:w-18 md:h-18"
                    />
                  </div>

                  {/* Temperatures:
                      Desktop: min on left, divide-x, max on right
                      Mobile: flex-col-reverse (max on top, min below, no vertical line) */}
                  <div className="w-full flex flex-col-reverse md:flex-row justify-center items-center md:divide-x md:divide-gray-600">
                    <div className="text-base sm:text-lg md:text-2xl font-axis-sng-indlab-value tracking-wider text-kapwa-brand-500 md:pr-2.5">
                      {item.tempMin}°
                    </div>
                    <div className="text-lg sm:text-xl md:text-2xl font-axis-sng-indlab-value tracking-wider text-flamengo-600 md:pl-2.5">
                      {item.tempMax}°
                    </div>
                  </div>

                  {/* Rain Details */}
                  <div className="flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-1.5 mt-1.5 px-1 md:px-2 py-0.5 bg-fantas-900/20 text-fantas-100/90 text-xs">
                    <div className="flex items-center gap-1 font-axis-navbar-focus tracking-wide">
                      <LazyIcon
                        name="streamline-ultimate:rain-umbrella-1-bold"
                        className="h-3.5 w-3.5 text-fantas-900/70 shrink-0"
                      />
                      <span className="text-[12px] sm:text-[12px] md:text-[12px] text-fantas-900/70">
                        {item.precipitationProb}%
                      </span>
                    </div>
                    <span className="text-[9px] md:text-[10px] text-fantas-900/70 font-axis-navbar-focus tracking-wide">
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
