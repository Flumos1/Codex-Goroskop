# Source Notes: Narasimha Rao - Vedic Astrology: An Integrated Approach

## Source

- Title: Интегральный подход к Ведической астрологии.
- Author: П. В. Р. Нарасимха Рао.
- Category: vedic-jyotish.
- Project priority: 1.
- Extraction status: text extracted.
- Pages: 484.
- Text characters: 797995.

## Project Role

This source is the first foundation for the Vedic / Jyotish branch.

It is useful for:

- Establishing Jyotish as a separate system.
- Defining core technical terms.
- Building the calculation-oriented structure of the Vedic branch.
- Planning future modules for dashas, nakshatras, vargas, transits, and ethics.

## Main Structure

The book is organized into major parts:

1. Chart analysis.
2. Dashas / periods.
3. Transits.
4. Tajaka annual astrology.
5. Additional topics, including birth time accuracy, rational thinking, remedial measures, muhurta, and Jyotish ethics.
6. Examples.

## Core Interpretive Architecture

### 1. Jyotish Is Not Western Astrology With Sanskrit Names

The source establishes a different technical system:

- Sidereal / nirayana zodiac rather than tropical / sayana zodiac.
- Grahas instead of only Western planets.
- Rashi as signs.
- Bhavas as houses counted from Lagna and other reference points.
- Vargas as divisional charts.
- Nakshatras as 27 lunar mansions.
- Dashas as period systems.

Project rule:

- Keep Vedic calculations, terminology, and interpretation separate from Western rules.

### 2. Four Pillars

The source explicitly frames Vedic astrology around four pillars:

1. Grahas / planets.
2. Rashis / signs.
3. Bhavas / houses.
4. Varga-chakras / divisional charts.

Generator use:

- Do not produce a Jyotish interpretation from rashi chart alone if the requested topic requires a varga.
- Use advanced mode to show which pillar is being used.

### 3. Grahas

The nine primary grahas:

- Sun.
- Moon.
- Mars.
- Mercury.
- Jupiter.
- Venus.
- Saturn.
- Rahu.
- Ketu.

Rahu and Ketu are mathematical shadow points, but are treated as grahas in Jyotish.

Project rule:

- Do not automatically equate graha meanings with Western planetary meanings.

### 4. Rashi

Rashis are 12 equal 30-degree divisions of the zodiac.

Important distinction:

- Vedic astrology generally uses the fixed sidereal zodiac.
- Western astrology usually uses the moving tropical zodiac.

Project rule:

- The site must clearly indicate zodiac mode in advanced mode.

### 5. Bhavas

Bhavas are houses. Rao emphasizes that houses can be counted from different reference points:

- Lagna is default when no other point is specified.
- Special lagnas can be used for specific topics.

Project rule:

- Vedic house interpretation must record the reference point.
- "7th from Lagna" and "7th from Chandra Lagna" are not identical claims.

### 6. Vargas

Vargas are divisional charts created by dividing rashis into parts.

Each varga relates to a specific sphere of life and can be interpreted as a chart.

Project rule:

- Vedic reports should not overstate a topic unless the relevant varga has been considered or explicitly omitted.

### 7. Nakshatras

The zodiac is divided into 27 nakshatras of 13°20'.

Each nakshatra has 4 padas of 3°20'.

Project rule:

- Nakshatras should be a separate module, not collapsed into Western sign meaning.

### 8. Dashas

Dashas divide life into periods, subperiods, and smaller subperiods.

The source distinguishes:

- Nakshatra dashas.
- Rashi dashas.
- Dashas for general results.
- Dashas for longevity.

Project safety rule:

- Avoid death timing and longevity predictions in the public product.
- Use dashas for thematic timing only unless a future private/research mode is explicitly defined.

## Generator Rules Extracted

### Rule: Vedic System Declaration

Every Vedic report should declare:

- Zodiac mode: sidereal / nirayana.
- Reference point: Lagna, Chandra Lagna, special Lagna, etc.
- Chart layer: Rashi chart, varga chart, nakshatra layer, dasha period.

### Rule: Four-Pillar Context

When interpreting a Vedic factor, identify which pillar it belongs to:

- Graha.
- Rashi.
- Bhava.
- Varga.

### Rule: Reference Point Discipline

A bhava reading must state its reference point.

Example:

- "7th from Lagna" means partnership as seen from the birth ascendant.
- "7th from Chandra Lagna" means partnership as filtered through the Moon/mind reference.

### Rule: Timing Safety

Dashas can be used to describe periods and themes.

Do not produce:

- Death prediction.
- Guaranteed event.
- Medical certainty.
- Fear-based period description.

## Knowledge-Base Targets

Add or refine:

- `vedic/core-concepts.md`
- `vedic/grahas.md`
- `vedic/rashis.md`
- `vedic/bhavas.md`
- `vedic/vargas.md`
- `vedic/nakshatras.md`
- `vedic/dashas.md`

## Graph Targets

New concepts:

- `vedic.graha.sun` through `vedic.graha.ketu`
- `vedic.concept.rashi`
- `vedic.concept.bhava`
- `vedic.concept.varga`
- `vedic.concept.lagna`
- `vedic.concept.dasha`
- `vedic.concept.nakshatra-pada`
- `rule.vedic.system-declaration`
- `rule.vedic.four-pillar-context`
- `rule.vedic.reference-point-discipline`
- `rule.vedic.timing-safety`

## First Generator Example

Input:

- Vedic report with Lagna as reference point.

Simple explanation:

In the Vedic branch, the chart is read through a different symbolic and calculation system. The first step is to identify the Lagna, because it becomes the main reference point for houses. From there, planets, signs, houses, divisional charts, nakshatras, and timing periods are interpreted as connected layers.

Advanced explanation:

This report uses the Jyotish framework: grahas, rashis, bhavas, and vargas. Unless otherwise stated, houses are counted from Lagna and the zodiac mode is sidereal / nirayana. Timing systems such as dashas are treated as thematic period indicators, not as guaranteed event mechanisms.
