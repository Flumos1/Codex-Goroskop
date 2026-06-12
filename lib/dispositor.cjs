const traditionalRulers = {
  Aries: "Mars",
  Taurus: "Venus",
  Gemini: "Mercury",
  Cancer: "Moon",
  Leo: "Sun",
  Virgo: "Mercury",
  Libra: "Venus",
  Scorpio: "Mars",
  Sagittarius: "Jupiter",
  Capricorn: "Saturn",
  Aquarius: "Saturn",
  Pisces: "Jupiter",
};

const modernRulers = {
  ...traditionalRulers,
  Scorpio: "Pluto",
  Aquarius: "Uranus",
  Pisces: "Neptune",
};

const ru = {
  Sun: "Солнце",
  Moon: "Луна",
  Mercury: "Меркурий",
  Venus: "Венера",
  Mars: "Марс",
  Jupiter: "Юпитер",
  Saturn: "Сатурн",
  Uranus: "Уран",
  Neptune: "Нептун",
  Pluto: "Плутон",
  Aries: "Овен",
  Taurus: "Телец",
  Gemini: "Близнецы",
  Cancer: "Рак",
  Leo: "Лев",
  Virgo: "Дева",
  Libra: "Весы",
  Scorpio: "Скорпион",
  Sagittarius: "Стрелец",
  Capricorn: "Козерог",
  Aquarius: "Водолей",
  Pisces: "Рыбы",
};

function localName(value, language = "ru") {
  return language === "ru" ? (ru[value] || value) : value;
}

function calculateChain(body, rulerByBody) {
  const chain = [];
  const seen = new Map();
  let current = body;

  while (current && rulerByBody[current]) {
    if (seen.has(current)) {
      const cycleStart = seen.get(current);
      return {
        body,
        chain,
        finalDispositor: null,
        cycle: chain.slice(cycleStart),
      };
    }

    seen.set(current, chain.length);
    const ruler = rulerByBody[current];
    chain.push({ body: current, ruler });

    if (ruler === current) {
      return {
        body,
        chain,
        finalDispositor: ruler,
        cycle: [],
      };
    }

    current = ruler;
  }

  return {
    body,
    chain,
    finalDispositor: null,
    cycle: [],
  };
}

function calculateDispositor(profile, options = {}) {
  const language = options.language || profile.language || "ru";
  const rulerSet = options.rulerSet === "modern" ? modernRulers : traditionalRulers;
  const positions = (profile.calculation?.positions || []).filter((position) => rulerSet[position.sign]);
  const rulerByBody = Object.fromEntries(positions.map((position) => [position.body, rulerSet[position.sign]]));

  const placements = positions.map((position) => ({
    body: position.body,
    bodyName: localName(position.body, language),
    sign: position.sign,
    signName: localName(position.sign, language),
    ruler: rulerByBody[position.body],
    rulerName: localName(rulerByBody[position.body], language),
    isInOwnSign: position.body === rulerByBody[position.body],
  }));

  const chains = positions.map((position) => calculateChain(position.body, rulerByBody)).map((chain) => ({
    ...chain,
    bodyName: localName(chain.body, language),
    chainText: compactChainText(chain.chain, language),
    finalDispositorName: chain.finalDispositor ? localName(chain.finalDispositor, language) : null,
    cycleNames: chain.cycle.map((item) => localName(item.body, language)),
  }));

  const finalCounts = chains.reduce((counts, chain) => {
    if (chain.finalDispositor) counts[chain.finalDispositor] = (counts[chain.finalDispositor] || 0) + 1;
    return counts;
  }, {});
  const dominantFinal = Object.entries(finalCounts).sort((a, b) => b[1] - a[1])[0] || null;

  const receptions = [];
  for (let i = 0; i < positions.length; i += 1) {
    for (let j = i + 1; j < positions.length; j += 1) {
      const a = positions[i].body;
      const b = positions[j].body;
      if (rulerByBody[a] === b && rulerByBody[b] === a) {
        receptions.push({
          bodyA: a,
          bodyB: b,
          bodyAName: localName(a, language),
          bodyBName: localName(b, language),
        });
      }
    }
  }

  const hasSingleFinal = dominantFinal && dominantFinal[1] === chains.length;
  const summary = hasSingleFinal
    ? `Главный диспозитор карты: ${localName(dominantFinal[0], language)}. Через него сходится большая часть мотивации карты.`
    : dominantFinal
      ? `Самая заметная точка диспозитория: ${localName(dominantFinal[0], language)}. Она собирает ${dominantFinal[1]} цепочек из ${chains.length}.`
      : "В карте нет единого финального диспозитора: важнее смотреть циклы управителей и взаимные связи.";

  return {
    rulerSet: options.rulerSet || "traditional",
    placements,
    chains,
    receptions,
    dominantFinal: dominantFinal ? { body: dominantFinal[0], bodyName: localName(dominantFinal[0], language), count: dominantFinal[1] } : null,
    summary,
  };
}

function compactChainText(chain, language) {
  const sequence = [];
  for (const item of chain) {
    if (!sequence.length) sequence.push(item.body);
    sequence.push(item.ruler);
  }
  const compact = sequence.filter((item, index) => index === 0 || item !== sequence[index - 1]);
  return compact.map((item) => localName(item, language)).join(" -> ");
}

module.exports = {
  calculateDispositor,
  calculateChain,
  compactChainText,
  modernRulers,
  traditionalRulers,
};
