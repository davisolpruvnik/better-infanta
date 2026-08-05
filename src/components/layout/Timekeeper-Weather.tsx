// app/components/timekeeper.tsx
import { useState, useEffect, lazy, Suspense } from 'react';

// 💡 LAZY ENABLED: Split the Iconify renderer into a separate on-demand chunk
const LazyIconify = lazy(() =>
  import('@iconify/react').then(module => ({ default: module.Icon }))
);

// --- PRIVATE HELPERS & CONFIGS (No "export" keywords here to satisfy Fast Refresh) ---

interface LocationConfig {
  name: string;
  lat: number;
  lon: number;
}

const WEATHER_LOCATIONS: LocationConfig[] = [
  { name: 'Infanta', lat: 14.7452, lon: 121.6492 },
  { name: 'Umiray (Gen. Nakar)', lat: 15.199, lon: 121.4222 },
  { name: 'Llavac (Real)', lat: 14.519, lon: 121.5352 },
  { name: 'Polillo', lat: 14.7247, lon: 121.9389 },
  { name: 'Jomalig', lat: 14.6959, lon: 122.3307 },
];

interface WeatherMapEntry {
  icon: string;
  label: string;
  iconClass: string;
}

function getWeatherConfig(code: number): WeatherMapEntry {
  if (code === 0) {
    return {
      icon: 'lucide:sun',
      label: 'Clear Sky',
      iconClass: 'text-amber-500 fill-amber-300/60',
    };
  }
  if (code >= 1 && code <= 3) {
    return {
      icon: 'lucide:cloud-sun',
      label: 'Partly Cloudy',
      iconClass: 'text-amber-600 fill-amber-200/40',
    };
  }
  if (code === 45 || code === 48) {
    return {
      icon: 'lucide:cloud-fog',
      label: 'Foggy',
      iconClass: 'text-slate-400 fill-slate-100',
    };
  }
  if (code >= 51 && code <= 57) {
    return {
      icon: 'lucide:cloud-drizzle',
      label: 'Drizzle',
      iconClass: 'text-blue-400 fill-blue-50/50',
    };
  }
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return {
      icon: 'lucide:cloud-rain',
      label: 'Rainy',
      iconClass: 'text-sky-500 fill-sky-200/60',
    };
  }
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
    return {
      icon: 'lucide:snowflake',
      label: 'Snowy',
      iconClass: 'text-sky-300 fill-sky-50',
    };
  }
  if (code >= 95 && code <= 99) {
    return {
      icon: 'lucide:cloud-lightning',
      label: 'Thunderstorms',
      iconClass: 'text-amber-500 fill-amber-100/50',
    };
  }

  return {
    icon: 'lucide:cloud',
    label: 'Cloudy',
    iconClass: 'text-slate-400 fill-slate-200/60',
  };
}

interface LocationWeather {
  name: string;
  temp: number;
  weatherCode: number;
}

interface CurrencyRate {
  code: string;
  symbol: string;
  rateInPhp: number;
}

// --- PRIMARY COMPONENT EXPORT ---

export default function Timekeeper() {
  const [timeStr, setTimeStr] = useState('');
  const [gmtOffsetStr, setGmtOffsetStr] = useState('');

  // Weather state
  const [weatherList, setWeatherList] = useState<LocationWeather[]>([]);
  const [loadingWeather, setLoadingWeather] = useState(true);

  // Currency state
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>([]);
  const [loadingRates, setLoadingRates] = useState(true);

  // Carousel Rotation Indexes
  const [activeWeatherIndex, setActiveWeatherIndex] = useState(0);
  const [activeCurrencyIndex, setActiveCurrencyIndex] = useState(0);

  // Carousel Transition States
  const [isWeatherFading, setIsWeatherFading] = useState(false);
  const [isCurrencyFading, setIsCurrencyFading] = useState(false);

  // 🕒 1. Clock & Timezone Offset loop
  useEffect(() => {
    const calculateOffset = () => {
      const offsetMinutes = new Date().getTimezoneOffset();
      const offsetHours = -offsetMinutes / 60;
      if (offsetMinutes === 0) return 'GMT';
      const sign = offsetHours >= 0 ? '+' : '';
      return `GMT${sign}${offsetHours}`;
    };

    setGmtOffsetStr(calculateOffset());

    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setTimeStr(`${hours}:${minutes}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // ☁️ 2. Single-Query Batch Weather Fetch
  useEffect(() => {
    async function fetchAllWeather() {
      try {
        const lats = WEATHER_LOCATIONS.map(loc => loc.lat).join(',');
        const lons = WEATHER_LOCATIONS.map(loc => loc.lon).join(',');

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,weather_code&timezone=Asia%2FManila`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Batch weather request failed');

        const data = await res.json();
        const dataList = Array.isArray(data) ? data : [data];

        const formattedList = WEATHER_LOCATIONS.map((loc, idx) => {
          const forecast = dataList[idx]?.current;
          return {
            name: loc.name,
            temp: forecast ? Math.round(forecast.temperature_2m) : 0,
            weatherCode: forecast ? forecast.weather_code : 0,
          };
        });

        setWeatherList(formattedList);
      } catch (err) {
        console.error('Failed to load batch weather', err);
      } finally {
        setLoadingWeather(false);
      }
    }

    fetchAllWeather();
  }, []);

  // 💵 3. Free Exchange Rate API Fetch (Base USD, converted to PHP)
  useEffect(() => {
    async function fetchExchangeRates() {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if (!res.ok) throw new Error('Currency fetch failed');

        const data = await res.json();
        const phpRate = data.rates.PHP;

        const rates: CurrencyRate[] = [
          { code: 'USD', symbol: '$', rateInPhp: phpRate },
          { code: 'EUR', symbol: '€', rateInPhp: phpRate / data.rates.EUR },
          { code: 'GBP', symbol: '£', rateInPhp: phpRate / data.rates.GBP },
          { code: 'JPY', symbol: '¥', rateInPhp: phpRate / data.rates.JPY },
          { code: 'BRL', symbol: 'R$', rateInPhp: phpRate / data.rates.BRL },
        ];

        setCurrencyRates(rates);
      } catch (err) {
        console.error('Failed to load currency rates', err);
      } finally {
        setLoadingRates(false);
      }
    }

    fetchExchangeRates();
  }, []);

  // 🎠 4. Sync Multi-Rotations every 5 seconds with offset transitions
  useEffect(() => {
    const rotationInterval = setInterval(() => {
      setIsWeatherFading(true);
      setIsCurrencyFading(true);

      setTimeout(() => {
        if (weatherList.length > 0) {
          setActiveWeatherIndex(prev => (prev + 1) % weatherList.length);
        }
        if (currencyRates.length > 0) {
          setActiveCurrencyIndex(prev => (prev + 1) % currencyRates.length);
        }

        setIsWeatherFading(false);
        setIsCurrencyFading(false);
      }, 350);
    }, 5000);

    return () => clearInterval(rotationInterval);
  }, [weatherList, currencyRates]);

  const activeWeather = weatherList[activeWeatherIndex];
  const weatherDetails = activeWeather
    ? getWeatherConfig(activeWeather.weatherCode)
    : null;
  const weatherIconName = weatherDetails ? weatherDetails.icon : null;

  const activeCurrency = currencyRates[activeCurrencyIndex];

  return (
    <nav className="w-full bg-cream-200 border-b border-cream-300 text-[10px] sm:text-[11px] font-axis-medium uppercase tracking-wide text-burgundy-900/60 py-1.5 px-3 sm:px-6 select-none transition-all duration-300">
      {/* 💡 FIXED: w-full on mobile to use maximum screen width, restricts to max-6xl on desktops */}
      <div className="w-full max-w-6xl mx-auto flex justify-between items-center gap-2">
        {/* 🏰 LEFT SIDE: Pulse indicators, running system time, & offset metadata */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="relative flex items-center justify-center w-2 h-2">
            <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-primary-400 opacity-70"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary-500"></span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="font-axis-chunky text-primary-800 proportional-nums text-[10px] sm:text-[12px]">
              {timeStr || '00:00'}
            </span>
            {/* 💡 SPACE SAVER: Hidden on mobile screens, shown on tablet/desktop */}
            <span className="hidden sm:inline-block opacity-80 text-[10px] text-primary-800">
              ({gmtOffsetStr})
            </span>
          </div>
        </div>

        {/* ☁️ & 💵 RIGHT SIDE: Live Weather + Exchange Rates Tickers */}
        <div className="flex items-center gap-2 sm:gap-3 justify-end flex-1 min-w-0 tracking-wider">
          {/* A. Currency Exchange Ticker (USD, EUR, GBP, JPY, BRL in PHP) */}
          <div className="flex items-center min-w-18.75 sm:min-w-25 justify-end border-r border-burgundy-300/30 pr-2 sm:pr-3 shrink-0">
            {loadingRates ? (
              <Suspense
                fallback={
                  <div className="h-3 w-3 rounded-full bg-burgundy-900/10 animate-pulse shrink-0" />
                }
              >
                <LazyIconify
                  icon="lucide:loader-2"
                  className="h-3 w-3 animate-spin text-burgundy-900/40"
                />
              </Suspense>
            ) : activeCurrency ? (
              <div
                className={`flex items-center gap-1 transition-all duration-300 ease-in-out transform ${
                  isCurrencyFading
                    ? 'opacity-0 -translate-y-1 scale-95'
                    : 'opacity-100 translate-y-0 scale-100'
                }`}
              >
                <span className="font-axis-subtitular-focus text-burgundy-900/80 text-[10px] sm:text-[12px]">
                  {activeCurrency.code}
                </span>
                <span className="font-axis-sng-indlab-value text-primary-800 proportional-nums text-[10px] sm:text-[12px]">
                  ₱{activeCurrency.rateInPhp.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="text-[9px] text-burgundy-900/30">Rates Off</span>
            )}
          </div>

          {/* B. Localized Multi-Town Weather Carousel */}
          <div className="flex items-center min-w-[110px] sm:min-w-[140px] justify-start shrink-0">
            {loadingWeather ? (
              <Suspense
                fallback={
                  <div className="h-3 w-3 rounded-full bg-burgundy-900/10 animate-pulse shrink-0" />
                }
              >
                <LazyIconify
                  icon="lucide:loader-2"
                  className="h-3 w-3 animate-spin text-burgundy-900/40"
                />
              </Suspense>
            ) : activeWeather && weatherIconName ? (
              <div
                className={`flex items-center gap-1.5 sm:gap-2 transition-all duration-300 ease-in-out transform ${
                  isWeatherFading
                    ? 'opacity-0 -translate-y-1 scale-95'
                    : 'opacity-100 translate-y-0 scale-100'
                }`}
              >
                {/* 💡 SPACE SAVER: Truncates long town names on extremely small mobile screens */}
                <span className="font-axis-subtitular-focus text-burgundy-900/85 text-[10px] sm:text-[12px] truncate max-w-[65px] sm:max-w-none">
                  {activeWeather.name}
                </span>

                <span className="text-burgundy-300/40">|</span>

                <div
                  className="flex items-center gap-1"
                  title={weatherDetails?.label}
                >
                  {/* 💡 LAZY ENABLED WEATHER ICON */}
                  <Suspense
                    fallback={
                      <div className="h-3.5 w-3.5 rounded bg-primary-200/40 animate-pulse shrink-0" />
                    }
                  >
                    <LazyIconify
                      icon={weatherIconName}
                      className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${weatherDetails?.iconClass}`}
                    />
                  </Suspense>
                  <span className="font-axis-sng-indlab-value text-primary-800 text-[11px] sm:text-[12px] proportional-nums">
                    {activeWeather.temp}°C
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-[10px] text-burgundy-900/40">Offline</span>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
