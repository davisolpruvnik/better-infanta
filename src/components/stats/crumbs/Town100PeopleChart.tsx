import { useState, useMemo } from 'react';
import { User } from 'lucide-react';
import { Barangay, Person100GridItem, Person100Slice } from '@/types/census';
import { CENSUS_YEAR_END, INFANTA_BARANGAYS } from '@/data/censusDataInfanta';

interface Town100PeopleChartProps {
  barangays?: Barangay[];
  initialYear?: number;
  topCount?: number; // Number of prominent barangays to highlight individually (default: 5)
}

// Curated 5 distinct colors for the top 5 barangays + neutral gray for aggregated remainder
const PRIMARY_COLORS = [
  '#d97706', // 1st: Amber
  '#0284c7', // 2nd: Sky Blue
  '#16a34a', // 3rd: Emerald Green
  '#e11d48', // 4th: Rose Red
  '#4f46e5', // 5th: Indigo
];
const OTHER_COLOR = '#94a3b8'; // Slate-400 for aggregated remainder (all other barangays)

export default function Town100PeopleChart({
  barangays = INFANTA_BARANGAYS,
  initialYear = CENSUS_YEAR_END,
  topCount = 5,
}: Town100PeopleChartProps) {
  // Extract all available census years from history
  const availableYears = useMemo(() => {
    if (!barangays.length || !barangays[0].history) return [2024];
    return barangays[0].history.map((h) => h.year).sort((a, b) => a - b);
  }, [barangays]);

  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const [hoveredBarangay, setHoveredBarangay] = useState<string | null>(null);
  const [selectedBarangay, setSelectedBarangay] = useState<string | null>(null);

  // Dynamic Aggregation & Largest Remainder Calculation
  const { totalPopulation, slices, peopleGrid } = useMemo(() => {
    // 1. Map population for the active year and sort descending
    const yearData = barangays
      .map((b) => {
        const hist = b.history.find((h) => h.year === selectedYear);
        return {
          id: b.id,
          name: b.name,
          population: hist ? hist.population : 0,
        };
      })
      .sort((a, b) => b.population - a.population);

    const total = yearData.reduce((sum, item) => sum + item.population, 0);

    // 2. Separate Top 5 barangays from the rest
    const topBarangays = yearData.slice(0, topCount);
    const otherBarangays = yearData.slice(topCount);
    const otherTotalPop = otherBarangays.reduce((sum, item) => sum + item.population, 0);

    // 3. Form groups (Top 5 + Aggregated Others) to represent in the 100 grid
    const groups = [
      ...topBarangays.map((b, idx) => ({
        name: b.name,
        population: b.population,
        color: PRIMARY_COLORS[idx % PRIMARY_COLORS.length],
        isOther: false,
      })),
      ...(otherTotalPop > 0
        ? [
            {
              name: 'Other Barangays',
              population: otherTotalPop,
              color: OTHER_COLOR,
              isOther: true,
            },
          ]
        : []),
    ];

    // 4. Largest Remainder Method (guarantees exactly 100 people)
    const withPercentages = groups.map((g) => {
      const exact = total > 0 ? (g.population / total) * 100 : 0;
      const floor = Math.floor(exact);
      const remainder = exact - floor;
      return {
        ...g,
        exact,
        count: floor,
        remainder,
      };
    });

    const currentTotalIcons = withPercentages.reduce((acc, curr) => acc + curr.count, 0);
    const slotsNeeded = 100 - currentTotalIcons;

    const sortedByRemainder = [...withPercentages].sort((a, b) => b.remainder - a.remainder);
    for (let i = 0; i < slotsNeeded; i++) {
      if (sortedByRemainder[i]) {
        sortedByRemainder[i].count += 1;
      }
    }

    // 5. Generate Legend Slices
    const generatedSlices: Person100Slice[] = withPercentages.map((g) => ({
      name: g.name,
      population: g.population,
      count: g.count,
      color: g.color,
    }));

    // 6. Generate 100-Person Grid
    const generatedGrid: Person100GridItem[] = [];
    let iconIndex = 0;
    withPercentages.forEach((g) => {
      for (let i = 0; i < g.count; i++) {
        generatedGrid.push({
          id: iconIndex++,
          name: g.name,
          color: g.color,
        });
      }
    });

    return {
      totalPopulation: total,
      slices: generatedSlices,
      peopleGrid: generatedGrid,
    };
  }, [barangays, selectedYear, topCount]);

  const activeHighlight = hoveredBarangay || selectedBarangay;
  const toggleBarangay = (name: string) => {
    setSelectedBarangay((prev) => (prev === name ? null : name));
  };

  const activeItem = activeHighlight
    ? slices.find((s) => s.name === activeHighlight)
    : slices[0];

  return (
    <div className="bg-white border border-slate-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 pb-4 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-center sm:text-left">
          <div className="flex flex-col items-center sm:items-start min-w-0 w-full sm:w-auto">
            <h4 className="text-lg font-axis-titular-focus uppercase tracking-wide text-slate-900 leading-tight">
              If Infanta Were a Town of 100 People ({selectedYear})
            </h4>
            <p className="text-sm font-axis-subtitular-focus uppercase tracking-wide text-slate-500 leading-tight mt-1 xs:mt-2">
              Each person icon represents 1% of the population (~{Math.round(totalPopulation / 100).toLocaleString()} residents)
            </p>
          </div>

          <span className="text-xs font-axis-navbar-focus uppercase tracking-wide bg-fantas-50 text-fantas-700 px-2.5 py-1 border border-fantas-200/60 whitespace-nowrap self-center sm:self-auto">
            Total Pop: {totalPopulation.toLocaleString()}
          </span>
        </div>

        {/* Year Toggle Buttons */}
        <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap pt-1">
          <span className="text-xs font-axis-navbar-focus uppercase tracking-wider text-slate-400 mr-1">
            Census Year:
          </span>
          {availableYears.map((yr) => {
            const isSelected = selectedYear === yr;
            return (
              <button
                key={yr}
                type="button"
                onClick={() => {
                  setSelectedYear(yr);
                  setSelectedBarangay(null); // Reset filter on year change
                }}
                className={`px-3 py-1 text-xs font-axis-navbar-focus uppercase tracking-wider  transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white font-bold '
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                }`}
              >
                {yr}
              </button>
            );
          })}
        </div>
      </div>

      {/* Responsive Grid: Mobile = Callout (1st), Chart (2nd) | Desktop = Chart (Left), Callout (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">

        {/* 10x10 GRID CHART
            - Mobile: 2nd (order-2)
            - Desktop: Left Column (lg:order-1)
        */}
        <div className="order-2 lg:order-1 w-full max-w-sm sm:max-w-md mx-auto flex flex-col items-center justify-center p-5 bg-slate-50/60 border border-slate-100">
          <div className="grid grid-cols-10 gap-1.5 sm:gap-2.5 w-full place-items-center">
            {peopleGrid.map((person) => {
              const isFaded = activeHighlight && activeHighlight !== person.name;
              const isHighlighted = activeHighlight === person.name;

              return (
                <button
                  key={person.id}
                  type="button"
                  title={`${person.name} (~1% in ${selectedYear})`}
                  onClick={() => toggleBarangay(person.name)}
                  onMouseEnter={() => setHoveredBarangay(person.name)}
                  onMouseLeave={() => setHoveredBarangay(null)}
                  className={`p-0.5  transition-all duration-200 cursor-pointer flex items-center justify-center transform focus:outline-none ${
                    isHighlighted ? 'scale-125 z-10' : ''
                  } ${isFaded ? 'opacity-20 scale-90' : 'opacity-100'}`}
                  style={{ color: person.color }}
                >
                  <User className="w-6 h-6 fill-current" />
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-2 text-[11px] font-axis-medium text-slate-400">
            <span>Hover or tap to filter</span>
            {selectedBarangay && (
              <button
                type="button"
                onClick={() => setSelectedBarangay(null)}
                className="text-fantas-700 font-bold underline cursor-pointer"
              >
                (Reset)
              </button>
            )}
          </div>
        </div>

        {/* UNIFIED DASHED CALLOUT + EMBEDDED LEGEND
            - Mobile: 1st (order-1)
            - Desktop: Right Column (lg:order-2)
        */}
        <div className="order-1 lg:order-2 w-full flex flex-col justify-start items-start text-start p-4 sm:p-5 gap-3 border-2 border-dashed border-slate-300 bg-white transition-all">

          {/* Top Section: Active Item Callout Text */}
          <div className="flex flex-row items-start gap-3 w-full">
            <div
              className="w-4 h-4  flex-shrink-0 mt-1 ring-4 ring-slate-100 transition-colors duration-200"
              style={{ backgroundColor: activeItem?.color || '#d97706' }}
            />

            <p className="text-sm text-slate-700 leading-relaxed font-axis-book">
              In {selectedYear}, out of every 100 residents in Infanta,{' '}
              <span
                className="font-axis-bold text-white px-1.5 mr-0.5 inline-block align-baseline transition-colors duration-200"
                style={{ backgroundColor: activeItem?.color || '#d97706' }}
              >
                {activeItem?.count ?? 0} {activeItem?.count === 1 ? 'person' : 'people'}
              </span>{' '}
              {activeItem?.name === 'Other Barangays' ? 'lived across' : 'lived in'}{' '}
              <span
                className="font-axis-bold transition-colors duration-200"
                style={{ color: activeItem?.color || '#d97706' }}
              >
                {activeItem?.name}
              </span>.
              <span className="text-xs text-slate-400 block mt-1">
                ({(activeItem?.population ?? 0).toLocaleString()} total residents &bull;{' '}
                {totalPopulation > 0
                  ? (((activeItem?.population ?? 0) / totalPopulation) * 100).toFixed(1)
                  : 0}
                % of Infanta)
              </span>
            </p>
          </div>

          {/* Horizontal Separator Line with Centered Header */}
          <div className="relative flex py-1 items-center w-full">
            <div className="flex-grow border-t border-slate-200" />
            <span className="flex-shrink mx-2 text-[10px] font-axis-navbar-focus uppercase tracking-wider text-slate-400 bg-white px-1.5">
              Top 5 & Others ({selectedYear})
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          {/* Space-Optimized Legend Pills Inside the Box */}
          <div className="flex flex-wrap items-center gap-1.5 w-full">
            {slices.map((slice, idx) => {
              const isHovered = activeHighlight === slice.name;
              const isFaded = activeHighlight && activeHighlight !== slice.name;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleBarangay(slice.name)}
                  onMouseEnter={() => setHoveredBarangay(slice.name)}
                  onMouseLeave={() => setHoveredBarangay(null)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200  text-xs transition-all cursor-pointer ${
                    isHovered ? 'bg-fantas-50/80 font-bold border-fantas-300' : 'hover:border-slate-300'
                  } ${isFaded ? 'opacity-30' : 'opacity-100'}`}
                >
                  <span
                    className="w-2 h-2  flex-shrink-0"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="font-axis-navbar-focus uppercase tracking-wide text-slate-700 text-[11px]">
                    {slice.name}
                  </span>
                  <span className="text-slate-400 font-semibold text-[10px]">
                    ({slice.count})
                  </span>
                </button>
              );
            })}
          </div>

        </div>

      </div>
    </div>
  );
}
