# Dual System Architecture

The project supports multiple astrological branches, with Western and Vedic as the first active pair:

- Western astrology.
- Vedic astrology / Jyotish.
- Chinese / East Asian astrology.
- Kabbalistic / esoteric and birthday-personology layers.

They should coexist as separate interpretive systems, not as an unmarked mixture.

Compatibility is handled as a cross-branch product domain, not as a separate tradition.

Some product modes may use a primary-wave source first, then add overlay layers. The first planned example is Goldschneider's birthday-personology source as the main wave for birthday/person/partner analysis, with the rest of the project added only as marked overlays.

## Principle

Western and Vedic astrology can analyze similar life questions, but they use different symbolic assumptions, calculation traditions, terminology, and timing techniques.

The generator must always know which system is speaking.

## Western Branch

Initial MVP scope:

- Natal chart.
- Planets.
- Zodiac signs.
- Houses.
- Aspects.
- Psychological interpretation.
- Outer planet themes.
- Transits and cycles in future phases.

Primary source categories:

- `01-classical-western`
- `02-psychological-archetypal`
- `03-natal-houses-methods`
- `04-predictive-transits-cycles`

## Vedic Branch

Initial parallel branch:

- Rashi chart basics.
- Planets/grahas.
- Signs/rashis.
- Houses/bhavas.
- Nakshatras.
- Dashas and timing methods in later phases.

Primary source category:

- `05-vedic-jyotish`

## Chinese / East Asian Branch

Initial research scope:

- Chinese zodiac / Eastern zodiac.
- Lunar calendar.
- Han-era Chinese astrology.
- Date selection / Ze Ri Xue.

Primary source category:

- `09-chinese-eastern-astrology`

Status:

- Intake added.
- OCR required before methodology extraction.
- No generator rules until source text is available.

## Kabbalistic / Esoteric And Birthday-Personology Branch

Initial research scope:

- Kabbalistic astrology as a labeled esoteric layer.
- Birthday-personology as a separate primary-wave report mode.
- Partner or important-person analysis by date of birth when a full chart is not available.

Primary source category:

- `07-kabbalah-esoteric`

Status:

- Berg requires OCR.
- Goldschneider's `Тайный язык дня рождения` requires OCR and is marked as a priority-1 foundational source.
- Birthday-personology must not be labeled Kabbalistic unless the source text supports that after OCR.

## Synthesis Rule

Do not merge Western and Vedic interpretations into a single claim unless the report explicitly marks it as synthesis.

Compatibility reports must also mark which source system is speaking. A Western synastry statement, a personology statement, a Jyotish matching statement, and a Chinese/Eastern compatibility statement are different layers.

When a report uses primary-wave architecture, state which source is the primary wave and which systems are overlays.

Preferred report structure:

1. Western interpretation.
2. Vedic interpretation.
3. Chinese / East Asian interpretation if explicitly requested and source-backed.
4. Convergences.
5. Differences.
6. Practical reflection.

## Compatibility Domain

Compatibility can use multiple branches, but must start by declaring relationship type:

- romantic;
- marriage / long-term partnership;
- parent-child;
- mother-child;
- father-child;
- friends;
- work / business;
- family / relatives.

The output should be multi-axis rather than verdict-based:

- natural ease;
- friction;
- emotional needs;
- communication;
- practical cooperation;
- growth;
- boundaries.

## Product Modes

### Simple Mode

For general users:

- Human, calm, clear language.
- No overloaded terminology.
- Emphasis on self-understanding and practical reflection.
- Claims framed as themes, tendencies, and inner dynamics.

### Advanced Mode

For experienced users:

- Shows technical factors.
- Explains interpretation logic.
- Separates Western and Vedic methods.
- Mentions source families or traditions.
- Highlights contradictions and uncertainty.

## Safety Boundaries

The system should avoid:

- Certainty about future events.
- Medical diagnosis.
- Fatalistic statements.
- Fear-based claims.

The system should prefer:

- "This may indicate..."
- "A useful way to observe this..."
- "This period can emphasize..."
- "In this tradition, the symbol is interpreted as..."
