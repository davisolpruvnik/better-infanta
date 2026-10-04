export type BatteryType = 'lfp' | 'lead-acid' | 'none';

export interface HourlyData {
  time: string;
  gti: number;
}

export interface SolarForecast {
  date: string;
  hourly: HourlyData[];
  peakSunHours: number;
  generatedKwh1kWp: number;
  peakTime: string;
  sunriseTime: string;
  sunsetTime: string;
}

export interface Appliance {
  name: string;
  drawLabel: string;
  type: 'continuous' | 'cycle';
  drawWh: number;
  unit: string;
  contextNote?: (units: number) => string | undefined;
}

export interface LocationInfo {
  barangay: string;
  town: string;
  province: string;
  latitude: number;
  longitude: number;
  isLiveGps: boolean;
}
