import { YEARS_ELAPSED } from '@/data/censusDataInfanta';
import { Barangay, Person100Slice, Person100GridItem } from '../types/census';

export const COLOR_PALETTE = [
  '#d97706', '#ea580c', '#f59e0b', '#fbbf24', '#0284c7',
  '#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#14b8a6'
];

/**
 * Calculates Overview Metrics for either a single barangay or all barangays consolidated.
 */
export function getCensusMetrics(selectedId: number | 'all', list: Barangay[]) {
  if (selectedId === 'all') {
    const totalPop = list.reduce((acc, b) => acc + b.population, 0);
    const totalPrevPop = list.reduce((acc, b) => acc + b.previousPopulation, 0);
    const totalHh = list.reduce((acc, b) => acc + b.households, 0);
    const totalArea = list.reduce((acc, b) => acc + b.landArea, 0);

    const relGrowth = (((totalPop - totalPrevPop) / totalPrevPop) * 100).toFixed(2);
    const cagr = (((Math.pow(totalPop / totalPrevPop, 1 / YEARS_ELAPSED)) - 1) * 100).toFixed(2);

    return {
      name: 'All Barangays',
      title: 'Municipality Overview (All Barangays)',
      subtitle: `Aggregated data across all ${list.length} barangays`,
      population: totalPop,
      households: totalHh,
      landArea: totalArea,
      relativeGrowth: relGrowth,
      cagr,
      avgHouseholdSize: (totalPop / totalHh).toFixed(1),
      density: (totalPop / totalArea).toFixed(1),
      captain: 'Municipal Mayor & Sangguniang Bayan',
      term: 'N/A',
      district: 'All Districts',
    };
  }

  const b = list.find((item) => item.id === selectedId) || list[0];
  const relGrowth = (((b.population - b.previousPopulation) / b.previousPopulation) * 100).toFixed(2);
  const cagr = (((Math.pow(b.population / b.previousPopulation, 1 / YEARS_ELAPSED)) - 1) * 100).toFixed(2);

  return {
    name: b.name,
    title: `Barangay ${b.name}`,
    subtitle: `${b.district} • Land Area: ${b.landArea} ha`,
    population: b.population,
    households: b.households,
    landArea: b.landArea,
    relativeGrowth: relGrowth,
    cagr,
    avgHouseholdSize: (b.population / b.households).toFixed(1),
    density: (b.population / b.landArea).toFixed(1),
    captain: b.captain,
    term: `${b.term} Term`,
    district: b.district,
  };
}

/**
 * Computes 100-people grid allocations using the Largest Remainder Method (Hare-Niemeyer).
 */
export function calculate100PeopleDistribution(list: Barangay[]) {
  const sorted = [...list].sort((a, b) => b.population - a.population);
  const totalPop = sorted.reduce((sum, b) => sum + b.population, 0);

  const top10 = sorted.slice(0, 10);
  const others = sorted.slice(10);

  const rawSlices = top10.map((b, idx) => ({
    name: b.name,
    population: b.population,
    exactPercent: (b.population / totalPop) * 100,
    color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
  }));

  if (others.length > 0) {
    const othersPop = others.reduce((sum, b) => sum + b.population, 0);
    rawSlices.push({
      name: `Others (${others.length} brgys)`,
      population: othersPop,
      exactPercent: (othersPop / totalPop) * 100,
      color: '#94a3b8',
    });
  }

  const allocated = rawSlices.map((s) => ({
    ...s,
    count: Math.floor(s.exactPercent),
    remainder: s.exactPercent - Math.floor(s.exactPercent),
  }));

  const currentSum = allocated.reduce((sum, s) => sum + s.count, 0);
  const diff = 100 - currentSum;

  const sortedAllocated = [...allocated].sort((a, b) => b.remainder - a.remainder);
  for (let i = 0; i < diff; i++) {
    sortedAllocated[i].count += 1;
  }

  const peopleGrid: Person100GridItem[] = [];
  allocated.forEach((group) => {
    for (let i = 0; i < group.count; i++) {
      peopleGrid.push({
        id: peopleGrid.length,
        name: group.name,
        color: group.color,
      });
    }
  });

  return { totalPop, slices: allocated as Person100Slice[], peopleGrid };
}

/**
 * Aggregates Historical timeline data for municipal vs. specific barangay scope.
 */
export function getHistoricalTimeline(selectedId: number | 'all', list: Barangay[]) {
  if (selectedId === 'all') {
    const yearMap: { [key: number]: number } = {};
    list.forEach((b) => {
      b.history.forEach((h) => {
        yearMap[h.year] = (yearMap[h.year] || 0) + h.population;
      });
    });
    return Object.keys(yearMap)
      .map((year) => ({
        year: Number(year),
        population: yearMap[Number(year)],
      }))
      .sort((a, b) => a.year - b.year);
  }

  const b = list.find((item) => item.id === selectedId);
  return b ? [...b.history].sort((a, b) => a.year - b.year) : [];
}
