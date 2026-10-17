# BetterInfanta

A community-run digital portal for the Municipality of Infanta, Quezon, Philippines. BetterInfanta presents public information — Citizen's Charter services, census data, municipal financials, tides, and solar potential — in an editorial format built for phones and for people who are trying to get something done today.

_Ganda nay-an, hane?_

- **Live:** [betterinfantaquezon.org](https://betterinfantaquezon.org)
- **Status:** Active
- **License:** CC0
- **Part of:** [BetterGov.PH](https://bettergov.ph)
- **Built on top of:** [Better Local Government starter kit](https://github.com/iyanski/betterlocalgov)
- **Where to see:** [https://lgu.bettergov.ph](https:/lgu.bettergov.ph)

BetterInfanta is not affiliated with the Municipality of Infanta or any government agency. It is volunteer-run.

## What it covers

- **Services.** Every service in the Citizen's Charter, with cost, time, location, and who can avail at the top of every page.
- **Statistics.** PSA census data, including the "Town of 100 People" visualization and barangay-level detail.
- **Finance.** BLGF Statement of Receipts and Expenditures, 1992–2025, with peer comparison.
- **Tides.** Tide curve, table, and NOW marker, referenced to the Port of Real station.
- **Solar.** Solar potential calculator with GPS detection, per-barangay coordinates, and LFP battery sizing.
- **Government.** Executive, legislative, and department rosters.

## Documentation

- [DESIGN.md](./DESIGN.md) — the design system and philosophy (Kumpol and Latik)
- [DATA.md](./DATA.md) — every data source, cadence, and known limitation
- [CONTENT-GUIDE.md](./CONTENT-GUIDE.md) — voice and structure for writers
- [CONTENT-MANAGEMENT.md](./CONTENT-MANAGEMENT.md) — how to add and update content
- [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) — local setup, Cloudflare Pages
- [INSPIRATION.md](./INSPIRATION.md) — the design references, expanded
- [CHANGELOG.md](./CHANGELOG.md) — version history
- [src/data/README.md](./src/data/README.md) — the data layer
- [src/lib/README.md](./src/lib/README.md) — the utility layer

## Running locally

```
git clone https://github.com/davisolpruvnik/better-infanta.git
cd better-infanta
npm install
npm run convert-yaml
npm run dev
```

The dev server runs at `http://localhost:5173`. There are no environment variables to set.

Deployment is on Cloudflare Pages. Full setup, deployment, and troubleshooting are in [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md).

## Data sources

| Dataset | Source | Cadence |
|---------|--------|---------|
| Services | Citizen's Charter, March 2026 | On new charter issue |
| Census | PSA | Every 5 years |
| Finance | BLGF SRE | Annually |
| Weather | Open-Meteo | Automatic |
| Tides | Open-Meteo Marine (Port of Real 660/024) | Automatic |
| Solar | Open-Meteo GTI | Automatic |

Full list of sources and limitations: [DATA.md](./DATA.md).

## Contributing

Read [DESIGN.md](./DESIGN.md) first. Every content and code decision inherits from it.

- **Writers.** See [CONTENT-GUIDE.md](./CONTENT-GUIDE.md) for voice and structure, and [CONTENT-MANAGEMENT.md](./CONTENT-MANAGEMENT.md) for the update workflow.
- **Designers and developers.** See [DESIGN.md](./DESIGN.md), [INSPIRATION.md](./INSPIRATION.md), and [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md).

Open an issue before opening a large PR. Integration and architecture decisions are made in issues, not in review.

## Contributors

- [iyanski](https://github.com/iyanski) — upstream starter kit
- [Nicu Listana](https://github.com/niculistana) — upstream starter kit

## License

CC0. Public domain. No restrictions on use, modification, or distribution. No attribution required, though it is appreciated.

The upstream [Better Local Government starter kit](https://github.com/iyanski/betterlocalgov) is also CC0.

## Disclaimer

BetterInfanta is not affiliated with the Municipality of Infanta, the Province of Quezon, or any government agency. It is volunteer-run and not an official source. Information is presented as-is, with sources and limitations named. For official transactions, consult the LGU directly.
