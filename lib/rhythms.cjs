const { calculateChart } = require("./astro.cjs");

const dayMs = 24 * 60 * 60 * 1000;

const curves = [
  {
    key: "body",
    title: "Физическое здоровье",
    short: "Биоритм тела",
    color: "#9a4038",
    period: 23,
    phase: 0.15,
    markers: "Марс, Солнце, 6-й дом",
    meaning: "выносливость, тонус, восстановление, телесная нагрузка",
    high: "подходит для активности, тренировок и задач, где нужно тело",
    low: "лучше снижать перегрузки и бережнее относиться к режиму",
  },
  {
    key: "emotion",
    title: "Эмоциональность",
    short: "Настроение",
    color: "#477089",
    period: 29.53,
    phase: 0.42,
    markers: "Луна и лунные фазы",
    meaning: "настроение, эмпатия, стресс, эмоциональная восприимчивость",
    high: "эмоции легче выражаются, больше отклика и живости",
    low: "лучше не принимать окончательных решений из состояния перепада",
  },
  {
    key: "mind",
    title: "Ментальная активность",
    short: "Интеллект",
    color: "#265e5b",
    period: 88,
    phase: 0.3,
    markers: "Меркурий",
    meaning: "концентрация, обучение, память, скорость решений",
    high: "хорошо учиться, писать, считать, вести переговоры",
    low: "нужны паузы, проверка деталей и меньше многозадачности",
  },
  {
    key: "love",
    title: "Личная жизнь и любовь",
    short: "Любовь",
    color: "#b68634",
    period: 225,
    phase: 0.58,
    markers: "Венера и 7-й дом",
    meaning: "романтика, притягательность, гармония, контакт с партнером",
    high: "проще создавать тепло, красоту и мягкий контакт",
    low: "лучше не давить на отношения ожиданиями и проверками",
  },
  {
    key: "business",
    title: "Деловая активность и финансы",
    short: "Дела и деньги",
    color: "#4f6f3a",
    period: 399,
    phase: 0.22,
    markers: "Юпитер, Сатурн, 2-й и 10-й дома",
    meaning: "карьера, деньги, покупки, стратегия, дисциплина",
    high: "подходит для планов, переговоров, крупных задач и роста",
    low: "лучше укреплять базу и не рисковать из нетерпения",
  },
  {
    key: "intuition",
    title: "Интуиция и духовная энергия",
    short: "Интуиция",
    color: "#7f5aa2",
    period: 165,
    phase: 0.73,
    markers: "Нептун, Плутон, 12-й дом",
    meaning: "сны, внутренний голос, глубинная чувствительность, защита",
    high: "полезны тишина, наблюдение, творчество и духовная практика",
    low: "лучше отличать интуицию от тревоги и не уходить в туман",
  },
  {
    key: "luck",
    title: "Общий график удачи",
    short: "Линия судьбы",
    color: "#202126",
    period: 120,
    phase: 0.11,
    markers: "интегральный показатель",
    meaning: "общий поток, согласованность сфер, ощущение попутного ветра",
    high: "можно двигать важные дела и просить больше от обстоятельств",
    low: "период тише: лучше сохранять силы и закрывать хвосты",
  },
];

function normalize(value) {
  return Math.max(0, Math.min(100, value));
}

function dateFromInput(value) {
  return value ? new Date(`${value}T00:00:00Z`) : new Date();
}

function daysBetween(a, b) {
  return (b.getTime() - a.getTime()) / dayMs;
}

function natalSeed(profile, key) {
  const positions = profile.calculation.positions;
  const bodyByKey = {
    body: "Mars",
    emotion: "Moon",
    mind: "Mercury",
    love: "Venus",
    business: "Jupiter",
    intuition: "Neptune",
    luck: "Sun",
  }[key];
  const position = positions.find((item) => item.body === bodyByKey) || positions[0];
  return (position.tropicalLongitude || 0) / 360;
}

function curveValue(curve, profile, date, birthDate) {
  const ageDays = daysBetween(birthDate, date);
  const seed = natalSeed(profile, curve.key);
  const waveA = Math.sin(Math.PI * 2 * (ageDays / curve.period + curve.phase + seed));
  const waveB = Math.sin(Math.PI * 2 * (ageDays / (curve.period * 2.7) + seed * 0.7));
  const value = 50 + waveA * 32 + waveB * 13;
  return Math.round(normalize(value));
}

function calculateRhythms(input) {
  const profile = calculateChart({ ...input, language: "ru", houseSystem: "equal-from-ascendant" });
  const birthDate = new Date(profile.birthData.datetimeUtc);
  const startDate = dateFromInput(input.startDate);
  const days = Math.max(7, Math.min(365, Number(input.days || 30)));
  const points = Array.from({ length: days }, (_, index) => {
    const date = new Date(startDate.getTime() + index * dayMs);
    const values = Object.fromEntries(curves.map((curve) => [curve.key, curveValue(curve, profile, date, birthDate)]));
    values.luck = Math.round(normalize((values.body + values.emotion + values.mind + values.love + values.business + values.intuition) / 6));
    return { date: date.toISOString().slice(0, 10), values };
  });
  const today = points[0];
  const summaries = curves.map((curve) => {
    const value = today.values[curve.key];
    const state = value >= 68 ? "пик" : value <= 35 ? "низина" : "рабочая зона";
    const advice = value >= 68 ? curve.high : value <= 35 ? curve.low : "можно действовать спокойно, без рывка и без откладывания";
    return { ...curve, value, state, advice };
  });

  return {
    subject: profile.subject,
    birthData: profile.birthData,
    startDate: today.date,
    days,
    points,
    summaries,
    safetyNote: "Графики являются астрологической и биоритмической моделью для планирования внимания. Они не являются медицинской диагностикой, финансовым прогнозом или гарантией событий.",
  };
}

module.exports = {
  calculateRhythms,
  curves,
};
