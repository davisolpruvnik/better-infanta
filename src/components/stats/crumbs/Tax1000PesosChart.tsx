import React, { useMemo, useState, useRef, useEffect } from 'react';
import { BLGFRawRecord } from '@/types/blgf';

interface BanknoteTreemapProps {
  record: BLGFRawRecord;
}

type ViewMode = 'revenue' | 'expenditure';

interface SectorConfig {
  id: keyof BLGFRawRecord;
  rawKey: keyof BLGFRawRecord;
  name: string;
  category: string;
  color: string;
}

// ============================================================
// 💵 SIDE A: REVENUE CONFIGURATION (Where Money Comes From)
// ============================================================
const REVENUE_CONFIG: SectorConfig[] = [
  {
    id: 'BILL_REV_NTA_IRA',
    rawKey: 'REV_NTA_IRA',
    name: 'National Allotment (NTA/IRA)',
    category: 'External Revenue',
    color: '#0284c7',
  },
  {
    id: 'BILL_REV_RPT',
    rawKey: 'REV_RPT',
    name: 'Amilyar (Property Tax)',
    category: 'Local Tax Revenue',
    color: '#0ea5e9',
  },
  {
    id: 'BILL_REV_BIZ_TAX',
    rawKey: 'REV_BIZ_TAX',
    name: 'Local Business Tax',
    category: 'Local Tax Revenue',
    color: '#38bdf8',
  },
  {
    id: 'BILL_REV_ECONOMIC_ENTERPRISE',
    rawKey: 'REV_ECONOMIC_ENTERPRISE',
    name: 'Economic Enterprises',
    category: 'Local Non-Tax',
    color: '#818cf8',
  },
  {
    id: 'BILL_REV_FEES_CHARGES',
    rawKey: 'REV_FEES_CHARGES',
    name: 'Regulatory & User Fees',
    category: 'Local Non-Tax',
    color: '#a78bfa',
  },
  {
    id: 'BILL_REV_OTHER_LOCAL',
    rawKey: 'REV_OTHER_LOCAL',
    name: 'Other Local Taxes',
    category: 'Local Revenue',
    color: '#c084fc',
  },
  {
    id: 'BILL_REV_OTHER_EXTERNAL',
    rawKey: 'REV_OTHER_EXTERNAL',
    name: 'Grants & Special Shares',
    category: 'External Revenue',
    color: '#64748b',
  },
];

// ============================================================
// 💳 SIDE B: EXPENDITURE CONFIGURATION (Where Money Goes)
// ============================================================
const EXPENDITURE_CONFIG: SectorConfig[] = [
  {
    id: 'BILL_EXP_GEN_ADMIN',
    rawKey: 'EXP_GEN_ADMIN',
    name: 'General Admin',
    category: 'General Public Services',
    color: '#2563eb',
  },
  {
    id: 'BILL_EXP_ECONOMIC_SERVICES',
    rawKey: 'EXP_ECONOMIC_SERVICES',
    name: 'Economic Services',
    category: 'Economic Development',
    color: '#dc2626',
  },
  {
    id: 'BILL_EXP_HEALTH',
    rawKey: 'EXP_HEALTH',
    name: 'Health & Nutrition',
    category: 'Social Services',
    color: '#059669',
  },
  {
    id: 'BILL_EXP_SOCIAL_WELFARE',
    rawKey: 'EXP_SOCIAL_WELFARE',
    name: 'Social Welfare',
    category: 'Social Services',
    color: '#7c3aed',
  },
  {
    id: 'BILL_EXP_EDUCATION',
    rawKey: 'EXP_EDUCATION',
    name: 'Education & Culture',
    category: 'Social Services',
    color: '#d97706',
  },
  {
    id: 'BILL_EXP_CAPITAL_OUTLAY',
    rawKey: 'EXP_CAPITAL_OUTLAY',
    name: 'Capital Outlay',
    category: 'Infrastructure',
    color: '#db2777',
  },
  {
    id: 'BILL_EXP_DEBT_SERVICE',
    rawKey: 'EXP_DEBT_SERVICE',
    name: 'Debt Servicing',
    category: 'Debt Burden',
    color: '#475569',
  },
  {
    id: 'BILL_EXP_OTHER',
    rawKey: 'EXP_OTHER',
    name: 'Other Services',
    category: 'Miscellaneous',
    color: '#0891b2',
  },
];

interface TileLayout {
  id: string;
  name: string;
  category: string;
  color: string;
  value: number;
  rawAmount: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function BanknoteTreemap({ record }: BanknoteTreemapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 850, height: 320 });
  const [activeTile, setActiveTile] = useState<TileLayout | null>(null);
  const [mode, setMode] = useState<ViewMode>('expenditure');

  // Clear active tooltip whenever switching Income / Spending view
  useEffect(() => {
    setActiveTile(null);
  }, [mode]);

  // Measure container dimensions responsively
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: Math.max(entry.contentRect.width, 320),
          height: Math.max(entry.contentRect.height, 280),
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute fluid squarified rects based on active toggle
  const activeConfig = mode === 'revenue' ? REVENUE_CONFIG : EXPENDITURE_CONFIG;

  const layoutTiles = useMemo<TileLayout[]>(() => {
    return computeTreemapLayout(record, activeConfig, dimensions.width, dimensions.height);
  }, [record, activeConfig, dimensions]);

  const totalAmountPhp =
    mode === 'revenue' ? record.TOTAL_OPERATING_INCOME : record.TOTAL_EXPENDITURES;

  return (
    <div
      className="bg-white border border-slate-200 p-6 space-y-4"
      onClick={() => setActiveTile(null)}
    >
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-axis-titular-focus text-slate-900 uppercase tracking-wide leading-snug text-center md:text-start lg:text-start pb-0.5">
              {mode === 'revenue' ? 'Where Every ₱1,000 Comes From' : 'Where Every ₱1,000 Goes'}
            </h3>
          </div>
          <p className="text-sm font-axis-subtitular-focus text-slate-500 uppercase tracking-wide leading-snug text-center md:text-start lg:text-start">
            {record.LGU_NAME} • FY {record.YEAR}{' '}
            {mode === 'revenue' ? 'Receipts & Income' : 'Expenditure Statement'} (BLGF SRE)
          </p>
        </div>

        {/* Side-by-Side Controls: Segmented Button & Total Badge */}
        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          {/* Segmented Toggle Buttons */}
          <div className="inline-flex p-0.5 bg-slate-100 border border-slate-200 text-xs font-axis-navbar-focus uppercase tracking-wider">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMode('revenue');
              }}
              className={`px-3 py-1.5 transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                mode === 'revenue'
                  ? 'bg-sky-700 text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>Income</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMode('expenditure');
              }}
              className={`px-3 py-1.5 transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                mode === 'expenditure'
                  ? 'bg-sky-700 text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>Spending</span>
            </button>
          </div>

          {/* Dynamic Total Amount Badge */}
          <div className="px-3 py-1.5 bg-sky-50 border border-sky-200 text-sky-900 text-xs font-axis-navbar-focus uppercase tracking-wider shrink-0">
            {mode === 'revenue' ? 'Total Income:' : 'Total Exp:'} ₱
            {(totalAmountPhp / 1_000_000).toFixed(2)}M
          </div>
        </div>
      </div>

      {/* ₱1,000 Banknote Styled Card Frame */}
      <div className="relative border border-sky-900/30 bg-gradient-to-r from-sky-900/10 via-cyan-900/5 to-sky-900/10 p-3">
        {/* Banknote Watermark Badges */}
        <div className="absolute top-2.5 left-3.5 z-10 pointer-events-none flex items-center gap-2 opacity-80">
          <span className="text-sm font-axis-chunky tracking-wider text-sky-950">₱1000</span>
          <span className="text-[10px] uppercase font-axis-navbar-focus text-sky-950 font-bold">
            REPUBLIKA NG PILIPINAS • {mode === 'revenue' ? 'STATEMENT OF RECEIPTS' : 'STATEMENT OF EXPENDITURES'}
          </span>
        </div>
        <div className="absolute bottom-2.5 right-3.5 z-10 pointer-events-none opacity-20">
          <span className="text-3xl font-black font-mono text-sky-950 tracking-tighter">1000</span>
        </div>

        {/* Morphing Treemap Canvas */}
        <div ref={containerRef} className="w-full h-80 pt-6 relative select-none">
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
            className="overflow-visible"
          >
            {layoutTiles.map((tile) => {
              const GAP = 5;
              const tx = tile.x + GAP / 4;
              const ty = tile.y + GAP / 4;
              const tw = Math.max(tile.w - GAP, 0);
              const th = Math.max(tile.h - GAP, 0);

              const isSmall = tw < 75 || th < 45;
              const isTiny = tw < 40 || th < 28;
              const isVisible = tile.value > 0 && tw > 0 && th > 0;
              const isSelected = activeTile?.id === tile.id;

              return (
                <g
                  key={`${mode}-${tile.id}`}
                  className="cursor-pointer group"
                  onMouseEnter={() => setActiveTile(tile)}
                  onMouseLeave={() => setActiveTile(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTile((prev) => (prev?.id === tile.id ? null : tile));
                  }}
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transition: 'opacity 0.4s ease',
                  }}
                >
                  {/* Fluid Morphing Rectangle */}
                  <rect
                    x={tx}
                    y={ty}
                    width={tw}
                    height={th}
                    rx={0}
                    ry={0}
                    fill={tile.color}
                    stroke={isSelected ? '#ffffff' : 'transparent'}
                    strokeWidth={isSelected ? 2.5 : 0}
                    className="hover:brightness-110 active:brightness-95 transition-all"
                    style={{
                      transition:
                        'x 0.55s cubic-bezier(0.16, 1, 0.3, 1), ' +
                        'y 0.55s cubic-bezier(0.16, 1, 0.3, 1), ' +
                        'width 0.55s cubic-bezier(0.16, 1, 0.3, 1), ' +
                        'height 0.55s cubic-bezier(0.16, 1, 0.3, 1), ' +
                        'fill 0.4s ease, filter 0.2s ease, stroke 0.2s ease',
                      animation: 'treemapGrowIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
                    }}
                  />

                  {/* Centered Label */}
                  {!isTiny && isVisible && (
                    <text
                      x={tx + tw / 2}
                      y={isSmall ? ty + th / 2 : ty + th / 2 - 8}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="fill-white text-xs font-axis-subtitular-focus uppercase pointer-events-none select-none tracking-wide"
                      style={{
                        transition:
                          'x 0.55s cubic-bezier(0.16, 1, 0.3, 1), ' +
                          'y 0.55s cubic-bezier(0.16, 1, 0.3, 1), ' +
                          'opacity 0.3s ease',
                      }}
                    >
                      {tw < 95 ? tile.name.split(' ')[0] : tile.name}
                    </text>
                  )}

                  {/* Centered Value */}
                  {!isSmall && isVisible && (
                    <text
                      x={tx + tw / 2}
                      y={ty + th / 2 + 12}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="fill-white/95 font-axis-sng-indlab-value text-md pointer-events-none select-none"
                      style={{
                        transition:
                          'x 0.55s cubic-bezier(0.16, 1, 0.3, 1), ' +
                          'y 0.55s cubic-bezier(0.16, 1, 0.3, 1), ' +
                          'opacity 0.3s ease',
                      }}
                    >
                      ₱{tile.value.toFixed(1)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Floating Tooltip (Tap-able with Close button on touchscreens) */}
          {activeTile && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute top-2 right-2 bg-slate-900/95 backdrop-blur-xs text-white p-3  border border-slate-700 text-xs space-y-1 z-30 pointer-events-auto min-w-[190px] max-w-[240px] animate-in fade-in zoom-in-95 duration-150"
            >
              {/* Header with Title and Close Button (✕) */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 shrink-0" style={{ backgroundColor: activeTile.color }} />
                  <p className="font-axis-navbar-focus uppercase text-white tracking-wide truncate">
                    {activeTile.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTile(null)}
                  className="text-slate-400 hover:text-white p-0.5 -mr-1 -mt-1 cursor-pointer text-sm leading-none"
                  aria-label="Close tooltip"
                >
                  ✕
                </button>
              </div>

              <p className="font-axis-subtitular-focus text-slate-400 text-[10px] uppercase tracking-wide">
                {activeTile.category}
              </p>

              <div className="pt-1.5 mt-1 border-t border-slate-800 space-y-1">
                <div className="flex justify-between gap-4">
                  <span className="font-axis-subtitular-focus uppercase tracking-wide text-slate-400">
                    Share of ₱1,000:
                  </span>
                  <span className="font-axis-sng-indlab-value font-bold text-emerald-400">
                    ₱{activeTile.value.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="font-axis-subtitular-focus uppercase tracking-wide text-slate-400">
                    Proportion:
                  </span>
                  <span className="font-axis-sng-indlab-value text-slate-200">
                    {((activeTile.value / 1000) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="font-axis-subtitular-focus uppercase tracking-wide text-slate-400">
                    Actual Amount:
                  </span>
                  <span className="font-axis-sng-indlab-value text-slate-300">
                    ₱{(activeTile.rawAmount / 1_000_000).toFixed(2)}M
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid Legend (Interactive / Tappable) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
        {layoutTiles
          .filter((t) => t.value > 0)
          .map((item) => {
            const isSelected = activeTile?.id === item.id;
            return (
              <div
                key={item.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTile((prev) => (prev?.id === item.id ? null : item));
                }}
                className={`p-2.5 border flex items-center gap-2.5 transition-all duration-150 cursor-pointer min-h-[54px] ${
                  isSelected
                    ? 'bg-sky-50 border-sky-400 '
                    : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
                }`}
              >
                {/* Color Swatch */}
                <span
                  className="w-3.5 h-3.5 shrink-0 "
                  style={{ backgroundColor: item.color }}
                />

                {/* Content Container */}
                <div className="flex-1 min-w-0 flex items-center justify-between gap-2.5">
                  <p className="font-axis-navbar-focus uppercase tracking-wide text-fantas-950/70 line-clamp-2 leading-snug text-[10.5px] lg:text-[12px] min-w-0 flex-1 text-pretty">
                    {item.name}
                  </p>
                  <p className="font-axis-sng-indlab-value text-fantas-900 text-sm sm:text-lg shrink-0 text-right tracking-wide">
                    ₱{item.value.toFixed(2)}
                  </p>
                </div>
              </div>
            );
          })}
      </div>

      {/* Animation Keyframes */}
      <style>{`
        @keyframes treemapGrowIn {
          from {
            transform: scale(0.92);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// 📐 Deterministic Squarified Layout Engine
// ============================================================
function computeTreemapLayout(
  record: BLGFRawRecord,
  config: SectorConfig[],
  width: number,
  height: number
): TileLayout[] {
  if (width <= 0 || height <= 0) return [];

  // 1. Gather all items using active config (Revenue or Expenditure)
  const items = config.map((cfg) => {
    const billVal = Number(record[cfg.id]) || 0;
    const rawVal = Number(record[cfg.rawKey]) || 0;
    return {
      id: String(cfg.id),
      name: cfg.name,
      category: cfg.category,
      color: cfg.color,
      value: billVal,
      rawAmount: rawVal,
    };
  });

  const totalValue = items.reduce((s, i) => s + i.value, 0);
  if (totalValue <= 0) {
    return items.map((i) => ({ ...i, x: 0, y: 0, w: 0, h: 0 }));
  }

  // 2. Sort active items descending for squarifying
  const activeItems = items
    .filter((i) => i.value > 0)
    .sort((a, b) => b.value - a.value)
    .map((item) => ({
      ...item,
      normalizedArea: (item.value / totalValue) * (width * height),
    }));

  const layoutMap = new Map<string, { x: number; y: number; w: number; h: number }>();

  let currX = 0;
  let currY = 0;
  let currW = width;
  let currH = height;

  let row: typeof activeItems = [];

  function layoutRow(
    r: typeof activeItems,
    x: number,
    y: number,
    w: number,
    h: number,
    isVertical: boolean
  ) {
    const rowArea = r.reduce((sum, item) => sum + item.normalizedArea, 0);
    const rowLength = isVertical ? rowArea / h : rowArea / w;

    let offset = 0;
    r.forEach((item) => {
      const itemLen = item.normalizedArea / rowLength;
      if (isVertical) {
        layoutMap.set(item.id, { x, y: y + offset, w: rowLength, h: itemLen });
        offset += itemLen;
      } else {
        layoutMap.set(item.id, { x: x + offset, y, w: itemLen, h: rowLength });
        offset += itemLen;
      }
    });

    return isVertical
      ? { newX: x + rowLength, newY: y, newW: Math.max(w - rowLength, 0), newH: h }
      : { newX: x, newY: y + rowLength, newW: w, newH: Math.max(h - rowLength, 0) };
  }

  for (let i = 0; i < activeItems.length; i++) {
    row.push(activeItems[i]);
    const isVertical = currW < currH;
    const nextItem = activeItems[i + 1];

    if (!nextItem || row.length >= 2) {
      const res = layoutRow(row, currX, currY, currW, currH, isVertical);
      currX = res.newX;
      currY = res.newY;
      currW = res.newW;
      currH = res.newH;
      row = [];
    }
  }

  // 3. Return full list matching input IDs
  return items.map((item) => {
    const coords = layoutMap.get(item.id) || { x: 0, y: 0, w: 0, h: 0 };
    return {
      ...item,
      x: coords.x,
      y: coords.y,
      w: coords.w,
      h: coords.h,
    };
  });
}
