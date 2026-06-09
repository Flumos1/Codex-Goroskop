/**
 * Parse Davydov "Kitaisky Goroskop" OCR text and generate Chinese zodiac rules.
 * Extracts energy characterisitcs for each of 12 animals from the
 * "ХАРАКТЕРИСТИКИ ПО ЗНАКУ РОЖДЕНИЯ" section.
 *
 * Input:  data/extracted-text/09-chinese-eastern-astrology/Давыдов-М-Китаи-скии-Гороскоп-2011.txt
 * Output: generator/rules/chinese-zodiac-rules.json
 *
 * Usage: node scripts/parse_davydov_chinese.cjs [--dry-run] [--stats]
 */
"use strict";
const fs   = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OCR_FILE = path.join(ROOT,
  "data", "extracted-text", "09-chinese-eastern-astrology",
  "Давыдов-М-Китаи-скии-Гороскоп-2011.txt");
const OUT_FILE = path.join(ROOT, "generator", "rules", "chinese-zodiac-rules.json");

const DRY_RUN = process.argv.includes("--dry-run");
const STATS   = process.argv.includes("--stats");

// 12 Chinese zodiac animals — Russian names as they appear in the text
// Ordered by traditional Chinese cycle (Rat=1)
const ANIMALS = [
  { ru: "Мыши",      ruNom: "Мышь",      en: "Rat",     num: 1, element: "Water", yin: false },
  { ru: "Вола",      ruNom: "Вол",        en: "Ox",      num: 2, element: "Earth", yin: true  },
  { ru: "Тигра",     ruNom: "Тигр",       en: "Tiger",   num: 3, element: "Wood",  yin: false },
  { ru: "Зайца",     ruNom: "Заяц",       en: "Rabbit",  num: 4, element: "Wood",  yin: true  },
  { ru: "Дракона",   ruNom: "Дракон",     en: "Dragon",  num: 5, element: "Earth", yin: false },
  { ru: "Змеи",      ruNom: "Змея",       en: "Snake",   num: 6, element: "Fire",  yin: true  },
  { ru: "Лошади",    ruNom: "Лошадь",     en: "Horse",   num: 7, element: "Fire",  yin: false },
  { ru: "Овцы",      ruNom: "Овца",       en: "Goat",    num: 8, element: "Earth", yin: true  },
  { ru: "Обезьяны",  ruNom: "Обезьяна",   en: "Monkey",  num: 9, element: "Metal", yin: false },
  { ru: "Петуха",    ruNom: "Петух",       en: "Rooster", num: 10, element: "Metal", yin: true },
  { ru: "Собаки",    ruNom: "Собака",      en: "Dog",     num: 11, element: "Earth", yin: false },
  { ru: "Кабана",    ruNom: "Кабан",       en: "Pig",     num: 12, element: "Water", yin: true  },
];

// Noise patterns
const NOISE_RE = /^(М\.|м\.|Рав|Раб|Ров|Равзаоб|Ров?ядов|Равядов|Кит[аА]й|[КкM][иИ][тТ][аА]|Ки[тТ]|М\s+Р|УДК|ИСБ|ISBN|[0-9]{1,3}\s*=?$|\d{1,3}$|[a-zA-Z]{2,})/;

// Section start marker
const SECTION_START_RE = /ХАРАКТЕРИСТИКИ ПО ЗНАКУ РОЖДЕНИЯ/;
// Section end marker (next chapter)
const SECTION_END_RE = /^Глава\s+\d|^ГЛАВА\s+\d|МЕДИЦИНСКАЯ АСТРОЛОГИЯ|«КНИГИ ПЕРЕМЕН»/;
// Individual animal marker: "Знак Мыши." or "Знак Вола." at start of line
function makeAnimalRE(ruGenitive) {
  return new RegExp(`^Знак ${ruGenitive}\\.`);
}

function parseText(raw) {
  const lines = raw.split(/\r?\n/);
  const results = []; // { en, ru, ruNom, num, element, body }

  // Find section start
  let inSection = false;
  let currentAnimal = null;
  let buf = [];

  function flushAnimal() {
    if (!currentAnimal) return;
    const text = buf
      .filter(l => l.trim().length > 3 && !NOISE_RE.test(l.trim()))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    results.push({ ...currentAnimal, body: text });
    buf = [];
    currentAnimal = null;
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (!inSection) {
      if (SECTION_START_RE.test(line)) { inSection = true; }
      continue;
    }

    if (SECTION_END_RE.test(line)) {
      flushAnimal();
      break;
    }

    // Check if line starts a new animal
    let matched = null;
    for (const animal of ANIMALS) {
      if (makeAnimalRE(animal.ru).test(line)) {
        matched = animal;
        break;
      }
    }
    if (matched) {
      flushAnimal();
      currentAnimal = { ...matched };
      // Include the first line in the buffer (after "Знак X. ")
      const afterLabel = line.replace(new RegExp(`^Знак ${matched.ru}\\.\\s*`), "");
      if (afterLabel.length > 2) buf.push(afterLabel);
      continue;
    }

    if (currentAnimal) buf.push(line);
  }
  flushAnimal();

  return results;
}

function generateRules(sections) {
  const rules = [];

  for (const s of sections) {
    const id = `chinese_zodiac_${s.en.toLowerCase()}`;
    const descRu = s.body.slice(0, 1200);

    // Summary: first 2 sentences
    const twoSent = descRu.match(/^(.{20,}?[.!?])(.{20,}?[.!?])/s);
    const summaryRu = twoSent
      ? (twoSent[1].trim() + " " + twoSent[2].trim()).slice(0, 280)
      : descRu.slice(0, 280);

    rules.push({
      id,
      type: "chinese-zodiac",
      factor: {
        chineseAnimal: s.en,
        animalNum: s.num,
        element: s.element,
        yin: s.yin,
      },
      significance: 60,
      simple: {
        title: `Year of the ${s.en} — Chinese Zodiac`,
        description: s.body.slice(0, 800),
      },
      simpleRu: {
        title: `Год ${s.ruNom} — Китайский зодиак`,
        animalRu: s.ruNom,
        animalRuGen: s.ru,
        element: s.element,
        summary: summaryRu,
        description: descRu,
      },
      source: "Давыдов М. — Китайский Гороскоп, 2011",
      confidence: "high",
      status: "source-verified",
    });
  }

  rules.sort((a, b) => a.factor.animalNum - b.factor.animalNum);
  return rules;
}

function main() {
  if (!fs.existsSync(OCR_FILE) || fs.statSync(OCR_FILE).size < 100000) {
    console.error("OCR file not found or too small.");
    process.exit(1);
  }

  const bytes = fs.statSync(OCR_FILE).size;
  console.log(`Input: ${path.basename(OCR_FILE)} (${(bytes/1024).toFixed(0)} KB)`);

  const raw      = fs.readFileSync(OCR_FILE, "utf8");
  const sections = parseText(raw);

  console.log(`Animals parsed: ${sections.length}`);

  if (STATS || DRY_RUN) {
    for (const s of sections) {
      console.log(`\n[${s.ruNom} / ${s.en}]`);
      console.log(`  body: ${s.body.length} chars`);
      console.log(`  "${s.body.slice(0, 100)}..."`);
    }
    if (DRY_RUN) { console.log("\n[DRY RUN] Not writing."); return; }
  }

  if (sections.length < 10) {
    console.error(`Only ${sections.length} animals parsed — check parser.`);
    process.exit(1);
  }

  const rules = generateRules(sections);
  fs.writeFileSync(OUT_FILE, JSON.stringify(rules, null, 2), "utf8");
  console.log(`\nDone. Written: ${rules.length} rules → ${OUT_FILE}`);
}

main();
