// src/hooks/useWeather.ts
import { getWeatherConfig, LocationConfig, WeatherMapEntry } from '@/components/config/weather-config';
import { useState, useEffect } from 'react';

export interface HourlyPoint {
  time: string;
  temp: number;
}

export interface DailyForecastDay {
  dayName: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitationProb: number;
  precipitationSum: number;
}

export interface ProcessedWeatherData {
  name: string;
  temp: number;
  feelsLike: number;
  minTemp: number;
  maxTemp: number;
  humidity: number;
  precipitation: number;
  rainChance: number;
  windSpeed: number;
  windGusts: number;
  aqi: number;
  weatherCode: number;
  isDay: boolean;
  condition: WeatherMapEntry;
  sunrise: string;
  sunset: string;
  hourly: HourlyPoint[];
  daily: DailyForecastDay[];
}

function formatIsoTime(isoString?: string): string {
  if (!isoString) return '--:--';
  const timePart = isoString.split('T')[1];
  return timePart ? timePart.substring(0, 5) : '--:--';
}

export function useWeather(location: LocationConfig) {
  const [data, setData] = useState<ProcessedWeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchWeatherData() {
      try {
        setLoading(true);
        setError(null);

        // 1. Weather Forecast Parameters (Includes 4 days + Hourly + Precipitation)
        const weatherParams = new URLSearchParams({
          latitude: location.lat.toString(),
          longitude: location.lon.toString(),
          current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,is_day',
          hourly: 'temperature_2m',
          daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,rain_sum,sunrise,sunset,sunshine_duration,shortwave_radiation_sum',
          wind_speed_unit: 'kmh',
          timezone: 'Asia/Manila',
          forecast_days: '4',
        });

        // 2. Air Quality Parameters
        const aqiParams = new URLSearchParams({
          latitude: location.lat.toString(),
          longitude: location.lon.toString(),
          current: 'us_aqi',
          timezone: 'Asia/Manila',
        });

        const weatherUrl = `https://api.open-meteo.com/v1/forecast?${weatherParams.toString()}`;
        const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?${aqiParams.toString()}`;

        // Fetch Weather & AQI concurrently
        const [weatherRes, aqiRes] = await Promise.all([
          fetch(weatherUrl),
          fetch(aqiUrl),
        ]);

        if (!weatherRes.ok) throw new Error('Failed to fetch weather data');

        const weatherJson = await weatherRes.json();
        const aqiJson = aqiRes.ok ? await aqiRes.json() : null;

        const current = weatherJson.current;
        const daily = weatherJson.daily;
        const hourly = weatherJson.hourly;
        const wmoCode = current?.weather_code ?? 0;
        const isDay = current?.is_day === 1;

        // -------------------------------------------------------------
        // HOURLY: 12-Hour Outlook starting at the NEXT top of the hour
        // -------------------------------------------------------------
        const hourlyTimes: string[] = hourly?.time ?? [];
        const hourlyTemps: number[] = hourly?.temperature_2m ?? [];

        const nextHour = new Date();
        nextHour.setMinutes(0, 0, 0);
        nextHour.setHours(nextHour.getHours() + 1);
        const nextHourMs = nextHour.getTime();

        let startIdx = hourlyTimes.findIndex((t) => new Date(t).getTime() >= nextHourMs);
        if (startIdx === -1) startIdx = 0;

        const TOTAL_POINTS = 5;
        const INTERVAL_HOURS = 3; // (0h, +3h, +6h, +9h, +12h)
        const graphData: HourlyPoint[] = [];

        for (let i = 0; i < TOTAL_POINTS; i++) {
          const targetIdx = startIdx + i * INTERVAL_HOURS;
          if (hourlyTimes[targetIdx]) {
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
        }

        // -------------------------------------------------------------
        // DAILY: 4-Day Forecast with Rain Probabilities & MM Fallbacks
        // -------------------------------------------------------------
        const daysOfWeek = ['SUN', 'MON', 'TUES', 'WED', 'THURS', 'FRI', 'SAT'];
        const dailyData: DailyForecastDay[] = (daily?.time ?? []).map((timeStr: string, idx: number) => {
          const dateObj = new Date(timeStr);
          const wCode = daily?.weather_code?.[idx] ?? 0;
          const rawSum = daily?.precipitation_sum?.[idx] ?? daily?.rain_sum?.[idx] ?? 0;
          const precipMm = Math.round(Number(rawSum) * 10) / 10;

          let precipProb = daily?.precipitation_probability_max?.[idx];
          if (precipProb === null || precipProb === undefined) {
            if (precipMm >= 10 || (wCode >= 65 && wCode <= 67) || (wCode >= 95 && wCode <= 99)) precipProb = 90;
            else if (precipMm >= 3 || wCode === 63 || wCode === 81) precipProb = 75;
            else if (precipMm > 0 || (wCode >= 51 && wCode <= 61) || wCode === 80) precipProb = 45;
            else precipProb = 0;
          }

          return {
            dayName: idx === 0 ? 'TODAY' : daysOfWeek[dateObj.getDay()],
            weatherCode: wCode,
            tempMax: Math.round(daily?.temperature_2m_max?.[idx] ?? 30),
            tempMin: Math.round(daily?.temperature_2m_min?.[idx] ?? 24),
            precipitationProb: Math.round(precipProb),
            precipitationSum: precipMm,
          };
        });

        // -------------------------------------------------------------
        // COMBINED DATA OBJECT
        // -------------------------------------------------------------
        const processed: ProcessedWeatherData = {
          name: location.name,
          temp: Math.round(current?.temperature_2m ?? 29),
          feelsLike: Math.round(current?.apparent_temperature ?? 33),
          minTemp: Math.round(daily?.temperature_2m_min?.[0] ?? 24),
          maxTemp: Math.round(daily?.temperature_2m_max?.[0] ?? 31),
          humidity: Math.round(current?.relative_humidity_2m ?? 75),
          precipitation: Math.round(current?.precipitation ?? 0),
          rainChance: Math.round(daily?.precipitation_probability_max?.[0] ?? 20),
          windSpeed: Math.round(current?.wind_speed_10m ?? 12),
          windGusts: Math.round(current?.wind_gusts_10m ?? 18),
          aqi: Math.round(aqiJson?.current?.us_aqi ?? 24),
          weatherCode: wmoCode,
          isDay,
          condition: getWeatherConfig(wmoCode),
          sunrise: formatIsoTime(daily?.sunrise?.[0]),
          sunset: formatIsoTime(daily?.sunset?.[0]),
          hourly: graphData,
          daily: dailyData,
        };

        if (isMounted) {
          setData(processed);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Error fetching weather');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchWeatherData();

    return () => {
      isMounted = false;
    };
  }, [location.lat, location.lon, location.name]);

  return { data, loading, error };
}
