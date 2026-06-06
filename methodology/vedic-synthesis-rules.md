# Vedic Synthesis Rules

## Source Basis

Initial source:

- Narasimha Rao, Vedic Astrology: An Integrated Approach.
- Govind Swarup Agarwal, Vedic Astrology, Vol. 2-3.

## Rule 1: Keep Jyotish Separate

Vedic interpretations must not be silently merged with Western interpretations.

Every Vedic rule should be marked with:

- System: Vedic / Jyotish.
- Zodiac: sidereal / nirayana unless otherwise specified.
- Reference point.
- Chart layer.

## Rule 2: Four Pillars

Vedic interpretation should identify the relevant pillar:

1. Graha: planetary actor or force.
2. Rashi: sign environment.
3. Bhava: house/life topic from a reference point.
4. Varga: divisional chart for a specific life sphere.

## Rule 3: Reference Point Discipline

Bhavas are counted from a reference point.

Default:

- Lagna.

Other possible reference points:

- Chandra Lagna.
- Surya / Ravi Lagna.
- Arudha Lagna.
- Hora Lagna.
- Ghati Lagna.
- Special Lagnas.

The generator must not omit the reference point in advanced mode.

## Rule 4: Vargas Are Topic-Specific

Do not treat every life topic as fully answered by D-1 alone.

Use:

- D-1 / Rashi as base chart.
- Relevant varga when the topic demands it.

If varga data is not used, say so in advanced mode.

## Rule 5: Dasha Safety

Dashas can describe timing themes and periods.

Do not use dashas for:

- Death prediction.
- Medical diagnosis.
- Guaranteed events.
- Fear-based fatalism.

Use:

- "This period may emphasize..."
- "This dasha can bring attention to..."
- "The theme is stronger if repeated in the natal chart and relevant vargas."

## Rule 6: Nakshatras Are A Separate Layer

Nakshatras and padas should be treated as their own symbolic layer.

Do not collapse nakshatras into Western sign descriptions.

## Rule 7: Functional Role Before Graha Statement

A graha's natural nature is not enough for a Jyotish reading.

Before interpreting a graha in a chart, identify:

- Lagna used.
- Houses owned by the graha.
- Whether the graha is functionally supportive, challenging, mixed, or context-dependent.

Do not generate a public Jyotish claim from graha name alone.

## Rule 8: Dasha Context Before Timing

Before interpreting a dasha or subperiod, identify:

- Dasha / antardasha planet.
- House ownership.
- Placement.
- Strength or condition if available.
- Dispositor and reinforcing or contradicting transit context if available.

Public output must remain thematic and non-deterministic.

## Rule 9: Sensitive Bhava Safety Filter

If Jyotish material touches health, longevity, children, marriage, 6th, 8th, or 12th house topics:

- Avoid diagnosis.
- Avoid death timing.
- Avoid pregnancy certainty.
- Avoid relationship determinism.
- Use cautious, symbolic, reflective language.
