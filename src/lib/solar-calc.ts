// lib/solar-calc.ts

import { HourlyData, SolarForecast, BatteryType, Appliance, LocationInfo } from '@/types/solar';
import { STORAGE_FACTORS } from '@/data/solarData';

export const DEFAULT_LOCATION: LocationInfo = {
  barangay: 'Poblacion',
  town: 'Infanta',
  province: 'Quezon',
  latitude: 14.75,
  longitude: 121.65,
  isLiveGps: false,
};

/**
 * Calculates usable energy after battery derating
 */
export function calculateUsableKwh(generatedKwh: number, batteryType: BatteryType): number {
  const factor = STORAGE_FACTORS[batteryType]?.factor ?? 1.0;
  return Number((generatedKwh * factor).toFixed(2));
}

// Alias in case older files import calculateUsableEnergy
export const calculateUsableEnergy = calculateUsableKwh;

/**
 * Calculates isolated appliance runtime
 */
export function calculateApplianceRuntime(usableKwh: number, appliance: Appliance): number {
  if (usableKwh <= 0 || !appliance) return 0;

  if (appliance.type === 'cycle') {
    return Math.floor((usableKwh * 1000) / appliance.drawWh);
  }
  return Number((usableKwh / (appliance.drawWh / 1000)).toFixed(1));
}

// Alias in case older files import calculateRuntime
export const calculateRuntime = calculateApplianceRuntime;

/**
 * Reverse-geocodes coordinates into Philippine Barangay, Municipality, and Province
 */
export async function reverseGeocode(lat: number, lon: number): Promise<Omit<LocationInfo, 'isLiveGps'>> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      const rawBarangay =
        addr.village ||
        addr.quarter ||
        addr.suburb ||
        addr.neighbourhood ||
        addr.hamlet ||
        addr.city_district ||
        '';

      const barangay = rawBarangay.replace(/^(Barangay|Brgy\.?)\s+/i, '');
      const town = addr.town || addr.municipality || addr.city || 'Infanta';
      const province = addr.province || addr.state || 'Quezon';

      return {
        barangay: barangay || 'Poblacion',
        town,
        province,
        latitude: Number(lat.toFixed(4)),
        longitude: Number(lon.toFixed(4)),
      };
    }
  } catch (err) {
    console.warn('Nominatim reverse geocode failed, trying fallback:', err);
  }

  try {
    const resFallback = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    if (resFallback.ok) {
      const fbData = await resFallback.json();
      return {
        barangay: fbData.locality || 'Poblacion',
        town: fbData.city || 'Infanta',
        province: fbData.principalSubdivision || 'Quezon',
        latitude: Number(lat.toFixed(4)),
        longitude: Number(lon.toFixed(4)),
      };
    }
  } catch (err) {
    console.error('All reverse geocoders failed:', err);
  }

  return {
    barangay: '',
    town: 'Infanta',
    province: 'Quezon',
    latitude: Number(lat.toFixed(4)),
    longitude: Number(lon.toFixed(4)),
  };
}

/**
 * Fetches Open-Meteo solar forecast
 */
export async function fetchSolarForecast(latitude = 14.75, longitude = 121.65): Promise<SolarForecast> {
  const roundedLat = latitude.toFixed(2);
  const roundedLon = longitude.toFixed(2);
  const CACHE_KEY = `betterinfanta_solar_${roundedLat}_${roundedLon}_v5`;
  const CACHE_EXP_KEY = `betterinfanta_solar_exp_${roundedLat}_${roundedLon}_v5`;

  if (typeof window !== 'undefined') {
    const cached = sessionStorage.getItem(CACHE_KEY);
    const exp = sessionStorage.getItem(CACHE_EXP_KEY);
    if (cached && exp && Date.now() < Number(exp)) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed?.sunriseTime && parsed?.peakTime) return parsed;
      } catch {
        sessionStorage.removeItem(CACHE_KEY);
      }
    }
  }

  const url =
    'https://api.open-meteo.com/v1/forecast?' +
    new URLSearchParams({
      latitude: latitude.toFixed(4),
      longitude: longitude.toFixed(4),
      hourly: 'global_tilted_irradiance',
      daily: 'sunrise,sunset',
      tilt: '15',
      azimuth: '0',
      timezone: 'Asia/Manila',
      forecast_days: '2',
    }).toString();

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);

  const data = await res.json();
  const times: string[] = data.hourly?.time?.slice(0, 24) || [];
  const gti: number[] = data.hourly?.global_tilted_irradiance?.slice(0, 24) || [];

  const rawSunrise = data.daily?.sunrise?.[0];
  const rawSunset = data.daily?.sunset?.[0];
  const sunriseTime = rawSunrise ? rawSunrise.split('T')[1].slice(0, 5) : '05:43';
  const sunsetTime = rawSunset ? rawSunset.split('T')[1].slice(0, 5) : '17:48';

  const hourly: HourlyData[] = times.map((t, idx) => ({
    time: t.split('T')[1].slice(0, 5),
    gti: Math.max(0, Math.round(gti[idx] || 0)),
  }));

  let maxIdx = 12;
  let maxGti = -1;
  gti.forEach((val, idx) => {
    if (val > maxGti) {
      maxGti = val;
      maxIdx = idx;
    }
  });

  let peakTime = '11:45';
  if (maxGti > 0) {
    const y1 = gti[maxIdx - 1] ?? 0;
    const y2 = gti[maxIdx] ?? 0;
    const y3 = gti[maxIdx + 1] ?? 0;
    const denom = y1 - 2 * y2 + y3;
    let deltaHours = 0;
    if (denom < 0) {
      deltaHours = 0.5 * ((y1 - y3) / denom);
      deltaHours = Math.max(-0.5, Math.min(0.5, deltaHours));
    }
    const peakDecimalHour = Math.max(0, (maxIdx - 0.5) + deltaHours);
    const totalMinutes = Math.round(peakDecimalHour * 60);
    const peakHour = Math.floor(totalMinutes / 60) % 24;
    const peakMin = totalMinutes % 60;
    peakTime = `${String(peakHour).padStart(2, '0')}:${String(peakMin).padStart(2, '0')}`;
  }

  const sumWh = gti.reduce((acc, curr) => acc + (curr > 0 ? curr : 0), 0);
  const peakSunHours = Number((sumWh / 1000).toFixed(2));
  const generatedKwh1kWp = Number((peakSunHours * 0.8).toFixed(2));

  const payload: SolarForecast = {
    date: times[0]?.split('T')[0] || new Date().toISOString().split('T')[0],
    hourly,
    peakSunHours,
    generatedKwh1kWp,
    peakTime,
    sunriseTime,
    sunsetTime,
  };

  if (typeof window !== 'undefined') {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    sessionStorage.setItem(CACHE_EXP_KEY, String(Date.now() + 60 * 60 * 1000));
  }

  return payload;
}
