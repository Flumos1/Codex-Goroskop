# First Research Roadmap

## Goal

Build the first working foundation for a serious horoscope platform:

- A structured source catalog.
- A clear interpretive philosophy.
- A natal chart knowledge base.
- A cautious forecasting method.
- A generator that can explain why it says what it says.

## Phase 1: Source Triage

Status: started.

Tasks:

- Catalog all uploaded books.
- Assign each source to a category.
- Mark reading priority.
- Keep an intake lane for new arrivals.

Output:

- `sources/books/book-catalog.md`

## Phase 2: Core Methodology

Status: next.

Tasks:

- Define what the project means by "forecast".
- Define the ethical boundary between help, prediction, and advice.
- Decide how Western and Vedic systems coexist.
- Define source reliability levels.

Output:

- `methodology/interpretive-philosophy.md`
- `methodology/forecasting-boundaries.md`

## Phase 3: Natal Chart Foundation

Status: planned.

Tasks:

- Build base entries for planets.
- Build base entries for zodiac signs.
- Build base entries for houses.
- Build aspect interpretation structure.
- Define synthesis rules: planet + sign + house + aspect.

Output:

- `knowledge-base/planets.md`
- `knowledge-base/signs.md`
- `knowledge-base/houses.md`
- `knowledge-base/aspects.md`
- `methodology/natal-synthesis-rules.md`

## Phase 4: Forecasting Foundation

Status: planned.

Tasks:

- Define transit categories.
- Define time windows.
- Define intensity levels.
- Define how to express probability without pretending certainty.

Output:

- `knowledge-base/transits.md`
- `methodology/forecast-synthesis-rules.md`

## Phase 5: Generator Prototype

Status: planned.

Tasks:

- Define user input schema: birth date, time, place.
- Select calculation approach for natal chart.
- Generate a first text based on structured rules.
- Include explanations and source-aware reasoning.

Output:

- `generator/input-schema.md`
- `generator/generation-principles.md`

## Open Questions

1. Reports should be written in Russian first, or should Ukrainian/English support be designed from the beginning?
2. Which PDF extraction approach should we use: install a parser, use OCR, or manually review selected books first?
3. Should the first site prototype include both Western and Vedic tabs immediately, or start with Western pages and reserve Vedic data behind the scenes?
