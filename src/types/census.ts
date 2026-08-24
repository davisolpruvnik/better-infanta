export interface HistoryPoint {
  year: number;
  population: number;
}

export interface Barangay {
  id: number;
  name: string;
  population: number;
  previousPopulation: number;
  households: number;
  landArea: number; // in hectares
  captain: string;
  term: '1st' | '2nd' | '3rd';
  district: string;
  history: HistoryPoint[];
}

export interface Person100Slice {
  name: string;
  population: number;
  exactPercent: number;
  count: number;
  color: string;
}

export interface Person100GridItem {
  id: number;
  name: string;
  color: string;
}
