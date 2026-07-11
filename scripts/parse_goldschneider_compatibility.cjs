"use strict";
const fs   = require("fs");
const path = require("path");

const SRC = path.resolve(__dirname, "../data/extracted-text/10-compatibility-relationships/Голдшнаи-дер-Г-Полныи-гороскоп-совместимости-Таи-ные-знания-2017.txt");
const OUT = path.resolve(__dirname, "../generator/rules/compatibility-rules.json");

// ─── 48 Periods ──────────────────────────────────────────────────────────────
const PERIODS = [
  { id:"CuspPiscesAries",           ruShort:"Куспит Рыбы—Овен",          ruWeek:"Узел Возрождения",           start:[3,19],end:[3,24] },
  { id:"AriesI",                    ruShort:"Овен I",                     ruWeek:"Неделя Ребенка",             start:[3,25],end:[4,2]  },
  { id:"AriesII",                   ruShort:"Овен II",                    ruWeek:"Неделя Звезды",              start:[4,3], end:[4,10] },
  { id:"AriesIII",                  ruShort:"Овен III",                   ruWeek:"Неделя Первопроходца",       start:[4,11],end:[4,18] },
  { id:"CuspAriesTaurus",           ruShort:"Куспит Овен—Телец",          ruWeek:"Узел Силы",                  start:[4,19],end:[4,24] },
  { id:"TaurusI",                   ruShort:"Телец I",                    ruWeek:"Неделя Манифестации",        start:[4,25],end:[5,2]  },
  { id:"TaurusII",                  ruShort:"Телец II",                   ruWeek:"Неделя Учителя",             start:[5,3], end:[5,10] },
  { id:"TaurusIII",                 ruShort:"Телец III",                  ruWeek:"Неделя Естественного",       start:[5,11],end:[5,18] },
  { id:"CuspTaurusGemini",          ruShort:"Куспит Телец—Близнецы",      ruWeek:"Узел Энергии",               start:[5,19],end:[5,24] },
  { id:"GeminiI",                   ruShort:"Близнецы I",                 ruWeek:"Неделя Свободы",             start:[5,25],end:[6,2]  },
  { id:"GeminiII",                  ruShort:"Близнецы II",                ruWeek:"Неделя Нового Языка",        start:[6,3], end:[6,10] },
  { id:"GeminiIII",                 ruShort:"Близнецы III",               ruWeek:"Неделя Искателя",            start:[6,11],end:[6,18] },
  { id:"CuspGeminiCancer",          ruShort:"Куспит Близнецы—Рак",        ruWeek:"Узел Волшебства",            start:[6,19],end:[6,24] },
  { id:"CancerI",                   ruShort:"Рак I",                      ruWeek:"Неделя Эмпата",              start:[6,25],end:[7,2]  },
  { id:"CancerII",                  ruShort:"Рак II",                     ruWeek:"Неделя Преданного",          start:[7,3], end:[7,10] },
  { id:"CancerIII",                 ruShort:"Рак III",                    ruWeek:"Неделя Убеждения",           start:[7,11],end:[7,18] },
  { id:"CuspCancerLeo",             ruShort:"Куспит Рак—Лев",             ruWeek:"Узел Осцилляции",            start:[7,19],end:[7,25] },
  { id:"LeoI",                      ruShort:"Лев I",                      ruWeek:"Неделя Авторитета",          start:[7,26],end:[8,2]  },
  { id:"LeoII",                     ruShort:"Лев II",                     ruWeek:"Неделя Балансирования",      start:[8,3], end:[8,10] },
  { id:"LeoIII",                    ruShort:"Лев III",                    ruWeek:"Неделя Театра",              start:[8,11],end:[8,18] },
  { id:"CuspLeoVirgo",              ruShort:"Куспит Лев—Дева",            ruWeek:"Узел Экспозиции",            start:[8,19],end:[8,25] },
  { id:"VirgoI",                    ruShort:"Дева I",                     ruWeek:"Неделя Системы",             start:[8,26],end:[9,2]  },
  { id:"VirgoII",                   ruShort:"Дева II",                    ruWeek:"Неделя Совершенства",        start:[9,3], end:[9,10] },
  { id:"VirgoIII",                  ruShort:"Дева III",                   ruWeek:"Неделя Экспозиции",          start:[9,11],end:[9,18] },
  { id:"CuspVirgoLibra",            ruShort:"Куспит Дева—Весы",           ruWeek:"Узел Красоты",               start:[9,19],end:[9,25] },
  { id:"LibraI",                    ruShort:"Весы I",                     ruWeek:"Неделя Выбора",              start:[9,26],end:[10,2] },
  { id:"LibraII",                   ruShort:"Весы II",                    ruWeek:"Неделя Общения",             start:[10,3],end:[10,10]},
  { id:"LibraIII",                  ruShort:"Весы III",                   ruWeek:"Неделя Глубины",             start:[10,11],end:[10,18]},
  { id:"CuspLibraScorpio",          ruShort:"Куспит Весы—Скорпион",       ruWeek:"Узел Критики",               start:[10,19],end:[10,25]},
  { id:"ScorpioI",                  ruShort:"Скорпион I",                 ruWeek:"Неделя Интенсивности",       start:[10,26],end:[11,2]},
  { id:"ScorpioII",                 ruShort:"Скорпион II",                ruWeek:"Неделя Глубины",             start:[11,3],end:[11,10]},
  { id:"ScorpioIII",                ruShort:"Скорпион III",               ruWeek:"Неделя Преобразования",      start:[11,11],end:[11,18]},
  { id:"CuspScorpioSagittarius",    ruShort:"Куспит Скорпион—Стрелец",    ruWeek:"Узел Революции",             start:[11,19],end:[11,24]},
  { id:"SagittariusI",              ruShort:"Стрелец I",                  ruWeek:"Неделя Независимости",       start:[11,25],end:[12,2]},
  { id:"SagittariusII",             ruShort:"Стрелец II",                 ruWeek:"Неделя Превосходства",       start:[12,3],end:[12,10]},
  { id:"SagittariusIII",            ruShort:"Стрелец III",                ruWeek:"Неделя Первопроходца",       start:[12,11],end:[12,18]},
  { id:"CuspSagittariusCapricorn",  ruShort:"Куспит Стрелец—Козерог",     ruWeek:"Узел Пророчества",           start:[12,19],end:[12,25]},
  { id:"CapricornI",                ruShort:"Козерог I",                  ruWeek:"Неделя Правителя",           start:[12,26],end:[1,2] },
  { id:"CapricornII",               ruShort:"Козерог II",                 ruWeek:"Неделя Самоопределения",     start:[1,3], end:[1,9] },
  { id:"CapricornIII",              ruShort:"Козерог III",                ruWeek:"Неделя Сосредоточенности",   start:[1,10],end:[1,16]},
  { id:"CuspCapricornAquarius",     ruShort:"Куспит Козерог—Водолей",     ruWeek:"Узел Тайны",                 start:[1,17],end:[1,22]},
  { id:"AquariusI",                 ruShort:"Водолей I",                  ruWeek:"Неделя Оригинальности",      start:[1,23],end:[1,30]},
  { id:"AquariusII",                ruShort:"Водолей II",                 ruWeek:"Неделя Откровения",          start:[1,31],end:[2,7] },
  { id:"AquariusIII",               ruShort:"Водолей III",                ruWeek:"Неделя Принятия",            start:[2,8], end:[2,15]},
  { id:"CuspAquariusPisces",        ruShort:"Куспит Водолей—Рыбы",        ruWeek:"Узел Чувствительности",      start:[2,16],end:[2,22]},
  { id:"PiscesI",                   ruShort:"Рыбы I",                     ruWeek:"Неделя Духа",                start:[2,23],end:[3,2] },
  { id:"PiscesII",                  ruShort:"Рыбы II",                    ruWeek:"Неделя Единства",            start:[3,3], end:[3,10]},
  { id:"PiscesIII",                 ruShort:"Рыбы III",                   ruWeek:"Неделя Видений",             start:[3,11],end:[3,18]},
];

const PERIOD_INDEX = new Map(PERIODS.map((p,i) => [p.id, i]));

// ─── Period name normalization ────────────────────────────────────────────────
const RU_TO_ID = new Map();
const ABBREV_MAP = {
  "куспит рыбы—овен": "CuspPiscesAries",    "куспит овен—телец": "CuspAriesTaurus",
  "куспит телец—близн.": "CuspTaurusGemini","куспит телец—близнецы": "CuspTaurusGemini",
  "куспит близн.—рак": "CuspGeminiCancer",  "куспит близнецы—рак": "CuspGeminiCancer",
  "куспит рак—лев": "CuspCancerLeo",        "куспит лев—дева": "CuspLeoVirgo",
  "куспит дева—весы": "CuspVirgoLibra",
  "куспит весы—скорп.": "CuspLibraScorpio", "куспит весы—скорпион": "CuspLibraScorpio",
  "узел весы—скорп.": "CuspLibraScorpio",
  "куспит скорп.—стрел.": "CuspScorpioSagittarius",
  "куспит скорпион—стрелец": "CuspScorpioSagittarius",
  "куспит стрел.—козер.": "CuspSagittariusCapricorn",
  "куспит стрелец—козерог": "CuspSagittariusCapricorn",
  "куспит козер.—водол.": "CuspCapricornAquarius",
  "куспит козерог—водолей": "CuspCapricornAquarius",
  "куспит водол.—рыбы": "CuspAquariusPisces",
  "куспит водолей—рыбы": "CuspAquariusPisces",
};

for (const p of PERIODS) {
  const lo = p.ruShort.toLowerCase();
  RU_TO_ID.set(lo, p.id);
  RU_TO_ID.set(lo.replace(/—/g,""), p.id);
  const up = p.ruShort.toUpperCase();
  RU_TO_ID.set(up, p.id);
  RU_TO_ID.set(up.replace(/—/g,"").replace(/\s+/g,""), p.id);
}
for (const [k,v] of Object.entries(ABBREV_MAP)) {
  RU_TO_ID.set(k, v);
  RU_TO_ID.set(k.replace(/—/g,"").replace(/\./g,""), v);
}

function normalizePeriodName(raw) {
  if (!raw) return null;
  const s = raw.trim()
    .replace(/^["«»\s]+|["«»\s]+$/g, "") // strip quotes
    .replace(/\s+/g, " ")
    .replace(/[–—]/g, "—")
    .replace(/-(?=[А-ЯЁа-яё])/g, "—");
  const lower = s.toLowerCase();
  if (RU_TO_ID.has(lower)) return RU_TO_ID.get(lower);
  if (RU_TO_ID.has(s)) return RU_TO_ID.get(s);
  // Expand abbreviations
  const exp = lower
    .replace(/близн\./g,"близнецы").replace(/скорп\./g,"скорпион")
    .replace(/стрел\./g,"стрелец").replace(/козер\./g,"козерог")
    .replace(/водол\./g,"водолей");
  if (RU_TO_ID.has(exp)) return RU_TO_ID.get(exp);
  return null;
}

function cleanLine(raw) {
  // Each line is wrapped in outer quotes in this OCR file
  return raw.replace(/^"|"$/g, "");
}

function isTocPartnerLine(t) {
  return /^(Куспит|Овен|Телец|Близнецы|Рак|Лев|Дева|Весы|Скорпион|Стрелец|Козерог|Водолей|Рыбы|Узел)\s/.test(t);
}
function isWrappedLine(raw) {
  return /^\s{20,}/.test(raw);
}
function isAllCapsRu(t) {
  if (t.length < 4 || t.length > 120) return false;
  if (/[а-яё]/.test(t)) return false;
  return (t.match(/[А-ЯЁ]/g) || []).length >= 3;
}
function isDateOnlyLine(t) {
  return /^\d+—\d+\s+[А-Яа-яёЁ]+\.?$/.test(t) && t.length < 30;
}
function isPageNum(t) { return /^\d{1,3}$/.test(t); }
function isPeriodLabel(t) { return !!normalizePeriodName(t) && t.length < 50; }
function isWeekLabel(t)   { return /^(Неделя|Узел)\s+[А-ЯЁа-яё]/.test(t) && t.length < 60; }

// ─── Read lines, strip outer quotes ──────────────────────────────────────────
const rawLines = fs.readFileSync(SRC, "utf8").split("\n");
const lines = rawLines.map(cleanLine);

// ─── Find compatibility section boundary ─────────────────────────────────────
// The book ToC has "Характеристика взаимоотношений 211" early on.
// The actual section starts much later. We find it by looking for line "211" or "212"
// preceded by "Характеристика" block or just by a large line number jump.
// The period guide section is pages 17-210 (lines ~450-8350 approx).
// We'll find "Характеристика\nвзаимоотношений" as a standalone multi-line block.

// The actual section is after page 210 (the 48-periods section ends there).
// Skip the first ~200 lines (intro/ToC). Find the second+ occurrence of
// "Характеристика" standalone (not in body text).
let compatStart = -1;
let charCount = 0;
for (let i = 500; i < lines.length; i++) {
  const t = lines[i].trim();
  if (t === "Характеристика" || /^Характеристика\s+взаимоотношений/.test(t)) {
    // Verify next non-empty line is "взаимоотношений" or this is it
    let j = i+1;
    while (j < lines.length && !lines[j].trim()) j++;
    if (t === "Характеристика" && lines[j]?.trim() === "взаимоотношений") {
      compatStart = i;
      break;
    }
    if (/^Характеристика\s+взаимоотношений/.test(t)) {
      compatStart = i;
      break;
    }
  }
}
// Fallback: search from line 7000+
if (compatStart < 0) {
  for (let i = 7000; i < lines.length; i++) {
    if (lines[i].trim() === "212") { compatStart = i; break; }
  }
}
console.log(`Compatibility section at line ${compatStart + 1}`);

// ─── Pass 1: Parse period guide tables (pages 17~210) ─────────────────────────
const PAIR_TO_TITLE = new Map();  // "A::B" → titleRu
const PERIOD_BEST   = {};         // periodId → { love, marriage, friendship, family, work }

let curPeriod = null;
let inGuide = false;
let inBest  = false;
let curCat  = null;
let curCatText = "";
const bestAcc = {};

function flushCat() {
  if (!curCat || !curPeriod) { curCat = null; curCatText = ""; return; }
  if (!bestAcc[curCat]) bestAcc[curCat] = [];
  for (const part of curCatText.split(/,\s*/)) {
    const id = normalizePeriodName(part.trim());
    if (id) bestAcc[curCat].push(id);
  }
  curCat = null; curCatText = "";
}
function flushBest() {
  if (!curPeriod) return;
  if (!PERIOD_BEST[curPeriod]) PERIOD_BEST[curPeriod] = {};
  Object.assign(PERIOD_BEST[curPeriod], JSON.parse(JSON.stringify(bestAcc)));
  Object.keys(bestAcc).forEach(k => delete bestAcc[k]);
  flushCat();
}

const CAT_RU = { "ЛЮБОВЬ":"love","БРАК":"marriage","ДРУЖБА":"friendship","СЕМЬЯ":"family","РАБОТА":"work" };

for (let i = 0; i < (compatStart > 0 ? compatStart : lines.length); i++) {
  const t = lines[i].trim();
  if (!t) continue;

  // Detect ALL CAPS period header
  if (isAllCapsRu(t) && !isDateOnlyLine(t)) {
    const pid = normalizePeriodName(t);
    if (pid) {
      flushBest();
      curPeriod = pid;
      inGuide = false;
      inBest  = false;
      continue;
    }
  }

  if (/Путеводитель взаимоотношений/.test(t) || /Страницы нахождения всех связей/.test(t)) {
    inGuide = true; inBest = false; continue;
  }
  if (/^Лучшие взаимоотношения/.test(t)) {
    inGuide = false; inBest = true; continue;
  }

  // ── Guide ToC lines ──
  if (inGuide && curPeriod && isTocPartnerLine(t)) {
    // Merge wrapped continuation lines
    let full = t;
    while (i+1 < lines.length && isWrappedLine(rawLines[i+1].replace(/^"|"$/g,""))) {
      i++;
      full += " " + lines[i].trim();
    }
    // full = "[partnerPeriod] [dates] [title...] [pageNum]"
    const pageM = full.match(/(\d{3})\s*$/);
    if (!pageM) continue;
    const page = parseInt(pageM[1]);
    const withoutPage = full.slice(0, full.lastIndexOf(pageM[1])).trim();

    // Find first date pattern: "3—10" or "25 марта—2" (month-spanning)
    const dateIdx = withoutPage.search(/\b\d+(?:\s+[А-Яа-яёЁ]+\.?)?\s*[—-]\s*\d+/);
    if (dateIdx < 2) continue;
    const partnerStr = withoutPage.slice(0, dateIdx).trim();
    const partnerId  = normalizePeriodName(partnerStr);
    if (!partnerId) continue;

    // Title comes after the date section
    // Date section: "19—24 марта" or "25 марта—2 апр." → ends with a month-word
    const afterDate = withoutPage.slice(dateIdx);
    // Strip date tokens: handles "3—10 июля", "25 марта—2 апр.", "26 авг.—2 сент."
    const titleM = afterDate.match(/\d+(?:\s+[А-Яа-яёЁ]+\.?)?\s*[—-]\s*\d+\s*[А-Яа-яёЁ]+\.?\s+(.+)$/)
      || afterDate.match(/\d+[—\s]\S+\.?(?:\s*[—]\s*\d+\s*\S+\.?)?\s+(.+)$/);
    if (!titleM) continue;
    let titleRu = titleM[1].trim();
    // Normalize whitespace that may have OCR spaces
    titleRu = titleRu.replace(/\s{3,}/g, " ").replace(/\s+(\d{3})$/, "").trim();
    if (!titleRu || titleRu.length < 3) continue;

    const key = [curPeriod, partnerId].sort().join("::");
    if (!PAIR_TO_TITLE.has(key)) PAIR_TO_TITLE.set(key, titleRu);
  }

  // ── Best-of lines ──
  if (inBest && curPeriod) {
    let foundCat = false;
    for (const [ru, en] of Object.entries(CAT_RU)) {
      if (t.startsWith(ru + ":")) {
        flushCat();
        curCat     = en;
        curCatText = t.slice(ru.length + 1).trim();
        foundCat   = true;
        break;
      }
    }
    if (!foundCat && curCat) {
      if (t && !Object.keys(CAT_RU).some(ru => t.startsWith(ru + ":"))) {
        curCatText += " " + t;
      } else {
        flushCat();
      }
    }
  }
}
flushBest();

console.log(`Pair→title from ToC: ${PAIR_TO_TITLE.size}`);
console.log(`Periods with best-of data: ${Object.keys(PERIOD_BEST).length}`);

// ─── Pass 2: Compatibility texts → title → text ───────────────────────────────
const titleToText = new Map();  // normalized-uppercase → { originalTitle, text }
let cTitle = null;
let cLines = [];

function flushCompat() {
  if (!cTitle) return;
  const text = cLines.filter(l => l.length > 2).join(" ").replace(/\s+/g," ").trim();
  if (text.length > 30) {
    const norm = cTitle.toUpperCase().replace(/\s+/g," ").trim();
    if (!titleToText.has(norm)) titleToText.set(norm, { originalTitle: cTitle, text });
  }
  cTitle = null; cLines = [];
}

const startLine = compatStart >= 0 ? compatStart : Math.floor(lines.length * 0.8);
for (let i = startLine; i < lines.length; i++) {
  const t = lines[i].trim();
  if (!t) continue;
  if (isPageNum(t)) continue;
  if (isDateOnlyLine(t)) continue;
  if (isPeriodLabel(t) && t.length < 40) continue;
  if (isWeekLabel(t)) continue;

  if (isAllCapsRu(t)) {
    flushCompat();
    cTitle = t;
    cLines = [];
  } else if (cTitle) {
    // Skip period marker blocks (date + label + code 3-line groups)
    cLines.push(t);
  }
}
flushCompat();

console.log(`Compatibility texts extracted: ${titleToText.size}`);

// ─── Pass 3: Join ─────────────────────────────────────────────────────────────
const results = [];
let matched = 0, unmatched = 0;

for (const [key, titleRu] of PAIR_TO_TITLE) {
  const [pA, pB] = key.split("::");
  const norm = titleRu.toUpperCase().replace(/\s+/g," ").trim();
  let found = titleToText.get(norm);

  if (!found) {
    // Try partial match: at least 60% word overlap
    const words = norm.split(" ").filter(w => w.length > 4);
    let best = 0, bestEntry = null;
    for (const [k, v] of titleToText) {
      const kw = k.split(" ").filter(w => w.length > 4);
      const overlap = words.filter(w => kw.includes(w)).length;
      const score = words.length > 0 ? overlap / words.length : 0;
      if (score > best && score >= 0.5) { best = score; bestEntry = v; }
    }
    found = bestEntry;
  }

  const bestA = PERIOD_BEST[pA] || {};
  const bestB = PERIOD_BEST[pB] || {};
  const cats = {};
  for (const cat of ["love","marriage","friendship","family","work"]) {
    if ((bestA[cat]||[]).includes(pB) || (bestB[cat]||[]).includes(pA)) cats[cat] = true;
  }

  results.push({
    periodA: pA, periodB: pB,
    titleRu: found?.originalTitle || titleRu,
    textRu: found?.text || null,
    compatCategories: cats,
  });
  if (found) matched++; else unmatched++;
}

results.sort((a,b) => {
  const ai = PERIOD_INDEX.get(a.periodA) ?? 99;
  const bi = PERIOD_INDEX.get(b.periodA) ?? 99;
  return ai !== bi ? ai-bi : (PERIOD_INDEX.get(a.periodB)??99)-(PERIOD_INDEX.get(b.periodB)??99);
});

console.log(`Matched: ${matched} | No text: ${unmatched} | Total: ${results.length}`);

// Sample output
if (results.length > 0) {
  const sample = results.find(r => r.textRu) || results[0];
  console.log(`\nSample: ${sample.periodA} × ${sample.periodB}`);
  console.log(`  Title: ${sample.titleRu}`);
  console.log(`  Text: ${(sample.textRu||"").slice(0,120)}...`);
}

// ─── Cleanup ─────────────────────────────────────────────────────────────────
function toTitleCaseRu(s) {
  // "ЭМОЦИОНАЛЬНЫЙ  ОГОНЬ" → "Эмоциональный огонь"
  return s.replace(/\s+/g," ").trim()
    .toLowerCase()
    .replace(/^[а-яёa-z]/, c => c.toUpperCase());
}
function cleanText(s) {
  if (!s) return s;
  return s
    .replace(/(\S)-\s+(\S)/g, "$1$2")  // remove soft hyphens: "при- чудам" → "причудам"
    .replace(/\s+/g, " ")
    .trim();
}
for (const r of results) {
  r.titleRu = toTitleCaseRu(r.titleRu);
  if (r.textRu) r.textRu = cleanText(r.textRu);
}

// ─── Output ───────────────────────────────────────────────────────────────────
const output = {
  periods: PERIODS.map(p => ({ id:p.id, ruShort:p.ruShort, ruWeek:p.ruWeek, start:p.start, end:p.end })),
  pairs: results,
};
fs.writeFileSync(OUT, JSON.stringify(output, null, 2), "utf8");
console.log(`\nWritten → ${path.relative(process.cwd(), OUT)}`);
