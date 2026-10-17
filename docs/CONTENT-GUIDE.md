# Content guide

This is for anyone writing content for BetterInfanta — service documents, government pages, or statistics copy. Read it before you write.

The portal's voice is described in [DESIGN.md](./DESIGN.md). This document is the working version of that voice and the schema for service documents.

## 1. Voice and register

Write the way a broadcast newscast sounds. Direct, factual, unadorned. Not a brochure. Not a press release. Not a legal notice.

**Tagalog is conversational, not formal.** The portal publishes in English and Filipino. The Filipino is what people actually say in Infanta, not what the Komisyon sa Wikang Filipino prescribes.

| Do not write | Write |
|--------------|-------|
| Oras ng pagproseso | Gaano katagal |
| Mga kinakailangang dokumento | Anong kailangan |
| Direktoryo | (just say what it is) |
| Gabay | (just say what it is) |
| Impormasyon | (just say what it is) |

**Second person for the reader.** "You'll need to bring..." Not "The applicant shall present..."

**Third person for the project.** "BetterInfanta presents..." Not "We're excited to share..."

**No marketing language.** No "exciting," "innovative," "revolutionary," "proud to announce." If you would not say it on the evening news, do not write it here.

**No corporate language.** No "leverage," "synergy," "empower," "solution."

**Every claim cites a source.** Every figure has a date. If the source is a model, say so.

## 2. Service document structure

A service is a Markdown file — `.md` — with a block of fields at the top, delimited by `---`. The delimiters are borrowed from YAML frontmatter; the fields inside are written in a YAML-like style, but the file is a Markdown document. The extension is `.md`.

The fields carry the metadata and the procedure. There is no narrative body below the closing `---`.

```markdown
---
title: 'Municipal Fishing Gear Registration'
description: 'This service provides procedures for issuing a document that certifies that a person is a registered farmer and/or fisherfolk in the municipality'
fees: 'P90'
fee_details:
time: '1 d, 1 hr 17 mins'
time_details: 'Includes a whole day visit for boat admeasurement.'
office: 'Office of the Municipal Agriculturist: Crops/Fishery Section'
office_address: '2/F Infanta Municipal Building, Poblacion 38, Infanta, Quezon'
office_hours: 'Mon to Fri, 8AM-5PM (No Noon Break)'
whocanavail:
  - 'All farmers/fisherfolks who are residents of Infanta, Quezon'
requirements_mandatory:
  - 'One (1) set original copy of Boat Admeasurement forms (to be filled out in the Office of Municipal Agriculturist/OMA)'
steps:
  - "Proceed to Office of the Municipal Agriculturist (OMA) and provide the necessary information. | An OMA personnel will set a schedule of actual boat admeasurement."
  - "Proceed to the designated time and place of actual boat measurement with OMA staff. | The boat admeasurement will include assigning a boat number and painting it on a specific part of the boat. A picture of the said boat will also be taken."
postscripts:
  - 'Optional final note. Omit the field entirely if there is no postscript.'
---
```

### On the format

The file is Markdown. The `---` at the start and end of the field block is a borrowed convention — it visually separates the metadata from the rest of the document, and it reads as frontmatter to anyone who has worked with Markdown before. It is not a signal that the content is strict YAML.

In practice, the fields follow YAML's syntax closely enough that a YAML parser will usually read them. The conventions in this guide — quoting strings, using `-` for list items, indenting list items under their key — are what keep the file parseable. Keep them.

If a value contains a character that would break a YAML parse — a leading `-`, an unescaped `:` followed by a space, a `#` in the middle of a line — quote the whole value with single quotes. Do not add escapes. Rewrite the sentence to avoid the character, or wrap it in quotes.

### Field reference

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| `title` | Yes | string | Service name, as the Citizen's Charter names it |
| `description` | Yes | string | One sentence. What the service is for. |
| `fees` | Yes | string | Peso amount, e.g. `'P90'`. Write `'Walang bayad'` if free. |
| `fee_details` | No | string | Use when the fee varies or is complicated. Omit if the base fee is enough. |
| `time` | Yes | string | Compact format, e.g. `'1 d, 1 hr 17 mins'`. |
| `time_details` | No | string | Use when the time varies or needs explanation. |
| `office` | Yes | string | Office name, and the section within it if applicable. |
| `office_address` | Yes | string | Full address, with floor and building. |
| `office_hours` | Yes | string | Operating hours. Include noon-break status. |
| `whocanavail` | Yes | list of strings | Who qualifies. Each entry is one eligibility clause. |
| `requirements` | No | list of strings | Uncategorized requirements. See section 3. |
| `requirements_<label>` | Yes | list of strings | Categorized requirements. See section 3. |
| `steps` | Yes | list of strings | The procedure. See section 4. |
| `postscripts` | No | list of strings | Final notes. Omit the field entirely if unused. |

The four fields the reader sees at the top of the page — `fees`, `time`, `office`, `whocanavail` — are the metadata-first block. Do not bury them elsewhere. The page renders them first because they answer the four questions everyone asks.

At least one `requirements_<label>` field is required. A service with no requirements is unusual; if the charter lists none, write a single `requirements_mandatory` field with the entry `'Walang kailangan'`.

### Writing each field

**`description`.** One sentence. State what the service is, not how to feel about it. "This service provides procedures for issuing..." not "Get your fishing gear registered today!"

**`fees`.** State the amount with a `P` prefix. Do not use `₱`, which renders inconsistently. If the fee is waived for some applicants, state that in `fee_details`.

**`time`.** Use the compact format: `1 d` for one day, `1 hr` for one hour, `17 mins` for seventeen minutes. Combine with commas. If the charter says "one working day," write `1 d`, and put the qualification in `time_details`.

**`office`.** Name the office as the charter names it. If the office has a section (`Crops/Fishery Section`), include it after a colon.

**`office_hours`.** Include the noon-break status. "No Noon Break" is information the reader needs.

**`whocanavail`.** Each entry is one clause. If a reader can qualify in two different ways, that is two entries, not one entry with an "or."

**`requirements_<label>`.** See section 3.

**`steps`.** See section 4.

**`postscripts`.** Use for a final warning, a common mistake, or a link to a related service. Keep it short. If you have more than two postscripts, the service page is probably trying to be two pages.

## 3. Requirements

Requirements are grouped. Each group has a label and a list of items. In the field block, each group is a separate field whose name begins with `requirements_`, followed by the label.

Underscores in the field name become spaces in the rendered label. Parentheses and other characters pass through literally.

```yaml
requirements_mandatory:
  - 'Barangay clearance'
  - 'Valid ID'
requirements_for_adults_(12_and_older):
  - 'Medical certificate'
requirements_for_minors:
  - "Parent's consent form"
```

Renders as three labeled groups:

**Mandatory**
- Barangay clearance
- Valid ID

**For adults (12 and older)**
- Medical certificate

**For minors**
- Parent's consent form

### Label conventions

Write the label in the register the portal uses. Sentence case, conversational, no bureaucratic phrasing.

| Field name | Rendered label |
|------------|----------------|
| `requirements_mandatory` | Mandatory |
| `requirements_for_adults_(12_and_older)` | For adults (12 and older) |
| `requirements_for_minors` | For minors |
| `requirements_business_specific` | Business specific |
| `requirements_renewal_only` | Renewal only |
| `requirements_if_applicable` | If applicable |

The renderer capitalizes the first letter of each label. Do not write `requirements_Mandatory` — write `requirements_mandatory`.

If a requirement applies to everyone, put it in `requirements_mandatory`. Do not create a `requirements_everyone` field; the mandatory group is the universal group.

If the charter distinguishes requirement categories that do not fit the list above, name the field after the charter's own distinction. Do not invent categories that the charter does not use.

### Ordering

Requirements groups render in the order they appear in the file. Put `requirements_mandatory` first. Put conditional groups after it, in the order the reader is likely to encounter them.

### The uncategorized form

A plain `requirements` field (no label suffix) is supported for services where the charter does not distinguish categories. It renders as a single unlabeled group.

```yaml
requirements:
  - 'Barangay clearance'
  - 'Valid ID'
```

Prefer the categorized form. Only use the plain form when the charter itself does not categorize, and when splitting the list into groups would be inventing a distinction the source does not make.

Do not mix the plain form and the categorized form in the same document. If one group is needed, all groups are needed.

## 4. Steps

Each step is one entry in the `steps` list. Steps form a hierarchy, and a step may carry a collapsible detail.

### The three markers

- **`|`** — splits a step into a primary clause and a collapsible detail. Everything before the pipe is visible. Everything after is hidden behind an accordion.
- **`>`** — marks a substep.
- **`>>`** — marks a sub-substep.

### Plain step

```yaml
steps:
  - 'Pay the fee at the Municipal Treasurer''s Office.'
```

Renders as a single visible step.

### Step with collapsible detail

```yaml
steps:
  - "Proceed to the Office of the Municipal Agriculturist and provide the necessary information. | An OMA personnel will set a schedule of actual boat admeasurement."
```

Renders as one step — "Proceed to the Office of the Municipal Agriculturist and provide the necessary information" — with a collapsed toggle that reveals "An OMA personnel will set a schedule of actual boat admeasurement."

The clause before the pipe is the action the reader must take. It is always visible. The clause after the pipe is supporting detail — what happens in the back office, why the step exists, what the counter staff will do. It is collapsed by default.

**Do not put a required action after the pipe.** If the reader must do it, it goes before the pipe. The accordion is for context, not for instructions.

### Substep

```yaml
steps:
  - 'Submit the complete application packet.'
  - '> Present the original documents for verification.'
  - '> Sign the application form in the presence of the officer.'
  - 'Pay the assessed fees at the Municipal Treasurer''s Office.'
```

Renders as four steps, with steps two and three indented under step one.

A substep is still a step the reader performs. It is nested because it belongs to the parent step, not because it is optional. If a step is optional, say so in the text — do not rely on the hierarchy to carry that meaning.

### Sub-substep

```yaml
steps:
  - 'Submit the complete application packet.'
  - '> Present the original documents for verification.'
  - '>> Hand over the barangay clearance first.'
  - '>> Then hand over the valid ID.'
```

Renders as a two-level indent under step one. Deeper than `>>` is not supported. If a step needs four levels, the step is doing too much — split it into two top-level steps.

### Combining the markers

A substep can carry a collapsible detail:

```yaml
steps:
  - '> Present the original documents for verification. | The officer will compare each document against the application form.'
```

A `>>` substep can carry one too. There is no restriction on combining `>` or `>>` with `|`.

### Rules

- **The pipe splits once.** A step cannot contain two pipes. If a step needs two collapsible details, it is two steps.
- **The pipe is optional.** Use it only when the second clause adds real context. A step whose detail is just a restatement of the action does not need one.
- **The hierarchy is two levels deep.** `>` and `>>` only. No `>>>`.
- **Do not number the steps in the text.** The renderer numbers them. Do not write "1." at the start of a step string.
- **Do not use the hierarchy for emphasis.** A step the reader must not skip is still a top-level step. Indentation signals belonging, not importance.

### Why accordions are permitted here

[DESIGN.md](./DESIGN.md) states that conditional content is never hidden behind an accordion. That rule applies to critical information — fees, time, office, who can avail, requirements, and the step sequence itself. All of that is visible at once. The reader never has to open a toggle to find out they are on the wrong path.

A step's supporting detail is different. It explains what happens in the back office, or why the step exists. The reader can complete the step without reading the detail. Collapsing it keeps the step list scannable. The `|` convention exists so the writer can separate the instruction from the context, and the reader can ignore the context if they are in a hurry.

## 5. Source attribution

Every service page cites the Citizen's Charter issue date. The citation appears at the bottom of the rendered page.

> Source: Citizen's Charter, Municipality of Infanta, March 2026 issue.

If you do not know the issue date, do not publish the page. An unverifiable service page is worse than no page.

When the LGU publishes a new charter, the issue date on every affected page must be updated. See [CONTENT-MANAGEMENT.md](./CONTENT-MANAGEMENT.md), section 7.

## 6. Disclaimers

Every page that presents a figure derived from a model — the solar calculator, the tide bulletin — carries a disclaimer. The disclaimer names the source and states the limitation.

Examples:

- Solar: "This is a model estimate. It is not a substitute for a site assessment by a licensed installer."
- Tides: "Open-Meteo Marine interpolates on an 8 km grid. Actual tides at your barangay may differ. Not for navigation."
- Finance: "Figures are submitted by the LGU to BLGF and are not independently audited by this portal."

A disclaimer that does not name a limitation is not a disclaimer. It is a hedge.

## 7. What to avoid

- **Bureaucratic language.** "The herein applicant shall..." is not a sentence. Write "Bring your ID."
- **Translated-from-English constructions.** If you are writing in Filipino, write in Filipino. Do not write English sentences and swap the words.
- **Invented euphemisms.** "Direktoryo," "Gabay," "Impormasyon" — these are not words people use in Infanta. Say what you mean.
- **Unnamed sources.** Every figure has a source. If you cannot name it, do not publish it.
- **Urgency without cause.** Dugo is for real urgencies. Do not use it to make an ordinary fee feel important.
- **Marketing copy.** No "we're excited," no "we're proud," no "we believe."
- **Formal Tagalog.** See section 1.
- **Placeholder fields.** If the charter does not specify a value, write `Hindi tinukoy sa charter` — do not leave the field blank and do not guess.

## See also

- [DESIGN.md](./DESIGN.md) — why the portal looks the way it does
- [CONTENT-MANAGEMENT.md](./CONTENT-MANAGEMENT.md) — how to add and update content
- [DATA.md](./DATA.md) — sources and limitations

Reply **"continue"** for the next file.
