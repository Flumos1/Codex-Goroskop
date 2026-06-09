/**
 * Parse Berg "Kabbalistic Astrology" OCR text and generate sign-based rules.
 * Extracts: description, tikkun (correction), monthly influence for each zodiac sign.
 *
 * Input:  data/extracted-text/07-kabbalah-esoteric/Берг-Р-...txt
 * Output: generator/rules/kabbalah-sign-rules.json
 *
 * Usage: node scripts/parse_berg_kabbalah.cjs [--dry-run] [--stats]
 */
"use strict";
const fs   = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OCR_FILE = path.join(ROOT,
  "data", "extracted-text", "07-kabbalah-esoteric",
  "Берг-Р-Каббалистическая-астрология-и-смысл-нашеи-жизни-Каббала-2011.txt");
const OUT_FILE = path.join(ROOT, "generator", "rules", "kabbalah-sign-rules.json");

const DRY_RUN = process.argv.includes("--dry-run");
const STATS   = process.argv.includes("--stats");

// Hebrew month → zodiac mapping
const MONTH_TO_SIGN = {
  "НИСАН":       { sign: "Aries",       signRu: "Овен",      num: 1 },
  "ИЯР":         { sign: "Taurus",      signRu: "Телец",     num: 2 },
  "СИВАН":       { sign: "Gemini",      signRu: "Близнецы",  num: 3 },
  "ТАММУЗ":      { sign: "Cancer",      signRu: "Рак",       num: 4 },
  "АВ":          { sign: "Leo",         signRu: "Лев",       num: 5 },
  "ЭЛЮЛЬ":       { sign: "Virgo",       signRu: "Дева",      num: 6 },
  "ТИШРЕЙ":      { sign: "Libra",       signRu: "Весы",      num: 7 },
  "МАР-ХЕШВАН":  { sign: "Scorpio",     signRu: "Скорпион",  num: 8 },
  "ХЕШВАН":      { sign: "Scorpio",     signRu: "Скорпион",  num: 8 },
  "КИСЛЕВ":      { sign: "Sagittarius", signRu: "Стрелец",   num: 9 },
  "ТЕВЕТ":       { sign: "Capricorn",   signRu: "Козерог",   num: 10 },
  "ШВАТ":        { sign: "Aquarius",    signRu: "Водолей",   num: 11 },
  "АДАР":        { sign: "Pisces",      signRu: "Рыбы",      num: 12 },
};

// Noise patterns (page headers/footers)
const NOISE_RE = /^(РАСКРЫВАЕМ КОД ДУШИ|Каббалистическая астрология|\d{1,3}|[*^])\.?$/;

// Section markers
const MONTH_RE    = /^МЕСЯЦ\s+([А-ЯЁ\-]+)$/;
const SIGN_RE     = /^\(([А-ЯЁ]+)\)$/;
const TIKKUN_RE   = /^ЕСЛИ ВАШ ТИККУН/;
const TIKKUN2_RE  = /^\(ИСПРАВЛЕНИЕ\)/;
const INFLUENCE_RE = /^ВЛИЯНИЕ ЭТОГО МЕСЯЦА/;

function parseText(raw) {
  const lines = raw.split(/\r?\n/);
  const sections = []; // { hebrewMonth, sign, signRu, description, tikkun, influence }

  let current = null;
  let mode = "desc"; // desc | tikkun | influence | post

  function flush() {
    if (!current) return;
    sections.push({
      ...current,
      description: current._desc.filter(l => l.length > 3).join(" ").replace(/\s+/g, " ").trim(),
      tikkun:      current._tik.filter(l => l.length > 3).join(" ").replace(/\s+/g, " ").trim(),
      influence:   current._inf.filter(l => l.length > 3).join(" ").replace(/\s+/g, " ").trim(),
    });
    current = null;
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (NOISE_RE.test(line)) continue;

    const mMonth = MONTH_RE.exec(line);
    if (mMonth) {
      flush();
      const hebrewMonth = mMonth[1];
      const info = MONTH_TO_SIGN[hebrewMonth];
      if (!info) continue; // skip unknown months
      current = { hebrewMonth, ...info, _desc: [], _tik: [], _inf: [] };
      mode = "desc";
      continue;
    }

    if (!current) continue;

    // Sign label (e.g. "(ОВЕН)") — skip, already know sign
    if (SIGN_RE.test(line)) continue;

    if (TIKKUN_RE.test(line) || TIKKUN2_RE.test(line)) {
      mode = "tikkun";
      continue;
    }
    if (INFLUENCE_RE.test(line)) {
      mode = "influence";
      continue;
    }

    // Skip "НА ВСЕХ НАС:" continuation of influence header
    if (line === "НА ВСЕХ НАС:" || line.startsWith("НА ВСЕХ НАС")) {
      mode = "influence";
      continue;
    }

    // Subtitle lines (all-caps short headings inside sections) — skip
    if (/^[А-ЯЁ\s]{4,40}:$/.test(line)) continue;

    if (mode === "desc")      current._desc.push(line);
    else if (mode === "tikkun")    current._tik.push(line);
    else if (mode === "influence") current._inf.push(line);
  }
  flush();

  return sections;
}

function generateRules(sections) {
  const rules = [];

  for (const s of sections) {
    const id = `kabbalah_sun_${s.sign.toLowerCase()}`;

    // Main description (truncate to 1200 chars)
    const descRu = s.description.slice(0, 1200);
    // Tikkun — spiritual correction
    const tikRu  = s.tikkun.slice(0, 600);
    // Monthly influence (for everyone)
    const infRu  = s.influence.slice(0, 400);

    // Short summary: first 2 sentences of description
    const sentenceBreak = descRu.match(/^(.+?[.!?])(.+?[.!?])/s);
    const summaryRu = sentenceBreak
      ? (sentenceBreak[1].trim() + " " + sentenceBreak[2].trim()).slice(0, 250)
      : descRu.slice(0, 250);

    rules.push({
      id,
      type: "kabbalah",
      factor: {
        kabbalahPlanet: "Sun",
        sign: s.sign,
        signNum: s.num,
        hebrewMonth: s.hebrewMonth,
      },
      significance: 65,
      simple: {
        title: `Sun in ${s.sign} — Kabbalistic (${s.hebrewMonth})`,
        description: s.description.slice(0, 800),
        tikkun: s.tikkun.slice(0, 500),
        monthlyInfluence: s.influence.slice(0, 300),
      },
      simpleRu: {
        title: `Солнце в ${s.signRu} — Каббала (Месяц ${s.hebrewMonth})`,
        summary: summaryRu,
        description: descRu,
        tikkun: tikRu,
        tikkunTitle: `Тиккун в ${s.signRu}`,
        monthlyInfluence: infRu,
      },
      source: "Берг Р. — Каббалистическая астрология, 2011",
      confidence: "high",
      status: "source-verified",
    });
  }

  // Sort by sign number
  rules.sort((a, b) => a.factor.signNum - b.factor.signNum);
  return rules;
}

function main() {
  if (!fs.existsSync(OCR_FILE) || fs.statSync(OCR_FILE).size < 50000) {
    console.error("Berg OCR file not found or too small. Run OCR first.");
    process.exit(1);
  }

  const bytes = fs.statSync(OCR_FILE).size;
  console.log(`Input: ${path.basename(OCR_FILE)} (${(bytes/1024).toFixed(0)} KB)`);

  const raw      = fs.readFileSync(OCR_FILE, "utf8");
  const sections = parseText(raw);

  console.log(`Sections parsed: ${sections.length}`);

  if (STATS || DRY_RUN) {
    for (const s of sections) {
      console.log(`\n[${s.hebrewMonth} → ${s.signRu}]`);
      console.log(`  desc:      ${s.description.length} chars — "${s.description.slice(0,80)}..."`);
      console.log(`  tikkun:    ${s.tikkun.length} chars — "${s.tikkun.slice(0,80)}..."`);
      console.log(`  influence: ${s.influence.length} chars — "${s.influence.slice(0,80)}..."`);
    }
    if (DRY_RUN) { console.log("\n[DRY RUN] Not writing."); return; }
  }

  if (sections.length < 10) {
    console.error(`Only ${sections.length} sections — check parsing.`);
    process.exit(1);
  }

  const rules = generateRules(sections);
  fs.writeFileSync(OUT_FILE, JSON.stringify(rules, null, 2), "utf8");
  console.log(`\nDone. Written: ${rules.length} rules → ${OUT_FILE}`);
}

main();
