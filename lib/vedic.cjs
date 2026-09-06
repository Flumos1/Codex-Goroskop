const { calculateChart } = require("./astro.cjs");

const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const signRu = {
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
const grahaRu = {
  Sun: "Сурья / Солнце",
  Moon: "Чандра / Луна",
  Mercury: "Будха / Меркурий",
  Venus: "Шукра / Венера",
  Mars: "Мангала / Марс",
  Jupiter: "Гуру / Юпитер",
  Saturn: "Шани / Сатурн",
  Rahu: "Раху",
  Ketu: "Кету",
};
const rulers = {
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
const nakshatras = [
  "Ашвини", "Бхарани", "Криттика", "Рохини", "Мригашира", "Ардра", "Пунарвасу", "Пушья", "Ашлеша",
  "Магха", "Пурва Пхалгуни", "Уттара Пхалгуни", "Хаста", "Читра", "Свати", "Вишакха", "Анурадха", "Джйештха",
  "Мула", "Пурва Ашадха", "Уттара Ашадха", "Шравана", "Дхаништха", "Шатабхиша", "Пурва Бхадрапада", "Уттара Бхадрапада", "Ревати",
];
const dashaOrder = [
  ["Ketu", 7],
  ["Venus", 20],
  ["Sun", 6],
  ["Moon", 10],
  ["Mars", 7],
  ["Rahu", 18],
  ["Jupiter", 16],
  ["Saturn", 19],
  ["Mercury", 17],
];
const grahaThemes = {
  Sun: {
    essence: "самоопределение, видимость, отношения с авторитетом и право занимать свое место",
    advice: "прояснять, где вы действуете из внутреннего достоинства, а где пытаетесь заслужить признание",
  },
  Moon: {
    essence: "эмоции, привычки, безопасность, семья, тело и способность восстанавливаться",
    advice: "настроить ритм жизни так, чтобы психика не жила только на рывках и тревоге",
  },
  Mars: {
    essence: "воля, действие, конфликт, защита границ и смелость начинать",
    advice: "переводить напряжение в точные действия, а не в резкие реакции",
  },
  Mercury: {
    essence: "мышление, обучение, речь, документы, сделки и способность связывать людей",
    advice: "навести порядок в коммуникации, договоренностях и ежедневных решениях",
  },
  Jupiter: {
    essence: "смысл, наставники, вера, рост, обучение и дальняя перспектива",
    advice: "выбирать рост через знание и этику, а не через обещание легкой удачи",
  },
  Venus: {
    essence: "отношения, вкус, удовольствие, деньги, красота и способность принимать жизнь",
    advice: "учиться мягкости без потери ценностей и ясности в желаниях",
  },
  Saturn: {
    essence: "ответственность, время, дисциплина, ограничения и зрелые результаты",
    advice: "строить устойчивость маленькими регулярными шагами, не путая паузу с поражением",
  },
  Rahu: {
    essence: "новизна, желание, амбиция, непривычная среда и резкое расширение опыта",
    advice: "проверять сильные желания на реальность и не отдавать им весь руль сразу",
  },
  Ketu: {
    essence: "отделение, внутренняя свобода, опыт прошлого, завершение и духовная дистанция",
    advice: "не убегать от мира, но честно отпускать то, что уже стало пустой формой",
  },
};
const focusTopics = {
  general: {
    title: "Общий вектор",
    houses: [1, 5, 9, 10],
    plain: "сейчас важнее всего смотреть, какая тема повторяется в лагне, Луне и периоде",
    action: "выберите один главный вектор на ближайшие месяцы и не распыляйте силы на все сразу",
  },
  work: {
    title: "Работа и дело",
    houses: [2, 6, 10, 11],
    plain: "профессиональная тема раскрывается через режим, навыки, видимый результат, доходы и долгосрочные цели",
    action: "переведите идеи периода в расписание, конкретные обязательства и измеримый результат",
  },
  relationships: {
    title: "Отношения",
    houses: [4, 5, 7, 8],
    plain: "отношения здесь читаются не как приговор, а как тема доверия, диалога, эмоциональной близости и честных договоренностей",
    action: "смотрите, где нужен разговор, где граница, а где больше тепла и терпения",
  },
  money: {
    title: "Деньги и ресурсы",
    houses: [2, 6, 10, 11, 12],
    plain: "денежная тема связана с ценностями, ежедневной работой, доходами, целями и тем, куда утекает энергия",
    action: "разделите желания, обязательные расходы и реальные источники роста; период лучше использовать через порядок, а не азарт",
  },
  inner: {
    title: "Внутреннее состояние",
    houses: [1, 4, 8, 12],
    plain: "психологический слой показывает, где человеку нужно восстановление, честность с собой и бережная перестройка привычек",
    action: "не давите на себя только волей; создайте условия, в которых нервная система сможет выдохнуть и собраться",
  },
  spiritual: {
    title: "Духовный путь",
    houses: [5, 8, 9, 12],
    plain: "духовный вектор связан со смыслом, учителями, практикой, отпусканием и глубинным изменением отношения к жизни",
    action: "оставьте место для тишины, обучения и практики; сейчас важна не эффектность, а регулярность",
  },
};

function normalizeDegrees(value) {
  return ((value % 360) + 360) % 360;
}

function decimalYear(date) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const end = Date.UTC(date.getUTCFullYear() + 1, 0, 1);
  return date.getUTCFullYear() + ((date.getTime() - start) / (end - start));
}

function lahiriAyanamsa(date) {
  return 22.460148 + 1.396042 * ((decimalYear(date) - 1900) / 100);
}

function signFromLongitude(longitude) {
  const normalized = normalizeDegrees(longitude);
  const sign = signs[Math.floor(normalized / 30)];
  return {
    longitude: Number(normalized.toFixed(6)),
    sign,
    signName: signRu[sign],
    degreeInSign: Number((normalized % 30).toFixed(6)),
  };
}

function houseFromLagna(sign, lagnaSign) {
  const signIndex = signs.indexOf(sign);
  const lagnaIndex = signs.indexOf(lagnaSign);
  return ((signIndex - lagnaIndex + 12) % 12) + 1;
}

function nakshatraFromLongitude(longitude) {
  const normalized = normalizeDegrees(longitude);
  const span = 360 / 27;
  const padaSpan = span / 4;
  const index = Math.floor(normalized / span);
  const pada = Math.floor((normalized - index * span) / padaSpan) + 1;
  const lord = dashaOrder[index % dashaOrder.length][0];
  return {
    name: nakshatras[index],
    index,
    pada,
    lord,
    lordName: grahaRu[lord],
    progress: (normalized - index * span) / span,
  };
}

function yearsBetween(from, to) {
  return (to.getTime() - from.getTime()) / (365.2425 * 24 * 60 * 60 * 1000);
}

function dashaAtDate(moonNakshatra, birthDate, targetDate = new Date()) {
  const birthLordIndex = dashaOrder.findIndex(([lord]) => lord === moonNakshatra.lord);
  const birthLordYears = dashaOrder[birthLordIndex][1];
  const firstRemaining = birthLordYears * (1 - moonNakshatra.progress);
  let elapsed = yearsBetween(birthDate, targetDate);
  let orderIndex = birthLordIndex;
  let periodYears = firstRemaining;
  let periodStartAge = 0;

  if (elapsed <= periodYears) {
    return buildDasha(orderIndex, periodStartAge, periodYears, elapsed, birthDate);
  }

  elapsed -= periodYears;
  periodStartAge += periodYears;
  orderIndex = (orderIndex + 1) % dashaOrder.length;

  for (let guard = 0; guard < 24; guard += 1) {
    periodYears = dashaOrder[orderIndex][1];
    if (elapsed <= periodYears) return buildDasha(orderIndex, periodStartAge, periodYears, elapsed, birthDate);
    elapsed -= periodYears;
    periodStartAge += periodYears;
    orderIndex = (orderIndex + 1) % dashaOrder.length;
  }

  return buildDasha(orderIndex, periodStartAge, periodYears, elapsed, birthDate);
}

function addYears(date, years) {
  return new Date(date.getTime() + years * 365.2425 * 24 * 60 * 60 * 1000);
}

function buildDasha(orderIndex, startAge, years, elapsedInside, birthDate) {
  const [lord] = dashaOrder[orderIndex];
  return {
    lord,
    lordName: grahaRu[lord],
    totalYears: years,
    elapsedYears: Number(elapsedInside.toFixed(2)),
    remainingYears: Number(Math.max(0, years - elapsedInside).toFixed(2)),
    startDate: addYears(birthDate, startAge).toISOString().slice(0, 10),
    endDate: addYears(birthDate, startAge + years).toISOString().slice(0, 10),
  };
}

function ownedHouses(graha, lagnaSign) {
  return signs
    .filter((sign) => rulers[sign] === graha)
    .map((sign) => houseFromLagna(sign, lagnaSign))
    .sort((a, b) => a - b);
}

function topicForHouse(house) {
  return {
    1: "личность, тело, первый импульс и самостоятельность",
    2: "ресурсы, речь, ценности и семейная опора",
    3: "инициатива, навыки, обучение и близкое окружение",
    4: "дом, внутренний покой, родовая база и чувство защищенности",
    5: "творчество, дети как тема, вдохновение и личная радость",
    6: "режим, работа, здоровье как забота о привычках и преодоление трудностей",
    7: "партнерство, договоренности, союз и умение видеть другого",
    8: "кризисы, доверие, трансформация и скрытые процессы",
    9: "смысл, вера, учителя, дальние горизонты и благословение опыта",
    10: "карьера, статус, долг, действия в обществе и видимый результат",
    11: "доходы, цели, поддержка групп и долгосрочные желания",
    12: "отпускание, уединение, духовная практика, расходы и дальние пространства",
  }[house];
}

function roleTone(houses) {
  if (houses.some((house) => [1, 5, 9].includes(house))) return "поддерживающая или развивающая";
  if (houses.some((house) => [6, 8, 12].includes(house))) return "требующая внимательности и зрелого обращения";
  if (houses.some((house) => [2, 7].includes(house))) return "смешанная, связанная с ценностями и отношениями";
  return "контекстная";
}

function formatHouseList(houses) {
  if (!houses.length) return "без управляемых домов в базовой схеме";
  return houses.map((house) => `${house}-й дом`).join(", ");
}

function buildPrediction(dasha, dashaPlacement, owned) {
  const theme = grahaThemes[dasha.lord] || grahaThemes.Saturn;
  const houseTopic = dashaPlacement ? topicForHouse(dashaPlacement.house) : "важные темы карты";
  const ownedTopics = owned.map(topicForHouse).filter(Boolean).slice(0, 2).join("; ");
  return [
    `Сейчас активен период ${dasha.lordName}. Человеческим языком: сильнее звучит тема "${theme.essence}".`,
    dashaPlacement
      ? `Так как этот граха стоит в ${dashaPlacement.house}-м доме от лагны, период может чаще поднимать вопросы про ${houseTopic}.`
      : "Для Раху и Кету в этой версии пока нет точного положения, поэтому прогноз дается как общий тематический ориентир.",
    ownedTopics
      ? `Через управление домами добавляется слой: ${ownedTopics}. Это не обещает событие, но показывает, куда может уходить внимание и энергия.`
      : "Главный ориентир периода сейчас читается через общий смысл грахи, без дополнительного слоя управления домами.",
    `Практический совет на период: ${theme.advice}.`,
  ];
}

function buildFocusReading(focusKey, dasha, dashaPlacement, owned) {
  const focus = focusTopics[focusKey] || focusTopics.general;
  const repeatedHouses = [...new Set([
    ...(dashaPlacement ? [dashaPlacement.house] : []),
    ...owned,
  ])].filter((house) => focus.houses.includes(house));
  const repeatedText = repeatedHouses.length
    ? repeatedHouses.map((house) => `${house}-й дом: ${topicForHouse(house)}`).join("; ")
    : "прямого попадания в ключевые дома темы немного, поэтому читать вопрос лучше через общий характер периода";
  const theme = grahaThemes[dasha.lord] || grahaThemes.Saturn;

  return {
    key: focusKey,
    title: focus.title,
    summary: `Фокус "${focus.title}" читается через выбранную тему и текущую махадашу ${dasha.lordName}.`,
    items: [
      `Простыми словами: ${focus.plain}.`,
      `Что в карте сейчас подсвечено для этой темы: ${repeatedText}.`,
      `Планета периода добавляет свой тон: ${theme.essence}.`,
      `Практический ход: ${focus.action}.`,
    ],
  };
}

function calculateVedic(input, options = {}) {
  const profile = calculateChart({ ...input, houseSystem: "whole-sign", language: input.language || "ru" });
  const birthDate = new Date(profile.birthData.datetimeUtc);
  const targetDate = options.targetDate ? new Date(options.targetDate) : new Date();
  const ayanamsa = lahiriAyanamsa(birthDate);
  const lagna = signFromLongitude(profile.calculation.angles.ascendant.longitude - ayanamsa);
  const siderealPositions = profile.calculation.positions.map((position) => {
    const sidereal = signFromLongitude(position.tropicalLongitude - ayanamsa);
    return {
      body: position.body,
      bodyName: grahaRu[position.body] || position.body,
      tropicalLongitude: position.tropicalLongitude,
      siderealLongitude: sidereal.longitude,
      rashi: sidereal.sign,
      rashiName: sidereal.signName,
      degreeInRashi: sidereal.degreeInSign,
      house: houseFromLagna(sidereal.sign, lagna.sign),
      ownedHouses: ownedHouses(position.body, lagna.sign),
    };
  });
  const moon = siderealPositions.find((position) => position.body === "Moon");
  const moonNakshatra = nakshatraFromLongitude(moon.siderealLongitude);
  const dasha = dashaAtDate(moonNakshatra, birthDate, targetDate);
  const dashaPlacement = siderealPositions.find((position) => position.body === dasha.lord) || null;
  const dashaOwnedHouses = ownedHouses(dasha.lord, lagna.sign);
  const focusKey = input.questionFocus || "general";
  const focusGrahas = siderealPositions
    .filter((position) => ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"].includes(position.body))
    .map((position) => ({
      ...position,
      roleTone: roleTone(position.ownedHouses),
      houseTopic: topicForHouse(position.house),
      ownedHouseText: formatHouseList(position.ownedHouses),
    }));
  const prediction = buildPrediction(dasha, dashaPlacement, dashaOwnedHouses);
  const focusReading = buildFocusReading(focusKey, dasha, dashaPlacement, dashaOwnedHouses);

  return {
    subject: profile.subject,
    birthData: profile.birthData,
    method: {
      system: "Jyotish / Vedic astrology",
      zodiac: "sidereal / nirayana",
      ayanamsa: "approximate Lahiri",
      ayanamsaDegrees: Number(ayanamsa.toFixed(4)),
      referencePoint: "Lagna",
      chartLayer: "D-1 Rashi prototype",
      targetDate: targetDate.toISOString().slice(0, 10),
      limitation: "Это прототип: без полной профессиональной проверки айанамши, варг, силы планет и ректификации времени.",
    },
    lagna: {
      ...lagna,
      title: `Лагна в знаке ${lagna.signName}`,
      explanation: `Главный вход в карту идет через ${lagna.signName}. Это описывает способ начинать, реагировать и строить жизненную траекторию. В этой версии дома считаются от лагны по цельнознаковой схеме.`,
    },
    moon: {
      rashi: moon.rashi,
      rashiName: moon.rashiName,
      degreeInRashi: moon.degreeInRashi,
      nakshatra: moonNakshatra,
      explanation: `Луна находится в накшатре ${moonNakshatra.name}, ${moonNakshatra.pada}-я пада. Это слой привычек ума, эмоционального ритма и того, как человеку легче восстанавливаться.`,
    },
    currentDasha: {
      ...dasha,
      placement: dashaPlacement,
      ownedHouses: dashaOwnedHouses,
      ownedHouseText: formatHouseList(dashaOwnedHouses),
      prediction,
    },
    focusReading,
    positions: focusGrahas,
    humanSummary: [
      `Карта читается от лагны: ${lagna.signName}. Это основной ориентир для домов и жизненных тем.`,
      `Луна в накшатре ${moonNakshatra.name} показывает эмоциональный стиль и запускает расчет периода Вимшоттари.`,
      `Текущий большой период: ${dasha.lordName}, примерно до ${dasha.endDate}. Это время лучше читать как усиление темы, а не как приговор или обязательное событие.`,
    ],
    safetyNote: "Прогнозный блок говорит о вероятных акцентах периода. Он не заменяет медицинские, финансовые, юридические или личные решения и не делает фатальных утверждений.",
  };
}

module.exports = {
  calculateVedic,
  dashaAtDate,
  lahiriAyanamsa,
  nakshatraFromLongitude,
  signFromLongitude,
};
