// app/config/weather-config.ts

export interface LocationConfig {
  name: string;
  lat: number;
  lon: number;
}

export const WEATHER_LOCATIONS: LocationConfig[] = [
  { name: 'Infanta (Poblacion)', lat: 14.7452, lon: 121.6492 },
  { name: 'General Nakar', lat: 14.7667, lon: 121.6333 },
  { name: 'Real', lat: 14.6622, lon: 121.6033 },
  { name: 'Polillo', lat: 14.7247, lon: 121.9389 },
];

export interface WeatherMapEntry {
  icon: string;
  label: string;
  iconClass: string;
}

export function getWeatherConfig(code: number): WeatherMapEntry {
  if (code === 0) {
    return {
      icon: 'lucide:sun',
      label: 'Clear Sky',
      iconClass: 'text-amber-400 fill-amber-300/60',
    };
  }
  if (code >= 1 && code <= 3) {
    return {
      icon: 'lucide:cloud-sun',
      label: 'Partly Cloudy',
      iconClass: 'text-amber-400 fill-amber-200/40',
    };
  }
  if (code === 45 || code === 48) {
    return {
      icon: 'lucide:cloud-fog',
      label: 'Foggy',
      iconClass: 'text-slate-300 fill-slate-100',
    };
  }
  if (code >= 51 && code <= 57) {
    return {
      icon: 'lucide:cloud-drizzle',
      label: 'Drizzle',
      iconClass: 'text-blue-300 fill-blue-50/50',
    };
  }
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return {
      icon: 'lucide:cloud-rain',
      label: 'Rainy',
      iconClass: 'text-sky-400 fill-sky-200/60',
    };
  }
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
    return {
      icon: 'lucide:snowflake',
      label: 'Snowy',
      iconClass: 'text-sky-200 fill-sky-50',
    };
  }
  if (code >= 95 && code <= 99) {
    return {
      icon: 'lucide:cloud-lightning',
      label: 'Thunderstorms',
      iconClass: 'text-amber-400 fill-amber-100/50',
    };
  }

  return {
    icon: 'lucide:cloud',
    label: 'Cloudy',
    iconClass: 'text-slate-300 fill-slate-200/60',
  };
}
