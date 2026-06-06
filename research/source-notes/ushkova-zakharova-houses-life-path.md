# Source Notes: Ushkova / Zakharova - Houses Of The Horoscope

## Source

- Title: Дома гороскопа. Жизненный путь.
- Authors: Ушкова Е. М., Захарова С. В.
- Category: natal-houses-methods.
- Project priority: 1.
- Extraction status: text extracted.
- Pages: 546.
- Text characters: 607918.

## Project Role

This source is useful for building the natal house layer of the project.

It is especially useful for:

- Defining houses as life spheres where natal potential becomes visible.
- Separating house cusp, house ruler, and planets in the house.
- Reading house axes as paired life themes.
- Creating practical report sections by life area.
- Building user exercises and reflective prompts.

## Core Structural Ideas

### 1. House As Life Sphere

The source treats houses as areas where a person's potential, character, resources, and life programs become concrete.

Generator use:

- A planet describes an actor or function.
- A sign describes style and quality.
- A house describes where the function becomes visible in life.

### 2. Four Angles

The source defines four main points:

- Ascendant: cusp of the 1st house.
- IC / Nadir: cusp of the 4th house.
- Descendant: cusp of the 7th house.
- MC / Midheaven: cusp of the 10th house.

Project use:

- These are high-priority chart anchors.
- They should be used in advanced explanations.
- Birth time accuracy is critical for them.

### 3. Cusp, Ruler, Planet In House

The source gives a practical interpretive hierarchy:

- House cusp: style and starting condition of the life area.
- House ruler: where the life area is delegated or routed.
- Planets in the house: active forces living inside that area.

Generator use:

1. Identify the house topic.
2. Read the sign on the cusp as the style of approaching the topic.
3. Read the ruler's house as where the topic seeks expression.
4. Read planets in the house as strong active factors.
5. If the house is empty, still interpret it through cusp and ruler.

### 4. Empty Houses Still Matter

The source explicitly warns against treating empty houses as absent life areas.

Generator rule:

- Never tell the user that an empty house means "nothing happens there".
- Use ruler and cusp to interpret empty houses.

### 5. House Axes

The source frames opposite houses as paired axes:

- 1 / 7: personality, initiative, relationship.
- 2 / 8: personal resources and shared resources.
- 3 / 9: learning, information exchange, close and distant environments.
- 4 / 10: roots, home, social growth, achievements.
- 5 / 11: creativity, attraction, freedom, groups, future plans.
- 6 / 12: material and non-material service.

Generator use:

- When one house is emphasized, check its opposite house for balance.
- Render axes as life polarities rather than isolated topics.

## House Meanings For MVP

| House | Core Life Area | Psychological Question | Generator Caution |
|---|---|---|---|
| 1 | Self-presentation, first reaction, body, beginning | How do I enter life and new situations? | Requires accurate birth time. |
| 2 | Resources, money, values, energy intake | What do I rely on and value? | Avoid financial guarantees. |
| 3 | Learning, information, close environment, siblings/neighbors | How do I learn, speak, and move through my near world? | Avoid simplistic sibling claims. |
| 4 | Home, roots, family base, tradition, inner foundation | What gives me a root system? | Avoid definite family-event claims. |
| 5 | Creativity, joy, attraction, children, personal expression | What awakens vitality and creative pleasure? | Avoid pregnancy guarantees. |
| 6 | Work, service, routine, health habits, chosen labor | How do I serve, maintain, and improve daily life? | No medical diagnosis. |
| 7 | Partnership, marriage, others, complementary traits | What do I seek through another person? | Avoid deterministic relationship claims. |
| 8 | Crisis, transformation, shared resources, inheritance, fear | How do I meet depth, dependence, risk, and change? | Avoid death prediction and fear language. |
| 9 | Higher education, worldview, distant environment, meaning | What expands my horizon and worldview? | Avoid dogmatic claims. |
| 10 | Career, public role, status, social goals | How do I become visible in society? | Avoid guaranteed career success. |
| 11 | Friends, groups, plans, collective creativity | What future do I build with others? | Avoid popularity guarantees. |
| 12 | Isolation, hidden service, institutions, retreat, spiritual service | What is served beyond ego and visibility? | Avoid imprisonment/hospital fatalism. |

## Generator Rules Extracted

### Rule: House Topic Layer

Every placement in a house should include:

- Life area.
- Psychological question.
- Possible constructive expression.
- Safety caution if the house touches health, death, money, children, marriage, or institutions.

### Rule: Cusp-Ruler-Resident Pipeline

For a house-focused interpretation:

1. House number gives the topic.
2. Cusp sign gives style.
3. Ruler shows where the topic is routed.
4. Planets in the house show active forces.
5. Empty houses are read through cusp and ruler.

### Rule: Axis Balancing

If interpreting a house, identify its opposite house as a balancing theme.

Example:

- 1st house emphasis should be balanced with 7th house relational awareness.
- 10th house emphasis should be balanced with 4th house roots and inner foundation.

## Graph Targets

New concepts:

- `western.house.1` through `western.house.12`
- `rule.western.house-topic-layer`
- `rule.western.cusp-ruler-resident-pipeline`
- `rule.western.house-axis-balancing`
- `theme.self-presentation`
- `theme.resources`
- `theme.close-environment`
- `theme.roots`
- `theme.creativity`
- `theme.service`
- `theme.partnership`
- `theme.transformation-crisis`
- `theme.worldview`
- `theme.public-role`
- `theme.groups-future`
- `theme.retreat-hidden-service`

## First Generator Example

Input factor:

- Saturn in the 7th house.

Simple explanation:

Partnership may be an area where you learn seriousness, patience, boundaries, and emotional maturity. Relationships may not feel light or casual; they may ask you to define commitment, responsibility, and the kind of bond that can endure pressure. The growth task is to avoid turning caution into isolation, and instead build agreements that are honest, stable, and mutual.

Advanced explanation:

The 7th house is read as the field of partnership and the encounter with the other. Saturn in this house brings the archetype of limit, commitment, duty, fear, and maturation into relational life. This should not be read as a fixed prediction of loneliness or difficult marriage. It is better treated as a symbolic indication that relationship becomes a serious developmental arena.
