# Knowledge Graph Plan

## Why Use A Graph

Astrological interpretation is not a flat list. It is a network:

- Planets connect to symbols.
- Signs modify planets.
- Houses map themes into life areas.
- Aspects create tension or flow.
- Traditions disagree or emphasize different meanings.
- Sources support or contradict rules.

A graph lets the project preserve these relationships.

## How It Will Work

### 1. Source Nodes

Every book becomes a source node.

Example:

```json
{
  "id": "source.greene-sasportas-development-personality-v1",
  "type": "source",
  "label": "Развитие Личности. Том 1",
  "system": "western",
  "status": "triaged"
}
```

### 2. Concept Nodes

Astrological objects become concept nodes:

- `western.planet.sun`
- `western.house.7`
- `western.aspect.square`
- `vedic.graha.shani`
- `vedic.nakshatra.ashwini`

### 3. Theme Nodes

Psychological/spiritual meanings become theme nodes:

- `theme.identity`
- `theme.boundary`
- `theme.intimacy`
- `theme.transformation`
- `theme.vocation`

### 4. Rule Nodes

Generator-ready interpretation rules become rule nodes.

Example:

```json
{
  "id": "rule.western.saturn-house-growth-task",
  "type": "rule",
  "label": "Saturn by house as growth task",
  "system": "western",
  "status": "draft"
}
```

### 5. Edges

Edges explain the relationship:

- Saturn `symbolizes` boundary.
- 7th house `symbolizes` partnership.
- Source `supports` Saturn-boundary relation.
- Medical caution `limits` health interpretation.

## Generator Use

The generator can query the graph like this:

1. Find chart factor: Saturn in 7th house.
2. Retrieve Saturn themes.
3. Retrieve 7th house themes.
4. Retrieve relevant synthesis rules.
5. Apply safety boundaries.
6. Render simple and advanced wording.

## Research Use

The graph helps answer:

- Which books support a given interpretation?
- Which concepts are repeated across traditions?
- Where do Western and Vedic systems agree?
- Where do they diverge?
- Which rules are safe enough for user-facing reports?
