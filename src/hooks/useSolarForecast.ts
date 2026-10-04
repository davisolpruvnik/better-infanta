'use client';

import { useState, useEffect, useCallback } from 'react';
import { SolarForecast, LocationInfo } from '@/types/solar';
import { fetchSolarForecast, reverseGeocode, DEFAULT_LOCATION } from '@/lib/solar-calc';

export function useSolarForecast() {
  const [location, setLocation] = useState<LocationInfo>(DEFAULT_LOCATION);
  const [data, setData] = useState<SolarForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [geoLoading, setGeoLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch forecast whenever coordinates change
  const loadForecast = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    try {
      const forecast = await fetchSolarForecast(lat, lon);
      setData(forecast);
      setError(null);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadForecast(location.latitude, location.longitude);
  }, [location.latitude, location.longitude, loadForecast]);

  // Trigger GPS detection
  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const geo = await reverseGeocode(latitude, longitude);
          setLocation({
            ...geo,
            isLiveGps: true,
          });
        } catch (err) {
          console.error(err);
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        console.warn('Geolocation denied or unavailable:', err.message);
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return {
    data,
    loading,
    geoLoading,
    error,
    location,
    detectLocation,
  };
}
