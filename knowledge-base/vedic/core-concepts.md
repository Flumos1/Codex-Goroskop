# Vedic Core Concepts

Use this file for Jyotish concepts before splitting into detailed modules.

| Concept | Sanskrit/Traditional Term | Working Definition | Use In Generator | Cautions | Source Notes |
|---|---|---|---|---|---|
| Planet | Graha |  |  | Do not equate automatically with Western planet meanings. |  |
| Sign | Rashi |  |  |  |  |
| House | Bhava |  |  |  |  |
| Lunar Mansion | Nakshatra |  |  | Needs careful source handling. |  |
| Planetary Period | Dasha |  |  | Timing claims must be cautious. |  |
| Combination | Yoga |  |  | Avoid fatalistic status claims. |  |

## Initial Jyotish Architecture

Source:

- Narasimha Rao, Vedic Astrology: An Integrated Approach.

Vedic astrology / Jyotish is handled as a separate system from Western astrology.

## Four Pillars

| Pillar | Term | Working Definition | Generator Use |
|---|---|---|---|
| Planetary actor | Graha | Planetary force or influential point, including Rahu and Ketu as shadow grahas | Identify the actor or force. |
| Sign | Rashi | 30-degree sidereal zodiac sign | Identify the sign environment. |
| House | Bhava | House counted from Lagna or another reference point | Identify the life topic and always record the reference point. |
| Divisional chart | Varga / Varga-chakra | Topic-specific chart created by dividing signs | Use for specific life areas when available. |

## Core Layers

| Layer | Meaning | Project Rule |
|---|---|---|
| Lagna | Main ascendant/reference point | Default reference point for houses unless another is named. |
| Nakshatra | Lunar mansion of 13°20' | Separate symbolic layer. |
| Pada | Quarter of a nakshatra, 3°20' | Use in nakshatra module. |
| Dasha | Planetary or sign-based period system | Use for timing themes with safety limits. |
| Yoga | Combination producing a specific result | Avoid deterministic status claims. |

## Safety Notes

- Do not predict death or longevity in the public product.
- Do not present dasha results as guaranteed events.
- Do not mix tropical and sidereal calculations without explicit labeling.
- Do not equate Vedic grahas with Western planetary meanings without a comparison layer.
