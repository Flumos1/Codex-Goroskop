# Knowledge Graph

The knowledge graph stores astrology knowledge as nodes and edges.

It is designed to support both research and generation:

- Research can trace every concept back to source families and books.
- The generator can combine related concepts in a structured way.
- Advanced reports can explain why an interpretation was produced.

## Files

- `nodes.jsonl`: one JSON object per concept, source, rule, or caution.
- `edges.jsonl`: one JSON object per relationship between nodes.
- `schema.md`: graph schema and relation types.

## Core Idea

Examples:

- Source node: `source:greene-sasportas-development-personality-v1`
- Concept node: `western.planet.saturn`
- Concept node: `psychology.boundary`
- Edge: Saturn `symbolizes` boundary.
- Edge: A book `supports` that symbolic reading.

The graph should never erase uncertainty. Conflicting interpretations can coexist as separate edges with source notes and confidence labels.
