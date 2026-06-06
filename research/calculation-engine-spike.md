# Calculation Engine Spike

## Goal

Choose a practical first calculation path for natal chart data.

The generator already accepts report profiles. The next missing layer is a chart calculator that can produce factors and rule IDs from birth data.

## Requirements

### Required For MVP

- Parse birth date and time.
- Represent birth place as latitude and longitude.
- Use UTC internally.
- Convert local birth time when an explicit timezone is available.
- Calculate tropical ecliptic longitudes for core bodies.
- Map longitudes to zodiac signs.
- Calculate a prototype Ascendant.
- Assign a first house system.
- Produce a report profile.
- Clearly mark calculation limitations.

### Required Later

- Geocoding.
- Reference-chart verification for Ascendant and houses.
- Configurable house systems.
- Aspects with configurable orb.
- Vedic sidereal positions with ayanamsa.
- Nakshatras.
- Vargas.
- Dashas.

## Library Options

### Swiss Ephemeris

Pros:

- High precision.
- Widely used in astrology software.
- Supports tropical and sidereal workflows.
- Strong candidate for final production engine.

Cons:

- License is AGPL or commercial.
- Public web service use has licensing consequences.
- Native/data-file setup can add operational complexity.

Decision:

- Keep as serious production candidate.
- Do not embed into MVP unless license strategy is decided.

### Astronomy Engine

Pros:

- JavaScript/TypeScript package.
- MIT license.
- No heavy ephemeris data files for first spike.
- Suitable for planetary ecliptic longitude prototype.

Cons:

- It is an astronomy library, not a complete astrology engine.
- Houses, ayanamsa, nakshatras, dashas, and vargas need additional implementation or another library.

Decision:

- Use for first local tropical-position spike.
- Keep output clearly marked as prototype calculation.

## MVP Calculation Plan

1. Install `astronomy-engine`.
2. Create a local calculation script.
3. Input:
   - UTC date/time.
   - Latitude/longitude placeholder.
4. Output:
   - Planetary tropical longitudes.
   - Zodiac signs.
   - Ascendant.
   - Equal Houses from Ascendant.
   - Planet-in-house placements.
   - A report profile skeleton.
5. Keep production-grade house systems and Vedic details pending.

## Implemented Prototype

- Local place registry: `data/places.json`.
- Local birth time conversion using IANA timezones.
- Tropical planetary longitudes.
- Major aspect detection.
- Ascendant by ecliptic/horizon intersection.
- Midheaven, Descendant, and Imum Coeli as explicit chart angles.
- Equal House cusps from Ascendant.
- Whole Sign houses from the Ascendant sign.
- Planet-in-house assignment.
- Rule matching for available aspect and house rules.
- Regression fixtures for local time conversion, Ascendant, house assignment, and matched factors.
- Reference-chart verification harness with four external Ascendant/planet-position references, candidate baselines, and source/status metadata.

## Safety And Accuracy Notes

- Do not claim full natal chart accuracy until geocoding, reference-chart verification, and configurable house systems are implemented.
- Candidate reference charts are regression baselines only; promote them to true references only after external values are recorded with source notes.
- Current external coverage verifies Ascendant and tropical planet positions, not production house-system accuracy.
- Equal Houses and Whole Sign are prototype choices, not a final house-system decision.
- Do not claim Jyotish accuracy until sidereal mode, ayanamsa, nakshatras, and vargas are implemented.
- Store calculation assumptions inside output profiles.
