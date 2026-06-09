/**
 * Generates transit rules for MC (Midheaven) as natal point, and for
 * outer-planet natal points (Uranus, Neptune, Pluto) + North Node.
 *
 * Appends to existing psychological-transit-rules.json and
 * psychological-fast-transit-rules.json without duplicating IDs.
 *
 * Usage: node scripts/gen_mc_transit_rules.cjs
 */
"use strict";
const fs   = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SLOW_FILE = path.join(ROOT, "generator", "rules", "psychological-transit-rules.json");
const FAST_FILE = path.join(ROOT, "generator", "rules", "psychological-fast-transit-rules.json");

// ─── Dictionaries ────────────────────────────────────────────────────────────

const TRANSIT_PLANETS_SLOW = {
  Jupiter: { orb: 2, dur_en: "weeks to a few months",  dur_ru: "недели — несколько месяцев" },
  Saturn:  { orb: 2, dur_en: "one to three months",     dur_ru: "один-три месяца" },
  Uranus:  { orb: 2, dur_en: "months to over a year",   dur_ru: "месяцы — более года" },
  Neptune: { orb: 1, dur_en: "one to two years",         dur_ru: "один-два года" },
  Pluto:   { orb: 1, dur_en: "one to several years",     dur_ru: "один — несколько лет" },
  Mars:    { orb: 1, dur_en: "days to one week",         dur_ru: "дни — одна неделя" },
  Sun:     { orb: 1, dur_en: "a few days",               dur_ru: "несколько дней" },
};

const TRANSIT_PLANETS_FAST = {
  Moon:    { orb: 1, dur_en: "hours",   dur_ru: "несколько часов" },
  Mercury: { orb: 1, dur_en: "days",    dur_ru: "несколько дней" },
  Venus:   { orb: 1, dur_en: "days",    dur_ru: "несколько дней" },
};

const TRANSIT_PRINCIPLE = {
  Jupiter: ["expansion, opportunity, growth, and faith",
            "расширения, возможности, роста и веры"],
  Saturn:  ["structure, discipline, limitation, and testing",
            "структуры, дисциплины, ограничения и испытания"],
  Uranus:  ["awakening, disruption, liberation, and sudden change",
            "пробуждения, разрушения, освобождения и внезапных перемен"],
  Neptune: ["dissolution, transcendence, idealization, and spiritual opening",
            "растворения, трансценденции, идеализации и духовного открытия"],
  Pluto:   ["transformation, depth, power, and unavoidable change",
            "трансформации, глубины, власти и неизбежных перемен"],
  Mars:    ["activation, urgency, assertion, and challenge",
            "активации, срочности, самоутверждения и вызова"],
  Sun:     ["focus, vitality, and conscious attention",
            "фокуса, жизненной силы и осознанного внимания"],
  Moon:    ["emotional attunement, instinct, and daily rhythm",
            "эмоционального резонанса, инстинкта и суточного ритма"],
  Mercury: ["mental clarity, communication, and curiosity",
            "ясности ума, коммуникации и любопытства"],
  Venus:   ["appreciation, ease, charm, and relational warmth",
            "признательности, лёгкости, обаяния и теплоты отношений"],
};

// New natal points to add
const NEW_NATAL_POINTS = {
  MC: {
    en: "vocation, public image, life direction, and reputation",
    ru: "призвания, публичного образа, жизненного направления и репутации",
    themes_en: ["mc", "vocation", "career", "reputation", "public-image"],
    themes_ru: ["МС", "призвание", "карьера", "репутация", "публичный образ"],
  },
  Uranus: {
    en: "originality, awakening, sudden freedom, and rebellion",
    ru: "оригинальности, пробуждения, внезапной свободы и бунта",
    themes_en: ["uranus", "awakening", "liberation", "disruption"],
    themes_ru: ["Уран", "пробуждение", "освобождение", "прорыв"],
  },
  Neptune: {
    en: "idealism, spirituality, compassion, and dissolution of boundaries",
    ru: "идеализма, духовности, сострадания и растворения границ",
    themes_en: ["neptune", "idealism", "spirituality", "compassion"],
    themes_ru: ["Нептун", "идеализм", "духовность", "сострадание"],
  },
  Pluto: {
    en: "transformation, power, deep change, and regeneration",
    ru: "трансформации, власти, глубокого изменения и регенерации",
    themes_en: ["pluto", "transformation", "power", "depth"],
    themes_ru: ["Плутон", "трансформация", "власть", "глубина"],
  },
  "North Node": {
    en: "soul direction, karmic growth, and unfamiliar potential",
    ru: "направления души, кармического роста и непривычного потенциала",
    themes_en: ["north-node", "karma", "soul-direction", "growth"],
    themes_ru: ["Северный узел", "карма", "направление души", "рост"],
  },
};

const ASPECT_QUALITY = {
  conjunction: {
    verb_en: "fuses with and intensifies",
    char_en: "activating and intensifying",
    verb_ru: "соединяется с и усиливает",
    char_ru: "активация и интенсификация",
    growth_en: "integrate the activated energy consciously rather than being overwhelmed by it",
    growth_ru: "интегрировать активированную энергию осознанно, не будучи захлёстнутым ею",
  },
  sextile: {
    verb_en: "opens a gentle doorway toward",
    char_en: "offering opportunity with effort",
    verb_ru: "открывает мягкую возможность к",
    char_ru: "возможность при сознательном усилии",
    growth_en: "take deliberate steps toward the opportunity — sextiles reward conscious effort",
    growth_ru: "предпринять целенаправленные шаги к возможности — секстили вознаграждают осознанное усилие",
  },
  square: {
    verb_en: "creates productive tension with",
    char_en: "challenging and demanding change",
    verb_ru: "создаёт напряжение с",
    char_ru: "вызов и требование перемен",
    growth_en: "meet the challenge with awareness — the friction is an invitation to grow",
    growth_ru: "встретить вызов осознанно — трение является приглашением к росту",
  },
  trine: {
    verb_en: "flows harmoniously into",
    char_en: "supporting and enabling",
    verb_ru: "гармонично поддерживает",
    char_ru: "поддержка и раскрытие возможностей",
    growth_en: "use the available ease actively rather than letting the opportunity pass unexplored",
    growth_ru: "активно использовать доступную лёгкость, не позволяя возможности пройти мимо",
  },
  opposition: {
    verb_en: "stands in polarity with",
    char_en: "polarizing and bringing awareness",
    verb_ru: "создаёт полярность с",
    char_ru: "поляризация и осознание",
    growth_en: "find the middle ground between the two poles rather than identifying with only one",
    growth_ru: "найти среднее между двумя полюсами, а не отождествляться лишь с одним",
  },
};

const ASPECTS = ["conjunction", "sextile", "square", "trine", "opposition"];

// ─── Rule builder ─────────────────────────────────────────────────────────────

function buildRule(tPlanet, aspect, nPoint, isFast) {
  const tConfig    = (isFast ? TRANSIT_PLANETS_FAST : TRANSIT_PLANETS_SLOW)[tPlanet];
  const tPrinciple = TRANSIT_PRINCIPLE[tPlanet];
  const nData      = NEW_NATAL_POINTS[nPoint];
  const aq         = ASPECT_QUALITY[aspect];

  const nPointSlug = nPoint.toLowerCase().replace(/\s+/g, "-");
  const idPrefix   = isFast ? "fast-transit" : "transit-rule";
  const id         = `${idPrefix}.western.${tPlanet.toLowerCase()}-${aspect}-natal-${nPointSlug}`;

  const dur_en = tConfig.dur_en;
  const dur_ru = tConfig.dur_ru;

  const rule = {
    id,
    system: "western",
    methodFamily: isFast ? "psychological-transit-fast" : "psychological-transit",
    factor: {
      transitPlanet: tPlanet,
      aspect,
      natalPoint: nPoint,
      orbDegrees: tConfig.orb,
    },
    timing: {
      typicalDuration: dur_en,
      typicalDurationRu: dur_ru,
    },
    themes: [tPlanet.toLowerCase(), aspect, nPointSlug, ...nData.themes_en],
    themesRu: [tPlanet, aspect, nPoint, ...nData.themes_ru],
    sourceIds: [isFast ? "source.general-transit-methodology" : "source.general-transit-methodology"],
    simple: {
      summary: `Transiting ${tPlanet} ${aspect} natal ${nPoint}: the principle of ${tPrinciple[0]} ${aq.verb_en} the domain of ${nData.en}.`,
      pattern: `This transit is ${aq.char_en}. It typically lasts ${dur_en}.`,
      growth: `The growth task during this transit is to ${aq.growth_en}.`,
      reflection: `What is being ${aspect === "square" || aspect === "opposition" ? "challenged" : "supported"} in your relationship to ${nData.en} right now?`,
    },
    simpleRu: {
      summary: isFast
        ? `Луна образует ${aspect} с натальным ${nPoint}: краткое активирование области ${nData.ru}.`
        : `Транзитный ${tPlanet} ${aq.verb_ru} натальный ${nPoint}: принцип ${tPrinciple[1]} затрагивает область ${nData.ru}.`,
      pattern: isFast
        ? `Кратковременное окно (${dur_ru}). ${nPoint === "MC" ? "Момент для внешнего проявления, решений по карьере или репутации." : "Мимолётная активация этой сферы."}`
        : `Этот транзит характеризуется ${aq.char_ru}. Он обычно длится ${dur_ru}.`,
      growth: `Задача: ${aq.growth_ru}.`,
      reflection: `Что сейчас ${aspect === "square" || aspect === "opposition" ? "оспаривается" : "поддерживается"} в вашем отношении к области ${nData.ru}?`,
    },
    advanced: {
      technical: `Transit ${tPlanet} ${aspect} natal ${nPoint}: ${tPrinciple[0]} ${aq.verb_en} ${nData.en}. Orb: ±${tConfig.orb}°.`,
      method: `Transit-to-natal interpretation: the transiting planet acts as a current activation of the natal point. Duration: ${dur_en}.`,
      caution: `Transits describe inner developmental pressure, not external events. ${nPoint === "MC" ? "MC transits often correlate with shifts in career or public life, but the trigger depends on individual circumstances." : ""}`.trim(),
      constructiveChannel: `Use the energy of ${tPrinciple[0]} as a catalyst for intentional development of ${nData.en}.`,
    },
    advancedRu: {
      technical: `Транзит ${tPlanet} ${aspect} натальный ${nPoint}: принцип ${tPrinciple[1]} ${aq.verb_ru} область ${nData.ru}. Орб: ±${tConfig.orb}°.`,
      method: `Транзит описывает текущую активацию натальной точки. Длительность: ${dur_ru}.`,
      caution: `Транзиты описывают внутреннее давление развития, а не внешние события. ${nPoint === "MC" ? "Транзиты к МС часто совпадают с карьерными сдвигами или изменением публичного положения." : ""}`.trim(),
      constructiveChannel: `Используйте принцип ${tPrinciple[1]} как катализатор для осознанного развития области ${nData.ru}.`,
    },
    confidence: "medium",
  };

  return rule;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function appendRules(filePath, newRules) {
  const existing = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const existingIds = new Set(existing.map(r => r.id));
  const toAdd = newRules.filter(r => !existingIds.has(r.id));
  const combined = [...existing, ...toAdd];
  fs.writeFileSync(filePath, JSON.stringify(combined, null, 2), "utf8");
  console.log(`  ${filePath.split(/[\\/]/).pop()}: added ${toAdd.length} / ${newRules.length} new rules (${existing.length} → ${combined.length})`);
}

// Generate slow transit rules for new natal points
const slowRules = [];
for (const [nPoint] of Object.entries(NEW_NATAL_POINTS)) {
  for (const tPlanet of Object.keys(TRANSIT_PLANETS_SLOW)) {
    for (const aspect of ASPECTS) {
      slowRules.push(buildRule(tPlanet, aspect, nPoint, false));
    }
  }
}

// Generate fast transit rules for new natal points
const fastRules = [];
for (const [nPoint] of Object.entries(NEW_NATAL_POINTS)) {
  for (const tPlanet of Object.keys(TRANSIT_PLANETS_FAST)) {
    for (const aspect of ASPECTS) {
      fastRules.push(buildRule(tPlanet, aspect, nPoint, true));
    }
  }
}

console.log(`Generated ${slowRules.length} slow + ${fastRules.length} fast rules for new natal points.`);
appendRules(SLOW_FILE, slowRules);
appendRules(FAST_FILE, fastRules);
console.log("Done.");
