# Knowledge Graph Schema

## Node Types

- `source`: book, article, website, video, or lecture.
- `concept`: astrological concept such as planet, sign, house, graha, nakshatra.
- `theme`: psychological, spiritual, or life-area theme.
- `rule`: interpretive rule used by the generator.
- `caution`: safety boundary or interpretation limitation.
- `tradition`: Western, Vedic, psychological, classical, etc.

## Edge Types

- `belongs_to`: concept belongs to a tradition or category.
- `symbolizes`: concept points to a theme.
- `governs`: concept rules or governs another concept in a specific tradition.
- `activates`: one factor activates another in timing or synthesis.
- `supports`: source supports a concept, theme, or rule.
- `contradicts`: source or rule conflicts with another source or rule.
- `limits`: caution limits a rule or interpretation.
- `renders_as`: structured rule can render into simple or advanced wording.

## Required Node Fields

```json
{
  "id": "western.planet.saturn",
  "type": "concept",
  "label": "Saturn",
  "system": "western",
  "status": "draft"
}
```

## Required Edge Fields

```json
{
  "from": "western.planet.saturn",
  "to": "theme.boundary",
  "type": "symbolizes",
  "confidence": "medium",
  "sourceIds": [],
  "notes": ""
}
```

## Confidence

- `low`: tentative or single weak source.
- `medium`: coherent with at least one serious source family.
- `high`: repeated across major sources or core tradition.

Confidence is interpretive strength, not scientific certainty.
