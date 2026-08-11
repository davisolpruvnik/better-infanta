// src/hooks/useWeather.ts
import { getWeatherConfig, LocationConfig, WeatherMapEntry } from '@/components/config/weather-config';
import { useState, useEffect } from 'react';

export interface ProcessedWeatherData {
  name: string;
  temp: number;
  feelsLike: number;
  minTemp: number;
  maxTemp: number;
  humidity: number;
  rainChance: number;
  windSpeed: number;
  windGusts: number;
  aqi: number;
  condition: WeatherMapEntry;
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

        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_gusts_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&wind_speed_unit=kmh&timezone=Asia%2FManila`;
        const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${location.lat}&longitude=${location.lon}&current=us_aqi`;

        // Fetch Weather & AQI in parallel
        const [weatherRes, aqiRes] = await Promise.all([
          fetch(weatherUrl),
          fetch(aqiUrl),
        ]);

        if (!weatherRes.ok) throw new Error('Failed to fetch weather data');

        const weatherJson = await weatherRes.json();
        const aqiJson = aqiRes.ok ? await aqiRes.json() : null;

        const current = weatherJson.current;
        const daily = weatherJson.daily;
        const wmoCode = current?.weather_code ?? 0;

        const processed: ProcessedWeatherData = {
          name: location.name,
          temp: Math.round(current?.temperature_2m ?? 29),
          feelsLike: Math.round(current?.apparent_temperature ?? 33),
          minTemp: Math.round(daily?.temperature_2m_min?.[0] ?? 24),
          maxTemp: Math.round(daily?.temperature_2m_max?.[0] ?? 31),
          humidity: Math.round(current?.relative_humidity_2m ?? 75),
          rainChance: Math.round(daily?.precipitation_probability_max?.[0] ?? 20),
          windSpeed: Math.round(current?.wind_speed_10m ?? 12),
          windGusts: Math.round(current?.wind_gusts_10m ?? 18),
          aqi: Math.round(aqiJson?.current?.us_aqi ?? 24),
          condition: getWeatherConfig(wmoCode),
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
