# Extraction And OCR Review

## Review Date

- 2026-06-05.

## Scope

Full extraction pass over the categorized library after the large source intake.

Command:

```powershell
npm run extract:pdf -- --all
npm run profile:text -- --all
```

## Summary

- Library files: 106.
- Extraction metadata records: 107.
- PDF source records: 105.
- Text-readable PDF records: 18.
- OCR-readable PDF records completed after review: 87.
- OCR-required PDF records remaining: 0.
- OCR running / partial / failed records remaining: 0.

The metadata count is one higher than the library count because an older uncategorized extraction record for Maslennikov still exists alongside the categorized `08-symbolic-systems-and-change-theory` record.

## Category Status

| Category | Records | Text-readable | OCR-readable | OCR required | Notes |
|---|---:|---:|---:|---:|---|
| 01-classical-western | 2 | 1 | 1 | 0 | Complete. |
| 02-psychological-archetypal | 8 | 5 | 3 | 0 | Complete. |
| 03-natal-houses-methods | 15 | 5 | 10 | 0 | Complete. |
| 04-predictive-transits-cycles | 13 | 1 | 12 | 0 | Complete. |
| 05-vedic-jyotish | 17 | 3 | 14 | 0 | Complete. |
| 06-medical-special-topics | 5 | 0 | 5 | 0 | Complete; all medical/special-topic PDFs now OCR-readable. |
| 07-kabbalah-esoteric | 2 | 0 | 2 | 0 | Complete; Goldschneider birthday source and Berg are OCR-readable. |
| 08-symbolic-systems-and-change-theory | 1 | 1 | 0 | 0 | Complete. |
| 09-chinese-eastern-astrology | 5 | 0 | 5 | 0 | Complete; full Davydov set OCR-readable. |
| 10-compatibility-relationships | 4 | 1 | 3 | 0 | Complete. |
| 11-rectification-birth-time | 2 | 0 | 2 | 0 | Complete. |
| 12-applied-esoteric-talismans-calendar | 20 | 0 | 20 | 0 | Complete. |
| 13-special-factors-karma-asteroids-nodes | 11 | 1 | 10 | 0 | Complete. |

## Best Immediate Text-Readable Sources

Priority sources that can be processed without OCR:

- Semira / Vetash - Astrology And Mythology.
- Goldschneider - Complete Horoscope Of Compatibility.
- Abu Mashar - Great Introduction To Astrology.
- Narasimha Rao - Integrated Approach To Vedic Astrology.
- Kolesnikov - Astrology Self-Teacher.
- Greene / Sasportas - Development Of Personality, Volume 1.
- Ushkova / Zakharova - Houses Of The Horoscope.
- Sasportas - Gods Of Change, Volume 1.
- Greene - Jung Studies In Astrology.
- Volokontsev - Secrets Of The Zodiac.
- Agarwal - Vedic Astrology, Volumes 2 and 3.
- Agafonov - Hidden Factors Of The Horoscope.
- Discepolo - Basics Of Medical Astrology.
- Maslennikov - Theory Of Changes.
- Wells - Astrology: Deep Influence.
- Zhuravskaya - Astrological DNA.
- Agafonov - Progressions.

## OCR Priority

Highest-value OCR targets were completed:

1. Goldschneider / Elffers - 48 Karmic Paths.
2. Goldschneider - Love, Family, And Business Relationships.
3. Goldschneider - Astrology Of Success.
4. Agafonov - Rectification.
5. Agafonov - Prognostic Astrology, Volumes 1-5.
6. Levin / Mityaeva / Tishchenko - Symbolic Directions.
7. Davydov Chinese / East Asian set.
8. K. Rao predictive Jyotish set.
9. Semira / Vetash asteroid and name-symbol sources.

## Working Decision

Proceed in two lanes:

1. Extract methodology from OCR-completed sources.
2. Convert reusable source-backed methods into graph nodes and generator rules only after safety review.

## OCR Pipeline Added

Commands:

```powershell
npm run ocr:pdf -- --all
npm run ocr:pdf -- --all --limit 1
npm run ocr:status
```

The OCR script uses:

- Tesseract `rus+eng`;
- ImageMagick / Ghostscript for PDF page rendering;
- page-level cache in `data/ocr-page-cache`;
- run status files in `data/ocr-runs`.

Completed OCR:

- Full categorized PDF library: 105/105 PDF records readable.
- OCR-readable records: 87.
- Pre-existing text-readable PDF records: 18.
- Remaining OCR required/running/partial/failed: 0.
- Source profiles created/updated for OCR-completed sources.
