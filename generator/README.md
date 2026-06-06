# Generator Prototype

This is the first local generator prototype for Codex Goroskop.

It reads structured JSON rules from:

`generator/rules/`

and renders simple and/or advanced reports.

## Commands

Validate project graph, rules, and profiles:

```powershell
npm run validate
npm run validate:calculations
npm run verify:references
npm run verify:references:strict
```

List available rules:

```powershell
npm run generate -- --list
```

Trace a rule back to sources and graph links:

```powershell
npm run trace:rule -- --query "Moon square Saturn"
npm run trace:rule -- --id rule-instance.western.moon-square-saturn --json
```

Generate by query:

```powershell
npm run generate -- --query "Moon square Saturn" --mode simple
npm run generate -- --query "Saturn in 7th house" --mode both
npm run generate -- --query "vedic framework" --mode advanced
```

Generate a composite report:

```powershell
npm run generate -- --queries "Moon square Saturn; Saturn in 7th house; vedic framework" --mode both
```

Generate by exact rule ID:

```powershell
npm run generate -- --id rule-instance.western.saturn-in-7th-house --mode both
```

Generate a composite report by rule IDs:

```powershell
npm run generate -- --ids "rule-instance.western.moon-square-saturn,rule-instance.western.saturn-in-7th-house" --mode simple
```

Generate from a report profile:

```powershell
npm run generate -- --profile generator/profiles/demo-profile.json
```

Write profile output to file:

```powershell
npm run generate -- --profile generator/profiles/demo-profile.json --out demo-profile-report.md
```

Calculate a prototype Western tropical profile from UTC birth data:

```powershell
npm run calculate -- --datetime "1990-04-10T12:00:00Z" --name "Demo User" --place "Chisinau, Moldova" --lat 47.0105 --lon 28.8638 --out calculated-match-profile.json
```

Calculate from local birth time using the local place registry:

```powershell
npm run calculate -- --local-date "1990-04-10" --local-time "15:00" --place-key chisinau-md --name "Demo User" --out local-time-demo-profile.json
npm run calculate -- --local-date "1990-04-10" --local-time "08:30" --place-key chisinau-md --name "House Rules Demo" --out house-rules-demo-profile.json
npm run calculate -- --local-date "1990-04-10" --local-time "08:30" --place-key chisinau-md --house-system whole-sign --name "Whole Sign Demo" --out whole-sign-demo-profile.json
```

Generate a report from a calculated profile:

```powershell
npm run generate -- --profile generator/profiles/calculated-match-profile.json --out calculated-match-report.md
npm run generate -- --profile generator/profiles/local-time-demo-profile.json --out local-time-demo-report.md
npm run generate -- --profile generator/profiles/house-rules-demo-profile.json --out house-rules-demo-report.md
```

Write output to file:

```powershell
npm run generate -- --id rule-instance.western.saturn-in-7th-house --mode both --out saturn-in-7th-house.md
```

Output files are written to:

`generator/outputs/`

## Modes

- `simple`: user-friendly explanation.
- `advanced`: technical/methodological explanation.
- `both`: both report layers.

Profiles can set `"mode": "simple"`, `"advanced"`, or `"both"`.

## Rule Requirements

Each rule should include:

- `id`
- `system`
- `methodFamily`
- `factor`
- `sourceRule` or `sourceRules`
- `sourceIds`
- `themes`
- `simple`
- `advanced`
- `confidence`

## Safety

Rules must avoid guaranteed predictions, medical diagnosis, death prediction, financial certainty, relationship determinism, and fear-based fatalism.

## Calculation Prototype

`npm run calculate` currently creates a Western tropical profile using `astronomy-engine`.

Current scope:

- UTC datetime input.
- Local birth date and time input when an explicit IANA timezone or known `data/places.json` place key is available.
- Local place registry lookup for latitude, longitude, and timezone.
- Tropical geocentric longitudes for Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, and Pluto.
- Major aspects between calculated bodies.
- Prototype Ascendant calculation.
- Prototype Equal House cusps from the Ascendant.
- Prototype Whole Sign houses from the Ascendant sign via `--house-system whole-sign`.
- Planet-in-house assignment for matching existing house rules.
- Matching only against currently available generator rule queries.
- Calculation regression fixtures through `npm run validate:calculations`.
- Reference-chart verification through `npm run verify:references`.

Current limitations:

- Local time conversion depends on explicit timezone data.
- Place lookup is limited to `data/places.json`.
- No external geocoding.
- Reference coverage includes four external Ascendant/planet-position checks plus internal candidate baselines.
- Supported prototype house systems are `equal-from-ascendant` and `whole-sign`.
- No Placidus, Koch, Regiomontanus, or Vedic bhava systems yet.
- No Vedic sidereal mode, ayanamsa, nakshatras, vargas, or dashas.
