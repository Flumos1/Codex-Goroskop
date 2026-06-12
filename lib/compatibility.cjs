const { calculateChart } = require("./astro.cjs");

const aspectDefinitions = [
  { name: "conjunction", ru: "соединение", angle: 0, orb: 8, tone: "fusion" },
  { name: "sextile", ru: "секстиль", angle: 60, orb: 5, tone: "support" },
  { name: "square", ru: "квадрат", angle: 90, orb: 6, tone: "friction" },
  { name: "trine", ru: "трин", angle: 120, orb: 6, tone: "ease" },
  { name: "opposition", ru: "оппозиция", angle: 180, orb: 8, tone: "polarity" },
];

const bodyRu = {
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
};

const contextLabels = {
  romantic: "Любовь и роман",
  marriage: "Брак / долгий союз",
  friendship: "Дружба",
  business: "Бизнес-партнерство",
  coworkers: "Коллеги",
  parentChild: "Родитель и ребенок",
  family: "Семья / родственники",
  general: "Любая человеческая коммуникация",
};

const axisMeta = {
  attraction: {
    title: "Притяжение и интерес",
    bodies: ["Sun", "Venus", "Mars", "Moon", "Jupiter"],
    plain: "как быстро возникает интерес, тепло, желание быть рядом или замечать друг друга",
  },
  emotion: {
    title: "Эмоциональная безопасность",
    bodies: ["Moon", "Venus", "Saturn", "Neptune"],
    plain: "насколько легко рядом расслабляться, просить заботу, выдерживать уязвимость и не копить обиды",
  },
  communication: {
    title: "Коммуникация",
    bodies: ["Mercury", "Moon", "Sun", "Mars"],
    plain: "как люди объясняют, спорят, слышат, перебивают, договариваются и переводят чувства в слова",
  },
  friction: {
    title: "Напряжение и конфликты",
    bodies: ["Mars", "Saturn", "Pluto", "Moon", "Mercury"],
    plain: "где связь может давить, раздражать, включать защиту, контроль или повторяющийся спор",
  },
  practical: {
    title: "Практическое сотрудничество",
    bodies: ["Saturn", "Jupiter", "Mercury", "Mars", "Sun"],
    plain: "можно ли вместе делать дела, держать договоренности, строить быт, проект или бизнес",
  },
  growth: {
    title: "Рост и развитие",
    bodies: ["Jupiter", "Saturn", "Sun", "Pluto", "Uranus"],
    plain: "как связь меняет людей, расширяет горизонт или заставляет взрослеть",
  },
  boundaries: {
    title: "Границы и безопасность",
    bodies: ["Saturn", "Mars", "Pluto", "Neptune", "Moon"],
    plain: "где нужны правила, ясность, паузы, уважение к темпу и отказ от манипуляций",
  },
};

const contextWeights = {
  romantic: { attraction: 1.35, emotion: 1.25, communication: 1.05, friction: 1.1, practical: 0.75, growth: 1, boundaries: 1.1 },
  marriage: { attraction: 1, emotion: 1.35, communication: 1.15, friction: 1.05, practical: 1.35, growth: 1.1, boundaries: 1.25 },
  friendship: { attraction: 0.85, emotion: 1.1, communication: 1.35, friction: 0.9, practical: 0.8, growth: 1.2, boundaries: 1 },
  business: { attraction: 0.65, emotion: 0.8, communication: 1.25, friction: 1.05, practical: 1.45, growth: 1.15, boundaries: 1.3 },
  coworkers: { attraction: 0.55, emotion: 0.75, communication: 1.35, friction: 1.05, practical: 1.4, growth: 1, boundaries: 1.3 },
  parentChild: { attraction: 0.65, emotion: 1.45, communication: 1.15, friction: 1.15, practical: 0.9, growth: 1.25, boundaries: 1.45 },
  family: { attraction: 0.65, emotion: 1.3, communication: 1.15, friction: 1.1, practical: 1, growth: 1, boundaries: 1.35 },
  general: { attraction: 1, emotion: 1, communication: 1, friction: 1, practical: 1, growth: 1, boundaries: 1 },
};

function normalizeDegrees(value) {
  return ((value % 360) + 360) % 360;
}

function angleDistance(a, b) {
  const diff = Math.abs(normalizeDegrees(a) - normalizeDegrees(b));
  return diff > 180 ? 360 - diff : diff;
}

function aspectBetween(a, b) {
  const distance = angleDistance(a.tropicalLongitude, b.tropicalLongitude);
  let best = null;
  for (const definition of aspectDefinitions) {
    const orb = Math.abs(distance - definition.angle);
    if (orb <= definition.orb && (!best || orb < best.orb)) {
      best = {
        bodyA: a.body,
        bodyB: b.body,
        bodyAName: bodyRu[a.body] || a.body,
        bodyBName: bodyRu[b.body] || b.body,
        aspect: definition.name,
        aspectName: definition.ru,
        tone: definition.tone,
        exactAngle: definition.angle,
        distance: Number(distance.toFixed(3)),
        orb: Number(orb.toFixed(3)),
      };
    }
  }
  return best;
}

function synastryAspects(profileA, profileB) {
  const positionsA = profileA.calculation.positions;
  const positionsB = profileB.calculation.positions;
  const aspects = [];
  for (const a of positionsA) {
    for (const b of positionsB) {
      const aspect = aspectBetween(a, b);
      if (aspect) aspects.push(aspect);
    }
  }
  return aspects.sort((a, b) => a.orb - b.orb);
}

function aspectWeight(aspect) {
  const base = {
    conjunction: 1.25,
    trine: 1,
    sextile: 0.8,
    square: 1.15,
    opposition: 1.05,
  }[aspect.aspect] || 0.75;
  return base * Math.max(0.35, 1 - aspect.orb / 8);
}

function aspectSupportsAxis(aspect, axis) {
  const bodies = axisMeta[axis].bodies;
  return bodies.includes(aspect.bodyA) || bodies.includes(aspect.bodyB);
}

function toneScore(aspect, axis) {
  if (axis === "friction" || axis === "boundaries") {
    if (["square", "opposition"].includes(aspect.aspect)) return 1.2;
    if (aspect.aspect === "conjunction" && ["Mars", "Saturn", "Pluto"].some((body) => [aspect.bodyA, aspect.bodyB].includes(body))) return 1;
    return 0.35;
  }
  if (["trine", "sextile"].includes(aspect.aspect)) return 1.1;
  if (aspect.aspect === "conjunction") return 0.95;
  return 0.55;
}

function axisAspects(aspects, axis) {
  return aspects.filter((aspect) => aspectSupportsAxis(aspect, axis)).slice(0, 8);
}

function buildAxes(aspects, relationshipContext) {
  const weights = contextWeights[relationshipContext] || contextWeights.general;
  return Object.keys(axisMeta).map((axis) => {
    const selected = axisAspects(aspects, axis);
    const raw = selected.reduce((sum, aspect) => sum + aspectWeight(aspect) * toneScore(aspect, axis), 0) * (weights[axis] || 1);
    const intensity = Math.min(10, Math.max(1, raw * 1.55 + (selected.length ? 2 : 0)));
    const strongest = selected.slice(0, 4);
    return {
      key: axis,
      title: axisMeta[axis].title,
      intensity: Number(intensity.toFixed(1)),
      plain: axisMeta[axis].plain,
      strongest,
      reading: axisReading(axis, intensity, strongest),
    };
  });
}

function aspectLabel(aspect) {
  return `${aspect.bodyAName} A ${aspect.aspectName} ${aspect.bodyBName} B`;
}

function axisReading(axis, intensity, aspects) {
  const lead = aspects[0];
  const basis = lead ? `Главная расчетная опора: ${aspectLabel(lead)} с орбом ${lead.orb.toFixed(2)}°.` : "Ярких точных аспектов по этой оси немного.";
  const level = intensity >= 7.2 ? "сильная" : intensity >= 4.6 ? "заметная" : "мягкая";
  const text = {
    attraction: `Здесь ${level} тема взаимного интереса. Люди могут быстро замечать друг в друге живость, стиль, тепло или вызов.`,
    emotion: `Эмоциональный климат ${level === "сильная" ? "очень чувствительный" : `${level}`}. Важно смотреть, как пара обращается с уязвимостью, молчанием и ожиданием заботы.`,
    communication: `Коммуникация ${level}. Связь лучше раскрывается, когда люди проговаривают правила разговора и не считают, что другой обязан понимать намеки.`,
    friction: `Напряжение ${level}. Это не означает плохую связь, но показывает места, где энергия легко превращается в спор, давление или защиту.`,
    practical: `Практическая совместимость ${level}. Эта ось показывает, насколько реально строить дела, быт, проект, рабочий процесс или общие планы.`,
    growth: `Потенциал роста ${level}. Такая связь может расширять человека, но иногда рост ощущается как требование меняться быстрее, чем комфортно.`,
    boundaries: `Тема границ ${level}. Чем она сильнее, тем важнее ясность: что можно, что нельзя, где нужен темп, пауза или договоренность.`,
  }[axis];
  return `${text} ${basis}`;
}

function strongestBodyPattern(aspects, body) {
  return aspects.filter((aspect) => aspect.bodyA === body || aspect.bodyB === body).slice(0, 5);
}

function buildHypotheses(aspects, axes, relationshipContext) {
  const hypotheses = [];
  const moonSaturn = aspects.find((aspect) => [aspect.bodyA, aspect.bodyB].includes("Moon") && [aspect.bodyA, aspect.bodyB].includes("Saturn"));
  const venusMars = aspects.find((aspect) => [aspect.bodyA, aspect.bodyB].includes("Venus") && [aspect.bodyA, aspect.bodyB].includes("Mars"));
  const mercuryMars = aspects.find((aspect) => [aspect.bodyA, aspect.bodyB].includes("Mercury") && [aspect.bodyA, aspect.bodyB].includes("Mars"));
  const venusSaturn = aspects.find((aspect) => [aspect.bodyA, aspect.bodyB].includes("Venus") && [aspect.bodyA, aspect.bodyB].includes("Saturn"));
  const moonNeptune = aspects.find((aspect) => [aspect.bodyA, aspect.bodyB].includes("Moon") && [aspect.bodyA, aspect.bodyB].includes("Neptune"));
  const friction = axes.find((axis) => axis.key === "friction");
  const emotion = axes.find((axis) => axis.key === "emotion");
  const practical = axes.find((axis) => axis.key === "practical");

  if (moonSaturn) {
    hypotheses.push(`Смелая гипотеза: один человек может рядом с другим становиться строже к своим чувствам, будто тепло надо заслужить. Это проверяется по ${aspectLabel(moonSaturn)}.`);
  }
  if (venusMars && ["romantic", "marriage", "general"].includes(relationshipContext)) {
    hypotheses.push(`Смелая гипотеза: физическое или романтическое притяжение может включаться быстро, но ему нужен экологичный канал, иначе оно легко превращается в соревнование темпа.`);
  }
  if (mercuryMars) {
    hypotheses.push(`Смелая гипотеза: споры могут начинаться не из-за сути вопроса, а из-за скорости реакции. Один сказал резко, другой услышал нападение, и тема уехала в защиту.`);
  }
  if (venusSaturn) {
    hypotheses.push(`Смелая гипотеза: в этой связи может быть страх недостаточной ценности: кому-то важно доказательство серьезности, верности или стабильности.`);
  }
  if (moonNeptune) {
    hypotheses.push(`Смелая гипотеза: люди могут идеализировать эмоциональный контакт, а потом болезненно сталкиваться с тем, что другой не всегда угадывает состояние без слов.`);
  }
  if (friction?.intensity >= 7 && emotion?.intensity >= 6) {
    hypotheses.push("Смелая гипотеза: связь может быть одновременно притягательной и нервной. В ней много живого материала, но без правил разговора она быстро перегревается.");
  }
  if (practical?.intensity >= 7 && ["business", "coworkers"].includes(relationshipContext)) {
    hypotheses.push("Смелая гипотеза: для дела это может быть сильная связка, если заранее разделить зоны власти, денег и финального решения.");
  }
  if (!hypotheses.length) {
    hypotheses.push("Смелая гипотеза: связь может развиваться спокойнее, чем кажется по первому впечатлению; главный ресурс здесь в постепенном накоплении доверия и понятных договоренностей.");
  }
  return hypotheses.slice(0, 7);
}

function contextAdvice(relationshipContext) {
  return {
    romantic: [
      "В любви важны не только притяжение, но и способность выдерживать разные эмоциональные темпы.",
      "Не превращайте химию в тест на власть: сильное желание лучше работает там, где есть уважение к границам.",
    ],
    marriage: [
      "Для долгого союза проверяйте бытовые договоренности, деньги, отдых, семейные ожидания и способы мириться.",
      "Если есть сильные напряженные аспекты, их нужно переводить в правила, а не оставлять на уровне надежды.",
    ],
    friendship: [
      "В дружбе главный ресурс — свобода быть разными без постоянного доказывания правоты.",
      "Связь становится крепче, когда есть общая тема, совместный ритм и уважение к личному пространству.",
    ],
    business: [
      "Для бизнеса важнее заранее определить роли, деньги, ответственность, право подписи и способ выхода из конфликта.",
      "Сильное напряжение может быть ресурсом для результата, если есть регламент и понятный лидер процесса.",
    ],
    coworkers: [
      "В рабочей коммуникации не смешивайте личную симпатию с качеством задачи.",
      "Регулярные короткие сверки лучше длинных разговоров после накопленного раздражения.",
    ],
    parentChild: [
      "В детско-родительской динамике нельзя читать напряжение как вину. Оно показывает разные потребности и темпы развития.",
      "Главная задача взрослого — не победить характер ребенка, а понять, где нужна структура, а где принятие.",
    ],
    family: [
      "В семье многое держится на привычках, памяти и негласных правилах. Их полезно делать видимыми.",
      "Не все старые роли нужно продолжать: связь может стать мягче, если люди дают друг другу право измениться.",
    ],
    general: [
      "Для любой коммуникации важны ясные ожидания, уважение к разнице и способность возвращаться к разговору после напряжения.",
      "Не ищите один окончательный ярлык. Смотрите, какая ось связи требует внимания прямо сейчас.",
    ],
  }[relationshipContext] || [];
}

function buildSummary(axes, relationshipContext, personA, personB) {
  const ordered = [...axes].sort((a, b) => b.intensity - a.intensity);
  const top = ordered.slice(0, 3).map((axis) => axis.title.toLowerCase()).join(", ");
  const context = contextLabels[relationshipContext] || contextLabels.general;
  return [
    `Это исследование связи "${personA}" и "${personB}" в контексте: ${context}.`,
    `Самые заметные оси сейчас: ${top}. Это не verdict, а карта того, где связь звучит громче всего.`,
    "Отчет специально разделяет любовь, дружбу, деловую коммуникацию, напряжение, рост и границы, потому что одна и та же пара может быть сильной в одном типе связи и требовать осторожности в другом.",
  ];
}

function calculateCompatibility(input) {
  const relationshipContext = input.relationshipContext || "romantic";
  const personAName = input.personA?.name || input.nameA || "Человек A";
  const personBName = input.personB?.name || input.nameB || "Человек B";
  const common = { language: "ru", houseSystem: "equal-from-ascendant" };
  const profileA = calculateChart({ ...common, ...(input.personA || {}), name: personAName });
  const profileB = calculateChart({ ...common, ...(input.personB || {}), name: personBName });
  const aspects = synastryAspects(profileA, profileB);
  const axes = buildAxes(aspects, relationshipContext);
  const hypotheses = buildHypotheses(aspects, axes, relationshipContext);
  const closeAspects = aspects.slice(0, 12);
  const moonPattern = [...strongestBodyPattern(aspects, "Moon")];
  const mercuryPattern = [...strongestBodyPattern(aspects, "Mercury")];
  const saturnPattern = [...strongestBodyPattern(aspects, "Saturn")];

  return {
    relationshipContext,
    relationshipLabel: contextLabels[relationshipContext] || contextLabels.general,
    people: {
      a: { name: personAName, birthData: profileA.birthData },
      b: { name: personBName, birthData: profileB.birthData },
    },
    summary: buildSummary(axes, relationshipContext, personAName, personBName),
    axes,
    closeAspects,
    hypotheses,
    deepResearch: {
      emotionalPattern: moonPattern.length
        ? `Эмоциональная линия читается через ${moonPattern.map(aspectLabel).join("; ")}. Здесь важно смотреть не только любовь, но и реакцию на усталость, молчание, обиду и просьбу о заботе.`
        : "Эмоциональная линия не перегружена точными лунными аспектами, поэтому многое будет зависеть от зрелости общения и реального поведения.",
      communicationPattern: mercuryPattern.length
        ? `Коммуникационная линия читается через ${mercuryPattern.map(aspectLabel).join("; ")}. Важны темп речи, способность уточнять и привычка не додумывать за другого.`
        : "Коммуникационная линия не имеет сильного перегруза по Меркурию; это дает шанс выстраивать язык связи осознанно.",
      responsibilityPattern: saturnPattern.length
        ? `Линия ответственности читается через ${saturnPattern.map(aspectLabel).join("; ")}. Сатурн показывает, где связь требует времени, зрелости и правил.`
        : "Сатурнианская линия выражена умеренно: долгосрочность будет больше зависеть от решений людей, чем от сильного ощущения долга.",
    },
    forecast: [
      "Ближайший практический прогноз лучше строить не как событие, а как режим наблюдения: какая ось чаще всего включается в реальности.",
      "Если повторяются конфликты, не спорьте о всей связи целиком. Выделите один сценарий: деньги, время, ревность, контроль, быт, ответственность или тон разговора.",
      "Если связь важна, в ближайший период полезны короткие регулярные сверки: что работает, что раздражает, о чем мы не договорились, где нужна пауза.",
      ...contextAdvice(relationshipContext),
    ],
    safetyNote: "Этот отчет не решает за людей, быть им вместе или нет. Он показывает вероятные паттерны связи, сильные стороны, риски и темы для честного разговора.",
  };
}

module.exports = {
  calculateCompatibility,
  synastryAspects,
  aspectBetween,
};
