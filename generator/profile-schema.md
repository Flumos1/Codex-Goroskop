# Report Profile Schema

Report profiles are JSON files that describe a generated report request.

They are an intermediate bridge between future chart calculation and current rule-based generation.

## Location

Profiles can live in:

`generator/profiles/`

## Minimal Profile

```json
{
  "mode": "both",
  "factors": [
    { "query": "Moon square Saturn" },
    { "query": "Saturn in 7th house" }
  ]
}
```

## Full Profile

```json
{
  "title": "Natal Reflection",
  "mode": "both",
  "language": "en",
  "systems": ["western", "vedic"],
  "subject": {
    "nickname": "Demo User"
  },
  "birthData": {
    "datetimeUtc": "1990-01-01T12:00:00Z",
    "localDate": "1990-01-01",
    "localTime": "14:00",
    "timeZone": "Europe/Chisinau",
    "place": "Chisinau, Moldova",
    "placeKey": "chisinau-md",
    "latitude": 47.0105,
    "longitude": 28.8638,
    "quality": "exact"
  },
  "calculation": {
    "engine": "astronomy-engine",
    "zodiac": "tropical",
    "houseSystem": "equal-from-ascendant",
    "housePlacementStartLongitude": 45.47773,
    "assumptions": [
      "Ascendant and houses use a prototype Equal House system from the Ascendant."
    ],
    "positions": [],
    "aspects": [],
    "angles": {
      "ascendant": {
        "longitude": 45.47773,
        "sign": "Taurus",
        "degreeInSign": 15.47773
      },
      "descendant": {
        "longitude": 225.47773,
        "sign": "Scorpio",
        "degreeInSign": 15.47773
      },
      "midheaven": {
        "longitude": 292.704275,
        "sign": "Capricorn",
        "degreeInSign": 22.704275
      },
      "imumCoeli": {
        "longitude": 112.704275,
        "sign": "Cancer",
        "degreeInSign": 22.704275
      }
    },
    "houses": []
  },
  "context": "Optional user context or question.",
  "factors": [
    {
      "query": "Moon square Saturn",
      "calculated": {
        "bodyA": "Moon",
        "aspect": "square",
        "bodyB": "Saturn",
        "orb": 0.49
      }
    },
    { "id": "rule-instance.western.saturn-in-7th-house" }
  ]
}
```

## Fields

- `title`: report title.
- `mode`: `simple`, `advanced`, or `both`.
- `language`: report language marker.
- `systems`: requested systems, such as `western` and `vedic`.
- `subject`: user label data.
- `birthData`: birth data used or intended for calculation.
- `calculation`: optional raw calculation data and assumptions.
- `context`: optional user question or report context.
- `factors`: rule lookups by `query` or exact `id`.

## Command

```powershell
npm run generate -- --profile generator/profiles/demo-profile.json --out demo-profile-report.md
```

## Future Use

When chart calculation is implemented, it should produce this profile format:

1. Calculate chart.
2. Select matching rule IDs.
3. Write report profile.
4. Generate simple and/or advanced report.

The current calculation prototype already writes this shape. It supports Western tropical positions, major aspects, a prototype Ascendant, Equal Houses from the Ascendant, and Whole Sign houses from the Ascendant sign. It does not support external geocoding, Placidus/Koch/Regiomontanus house systems, or Vedic sidereal factors yet.

The calculator now supports local birth time when either:

- `--place-key` resolves to a known entry in `data/places.json`;
- or `--timezone`, `--lat`, and `--lon` are provided manually.

The current place registry is intentionally small and should be treated as a temporary local geocoding layer.

The house system can be selected with:

```powershell
npm run calculate -- --local-date "1990-04-10" --local-time "08:30" --place-key chisinau-md --house-system whole-sign --out whole-sign-demo-profile.json
```
