# Report Modes

The generator should produce two levels of explanation for the same chart.

## Simple Explanation

Purpose:

Help a general user understand themselves without needing astrology training.

Style:

- Calm.
- Direct.
- Respectful.
- Psychological and reflective.
- No entertainment tone.

Structure:

1. Main life themes.
2. Emotional pattern.
3. Strengths.
4. Tensions or growth points.
5. Practical reflection.

Example framing:

- "You may notice..."
- "A recurring theme can be..."
- "This placement often points to..."

## Advanced Explanation

Purpose:

Let advanced users see the technical basis of the interpretation.

Style:

- Source-aware.
- Methodological.
- Transparent.
- Comfortable with ambiguity.

Structure:

1. Chart factors used.
2. Western interpretation.
3. Vedic interpretation.
4. Agreements between systems.
5. Differences between systems.
6. Confidence and cautions.
7. Source or tradition notes.

## Shared Rule

Both modes should be generated from the same structured interpretation data. The difference is presentation depth, not hidden contradictions.

## Birthday Source-Only Mode

Purpose:

Generate a birthday-personology report from one declared source before adding overlays.

Initial source:

- Goldschneider - Secret Language Of Birthdays.

Required behavior:

- declare the source at the start;
- use birth month and day as the lookup key;
- do not import natal chart, Jyotish, Chinese / Eastern, Kabbalah, or compatibility material unless overlay mode is requested;
- frame the reading as one symbolic lens, not the whole person.

Structure:

1. Source declaration.
2. Primary-wave portrait.
3. Strengths.
4. Watch points.
5. Growth prompt.
6. Relationship-use note if the subject is a partner, child, parent, friend, or colleague.
7. Boundary note.

See `birthday-source-only-schema.md`.

## Stereo Overlay Mode

Purpose:

Combine a primary-wave source with one or more clearly labeled overlays.

Required behavior:

- label the primary wave;
- label each overlay source or tradition;
- describe agreements and differences as separate symbolic lenses;
- avoid making the overlay sound like it has "corrected" the primary wave unless source evidence and user context support that.

## Subpersonality Rendering

When chart factors conflict, reports may describe them as inner parts.

Simple mode:

- "One part of you may need..."
- "Another part may pull toward..."
- "The task is to help these parts cooperate."

Advanced mode:

- Show which chart factors are being treated as subpersonalities.
- Separate symbolic inference from biographical fact.
- Use the workflow: recognition, acceptance, coordination, integration.
