// src/components/home/WeatherCard.tsx
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import LazyIcon from '../ui/Lazying';

interface CurrentWeather {
  temp: number;
  precipitation: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
}

interface HourlyForecast {
  time: string;
  temp: number;
}

interface DailyForecast {
  dayName: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
}

const DEFAULT_COORDS = { lat: 14.7452, lon: 121.6492, name: "INFANTA" }; // Default to Infanta, Quezon

// WMO Weather code mapper for Remix Icons & labels
function getWeatherConfig(code: number) {
  if (code === 0) return { icon: 'ri:sun-line', label: 'Clear' };
  if (code >= 1 && code <= 3) return { icon: 'ri:cloudy-2-line', label: 'Partly Cloudy' };
  if (code === 45 || code === 48) return { icon: 'ri:mist-line', label: 'Foggy' };
  if (code >= 51 && code <= 57) return { icon: 'ri:drizzle-line', label: 'Drizzle' };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { icon: 'ri:rainy-line', label: 'Rainy' };
  if (code >= 95 && code <= 99) return { icon: 'ri:thunderstorms-line', label: 'Stormy' };
  return { icon: 'ri:cloudy-line', label: 'Cloudy' };
}

export default function WeatherCard() {
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [hourly, setHourly] = useState<HourlyForecast[]>([]);
  const [daily, setDaily] = useState<DailyForecast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${DEFAULT_COORDS.lat}&longitude=${DEFAULT_COORDS.lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FManila&forecast_days=4`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Weather fetch failed");
        const data = await res.json();

        // 1. Current Weather
        setCurrent({
          temp: Math.round(data.current.temperature_2m),
          precipitation: Math.round(data.current.precipitation),
          humidity: Math.round(data.current.relative_humidity_2m),
          windSpeed: Math.round(data.current.wind_speed_10m),
          weatherCode: data.current.weather_code,
        });

        // 2. Hourly Weather (Map 5 evenly spaced intervals for the SVG graph)
        const hourlyTimes = data.hourly.time;
        const hourlyTemps = data.hourly.temperature_2m;
        const currentHourIdx = new Date().getHours();

        const graphData: HourlyForecast[] = [];
        for (let i = 0; i < 5; i++) {
          const targetIdx = (currentHourIdx + i * 3) % 24; // 3-hour intervals
          const timeString = new Date(hourlyTimes[targetIdx]).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });
          graphData.push({
            time: timeString,
            temp: Math.round(hourlyTemps[targetIdx]),
          });
        }
        setHourly(graphData);

        // 3. Daily Weather (4-Day Forecast)
        const daysOfWeek = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
        const dailyData: DailyForecast[] = data.daily.time.map((timeStr: string, idx: number) => {
          const dateObj = new Date(timeStr);
          const isToday = idx === 0;
          const dayName = isToday ? "TODAY" : daysOfWeek[dateObj.getDay()];

          return {
            dayName,
            weatherCode: data.daily.weather_code[idx],
            tempMax: Math.round(data.daily.temperature_2m_max[idx]),
            tempMin: Math.round(data.daily.temperature_2m_min[idx]),
          };
        });
        setDaily(dailyData);

      } catch (err) {
        console.error("Failed to fetch homepage weather", err);
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, []);

  if (loading) {
    return (
      <div className="w-auto h-[360px] bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
      </div>
    );
  }

  if (!current || hourly.length === 0 || daily.length === 0) {
    return (
      <div className="w-auto h-[360px] bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-sm text-gray-400">
        Weather info temporarily unavailable.
      </div>
    );
  }

  // --- 📈 PURE SVG TEMPERATURE GRAPH GENERATOR (No chart packages, pure responsive vector paths!) ---
  const temps = hourly.map(h => h.temp);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const tempDiff = maxTemp - minTemp || 1;

  // X & Y Grid Alignments inside the 500x120 SVG viewport
  const xCoords = [50, 150, 250, 350, 450];
  const scaleY = (temp: number) => {
    // Math scale: places maximum temperature near Y=25 and minimum near Y=85
    return 85 - ((temp - minTemp) / tempDiff) * 60;
  };

  const pathD = hourly.map((h, i) => `${i === 0 ? 'M' : 'L'} ${xCoords[i]} ${scaleY(h.temp)}`).join(' ');
  const areaD = `${pathD} L ${xCoords[4]} 120 L ${xCoords[0]} 120 Z`;

  return (
    <div className="max-w-6xl overflow-hidden rounded-2xl border border-slate-800 shadow-lg flex flex-col md:flex-row h-auto md:h-[380px]">

      {/* 🌑 LEFT HALF: Current City Status & Details (Dark Charcoal Gray) */}
      <div className="w-full md:w-1/3 bg-[#363636] p-6 sm:p-8 flex flex-col justify-between text-start text-white shrink-0">
        <div>
          {/* City Name */}
          <h1 className="text-4xl sm:text-5xl font-axis-titular-focus tracking-wider uppercase text-sky-400 leading-none">
            {DEFAULT_COORDS.name}
          </h1>
          {/* Current Temp */}
          <span className="text-6xl sm:text-7xl font-axis-sng-indlab-value text-white block mt-4 font-light tracking-tight leading-none">
            {current.temp}<span className="text-4xl sm:text-5xl align-top">°C</span>
          </span>
        </div>

        {/* Dynamic Weather Metrics */}
        <div className="space-y-3 pt-6 border-t border-white/10 mt-6 md:mt-0">
          {/* Rain */}
          <div className="flex justify-between items-center text-xs uppercase tracking-widest font-axis-sng-indlab-header text-gray-300">
            <span>Precipitation</span>
            <span className="font-axis-sng-indlab-value text-sm sm:text-base text-white font-semibold">{current.precipitation}%</span>
          </div>
          <div className="h-px bg-white/5 w-full" />

          {/* Humidity */}
          <div className="flex justify-between items-center text-xs uppercase tracking-widest font-axis-sng-indlab-header text-gray-300">
            <span>Humidity</span>
            <span className="font-axis-sng-indlab-value text-sm sm:text-base text-white font-semibold">{current.humidity}%</span>
          </div>
          <div className="h-px bg-white/5 w-full" />

          {/* Wind */}
          <div className="flex justify-between items-center text-xs uppercase tracking-widest font-axis-sng-indlab-header text-gray-300">
            <span>Wind Speed</span>
            <span className="font-axis-sng-indlab-value text-sm sm:text-base text-white font-semibold">{current.windSpeed} km/h</span>
          </div>
        </div>
      </div>

      {/* 🌌 RIGHT HALF: Interactive Temperature Wave & 4-Day Forecast (Deep Ocean Blue) */}
      <div className="flex-1 bg-[#1e2d4d] flex flex-col justify-between overflow-hidden">

        {/* Top: Vector Wave Graph */}
        <div className="relative w-full pt-6 flex-1 flex flex-col justify-between min-h-[160px]">
          {/* Dynamic SVG Drawing */}
          <svg className="w-full h-full min-h-[100px] overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none" aria-hidden="true">
            {/* Shaded Area Underneath */}
            <path d={areaD} className="fill-sky-400/15 transition-all duration-300" />

            {/* Line Path */}
            <path d={pathD} className="stroke-sky-400 stroke-2 fill-none transition-all duration-300" />

            {/* Interactive dots + numeric readouts */}
            {hourly.map((h, i) => (
              <g key={i}>
                <circle cx={xCoords[i]} cy={scaleY(h.temp)} r="4" className="fill-white ring-4 ring-sky-400/30" />
                <text
                  x={xCoords[i]}
                  y={scaleY(h.temp) - 12}
                  textAnchor="middle"
                  className="fill-white text-[10px] font-axis-sng-indlab-value font-medium"
                >
                  {h.temp}°
                </text>
              </g>
            ))}
          </svg>

          {/* Hourly Timeline Axis */}
          <div className="grid grid-cols-5 px-6 pb-2 text-[10px] uppercase font-axis-sng-indlab-header text-sky-200/50 text-center tracking-wider shrink-0 border-b border-white/5">
            {hourly.map((h, i) => (
              <span key={i} className="tabular-nums">{h.time}</span>
            ))}
          </div>
        </div>

        {/* Bottom: 4-Day Forecast Grid */}
        <div className="grid grid-cols-4 p-4 sm:p-6 gap-2 divide-x divide-white/5 shrink-0 bg-black/10">
          {daily.map((day, idx) => {
            const config = getWeatherConfig(day.weatherCode);
            return (
              <div key={idx} className="flex flex-col items-center justify-center text-center space-y-2 first:pl-0 pl-2">
                {/* Day Header */}
                <span className="text-[10px] sm:text-xs font-axis-sng-indlab-header uppercase tracking-wider text-white">
                  {day.dayName}
                </span>

                {/* Styled Vector Weather Icon */}
                <div className="py-1">
                  <LazyIcon name={config.icon} className="h-7 w-7 text-sky-300 shrink-0" />
                </div>

                {/* Temps Row */}
                <div className="flex flex-col text-[12px] sm:text-sm font-axis-sng-indlab-value font-medium tabular-nums">
                  <span className="text-orange-400">{day.tempMax}°</span>
                  <span className="text-sky-300/60">{day.tempMin}°</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}
