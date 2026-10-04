'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { HourlyData } from '@/types/solar';

interface Props {
  hourly: HourlyData[];
  sunriseTime: string;
  sunsetTime: string;
}

// 1. Custom X-Axis Tick using your website's font classes
const CustomXAxisTick = ({ x, y, payload }: any) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={10}
        textAnchor="middle"
        className="font-axis-navbar-focus tracking-wide text-xs fill-[#2C241D]/80 select-none"
      >
        {payload.value}
      </text>
    </g>
  );
};

// 2. Custom Y-Axis Tick using your numbers font variation
const CustomYAxisTick = ({ x, y, payload }: any) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={-6}
        y={3}
        textAnchor="end"
        className="font-axis-navbar-focus tracking-wide text-xs fill-[#2C241D]/65 select-none"
      >
        {payload.value}
      </text>
    </g>
  );
};

// 3. Flat, zero-shadow newsprint editorial tooltip
const EditorialTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data: HourlyData = payload[0].payload;
    const estYieldKwh = ((data.gti * 0.8) / 1000).toFixed(2);

    return (
      <div className="bg-[#2C241D] text-[#FBF9F5] border border-[#FBF9F5]/20 px-3 py-1.5 shadow-none select-none">
        <div className="flex items-center gap-2">
          <span className="font-axis-sng-indlab-value text-xs text-[#DFCDBE]">
            {data.time}
          </span>
          <span className="text-[10px] text-[#FBF9F5]/40">|</span>
          <span className="font-axis-sng-indlab-value text-xs font-bold text-white">
            {data.gti} W/m²
          </span>
          <span className="text-[10px] text-[#FBF9F5]/40">|</span>
          <span className="text-[11px] font-axis-navbar-focus text-[#DFCDBE]">
            ~{estYieldKwh} kWh
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export const SolarYieldCurve: React.FC<Props> = ({ hourly, sunriseTime, sunsetTime }) => {
  const sunriseHour = `${sunriseTime.split(':')[0].padStart(2, '0')}:00`;
  const sunsetHour = `${sunsetTime.split(':')[0].padStart(2, '0')}:00`;

  return (
    <div className="w-full bg-[#F4EFEA] border-t border-b border-[#2C241D]/20 py-4 my-6 select-none font-sans">
      <div className="max-w-7xl mx-auto">
        {/* EDITORIAL BROADCAST HUD HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline px-6 mb-2 gap-1 pb-2">
          <div className="flex items-center gap-2">
            <span className="font-axis-wide-header text-md uppercase tracking-wider text-[#7c0902]">
              Hourly Irradiance Curve (GTI)
            </span>
          </div>

          <div className="text-xs font-axis-navbar-focus text-[#2C241D]">
            <span className="text-[#2C241D]/70 text-md font-axis-navbar-focus uppercase tracking-wider">
              Sunrise: <strong className="text-[#2C241D] font-axis-sng-indlab-value text-md">{sunriseTime}</strong> | Sunset: <strong className="text-[#2C241D] font-axis-sng-indlab-value text-md">{sunsetTime}</strong>
            </span>
          </div>
        </div>

        {/* RECHARTS CONTAINER */}
        <div className="w-full h-[200px] mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={hourly}
              margin={{ top: 22, right: 24, left: 10, bottom: 6 }}
            >
              <defs>
                <linearGradient id="rechartsNewsprintGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#DFCDBE" stopOpacity={0.85} />
                  <stop offset="100%" stopColor="#F4EFEA" stopOpacity={0.2} />
                </linearGradient>
              </defs>

              {/* X-AXIS WITH CUSTOM FONT TICK */}
              <XAxis
                dataKey="time"
                interval={2} // Every 3 hours
                tickLine={{ stroke: '#2C241D', strokeWidth: 1 }}
                axisLine={{ stroke: '#2C241D', strokeWidth: 0.8, opacity: 0.3 }}
                tick={<CustomXAxisTick />}
              />

              {/* Y-AXIS WITH CUSTOM FONT TICK */}
              <YAxis
                domain={[0, 'dataMax + 50']}
                tickLine={false}
                axisLine={false}
                tick={<CustomYAxisTick />}
              />

              {/* TOOLTIP & HAIRLINE CROSSHAIR */}
              <Tooltip
                content={<EditorialTooltip />}
                cursor={{
                  stroke: '#7c0902',
                  strokeWidth: 1.2,
                  strokeDasharray: 'none',
                }}
              />

              {/* SUNRISE & SUNSET VERTICAL LINES */}
              <ReferenceLine
                x={sunriseHour}
                stroke="#7c0902"
                strokeDasharray="3 3"
                opacity={0.5}
                label={{
                  value: `Sunrise ${sunriseTime}`,
                  position: 'top',
                  className: 'font-axis-navbar-focus text-xs fill-[#7c0902] uppercase tracking-wide',
                }}
              />
              <ReferenceLine
                x={sunsetHour}
                stroke="#7c0902"
                strokeDasharray="3 3"
                opacity={0.5}
                label={{
                  value: `Sunset ${sunsetTime}`,
                  position: 'top',
                  className: 'font-axis-navbar-focus text-xs fill-[#7c0902] uppercase tracking-wider',
                }}
              />

              {/* MONOTONE SPLINE & AREA FILL */}
              <Area
                type="monotone"
                dataKey="gti"
                stroke="#4A3B32"
                strokeWidth={2.5}
                fill="url(#rechartsNewsprintGradient)"
                activeDot={{
                  r: 4.5,
                  fill: '#FBF9F5',
                  stroke: '#7c0902',
                  strokeWidth: 2.5,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
