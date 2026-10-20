import type { PrecinctResultProps } from './electionres';

interface PrecinctElectionBreakdownProps {
  precinct: PrecinctResultProps;
  onReset: () => void;
}

export function PrecinctElectionBreakdown({ precinct, onReset }: PrecinctElectionBreakdownProps) {
  const mDiverge = precinct.diverging_mayor_pct ?? 50;
  const ruantoPct = Number(mDiverge.toFixed(1));
  const escuetaPct = Number((100 - mDiverge).toFixed(1));
  const mayorMargin = Number(Math.abs(ruantoPct - escuetaPct).toFixed(1));

  const vmDiverge = precinct.diverging_vice_mayor_pct ?? 50;
  const manniePct = Number(vmDiverge.toFixed(1));
  const gracePct = Number((100 - vmDiverge).toFixed(1));
  const vmMargin = Number(Math.abs(manniePct - gracePct).toFixed(1));

  return (
    <div className="space-y-4 text-start">
      <div className="border-b border-slate-100 pb-3 pr-8 relative">
        <span className="text-xs font-axis-navbar-focus uppercase tracking-wider text-slate-400">
          Precinct Inspector
        </span>
        <h3 className="text-lg font-axis-wide-header uppercase text-fantas-900 mt-0.5">
          Precinct {precinct.precinct_id}
        </h3>
        <span className="text-xs uppercase tracking-wider text-white bg-fantas-900 font-axis-navbar-focus px-2 py-0.5 inline-block mt-1">
          BRGY. {precinct.barangay}
        </span>
        <button
          onClick={onReset}
          className="absolute right-0 top-0 size-7 bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div className="bg-slate-50 border border-slate-200 p-3.5 space-y-3 text-xs">
        <div className="text-[10px] font-axis-navbar-focus uppercase tracking-wider text-slate-400">
          Precinct Vote Breakdown
        </div>

        {/* MAYOR */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm uppercase tracking-wide">
            <span className="font-axis-navbar-focus text-slate-600">Mayor:</span>
            <span
              className={`font-axis-number-focus normal-case tracking-normal ${
                precinct.mayor_winner === 'Ruanto'
                  ? 'text-purple-800'
                  : precinct.mayor_winner === 'Escueta'
                  ? 'text-emerald-700'
                  : 'text-fantas-900'
              }`}
            >
              {precinct.mayor_winner || 'N/A'}{' '}
              <span className="font-axis-number-focus tracking-wide">+{mayorMargin}</span>
            </span>
          </div>

          <div className="w-full bg-slate-200 h-2 flex overflow-hidden">
            <div style={{ width: `${escuetaPct}%` }} className="bg-[#10b981]" title={`Escueta: ${escuetaPct}%`} />
            <div style={{ width: `${ruantoPct}%` }} className="bg-[#7c3aed]" title={`Ruanto: ${ruantoPct}%`} />
          </div>

          <div className="flex justify-between text-[11px] font-axis-number-focus">
            <span className={precinct.mayor_winner === 'Escueta' ? 'font-bold text-emerald-700' : 'text-slate-400'}>
              Escueta: {escuetaPct}%
            </span>
            <span className={precinct.mayor_winner === 'Ruanto' ? 'font-bold text-purple-800' : 'text-slate-400'}>
              Ruanto: {ruantoPct}%
            </span>
          </div>
        </div>

        {/* VICE MAYOR */}
        <div className="space-y-1 pt-2 border-t border-slate-200/60">
          <div className="flex items-center justify-between text-sm uppercase tracking-wide">
            <span className="font-axis-navbar-focus text-slate-600">Vice Mayor:</span>
            <span
              className={`normal-case font-axis-number-focus tracking-normal ${
                precinct.vice_mayor_winner?.includes('Mannie')
                  ? 'text-purple-800'
                  : precinct.vice_mayor_winner?.includes('Grace')
                  ? 'text-emerald-700'
                  : 'text-fantas-900'
              }`}
            >
              {precinct.vice_mayor_winner || 'N/A'}{' '}
              <span className="font-axis-number-focus font-bold tracking-wide">+{vmMargin}</span>
            </span>
          </div>

          <div className="w-full bg-slate-200 h-2 flex overflow-hidden">
            <div style={{ width: `${gracePct}%` }} className="bg-[#10b981]" title={`Grace: ${gracePct}%`} />
            <div style={{ width: `${manniePct}%` }} className="bg-[#7c3aed]" title={`Mannie: ${manniePct}%`} />
          </div>

          <div className="flex justify-between text-[11px] font-axis-number-focus">
            <span className={precinct.vice_mayor_winner?.includes('Grace') ? 'font-bold text-emerald-700' : 'text-slate-400'}>
              Grace: {gracePct}%
            </span>
            <span className={precinct.vice_mayor_winner?.includes('Mannie') ? 'font-bold text-purple-800' : 'text-slate-400'}>
              Mannie: {manniePct}%
            </span>
          </div>
        </div>

        {/* TANDEM OUTCOME */}
        {precinct.mayor_vice_winners && (
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <span className="text-slate-600 font-axis-navbar-focus uppercase tracking-wide">Tandem Outcome:</span>
            <span
              className={`px-2 py-0.5 font-semibold text-[11px] font-axis-navbar-focus uppercase tracking-wide border ${
                precinct.mayor_vice_winners.includes('Grace') && precinct.mayor_vice_winners.includes('Ruanto')
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : precinct.mayor_vice_winners.includes('Ruanto')
                  ? 'bg-purple-50 text-purple-900 border-purple-900'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-900'
              }`}
            >
              {precinct.mayor_vice_winners}
            </span>
          </div>
        )}
      </div>

      {/* PARTICIPATION FIGURES */}
      <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-100">
        <div className="flex flex-row items-baseline gap-2">
          <span className="text-[11px] uppercase tracking-wider font-axis-navbar-focus text-slate-400">Ballots Cast</span>
          <div className="text-lg font-axis-sng-indlab-value text-fantas-900 tracking-wide">
            {precinct.actual_voters.toLocaleString()}{' '}
            <span className="text-[11px] text-slate-400 tracking-wide">/ {precinct.registered_voters.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex flex-row items-baseline gap-2">
          <span className="text-[11px] uppercase font-axis-navbar-focus text-slate-400">Turnout %</span>
          <div className="text-lg font-axis-sng-indlab-value tracking-wide text-fantas-900">
            {precinct.turnout_pct}%
          </div>
        </div>
      </div>

      <button
        onClick={onReset}
        className="w-full mt-4 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-axis-navbar-focus uppercase tracking-wider transition-colors cursor-pointer"
      >
        Reset Map View
      </button>
    </div>
  );
}
