# Current State

## Project Foundation

The project now has:

- Source library with categorized books.
- Chinese / East Asian astrology source intake.
- Compatibility / relationships source intake and architecture.
- Primary-wave / overlay architecture for source-only and stereo reports.
- Large Western, Vedic, rectification, applied-esoteric, and special-factor source intake.
- Extraction/OCR review over the categorized source library.
- PDF extraction, OCR, and profiling tools.
- Source notes/profiles for key Western, house, Vedic, compatibility, Chinese / East Asian, Kabbalistic, applied-esoteric, and special-factor sources; detailed methodology notes are still pending for many OCR-completed sources.
- Intake notes for applied Vedic timing and Western synthesis.
- Western and Vedic knowledge-base folders.
- JSONL knowledge graph.
- Rule-based generator prototype.
- Composite report support.
- Report profile support.
- Prototype chart calculation support.
- Local place registry for prototype timezone and coordinate lookup.
- Prototype house-system selection.
- Calculation fixture validation.
- Reference-chart verification harness with four external references and candidate baselines.
- Rule source trace command.
- Project validation command.
- First-level local module showcase with full-screen motion scene and entry cards for Vedic, Western, Jewish/Kabbalistic, compatibility, numerology, and forecasting branches.
- Second-level Western astrology page for chart input, chart wheel, aspects, dispositor chains, and report display.
- Separate local Vedic / Jyotish page with sidereal prototype, Lagna, Moon nakshatra, Vimshottari period theme, and human-language prediction text.
- Separate local compatibility page with two-person input, relationship context selection, synastry aspects, multi-axis interpretation, bold hypotheses, deep research notes, and communication forecast.
- Separate local Jewish / Kabbalistic page with Berg-inspired month/sign layer, tikkun, name/date number overlays, bold hypotheses, and practical light-oriented prompts.
- Separate local graphs / biorhythms page with seven forecast curves for body, emotions, mind, love, business, intuition, and integrated luck, plus human-readable current-period notes.
- Completed OCR pipeline pass with Tesseract / ImageMagick / Ghostscript and page-level resume cache.
- Goldschneider birthday-personology primary-wave notes and source-only report schema.
- Custom Codex skill: `codex-goroskop-research`.

## Current Counts

- Graph nodes: 144.
- Graph edges: 132.
- Generator rules: 17.
- Report profiles: 11.
- Source extraction metadata records: 107.
- Source profiles: 105.
- PDF source records: 105.
- Text-readable PDF records: 18.
- OCR-readable PDF records: 87.
- OCR-required PDF records remaining: 0.

## Main Commands

Run from `G:\Codex Goroskop`:

```powershell
npm run validate
npm run validate:calculations
npm run verify:references
npm run verify:references:strict
npm run trace:rule -- --query "Moon square Saturn"
npm run extract:pdf -- --all
npm run ocr:pdf -- --all
npm run ocr:status
npm run profile:text -- --all
npm run calculate -- --local-date "1990-04-10" --local-time "15:00" --place-key chisinau-md --name "Demo User" --out local-time-demo-profile.json
npm run calculate -- --local-date "1990-04-10" --local-time "08:30" --place-key chisinau-md --name "House Rules Demo" --out house-rules-demo-profile.json
npm run calculate -- --local-date "1990-04-10" --local-time "08:30" --place-key chisinau-md --house-system whole-sign --name "Whole Sign Demo" --out whole-sign-demo-profile.json
npm run calculate -- --datetime "1990-04-10T12:00:00Z" --name "Demo User" --place "Chisinau, Moldova" --lat 47.0105 --lon 28.8638 --out calculated-match-profile.json
npm run generate -- --list
npm run generate -- --profile generator/profiles/house-rules-demo-profile.json --out house-rules-demo-report.md
npm run generate -- --profile generator/profiles/local-time-demo-profile.json --out local-time-demo-report.md
npm run generate -- --profile generator/profiles/calculated-match-profile.json --out calculated-match-report.md
npm run generate -- --profile generator/profiles/demo-profile.json
npm run generate -- --queries "Moon square Saturn; Saturn in 7th house" --mode both
```

## Current Generator Capability

The generator can:

- List available rules.
- Generate a single-factor report.
- Generate a composite report from multiple queries or rule IDs.
- Generate a profile-based report.
- Calculate a prototype Western tropical profile from UTC birth data.
- Calculate from local date/time when a known place key or explicit timezone is available.
- Calculate a prototype Ascendant.
- Calculate Descendant, Midheaven, and Imum Coeli.
- Assign Equal Houses from the Ascendant.
- Assign Whole Sign houses from the Ascendant sign.
- Match planet-in-house factors to available generator rules.
- Match calculated major aspects to available generator rules.
- Calculate traditional or modern dispositor chains for a calculated profile.
- Validate deterministic calculation fixtures.
- Verify four external reference charts and candidate baselines with explicit source/status metadata.
- Trace generator rules back to sources and graph links.
- Render simple, advanced, or both report modes.
- Write reports to `generator/outputs`.
- Serve a local browser prototype with a first-level module showcase plus second-level Western profile form, SVG chart wheel, aspect list, dispositor view, and generated report.
- Serve a separate Vedic prototype page that keeps Jyotish separate from Western interpretation and uses non-fatalistic period language.
- Serve a compatibility prototype for romantic, friendship, business, family, coworker, parent-child, and general communication contexts.
- Serve a Jewish / Kabbalistic prototype that keeps the esoteric layer labeled and separate from Western, Jyotish, and birthday-personology reports.
- Serve a graphs / biorhythms prototype that combines natal-chart seed values with cyclical forecast curves and explanatory cards for planning attention across seven life areas.
- Design-level support for future birthday source-only and stereo overlay report modes.

## Current Limitations

- Chart calculation is prototype-only.
- Current reference coverage includes four external Ascendant/planet-position checks plus internal candidate baselines.
- Timezone handling currently depends on explicit IANA timezone or `data/places.json`.
- Place lookup is a small local registry, not external geocoding.
- House calculation currently supports prototype Equal Houses and Whole Sign only.
- No Placidus, Koch, Regiomontanus, or Vedic bhava systems yet.
- No Vedic sidereal calculation yet.
- Vedic branch has a first sidereal prototype using approximate Lahiri ayanamsa, Lagna reference, Moon nakshatra, and a high-level Vimshottari mahadasha theme. It still needs professional-grade ayanamsa verification, Rahu/Ketu placement, vargas, strength logic, antardasha, and source-expanded interpretations.
- Vedic branch now has framework plus source-backed generator rules for functional roles, dasha context, and sensitive bhava safety; detailed graha/rashi/bhava interpretations are still pending.
- Chinese / East Asian branch has source intake and OCR-completed Davydov texts; methodology extraction is pending.
- Birthday-personology primary-wave source has been added; Goldschneider's `Тайный язык дня рождения` OCR is complete and detailed source notes are pending.
- Compatibility domain has one extracted Goldschneider source and three OCR-completed Goldschneider sources.
- New Agafonov, Levin, Mazova, K. Rao, Semira/Vetash, and Sushchinskaya source families have been sorted into the library; extraction/OCR review and OCR pass are complete.
- Berg's Kabbalistic source is OCR-readable.
- Jewish / Kabbalistic branch is a first symbolic prototype only: exact Hebrew calendar sunset handling, Hebrew-letter gematria, detailed month source extraction, and religious-tradition review are still pending.
- Graphs / biorhythms branch is a planning prototype only: the seven curves are symbolic astrological and biorhythmic indicators, not medical diagnosis, financial advice, or event guarantees.
- Full OCR sweep is complete: all 105 PDF source records are readable, with no `ocrRequired`, `running`, `partial`, or `failed` records remaining.
- Web UI is a local prototype only; it is not production-deployed and still uses the prototype calculation layer.

## Recommended Next Steps

1. Extend the chart calculation layer:
   - add geocoding;
   - add more externally verified Ascendant/house values;
   - add configurable house systems;
   - decide production ephemeris strategy;
   - add Vedic sidereal handling.

2. Expand generator rules:
   - more planet-in-house rules;
   - more aspect rules;
   - first Vedic graha/bhava rules.

3. Improve the site prototype:
   - add saved profile management;
   - add richer chart controls;
   - add richer Vedic/Jyotish controls and antardasha support;
   - add stronger browser-based UI tests.

4. Convert OCR-completed sources into methodology notes:
   - start with birthday personology / compatibility;
   - then Chinese / East Asian astrology;
   - then Vedic timing and special-factor overlays;
   - update source reviews and graph links as reusable methods are extracted.

5. Add graph querying:
   - source trace by rule;
   - missing source checks;
   - contradiction checks.
