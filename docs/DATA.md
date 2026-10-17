# Data

Every dataset on BetterInfanta has a source, a cadence, and a limitation. This document names all three.

If you cannot find a source for a number on the portal, it is a bug. Open an issue.

## 1. Citizen's Charter

**Source.** Municipality of Infanta, Citizen's Charter, March 2026 issue.

**What it is.** The LGU's own document listing every service it provides, with the cost, processing time, requirements, and steps for each.

**How it is transcribed.** Manually. Each service becomes a `.md` file under `content/services/<category>/`, with a field block at the top delimited by `---`. See [CONTENT-GUIDE.md](./CONTENT-GUIDE.md) for the schema and [CONTENT-MANAGEMENT.md](./CONTENT-MANAGEMENT.md) for the workflow.

**Update cadence.** When the LGU publishes a new issue. Historically the charter is revised irregularly — sometimes annually, sometimes less often. The portal cites the issue date on every service page. If the charter is updated and the portal is not, the portal is wrong, and the issue date is how a reader knows.

**Known limitations.**
- Transcription is manual, and errors are possible. If you find one, file an issue.
- Some services in the charter have ambiguous requirements. Where the charter is unclear, the portal reproduces the ambiguity rather than resolving it. Do not guess on the LGU's behalf.
- The portal does not replace the charter. It is a presentation layer.

## 2. Census and population

**Source.** Philippine Statistics Authority (PSA).

**Data used.**
- Barangay-level population counts.
- Historical population, 1903–2020.
- Household counts.
- Age and sex distribution, where available.

**Where it lives.** `src/data/censusDataInfanta.ts`. Types in `src/types/census.ts`.

**Update cadence.** Every five years, following the PSA census cycle. Mid-decade updates from PSA's population estimates are not currently ingested.

**Known limitations.**
- PSA census data lags reality. A 2020 census is a snapshot of a population that has already changed.
- Barangay boundaries are not perfectly stable across census years. Comparisons across decades are approximate.
- The "Town of 100 People" visualization is a humanization of census figures, not a survey. It is illustrative.

## 3. Financial records

**Source.** Bureau of Local Government Finance (BLGF), Statement of Receipts and Expenditures (SRE).

**Data used.**
- Annual receipts and expenditures, 1992–2025.
- Breakdown by category.
- Peer comparison against other municipalities.

**Where it lives.** Rendered from BLGF source files into `src/data/` and consumed by `src/hooks/useBLGFData.ts` and `src/components/stats/LGUFinance.tsx`.

**Update cadence.** Annually, after BLGF publishes the prior year's SRE. Publication is typically mid-year following the reporting year.

**Known limitations.**
- SRE figures are submitted by the LGU, not audited by BLGF. They are the LGU's own accounting.
- COA audit findings are not currently integrated. See section 7.
- Peer comparison uses municipalities of similar income class, not similar population. This is a deliberate choice — income class is the more comparable axis for fiscal questions — but it is not the only valid one.

## 4. Weather

**Source.** Open-Meteo forecast API.

**Data used.**
- Current conditions.
- Short-range forecast.
- Daily high and low, precipitation probability.

**Update cadence.** Automatic. The client fetches on load and caches briefly. See `src/components/config/weather-config.ts` for the cache window.

**Known limitations.**
- Open-Meteo is a global model. It is not a local weather station. Infanta's microclimate — especially along the coast and in the Sierra Madre foothills — is not fully captured.
- Forecasts beyond 3 days should be treated as indicative.
- The portal displays what the API returns. It does not adjust or editorialize.

## 5. Tides

**Source.** Open-Meteo Marine API, referenced to the Port of Real tide station, code 660/024.

**Data used.**
- Tide height timeseries for the current day.
- High and low tide times.
- A NOW marker on the curve.

**Where it lives.** Rendered by `src/components/home/DetailedTide.tsx`.

**Update cadence.** Automatic. Refreshed on load.

**Known limitations.**
- **8 km resolution.** Open-Meteo Marine interpolates tide predictions on an 8 km grid. Infanta's coastline is not a straight line. Actual tide times at a specific barangay may differ from the bulletin by tens of minutes.
- **Not for navigation.** The tide bulletin is informative. It is not a navigational aid. Fisherfolk and boat operators should consult PAGASA and the Port of Real station directly.
- The reference station is Port of Real, in the neighboring municipality of Real. It is the nearest reference point with a stable, published record. It is not identical to Infanta's tides.

## 6. Solar potential

**Source.** Open-Meteo Global Tilted Irradiance (GTI) API.

**Battery parameters.**
- CSIRO–SEDA Malaysia, 2025.
- Journal of Power Sources, 2013.

**How the calculation works.** See [src/lib/README.md](./src/lib/README.md) for the storage factor formula and the derating assumptions.

**Where it lives.** `src/lib/solar-calc.ts`, `src/data/solarData.ts`, types in `src/types/solar.ts`.

**Update cadence.** Automatic. GTI is fetched on demand when a user runs the calculator.

**Known limitations.**
- **Model estimate, not a survey.** The calculator produces a first-pass estimate. It is not a substitute for a site assessment by a licensed installer.
- **Tropical derating.** Panel output is derated for temperature, dust, and inverter losses using assumptions tuned to tropical conditions. These assumptions are conservative, and a well-installed system may outperform the estimate.
- **Battery chemistry.** Only LFP (lithium iron phosphate) is offered. NMC is not offered — NMC chemistry is unsafe for tropical climates at the temperatures Infanta regularly reaches.
- **Per-barangay coordinates.** Barangay centers are used, not individual rooftop locations. Within a barangay, irradiance varies.
- **No shading analysis.** The calculator does not account for trees, buildings, or terrain shading.

## 7. Known gaps

The portal does not yet include:

- **DPWH projects.** The Department of Public Works and Highways publishes infrastructure project lists. These are not integrated.
- **COA audit reports.** The Commission on Audit publishes annual audit findings on the LGU. These are not integrated, and their absence means the financial section shows the LGU's own numbers without an independent check.
- **Procurement records.** PhilGEPS publishes bid notices and awards. Not integrated.
- **Barangay-level financials.** BLGF SRE data is municipal-level. Barangay budgets are not published in a consistent machine-readable format.
- **Real-time service queue status.** The portal presents what the charter says. It cannot tell you how long the line is today.

If you want to close one of these gaps, open an issue before opening a pull request. Integration decisions are architectural, not just data-entry.

## See also

- [src/data/README.md](./src/data/README.md) — the data layer, file by file
- [src/lib/README.md](./src/lib/README.md) — the utility layer
- [CONTENT-MANAGEMENT.md](./CONTENT-MANAGEMENT.md) — update workflow
