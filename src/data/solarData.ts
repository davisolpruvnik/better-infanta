import { Appliance, BatteryType } from '@/types/solar';

export const APPLIANCES: Appliance[] = [
  {
    name: 'Electric fan',
    drawLabel: '50 W',
    type: 'continuous',
    drawWh: 50,
    unit: 'hrs',
    contextNote: (hrs) => {
      const nights = Math.floor(hrs / 8);
      return nights > 0 ? `${nights} nights (8 hrs/night)` : undefined;
    },
  },
  {
    name: 'Phone charge',
    drawLabel: '15 Wh',
    type: 'cycle',
    drawWh: 15,
    unit: 'charges',
  },
  {
    name: '50-inch TV',
    drawLabel: '100 W',
    type: 'continuous',
    drawWh: 100,
    unit: 'hrs',
  },
  {
    name: 'LED bulb',
    drawLabel: '10 W',
    type: 'continuous',
    drawWh: 10,
    unit: 'hrs',
    contextNote: (hrs) => {
      const nights = Math.floor(hrs / 12);
      return nights > 0 ? `${nights} nights (12 hrs/night)` : undefined;
    },
  },
  {
    name: 'Laptop',
    drawLabel: '65 W',
    type: 'continuous',
    drawWh: 65,
    unit: 'hrs',
  },
  {
    name: 'Wi-Fi modem',
    drawLabel: '10 W',
    type: 'continuous',
    drawWh: 10,
    unit: 'hrs',
  },
  {
    name: 'Water pump',
    drawLabel: '500 W',
    type: 'continuous',
    drawWh: 500,
    unit: 'hrs',
  },
  {
    name: 'Boat battery',
    drawLabel: '600 Wh',
    type: 'cycle',
    drawWh: 600,
    unit: 'charges',
  },
];

export const STORAGE_FACTORS: Record<BatteryType, { factor: number; label: string; spec: string }> = {
  lfp: {
    factor: 0.85 * 0.95 * 0.70, // 0.565
    label: 'LFP (LiFePO4)',
    spec: '85% DoD · 95% RTE · 30% tropical derating',
  },
  'lead-acid': {
    factor: 0.50 * 0.80 * 0.50, // 0.20
    label: 'Lead-Acid (AGM/VRLA)',
    spec: '50% DoD · 80% RTE · 50% tropical derating',
  },
  none: {
    factor: 1.0,
    label: 'Direct (No Battery)',
    spec: '100% direct daytime consumption',
  },
};
