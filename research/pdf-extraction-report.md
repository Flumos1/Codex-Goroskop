# PDF Extraction Report

## Summary

PDF extraction tooling is now active.

- Total PDFs processed: 17.
- Text extraction successful: 14.
- OCR or manual review required: 3.

## Tooling

- Extract PDF text: `npm run extract:pdf -- --all`
- Extract one PDF: `npm run extract:pdf -- --file "path/to/book.pdf"`
- Profile extracted text: `npm run profile:text -- --all`
- Seed knowledge graph: `npm run graph:seed`

## Ready For Text Analysis

| Category | Source | Pages | Characters |
|---|---|---:|---:|
| classical-western | Абу Машар - Большое введение в Астрологию - 2022 | 618 | 1505060 |
| psychological-archetypal | Грин Лиз - Исследования Юнга в области астрологии - 2022 | 292 | 578822 |
| psychological-archetypal | Грин Лиз, Саспортас Говард - Развитие Личности. Том 1 - 2025 | 300 | 757286 |
| psychological-archetypal | Саспортас Г. - Боги перемен; Уран, Нептун, Плутон. Том 1 - 2023 | 302 | 598310 |
| psychological-archetypal | Саспортас Г. - Боги перемен; Уран, Нептун, Плутон. Том 2 - 2023 | 214 | 421445 |
| natal-houses-methods | Волоконцев Евгений - Тайны Зодиака - 2024 | 341 | 478909 |
| natal-houses-methods | Вэлс Мартин - Астрология. Глубинное влияние звезд, планет и созвездий - 2021 | 194 | 287357 |
| natal-houses-methods | Журавская Анжелика - Астрологическая ДНК - 2023 | 208 | 263351 |
| natal-houses-methods | Колесников A. - Астрология. Самоучитель - 2018 | 314 | 765343 |
| natal-houses-methods | Ушкова Е. М., Захарова С. В. - Дома гороскопа. Жизненный путь - 2023 | 546 | 607918 |
| vedic-jyotish | Агарвал Г.С. - Ведическая астрология. Том 2 - 2017 | 342 | 468462 |
| vedic-jyotish | Агарвал Г.С. - Ведическая астрология. Том 3 - 2017 | 284 | 381042 |
| vedic-jyotish | Рао Нарасимха - Интегральный подход к Ведической астрологии - 2023 | 484 | 797995 |
| medical-special-topics | Дишеполо Чиро - Основы медицинской астрологии - 2013 | 322 | 409472 |

## Requires OCR

These PDFs returned zero text characters:

| Category | Source | Pages | Next Step |
|---|---|---:|---|
| classical-western | Павел Александрийский - Начала астрологии - 1997 | 112 | OCR or manual review |
| predictive-transits-cycles | Блект Рами - Волшебный ключ к 12 домам судьбы - 2013 | 401 | OCR or manual review |
| vedic-jyotish | МШВА Рами - Накшатры. Жизнь под счастливой звездой - 2014 | 324 | OCR or manual review |

## Next Research Pipeline

1. Review source profiles in `research/source-profiles/`.
2. Select one source per branch for deep analysis:
   - Western: `Грин Лиз, Саспортас Говард - Развитие Личности. Том 1`.
   - Natal methods: `Ушкова Е. М., Захарова С. В. - Дома гороскопа`.
   - Vedic: `Рао Нарасимха - Интегральный подход к Ведической астрологии`.
3. Extract chapter-level notes.
4. Convert stable concepts into knowledge-base files.
5. Convert relationships into graph nodes and edges.
6. Keep contradictions as explicit graph edges instead of hiding them.
