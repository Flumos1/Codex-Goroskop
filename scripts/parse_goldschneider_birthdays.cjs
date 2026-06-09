/**
 * Parse OCR text of Goldschneider "Secret Language of Birthdays" and
 * enrich birthday-period-rules.json with day-specific portraits.
 *
 * Input:  data/extracted-text/07-kabbalah-esoteric/Голдшнаи-дер-...-рождения-....txt
 * Output: overwrites generator/rules/birthday-period-rules.json
 *
 * Usage: node scripts/parse_goldschneider_birthdays.cjs [--dry-run] [--stats]
 */
"use strict";
const fs   = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OCR_FILE = path.join(ROOT,
  "data", "extracted-text", "07-kabbalah-esoteric",
  "Голдшнаи-дер-Г-Таи-ныи-язык-дня-рождения-Астролого-психологическии-портрет-каждого-дня-года.txt");
const RULES_FILE = path.join(ROOT, "generator", "rules", "birthday-period-rules.json");

const DRY_RUN = process.argv.includes("--dry-run");
const STATS   = process.argv.includes("--stats");

// ─── Dictionaries ─────────────────────────────────────────────────────────────

// Note: OCR may misread 'Д'→'А', 'Ц'→'П', 'Е'→'В', 'Ь'→'Ь' etc.
const ORDINAL_MAP = {
  "ПЕРВОЕ": 1, "ВТОРОЕ": 2, "ТРЕТЬЕ": 3,
  "ЧЕТВЕРТОЕ": 4, "ЧЕТВЁРТОЕ": 4,
  "ПЯТОЕ": 5,
  "ШЕСТОЕ": 6, "ШВСТОЕ": 6,           // ШВСТОЕ = ШЕСТОЕ (Е→В OCR)
  "СЕДЬМОЕ": 7, "ВОСЬМОЕ": 8, "ДЕВЯТОЕ": 9,
  "ДЕСЯТОЕ": 10,
  "ОДИННАДЦАТОЕ": 11, "ОДИННААДЦАТОЕ": 11, "ОДИННААЦАТОЕ": 11,
  "ДВЕНАДЦАТОЕ": 12, "ДАВЕНАДЦАТОЕ": 12, "АВЕНАДЦАТОЕ": 12,
  "ТРИНАДЦАТОЕ": 13, "ТРИНААЦАТОЕ": 13,
  "ЧЕТЫРНАДЦАТОЕ": 14,
  "ПЯТНАДЦАТОЕ": 15,
  "ШЕСТНАДЦАТОЕ": 16, "ЩЕСТНАДЦАТОЕ": 16,
  "СЕМНАДЦАТОЕ": 17,
  "ВОСЕМНАДЦАТОЕ": 18,
  "ДЕВЯТНАДЦАТОЕ": 19, "АЕВЯТНАДЦАТОЕ": 19,
  "ДВАДЦАТОЕ": 20, "АВАДЦАТОЕ": 20, "АВАДНАТОЕ": 20, "ДАВАДЦАТОЕ": 20,
  "ДВАДЦАТЬ ПЕРВОЕ": 21,  "АВАДЦАТЬ ПЕРВОЕ": 21,  "АВАДПАТЬ ПЕРВОЕ": 21,
  "ДВАДЦАТЬ ВТОРОЕ": 22,  "АВАДЦАТЬ ВТОРОЕ": 22,  "АВАДПАТЬ ВТОРОЕ": 22,
  "ДВАДЦАТЬ ТРЕТЬЕ": 23,  "АВАДЦАТЬ ТРЕТЬЕ": 23,  "АВАДПАТЬ ТРЕТЬЕ": 23,
  "АВАДЦАТЬ ТРЕТЬ": 23,   "ДВАДЦАТЬ ТРЕТЬ": 23,                           // ТРЕТЬЕ→ТРЕТЬ OCR
  "ДВАДЦАТЬ ЧЕТВЕРТОЕ": 24, "ДВАДЦАТЬ ЧЕТВЁРТОЕ": 24,
  "АВАДЦАТЬ ЧЕТВЕРТОЕ": 24, "АВАДЦАТЬ ЧЕТВЁРТОЕ": 24,
  "АВАДПАТЬ ЧЕТВЕРТОЕ": 24, "АВАДПАТЬ ЧЕТВЁРТОЕ": 24,
  "ДВАДЦАТЬ ПЯТОЕ": 25,   "АВАДЦАТЬ ПЯТОЕ": 25,   "АВАДПАТЬ ПЯТОЕ": 25,
  "ДВАДЦАТЬ ШЕСТОЕ": 26,  "АВАДЦАТЬ ШЕСТОЕ": 26,  "АВАДПАТЬ ШЕСТОЕ": 26,
  "ДВАДЦАТЬ ШВСТОЕ": 26,  "АВАДЦАТЬ ШВСТОЕ": 26,                          // ШВСТОЕ variant
  "АВААЦАТЬ ШЕСТОЕ": 26,                                                   // АВААЦАТЬ variant
  "ДВАДЦАТЬ СЕДЬМОЕ": 27, "АВАДЦАТЬ СЕДЬМОЕ": 27, "АВАДПАТЬ СЕДЬМОЕ": 27,
  "ДВАДЦАТЬ ВОСЬМОЕ": 28, "АВАДЦАТЬ ВОСЬМОЕ": 28, "АВАДПАТЬ ВОСЬМОЕ": 28,
  "ДВАДЦАТЬ ДЕВЯТОЕ": 29, "АВАДЦАТЬ ДЕВЯТОЕ": 29, "АВАДПАТЬ ДЕВЯТОЕ": 29,
  "АВААЦАТЬ ДЕВЯТОЕ": 29, "АВАДДЦАТЬ ДЕВЯТОЕ": 29,
  "ТРИДЦАТОЕ": 30,
  "ТРИДЦАТЬ ПЕРВОЕ": 31,
};

const MONTH_MAP = {
  "ЯНВАРЯ": 1, "ФЕВРАЛЯ": 2, "МАРТА": 3, "АПРЕЛЯ": 4,
  "МАЯ": 5, "ИЮНЯ": 6, "ИЮЛЯ": 7, "АВГУСТА": 8,
  "СЕНТЯБРЯ": 9, "ОКТЯБРЯ": 10, "НОЯБРЯ": 11, "ДЕКАБРЯ": 12,
};
const MONTH_PATTERN = new RegExp(`(${Object.keys(MONTH_MAP).join("|")})$`);

// Noise lines (page footers, headers to discard)
const NOISE_RE = /^(ТАЙНЫЙ ЯЗЫК ДНЯ РОЖДЕНИЯ|НАЙДИ СВОЙ ДЕНЬ|ОПИСАНИЕ ЗНАКОВ ЗОДИАКА|ОПИСАНИЕ ЗНАКО|НАЙДИ СВОЙ|——|—{3,}|\d{1,3})\.?$/;

// СОВЕТ
const SOVET_RE = /^СОВЕТ$/;

// Day title: starts with "ДЕНЬ " (or OCR variant "АЕНЬ") in all-caps
const DAY_TITLE_RE = /^[ДА]ЕНЬ\s+[А-ЯЁ].{3,}$/;

// ─── Detect day-header line ────────────────────────────────────────────────

function parseDayHeader(line) {
  // Strip leading/trailing noise chars (.`‚ etc.) before testing
  const trimmed = line.trim().replace(/^[^А-ЯЁ]+/, '').replace(/[.`'"…‚]+$/, '').trim();
  // Must be all-caps Russian + spaces, ending with a month name
  if (!/^[А-ЯЁ\s]{5,}$/.test(trimmed)) return null;
  const monthMatch = MONTH_PATTERN.exec(trimmed);
  if (!monthMatch) return null;
  const month = MONTH_MAP[monthMatch[1]];
  const ordinalPart = trimmed.slice(0, trimmed.length - monthMatch[1].length).trim();
  const day = ORDINAL_MAP[ordinalPart];
  if (!day) return null;
  return { month, day };
}

// ─── Parse full OCR text ───────────────────────────────────────────────────

function parseText(raw) {
  const lines = raw.split(/\r?\n/);
  const entries = []; // { month, day, title, body, sovet }

  let current = null;
  let inSovet = false;
  const buf = [];

  function flushCurrent() {
    if (!current) return;
    const body    = buf.filter(l => !NOISE_RE.test(l) && l.length > 3)
                       .join(" ").replace(/\s+/g, " ").trim();
    entries.push({ ...current, body: body.slice(0, 2000) });
    buf.length = 0;
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const header = parseDayHeader(line);
    if (header) {
      flushCurrent();
      current = { month: header.month, day: header.day, title: "", sovet: "" };
      inSovet = false;
      continue;
    }

    if (!current) continue;  // still in intro section

    if (SOVET_RE.test(line)) { inSovet = true; continue; }

    if (!current.title && DAY_TITLE_RE.test(line)) {
      current.title = line.replace(/^АЕНЬ\s+/, "ДЕНЬ ");
      continue;
    }

    if (NOISE_RE.test(line)) continue;

    if (inSovet) {
      current.sovet += (current.sovet ? " " : "") + line;
    } else {
      buf.push(line);
    }
  }
  flushCurrent();

  return entries;
}

// ─── Enrich rules ─────────────────────────────────────────────────────────

function enrichRules(entries) {
  const rules = JSON.parse(fs.readFileSync(RULES_FILE, "utf8"));
  const ruleMap = new Map(rules.map(r => [`${r.factor.month}:${r.factor.day}`, r]));

  let enriched = 0, notFound = 0;

  for (const e of entries) {
    const rule = ruleMap.get(`${e.month}:${e.day}`);
    if (!rule) { notFound++; continue; }

    const titleShort = e.title
      ? e.title.replace(/^ДЕНЬ\s+/, "").toLowerCase().replace(/^\w/, c => c.toUpperCase())
      : "";

    // simple (EN field) — keep period-level content, add day-level overlay
    rule.simple = rule.simple || {};
    if (e.title) rule.simple.dayTitle = e.title;
    if (e.body.length > 80)  rule.simple.dayPortrait = e.body.slice(0, 800);
    if (e.sovet.length > 20) rule.simple.growth = e.sovet.slice(0, 300);

    // simpleRu — primary Russian output
    rule.simpleRu = rule.simpleRu || {};
    if (e.title) {
      rule.simpleRu.dayTitle      = e.title;
      rule.simpleRu.dayTitleShort = titleShort;
    }
    if (e.body.length > 80)  rule.simpleRu.summary  = e.body.slice(0, 1000);
    if (e.sovet.length > 20) rule.simpleRu.advice    = e.sovet.slice(0, 400);

    rule.confidence = "high";
    rule.status     = "source-verified";
    enriched++;
  }

  console.log(`Enriched: ${enriched} | Not matched: ${notFound} | Entries parsed: ${entries.length}`);
  return rules;
}

// ─── Main ─────────────────────────────────────────────────────────────────

function main() {
  // Allow testing on partial/sample file
  const testSample = path.join(path.dirname(OCR_FILE), "_test_sample.txt");
  const inputFile = (!fs.existsSync(OCR_FILE) || fs.statSync(OCR_FILE).size < 10000)
    ? (fs.existsSync(testSample) ? testSample : null)
    : OCR_FILE;

  if (!inputFile) {
    console.error("OCR file not found or too small. Run scripts/ocr_goldschneider.ps1 first.");
    process.exit(1);
  }

  const bytes = fs.statSync(inputFile).size;
  const isPartial = inputFile === testSample;
  console.log(`Input: ${path.basename(inputFile)} (${(bytes/1024).toFixed(0)} KB)${isPartial ? " [SAMPLE]" : ""}`);

  const raw      = fs.readFileSync(inputFile, "utf8");
  const entries  = parseText(raw);

  const covered = new Set(entries.map(e => `${e.month}:${e.day}`));
  console.log(`Days found: ${covered.size}`);

  if (STATS || isPartial) {
    console.log("\nSample entries:");
    entries.slice(0, 6).forEach(e =>
      console.log(`  ${e.month}/${e.day}: "${e.title}" body=${e.body.length}ch sovet=${e.sovet.length}ch`)
    );

    const missing = [];
    for (let mo = 1; mo <= 12; mo++) {
      const dim = new Date(2000, mo, 0).getDate();
      for (let d = 1; d <= dim; d++) {
        if (!covered.has(`${mo}:${d}`)) missing.push(`${mo}/${d}`);
      }
    }
    if (missing.length) console.log(`Missing days (${missing.length}): ${missing.slice(0,20).join(", ")}${missing.length>20?"...":""}`);
  }

  if (DRY_RUN || isPartial) {
    console.log(isPartial ? "\n[SAMPLE RUN] Not writing rules." : "\n[DRY RUN] Not writing rules.");
    return;
  }

  if (entries.length < 200) {
    console.error(`Only ${entries.length} entries parsed — OCR may be incomplete. Use --dry-run to preview.`);
    process.exit(1);
  }

  const enrichedRules = enrichRules(entries);
  fs.writeFileSync(RULES_FILE, JSON.stringify(enrichedRules, null, 2), "utf8");
  console.log(`\nDone. Rules written: ${RULES_FILE}`);
}

main();
