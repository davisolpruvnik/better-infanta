# Design system and philosophy: Kumpol and Latik

BetterInfanta is not a standard municipal portal. It does not mimic corporate product dashboards or administrative intranets. Its design functions as a public broadcast wire and broadsheet newspaper built for the screen.

This document details the editorial and structural decisions behind BetterInfanta, the historical and international influences that shaped its interface, and the principles required to maintain or adapt it.

## 1. What this portal is

BetterInfanta is an independent civic portal affiliated within the BetterGovPH ecosystem. It is not affiliated with the local government unit (LGU) of Infanta, Quezon. It functions as a civic broadcast station: a continuous, high-density stream of verifiable public data, statutory civic workflows, and environmental bulletins.

Traditional municipal websites bury statutory information inside low-resolution scans, multi-page PDFs, and nested menus. Commercial civic platforms wrap simple municipal procedures in promotional photographs, opaque search bars, and chat widgets.

BetterInfanta treats civic information as daily infrastructure. The layout gives immediate precedence to what an ordinary resident needs before walking out the door:

- What a transaction costs
- What physical counter processes the papers
- What documents must be carried
- When the tide turns at the port
- How the municipal budget was allocated over the last three decades

The interface adopts the posture of an editorial room, not a public relations bureau.

## 2. Why it looks like it: South-South design lineage

Modern digital public infrastructure across the Global South routinely imports aesthetic templates from North American software firms or Northern European civil services: GOV.UK, USWDS, or generic Silicon Valley web applications, or also, AI-driven UI/UX aesthetic.

These templates assume high-bandwidth fiber connections, ultra-low ambient glare, high-end display panels, and bureaucratic processes that operate with fully digitized backends. In Philippine coastal towns, these assumptions backfire, at least.

BetterInfanta looks to media and political communication traditions shaped under volatile infrastructure, extreme sunlight, and high civic stakes:

**South-South translation.** The design references media systems from Brazil, France, and Chile — places where public information is broadcast with density, rhythm, and authority. Not the authority of a government seal, but the authority of a masthead.

- **Globo and O Globo** (Brazil) — broadcast rhythm, newspaper substrate, live tickers, the assumption that the viewer can handle more than one fact at once.
- **PT.org.br** (Brazil) — numbered steps, community mobilization structure. Information as an instruction, not a brochure.
- **Gov.br** (Brazil) — the citizen-first service taxonomy, circular service icons. Proof that a government portal can be warm.
- **Brazilian football clubs** — the shades of red, green, and blue come from widely-known football clubs of Southeastern Brazil: Flamengo, Corinthians, Palmeiras, and Cruzeiro. The incorporation of football club-inspired color shadings brings a sense of belonging, loyalty, and community inclusion.
- **TF1 election graphics** (France) — composition as information. The layout itself tells you the result before you read a number.
- **Le Monde** (France) — cartographic clarity. A map that respects the reader's time.
- **T13** (Chile) — numeral treatment. Restraint in the broadcast register.

The references are expanded in [INSPIRATION.md](./INSPIRATION.md).

## 3. The visual system

The interface operates on two foundational systems: **Kumpol** (the chromatic palette) and **Latik** (the typographic scale).

### Kumpol (color system)

Color in BetterInfanta indicates status, authority, and consequence. It is never used as decorative filler.

| Token | Hex | Name | Role and application |
|-------|-----|------|----------------------|
| `dugo` | `#7c0902` | Dugo (Deep Oxblood) | Urgency, statutory fees, "NOW" markers, emergency bulletins, procedural warnings |
| `tihim` | `#d4a017` | Tihim (Deep Ochre / Gold) | Public treasury, revenue records, municipal trust, verified records |
| `ampiyas` | `#1d4ed8` | Ampiyas (Maritime Blue) | Procedural workflows, primary citizen services, civic metadata |
| `pakatan` | `#15803d` | Pakatan (Forest Green) | Environmental yield, solar outputs, agriculture, valid requisites |
| `semento` | `#334155` | Semento (Slate Grey) | Administrative infrastructure, structural borders, tabular grids, metadata keys |

### Latik (typographic system)

BetterInfanta uses **Google Sans Flex** across all interfaces. The typeface provides structural continuity from high-impact mastheads to micro-data tables via precise axis modulation.

Two families, both variable, both Google Sans Flex:

- `--font-kapwa-sans` — the sans family. Used for everything, even in data.
- `--font-kapwa-mono` — the mono family. Used for select conditions when necessary.

The CSS variable prefix `kapwa` is a naming artifact. Kapwa was evaluated as a component library and not adopted, but the variable names were retained to avoid a churn-only refactor. The variable names do not indicate that Kapwa is in use.

**Numbers have their own font variation.** Every number that appears in a column uses the same sans family through `font-axis-sng-indlab-value` for huge sizes and `font-axis-number-focus` for textual/ordinary sizes.

#### The axis presets

Latik is not "condensed headers, normal body." It is a set of named axis presets. Each preset fixes `wght`, `wdth`, and `opsz` for a specific UI role. Components use the preset, not ad-hoc font settings.

**Weight-only presets.** Used where the width axis stays at 100 and only weight varies.

| Class | wght | wdth | Use |
|-------|------|------|-----|
| `font-axis-thin` | 300 | 100 | Captions, fine print |
| `font-axis-book` | 400 | 100 | Body copy |
| `font-axis-medium` | 500 | 100 | Emphasized body, labels |
| `font-axis-semibold` | 600 | 100 | Subheads |
| `font-axis-bold` | 700 | 100 | Section headers |
| `font-axis-chunky` | 800 | 100 | Masthead, display |

**Role-bound presets.** Used where width and optical size are also fixed. These are the load-bearing presets.

| Class | wght | wdth | opsz | Role |
|-------|------|------|------|------|
| `font-axis-titular-focus` | 800 | 50 | 36 | Used for headers and headline-like texts |
| `font-axis-subtitular-focus` | 400 | 60 | 18 | Used for subheaders in hero and at times a subheader for category and a header |
| `font-axis-navbar-focus` | 600 | 60 | 54 | Used for navbar texts and category names |
| `font-axis-footer-focus` | 300 | 60 | 18 | Used for subcategories in the footer and other footer texts |
| `font-axis-plantao-text-focus` | 400 | 75 | 18 | Used in hotline categories/departments at the top of the website |
| `font-axis-number-focus` | 700 | 75 | 18 | Used in hotline numbers of categories/departments at the top of the website and numerical and textual values like tables where emphasis/attention is needed |
| `font-axis-sng-indlab-header` | 300 | 50 | 12 | Used as headers to yield to a number/value emphasized, found in how-tos of processes in the website |
| `font-axis-sng-indlab-value` | 700 | 50 | 36 | Used to emphasize a number/value below the header, found in how-tos of processes in the website |
| `font-axis-wide-header` | 700 | 125 | 54 | Wide header — full-width section titles, found in hero, services, government, statistics, and transparency parts |
| `font-axis-wide-subheader` | 400 | 125 | 54 | Wide subheader — full-width section titles, found in hero, services, government, statistics, and transparency parts |

The optical size axis is fixed per preset, not left to the browser. A navbar at `opsz 54` is drawn for a large display, even though it renders small. This is a deliberate choice: the navbar wordmark should read as display type, not as enlarged body type.

## 4. Core layout principles

Four principles govern every screen.

1. **Density as respect.** Pack the screen with useful information. A reader who came for the cost of a business permit should not have to scroll past a hero image to find it.
2. **Flattened branching logic.** Never hide conditional content behind an accordion. If a service has two paths — say, a renewal and a first-time application — show both, side by side or stacked, visible simultaneously. The reader will pick.
3. **Metadata-first.** Every service page opens with Cost, Time, Location. These are the three questions everyone asks. They are answered before anything else.
4. **Source attribution on every page.** Every figure has a source, a date, and — where the source is a model — a disclaimer.

## 5. The logo

The BetterInfanta logo layers four meanings into one mark.

- **Suman shape.** A suman is a Filipino rice cake, wrapped in leaves, and Infanta has its own version of this delicacy, sold in markets across Infanta, and is now increasingly becoming known outside the town and the peripheries. The logo's silhouette is a suman: a wrapped bundle, tied at the middle. It is what the town sells, what the town eats, and what the town is.
- **Barcode pattern.** The suman's ties are rendered as a barcode — a nod to the scanning, indexing, and retrieval that the portal performs. Information as thing you can look up.
- **Exclamation mark.** One tie is heavier than the others. Read vertically, it is an exclamation point — the mark of a NOW alert, of something that requires the reader's attention.
- **ORG label.** The mark carries the suffix ORG, not GOV. This is the single most important signal on the logo. It says: this is not the government. This is not a replacement for the government. This is a community project.

The logo is not decorative. It states the project's position.

## See also

- [INSPIRATION.md](./INSPIRATION.md) — expanded reference list
- [DATA.md](./DATA.md) — sources, cadence, limitations
- [CONTENT-GUIDE.md](./CONTENT-GUIDE.md) — voice and structure for writers
- [CONTENT-MANAGEMENT.md](./CONTENT-MANAGEMENT.md) — for maintainers
