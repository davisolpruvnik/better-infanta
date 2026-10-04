'use client';

import React, { useState } from 'react';
import { BatteryType } from '@/types/solar';
import { APPLIANCES, STORAGE_FACTORS } from '@/data/solarData';
import { calculateUsableKwh, calculateApplianceRuntime } from '@/lib/solar-calc';
import { useSolarForecast } from '@/hooks/useSolarForecast';
import { SolarYieldCurve } from './crumbs/SolarYieldCurve';

export default function SolarBulletinTab() {
  const { data, loading, geoLoading, error, location, detectLocation } = useSolarForecast();
  const [batteryType, setBatteryType] = useState<BatteryType>('lfp');

  if (loading) {
    return (
      <div className="p-12 text-center text-[#2C241D]/80">
        <span className="inline-block animate-pulse font-axis-navbar-focus uppercase text-md tracking-wider text-[#7c0902]">
          Obtaining latest data...
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center">
        <span className="bg-[#7c0902] text-white text-xs font-bold uppercase tracking-widest px-2 py-0.5 inline-block mb-3">
          Public Notice
        </span>
        <p className="font-bold text-lg text-[#7c0902]">Data temporarily unavailable.</p>
        <p className="text-sm text-[#2C241D]/80 mt-1">
          Unable to establish connection with the atmospheric model forecast. Please check your internet connection or reload.
        </p>
      </div>
    );
  }

  const { peakSunHours, generatedKwh1kWp, peakTime, sunriseTime, sunsetTime, hourly } = data;
  const usableKwh1kWp = calculateUsableKwh(generatedKwh1kWp, batteryType);

  const scaleTable = [
    { label: '1 kWp', panels: '2–3 panels', yieldKwh: generatedKwh1kWp },
    { label: '3 kWp', panels: '6–8 panels', yieldKwh: Number((peakSunHours * 0.8 * 3).toFixed(2)) },
    { label: '5 kWp', panels: '10–12 panels', yieldKwh: Number((peakSunHours * 0.8 * 5).toFixed(2)) },
    { label: '10 kWp', panels: '20–24 panels', yieldKwh: Number((peakSunHours * 0.8 * 10).toFixed(2)) },
  ];

  // Coords fallback
  const lat = location?.latitude ?? 14.75;
  const lon = location?.longitude ?? 121.65;
  const barangay = location?.barangay;
  const town = location?.town ?? 'Infanta';
  const province = location?.province ?? 'Quezon';
  const isLiveGps = location?.isLiveGps ?? false;

  return (
    <div className="text-[#2C241D] font-sans antialiased max-w-7xl">
      {/* HEADER SECTION WITH DYNAMIC LOCATION & GPS ACTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4 border-b border-slate-400">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-axis-wide-header uppercase tracking-wide text-slate-900">
              Daily Solar Energy Estimates
            </h2>
          </div>

          {/* DYNAMIC DISPATCH LOCATION BAR */}
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {barangay && (
              <span className="bg-[#7c0902] text-white text-xs font-axis-navbar-focus px-2 py-0.5 uppercase tracking-wider">
                Brgy. {barangay}
              </span>
            )}
            <span className="text-sm font-axis-navbar-focus uppercase tracking-wide font-bold text-slate-800">
              {town}, {province}
            </span>
            <span className="text-xs font-axis-sng-indlab-value text-slate-500">
              [{lat.toFixed(4)}° N, {lon.toFixed(4)}° E]
            </span>
          </div>

          <p className="text-xs font-axis-navbar-focus tracking-wide text-slate-500 mt-1">
            Model Estimate · at 15° Tilt · South-Facing (Azimuth 0°) · Open-Meteo
          </p>
        </div>

        {/* GEOLOCATION ACTION BUTTON */}
        <button
          type="button"
          onClick={detectLocation}
          disabled={geoLoading}
          className="border border-[#2C241D] bg-[#F4EFEA] hover:bg-[#2C241D] hover:text-[#FBF9F5] text-[#2C241D] text-xs font-axis-navbar-focus uppercase tracking-wider px-3.5 py-2 transition-colors flex items-center gap-2 shrink-0 select-none shadow-none disabled:opacity-60"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isLiveGps ? 'bg-emerald-600 animate-pulse' : 'bg-[#7c0902]'
            } inline-block`}
          />
          {geoLoading
            ? 'Acquiring GPS...'
            : isLiveGps
            ? 'GPS Active (Re-detect)'
            : 'Detect Exact Location'}
        </button>
      </div>

      {/* HERO METRICS */}
      <section className="mt-6 border-b border-[#2C241D]/30 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-baseline">
          {/* Primary Metric */}
          <div className="md:col-span-5 bg-[#F4EFEA] p-4 border-l-4 border-[#7c0902]">
            <span className="block font-axis-navbar-focus uppercase text-sm tracking-wider text-[#7c0902]">
              Peak Sun Hours Today
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-5xl font-axis-sng-indlab-value tracking-tight text-[#2C241D] leading-none">
                {peakSunHours.toFixed(1)}
              </span>
              <span className="text-sm font-axis-navbar-focus uppercase tracking-wider text-[#2C241D]/60">
                PSH (kWh/m²)
              </span>
            </div>
            <p className="text-xs text-[#2C241D]/75 mt-2 leading-snug tracking-tight">
              Equivalent to <span className="font-axis-bold">{peakSunHours.toFixed(1)} hours</span> of full-strength sunlight today, accounting for potential cloud cover.
            </p>
          </div>

          {/* Secondary Metrics */}
          <div className="md:col-span-7 grid grid-cols-3 divide-x divide-[#2C241D]/20 border-t md:border-t-0 border-[#2C241D]/20 pt-4 md:pt-0">
            <div className="px-3 first:pl-0">
              <span className="block text-sm uppercase font-axis-navbar-focus text-[#2C241D]/70 tracking-wider">
                Yield (1 kWp)
              </span>
              <span className="text-3xl sm:text-4xl font-axis-sng-indlab-value text-[#2C241D] mt-1 block">
                {generatedKwh1kWp} <span className="text-xs font-axis-navbar-focus tracking-wide uppercase text-[#2C241D]/70">kWh</span>
              </span>
              <span className="text-xs text-[#2C241D]/60 block mt-1 tracking-tight">
                80% standard system efficiency
              </span>
            </div>

            <div className="px-3">
              <span className="block text-sm uppercase font-axis-navbar-focus text-[#2C241D]/70 tracking-wider">
                Peak Hour
              </span>
              <span className="text-3xl sm:text-4xl font-axis-sng-indlab-value text-[#2C241D] mt-1 block">
                {peakTime}
              </span>
              <span className="text-xs text-[#2C241D]/60 block mt-1 tracking-tight">
                Peak sunlight
              </span>
            </div>

            <div className="px-3">
              <span className="block text-sm uppercase font-axis-navbar-focus text-[#2C241D]/70 tracking-wider">
                Daylight
              </span>
              <span className="text-lg font-axis-sng-indlab-value text-[#2C241D] mt-1 block leading-snug">
                <span className="font-axis-sng-indlab-value uppercase text-2xl">{sunriseTime}</span> <span className="font-axis-navbar-focus uppercase tracking-wide text-xs text-[#2C241D]/60">Rise</span>
                <br />
                <span className="font-axis-sng-indlab-value uppercase text-2xl">{sunsetTime}</span> <span className="font-axis-navbar-focus uppercase tracking-wide text-xs text-[#2C241D]/60">Set</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* YIELD CURVE */}
      <section>
        <SolarYieldCurve hourly={hourly} sunriseTime={sunriseTime} sunsetTime={sunsetTime} />
      </section>

      {/* BATTERY SELECTOR */}
      <section className="mt-8 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between border-b border-[#2C241D]/20 pb-2 mb-3">
          <span className="font-axis-wide-header uppercase text-md tracking-wider text-[#2C241D]">
            Storage Configuration
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(['lfp', 'lead-acid', 'none'] as BatteryType[]).map((type) => {
            const active = batteryType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setBatteryType(type)}
                className={`text-left p-3 border transition-colors ${
                  active
                    ? 'border-[#7c0902] bg-[#F4EFEA] ring-1 ring-[#7c0902]'
                    : 'border-[#2C241D]/20 bg-transparent hover:bg-[#F4EFEA]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-axis-navbar-focus uppercase text-md tracking-wide text-[#2C241D]">
                    {type === 'lfp' ? 'LFP (LiFePO4)' : type === 'lead-acid' ? 'Lead-Acid' : 'No Battery'}
                  </span>
                </div>
                <p className="font-axis-medium text-[12px] text-[#2C241D]/75 mt-1 leading-tight">
                  {STORAGE_FACTORS[type].spec}
                </p>
              </button>
            );
          })}
        </div>

        <div className="bg-[#F4EFEA]/60 px-3 py-2 mt-2 border-l-2 border-[#2C241D]/30 flex justify-between items-baseline text-xs">
          <span className="text-[#2C241D]/80 text-wrap sm:text-nowrap leading-tight tracking-tight">
            Power to be used from a 1 kWp after losses:
          </span>
          <span className="font-bold text-sm text-[#7c0902] shrink-0 font-mono">
            {usableKwh1kWp} kWh
          </span>
        </div>
      </section>

      {/* APPLIANCE RUNTIME TABLE */}
      <section className="mt-8">
        <div className="border-b-2 border-[#2C241D] pb-1 flex justify-between items-end">
          <span className="font-axis-wide-header uppercase text-sm tracking-wider text-[#2C241D]">
            Estimated Appliance Runtime (1 kWp Setup)
          </span>
          <span className="text-[12px] font-axis-navbar-focus text-[#7c0902] uppercase tracking-wider">
            If used alone
          </span>
        </div>

        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-[#2C241D]/20 text-xs font-axis-navbar-focus uppercase tracking-wider text-[#2C241D]/70">
              <th className="py-2 pr-4">Appliance</th>
              <th className="py-2 px-4">Draw</th>
              <th className="py-2 pl-4 text-right">Est. Runtime/Usage*</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2C241D]/15 font-sans">
            {APPLIANCES.map((item) => {
              const runtime = calculateApplianceRuntime(usableKwh1kWp, item);
              const formattedRuntime = item.type === 'cycle' ? `${runtime} charges` : `${runtime} hrs`;
              const context = item.contextNote ? item.contextNote(runtime) : undefined;

              return (
                <tr key={item.name} className="hover:bg-[#F4EFEA]/40 transition-colors">
                  <td className="py-2.5 pr-4">
                    <span className="font-axis-medium text-[#2C241D] block">{item.name}</span>
                    {context && (
                      <span className="text-[11px] text-[#2C241D]/60 block leading-none mt-0.5">
                        ≈ {context}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-[#2C241D]/70 text-sm">{item.drawLabel}</td>
                  <td className="py-2.5 pl-4 text-right font-bold text-[#2C241D] text-sm">{formattedRuntime}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <span className="text-[12px] font-axis-semibold text-fantas-100/90 mt-4 bg-flamengo-800 px-2 py-1 inline-block">
          *Note: Estimates reflect running ONE appliance in isolation. Does not assume simultaneous use.
        </span>
      </section>

      {/* SCALE-IT TABLE */}
      <section className="mt-10">
        <div className="border-b border-[#2C241D]/30 pb-1 mb-2">
          <span className="font-axis-wide-header uppercase text-sm tracking-wider text-[#2C241D]">
            Yield Comparison by System Size
          </span>
        </div>

        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-[#2C241D]/20 text-xs font-axis-navbar-focus uppercase tracking-wider text-[#2C241D]/70">
              <th className="py-2 pr-4">Capacity</th>
              <th className="py-2 px-4">Typical Array</th>
              <th className="py-2 pl-4 text-right">Est. Daily Yield</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2C241D]/15 font-sans">
            {scaleTable.map((row) => (
              <tr key={row.label} className="hover:bg-[#F4EFEA]/40 transition-colors">
                <td className="py-2.5 pr-4 font-axis-medium text-[#2C241D]">{row.label}</td>
                <td className="py-2.5 px-4 text-xs text-[#2C241D]/75">{row.panels}</td>
                <td className="py-2.5 pl-4 text-right font-axis-bold text-[#2C241D]">
                  {row.yieldKwh} <span className="font-axis-book text-xs text-[#2C241D]/70">kWh/day</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* EDITORIAL DISCLAIMER */}
      <footer className="mt-6 pt-6 border-t-2 border-[#2C241D] text-[#2C241D]/75 text-xs leading-relaxed">
        <p className="mb-3">
          <strong>DISCLAIMER:</strong> Model estimate based on Open-Meteo forecast data at ~8 km resolution. Assumes a
          south-facing panel at 15° tilt, 0.8 performance ratio, and the selected battery type with tropical derating applied.
          Actual output depends on orientation, shading, panel temperature, and battery condition. Not a substitute for a
          professional site assessment.
        </p>
        <div className="border-t border-[#2C241D]/15 pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center text-md font-axis-navbar-focus tracking-wide text-[#2C241D]/60">
          <span>Source | Open-Meteo Global Tilted Irradiance Forecast</span>
        </div>
      </footer>
    </div>
  );
}
