# Birthday Source-Only Schema

## Purpose

This schema defines the structured data needed for a source-only birthday-personology report.

Initial primary source:

- `source.goldschneider-secret-language-birthdays`

The schema is intentionally source-labeled so the project can later add other birthday, Kabbalistic, numerological, or symbolic systems without merging them silently.

## Input

Required:

- `birthMonth`
- `birthDay`

Optional:

- `year`, only for user context; the initial source-only mode does not require it;
- `personLabel`, such as self, partner, child, parent, friend, or colleague;
- `relationshipContext`, if the user asks about another person;
- `overlayMode`, one of `source-only`, `stereo`, or `compare-layers`.

## Record Shape

Each day record should use:

```json
{
  "id": "birthday.goldschneider.01-01",
  "sourceId": "source.goldschneider-secret-language-birthdays",
  "calendar": {
    "month": 1,
    "day": 1,
    "dayKey": "01-01"
  },
  "zodiacContext": {
    "sign": "",
    "period": "",
    "cusp": false
  },
  "primaryWave": {
    "title": "",
    "corePattern": "",
    "strengths": [],
    "risks": [],
    "growthPrompt": "",
    "relationshipUse": ""
  },
  "safety": {
    "noDeterminism": true,
    "requiresSourceLabel": true,
    "overlayAllowed": true
  }
}
```

## Report Sections

Source-only birthday report:

1. Source declaration.
2. Primary-wave portrait.
3. Strengths / resources.
4. Watch points / friction.
5. Growth prompt.
6. If another person is being analyzed, relationship-use note.
7. Boundary: this is one source lens, not the whole person.

## Stereo Report Sections

Stereo report:

1. Primary wave: Goldschneider birthday-personology.
2. Overlay source declaration.
3. Agreements between layers.
4. Tensions or differences between layers.
5. Practical reflection.
6. Safety boundary.

## Extraction Rules

- Store only reusable structured summaries, not long copied passages.
- Keep the source day and page references where possible.
- Do not rewrite source phrasing as certainty.
- Do not combine birthday source claims with chart claims unless the report mode explicitly asks for overlays.
