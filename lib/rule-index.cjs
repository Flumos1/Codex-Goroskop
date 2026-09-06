"use strict";

// Rule matching engine for the full Codex Goroskop knowledge base.
//
// Extracted from the standalone Express prototype (branch `flumos-line`) when
// the two development lines were merged: that server carried the only copy of
// the matcher, so the modular site could reach just 4 of the 16 rule files.
// Living in lib/ it is shared by the site, the report generator and the
// Cloudflare Worker.
//
// Rules load lazily and are cached: the set is ~11MB across 16 files, so it is
// read once per process, on first use rather than at require() time.

const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const rulesDir = path.join(projectRoot, "generator", "rules");

// Load all rules and build lookup indices
function loadAllRules() {
  const rules = [];
  for (const name of fs.readdirSync(rulesDir).filter(f => f.endsWith(".json"))) {
    const raw = JSON.parse(fs.readFileSync(path.join(rulesDir, name), "utf8"));
    const list = Array.isArray(raw) ? raw : (raw.rules || []);
    rules.push(...list);
  }
  return rules;
}

function buildRuleIndex(rules) {
  const byAspect    = new Map(); // "Moon trine Pluto" → rule
  const byHouse     = new Map(); // "Sun 10" → rule
  const bySign      = new Map(); // "Sun Gemini" → rule
  const byRulerId   = new Map(); // "rule-instance.western.ruler-of-1st-in-9th" → rule
  const byVedic     = new Map(); // "Sun:Mesha" → rule
  const byBirthday  = new Map(); // "5:15" → rule (month:day)
  const byKabbalah  = new Map(); // "Sun:Aries" → rule
  const byChinese   = new Map(); // "Rat" → rule
  const byNakshatra     = new Map(); // "Ashwini" → rule
  const byNakshatraPada = new Map(); // "Ashwini:1" → rule
  const byLunarMansion  = new Map(); // "Ashwini" → lunar-mansion rule

  for (const rule of rules) {
    const f = rule.factor || {};
    if (f.planetA && f.aspect && f.planetB) {
      byAspect.set(`${f.planetA} ${f.aspect} ${f.planetB}`, rule);
    } else if (f.planet && f.house) {
      const hNum = typeof f.house === "string"
        ? parseInt(f.house, 10)
        : f.house;
      byHouse.set(`${f.planet} ${hNum}`, rule);
    } else if (f.planet && f.sign) {
      bySign.set(`${f.planet} ${f.sign}`, rule);
    } else if (f.rulerOfHouse && f.placedInHouse) {
      byRulerId.set(rule.id, rule);
    } else if (f.graha && f.rashi) {
      byVedic.set(`${f.graha}:${f.rashi}`, rule);
    } else if (f.month && f.day) {
      byBirthday.set(`${f.month}:${f.day}`, rule);
    } else if (f.kabbalahPlanet && f.sign) {
      byKabbalah.set(`${f.kabbalahPlanet}:${f.sign}`, rule);
    } else if (f.chineseAnimal) {
      byChinese.set(f.chineseAnimal, rule);
    } else if (f.nakshatra && f.pada) {
      byNakshatraPada.set(`${f.nakshatra}:${f.pada}`, rule);
    } else if (f.nakshatra && f.mansionNum) {
      byLunarMansion.set(f.nakshatra, rule);
    } else if (f.nakshatra) {
      byNakshatra.set(f.nakshatra, rule);
    }
  }
  return { byAspect, byHouse, bySign, byRulerId, byVedic, byBirthday, byKabbalah, byChinese, byNakshatra, byNakshatraPada, byLunarMansion };
}

function findRuleForFactor(factor, idx) {
  const q = factor.query || "";

  // Aspect: "Moon trine Pluto"
  const c = factor.calculated || {};
  if (c.bodyA && c.aspect && c.bodyB) {
    return idx.byAspect.get(`${c.bodyA} ${c.aspect} ${c.bodyB}`)
        || idx.byAspect.get(`${c.bodyB} ${c.aspect} ${c.bodyA}`);
  }
  // House: "Sun in 10th house"
  if (c.body && c.house) {
    return idx.byHouse.get(`${c.body} ${c.house}`);
  }
  // Sign: "Sun in Gemini"
  const signMatch = q.match(/^(\w+) in (\w+)$/);
  if (signMatch && !signMatch[0].includes("house")) {
    return idx.bySign.get(`${signMatch[1]} ${signMatch[2]}`);
  }
  // Ruler: "ruler-of-1st-in-9th"
  if (q.startsWith("ruler-of-")) {
    const id = `rule-instance.western.${q}`;
    return idx.byRulerId.get(id);
  }
  // Vedic: "vedic:Sun:Mesha"
  if (q.startsWith("vedic:") && c.graha && c.rashi) {
    return idx.byVedic.get(`${c.graha}:${c.rashi}`);
  }
  // Kabbalah: "kabbalah:Sun:Aries"
  if (q.startsWith("kabbalah:") && c.kabbalahPlanet && c.sign) {
    return idx.byKabbalah.get(`${c.kabbalahPlanet}:${c.sign}`);
  }
  // Chinese zodiac: "chinese:Rat"
  if (q.startsWith("chinese:") && c.chineseAnimal) {
    return idx.byChinese.get(c.chineseAnimal);
  }
  // Nakshatra-pada: "nakshatra-pada:Ashwini:1"
  if (q.startsWith("nakshatra-pada:") && c.nakshatra && c.pada) {
    return idx.byNakshatraPada.get(`${c.nakshatra}:${c.pada}`);
  }
  // Lunar mansion: "lunar-mansion:Ashwini"
  if (q.startsWith("lunar-mansion:") && c.nakshatra) {
    return idx.byLunarMansion.get(c.nakshatra);
  }
  // Nakshatra: "nakshatra:Ashwini"
  if (q.startsWith("nakshatra:") && c.nakshatra) {
    return idx.byNakshatra.get(c.nakshatra);
  }
  return null;
}

// Significance scoring — higher = show first
const PLANET_WEIGHT = {
  Sun: 3.0, Moon: 3.0, Mercury: 2.0, Venus: 2.0, Mars: 2.0,
  Jupiter: 1.5, Saturn: 1.5, Uranus: 1.0, Neptune: 1.0, Pluto: 1.0,
};
const ANGULAR_HOUSES  = new Set([1, 4, 7, 10]);
const SUCCEDENT_HOUSES = new Set([2, 5, 8, 11]);
const ASPECT_WEIGHT = { conjunction: 1.4, opposition: 1.3, square: 1.2, trine: 1.1, sextile: 1.0 };
const DIGNITY_BONUS = { exalted: 0.8, "own sign": 0.5, friendly: 0.2, neutral: 0, inimical: -0.1, debilitated: -0.2 };

function scoreFactors(factor) {
  const c = factor.calculated || {};
  const rule = factor.rule || {};
  let score = 1.0;

  if (c.bodyA && c.aspect) {
    // aspect rule — tighter orb = stronger. A partile (orb 0) must score highest.
    const pa = PLANET_WEIGHT[c.bodyA] || 1;
    const pb = PLANET_WEIGHT[c.bodyB] || 1;
    const aw = ASPECT_WEIGHT[c.aspect] || 1;
    const orbPenalty = c.orb != null ? Math.max(0, 1 - c.orb / 10) : 0.8;
    score = (pa + pb) / 2 * aw * (0.7 + 0.3 * orbPenalty) + 2.0;
  } else if (c.body && c.house) {
    // house rule
    const pw = PLANET_WEIGHT[c.body] || 1;
    const hw = ANGULAR_HOUSES.has(c.house) ? 1.5 : SUCCEDENT_HOUSES.has(c.house) ? 1.2 : 1.0;
    score = pw * hw + 1.5;
  } else if (c.body && !c.graha) {
    // western sign rule
    const pw = PLANET_WEIGHT[c.body] || 1;
    score = pw + 1.0;
  } else if (c.graha) {
    // vedic rashi rule
    const pw = PLANET_WEIGHT[c.graha] || 1;
    const dignity = rule.dignity?.status || "neutral";
    const db = DIGNITY_BONUS[dignity] || 0;
    score = pw * 1.2 + db + 1.5;
  } else {
    // ruler-pipeline
    score = 1.2;
  }
  return score;
}

function mergeRules(profile, idx) {
  const factors = Array.isArray(profile.factors) ? profile.factors : [];
  return factors
    .map(factor => {
      const rule = findRuleForFactor(factor, idx);
      return { ...factor, rule: rule || null };
    })
    .filter(f => f.rule)
    .map(f => ({ ...f, significance: scoreFactors(f) }))
    .sort((a, b) => b.significance - a.significance);
}

// Goldschneider period/compatibility data (2.2MB) — loaded on first use so
// that `require`ing this module stays cheap.
let cachedCompatData = null;
function getCompatData() {
  if (cachedCompatData) return cachedCompatData;
  const raw = JSON.parse(fs.readFileSync(path.join(rulesDir, "compatibility-rules.json"), "utf8"));
  const pairMap = new Map();
  for (const pair of raw.pairs) {
    const key = [pair.periodA, pair.periodB].sort().join("::");
    pairMap.set(key, pair);
  }
  cachedCompatData = { periods: raw.periods, pairMap };
  return cachedCompatData;
}

function dateToPeriod(dateStr) {
  // dateStr: "YYYY-MM-DD"
  const parts = dateStr.split("-");
  const month = parseInt(parts[1], 10);
  const day   = parseInt(parts[2], 10);
  for (const p of getCompatData().periods) {
    const [sm, sd] = p.start;
    const [em, ed] = p.end;
    // Periods always span at most two adjacent months (e.g. Dec 26 – Jan 2 or
    // Mar 1 – Apr 5), so matching the two boundary months is sufficient.
    if (sm === em) {
      if (month === sm && day >= sd && day <= ed) return p;
    } else if ((month === sm && day >= sd) || (month === em && day <= ed)) {
      return p;
    }
  }
  return null;
}

// ── Lazy singletons ──────────────────────────────────────────────────────────
// Built on first use so that requiring this module stays cheap for callers
// that never touch the rule set (the OCR and parser scripts, for instance).
let cachedRules = null;
let cachedIndex = null;

function getRules() {
  if (!cachedRules) cachedRules = loadAllRules();
  return cachedRules;
}

function getRuleIndex() {
  if (!cachedIndex) cachedIndex = buildRuleIndex(getRules());
  return cachedIndex;
}

// Attach the matched rule (and a significance score) to every factor a profile
// produced. Returns the enriched list, most significant first.
function matchProfileRules(profile) {
  return mergeRules(profile, getRuleIndex());
}

// Goldschneider birthday portrait for a calendar day.
function birthdayRule(month, day) {
  return getRuleIndex().byBirthday.get(`${month}:${day}`) || null;
}

// Goldschneider period-pair compatibility for two birth dates.
function periodCompatibility(dateA, dateB) {
  const periodA = dateToPeriod(dateA);
  const periodB = dateToPeriod(dateB);
  if (!periodA) throw new Error(`Не удалось определить период для даты: ${dateA}`);
  if (!periodB) throw new Error(`Не удалось определить период для даты: ${dateB}`);

  const key = [periodA.id, periodB.id].sort().join("::");
  return {
    personA: { date: dateA, periodId: periodA.id, periodName: periodA.ruShort, weekName: periodA.ruWeek },
    personB: { date: dateB, periodId: periodB.id, periodName: periodB.ruShort, weekName: periodB.ruWeek },
    pair: getCompatData().pairMap.get(key) || null,
    samePeriod: periodA.id === periodB.id,
  };
}

module.exports = {
  loadAllRules,
  buildRuleIndex,
  findRuleForFactor,
  scoreFactors,
  mergeRules,
  dateToPeriod,
  getCompatData,
  getRules,
  getRuleIndex,
  matchProfileRules,
  birthdayRule,
  periodCompatibility,
};
