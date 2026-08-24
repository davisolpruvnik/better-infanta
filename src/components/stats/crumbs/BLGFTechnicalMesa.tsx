import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, ArrowUpDown, Download } from 'lucide-react';
import { BLGFRawRecord, getLocalRevenue, getNTADependency } from '@/types/blgf';

interface InfantaHistoricalTableProps {
  dataset: BLGFRawRecord[];
  targetLguName?: string; // Default: 'Infanta'
  selectedYear?: number;
}

type SortField =
  | 'YEAR'
  | 'TOTAL_OPERATING_INCOME'
  | 'LOCAL_SOURCES'
  | 'REV_NTA_IRA'
  | 'TOTAL_EXPENDITURES'
  | 'NET_SURPLUS'
  | 'NTA_DEP';

export default function BLGFTechnicalTable({
  dataset,
  targetLguName = 'Infanta',
  selectedYear,
}: InfantaHistoricalTableProps) {
  const [searchYear, setSearchYear] = useState('');
  const [sortField, setSortField] = useState<SortField>('YEAR');
  const [sortAsc, setSortAsc] = useState(false); // Default: latest year first (2025 -> 1992)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Filter strictly for Infanta across all available historical years
  const historicalRows = useMemo(() => {
    const targetRows = dataset.filter(
      (d) => d.LGU_NAME.toLowerCase() === targetLguName.toLowerCase()
    );

    const processed = targetRows.map((row) => {
      const localSources = getLocalRevenue(row);
      const ntaDep = getNTADependency(row);
      const netSurplus = row.TOTAL_OPERATING_INCOME - row.TOTAL_EXPENDITURES;

      return {
        ...row,
        LOCAL_SOURCES: localSources,
        NET_SURPLUS: netSurplus,
        NTA_DEP: ntaDep,
      };
    });

    return processed
      .filter((r) => String(r.YEAR).includes(searchYear.trim()))
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        return sortAsc ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
      });
  }, [dataset, targetLguName, searchYear, sortField, sortAsc]);

  const yearRange = useMemo(() => {
    if (!historicalRows.length) return '1992–2025';
    const years = historicalRows.map((r) => r.YEAR);
    return `${Math.min(...years)}–${Math.max(...years)}`;
  }, [historicalRows]);

  const exportCSV = () => {
    const headers = [
      'Year,LGU Name,Province,Total Operating Income (PHP),Local Sources (PHP),NTA / IRA Share (PHP),Total Expenditures (PHP),Net Fiscal Surplus (PHP),NTA Dependency (%)',
    ];
    const csvRows = historicalRows.map(
      (r) =>
        `${r.YEAR},"${r.LGU_NAME}","${r.PROVINCE}",${r.TOTAL_OPERATING_INCOME},${r.LOCAL_SOURCES},${r.REV_NTA_IRA},${r.TOTAL_EXPENDITURES},${r.NET_SURPLUS},${r.NTA_DEP.toFixed(2)}`
    );
    const blob = new Blob([[...headers, ...csvRows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${targetLguName}_BLGF_Historical_SRE_${yearRange}.csv`;
    link.click();
  };

  return (
    <div className="bg-white border border-slate-200 p-6 space-y-4">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-axis-titular-focus uppercase tracking-wide leading-snug text-center md:text-start lg:text-start pb-0.5 text-slate-900">
              {targetLguName} Historical SRE Timeseries ({yearRange})
            </h3>
          </div>
          <p className="text-xs font-axis-subtitular-focus uppercase tracking-wide leading-snug text-center md:text-start lg:text-start text-slate-500">
            Official BLGF Statement of Receipts & Expenditures (Historical Archive)
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by year..."
              value={searchYear}
              onChange={(e) => setSearchYear(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 focus:outline-none focus:ring-1 focus:ring-fantas-600 bg-slate-50/50"
            />
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-axis-navbar-focus uppercase bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Historical Data Table */}
      <div className="overflow-x-auto border border-slate-200">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 font-axis-navbar-focus uppercase text-slate-700 border-b border-slate-200 select-none">
            <tr>
              <th className="p-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('YEAR')}>
                <div className="flex items-center gap-1">Fiscal Year {renderSortIcon('YEAR', sortField, sortAsc)}</div>
              </th>
              <th className="p-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('TOTAL_OPERATING_INCOME')}>
                <div className="flex items-center justify-end gap-1">Total Income {renderSortIcon('TOTAL_OPERATING_INCOME', sortField, sortAsc)}</div>
              </th>
              <th className="p-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('LOCAL_SOURCES')}>
                <div className="flex items-center justify-end gap-1">Local Sources {renderSortIcon('LOCAL_SOURCES', sortField, sortAsc)}</div>
              </th>
              <th className="p-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('REV_NTA_IRA')}>
                <div className="flex items-center justify-end gap-1">NTA / IRA {renderSortIcon('REV_NTA_IRA', sortField, sortAsc)}</div>
              </th>
              <th className="p-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('TOTAL_EXPENDITURES')}>
                <div className="flex items-center justify-end gap-1">Total Exp. {renderSortIcon('TOTAL_EXPENDITURES', sortField, sortAsc)}</div>
              </th>
              <th className="p-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('NET_SURPLUS')}>
                <div className="flex items-center justify-end gap-1">Net Surplus/(Deficit) {renderSortIcon('NET_SURPLUS', sortField, sortAsc)}</div>
              </th>
              <th className="p-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('NTA_DEP')}>
                <div className="flex items-center justify-end gap-1">NTA Dep. (%) {renderSortIcon('NTA_DEP', sortField, sortAsc)}</div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {historicalRows.map((row) => {
              const isSelectedYear = selectedYear === row.YEAR;
              const isSurplus = row.NET_SURPLUS >= 0;

              return (
                <tr
                  key={row.YEAR}
                  className={
                    isSelectedYear
                      ? 'bg-fantas-50/80 font-semibold text-fantas-950 border-l-2 border-l-fantas-700'
                      : 'hover:bg-slate-50/50'
                  }
                >
                  <td className="p-3 font-axis-navbar-focus uppercase text-slate-900 flex items-center gap-2">
                    {isSelectedYear && <span className="w-1.5 h-1.5 bg-fantas-600 rounded-full" />}
                    FY {row.YEAR}
                  </td>
                  <td className="p-3 text-right font-axis-sng-indlab-value font-bold text-slate-900">
                    ₱{row.TOTAL_OPERATING_INCOME.toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-axis-sng-indlab-value text-slate-500">
                    ₱{row.LOCAL_SOURCES.toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-axis-sng-indlab-value text-slate-500">
                    ₱{row.REV_NTA_IRA.toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-axis-sng-indlab-value text-slate-700">
                    ₱{row.TOTAL_EXPENDITURES.toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-axis-sng-indlab-value">
                    <span className={isSurplus ? 'text-emerald-700 font-medium' : 'text-red-600 font-medium'}>
                      {isSurplus ? '+' : ''}₱{row.NET_SURPLUS.toLocaleString()}
                    </span>
                  </td>
                  <td className="p-3 text-right font-axis-sng-indlab-value">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                        row.NTA_DEP >= 85
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : row.NTA_DEP >= 70
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {row.NTA_DEP.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function renderSortIcon(field: SortField, activeField: SortField, isAsc: boolean) {
  if (field !== activeField) return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-50" />;
  return isAsc ? <ChevronUp className="w-3.5 h-3.5 text-fantas-700" /> : <ChevronDown className="w-3.5 h-3.5 text-fantas-700" />;
}
