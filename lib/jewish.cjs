const path = require("path");
const { calculateChart } = require("./astro.cjs");

const hebrewMonthRows = require(path.join("..", "data", "hebrew-calendar-months.json"));

const monthBySign = {
  Aries: {
    month: "Нисан",
    hebrew: "Nisan",
    signName: "Овен",
    sefirah: "Хесед",
    title: "Импульс освобождения",
    tikkun: "учиться действовать смело, но не сжигать пространство другого человека своим напором",
    shadow: "нетерпение, желание немедленно пробить стену, спор ради победы",
    gift: "первый шаг, смелость, способность разбудить жизнь там, где все застоялось",
  },
  Taurus: {
    month: "Ияр",
    hebrew: "Iyar",
    signName: "Телец",
    sefirah: "Гвура",
    title: "Исцеление через устойчивость",
    tikkun: "отличать настоящую опору от привязанности к комфорту и контролю",
    shadow: "упрямство, страх потери, медленное отпускание старого",
    gift: "терпение, верность телу, способность создавать надежную форму",
  },
  Gemini: {
    month: "Сиван",
    hebrew: "Sivan",
    signName: "Близнецы",
    sefirah: "Тиферет",
    title: "Слово как мост",
    tikkun: "перевести любопытство в ясную связь, а не в рассеивание внимания",
    shadow: "раздвоенность, тревожная смена мнений, разговор вместо выбора",
    gift: "обучение, язык, гибкость, умение соединять людей и идеи",
  },
  Cancer: {
    month: "Таммуз",
    hebrew: "Tammuz",
    signName: "Рак",
    sefirah: "Нецах",
    title: "Память сердца",
    tikkun: "заботиться, не превращая заботу в зависимость или скрытую обиду",
    shadow: "обидчивость, уход в прошлое, эмоциональная защита вместо просьбы",
    gift: "тепло, память, дом, способность хранить живую связь",
  },
  Leo: {
    month: "Ав",
    hebrew: "Av",
    signName: "Лев",
    sefirah: "Ход",
    title: "Свет достоинства",
    tikkun: "сиять так, чтобы свет не становился требованием поклонения",
    shadow: "гордость, драматизация, болезненная потребность в признании",
    gift: "сердце, щедрость, творческое лидерство, радость проявления",
  },
  Virgo: {
    month: "Элюль",
    hebrew: "Elul",
    signName: "Дева",
    sefirah: "Йесод",
    title: "Исправление через точность",
    tikkun: "служить жизни, не превращая путь в бесконечную критику себя и других",
    shadow: "перфекционизм, тревожный анализ, страх ошибки",
    gift: "чистота действия, ремесло, внимание к деталям, практическая помощь",
  },
  Libra: {
    month: "Тишрей",
    hebrew: "Tishrei",
    signName: "Весы",
    sefirah: "Малхут",
    title: "Весы выбора",
    tikkun: "искать мир без потери честности и собственного центра",
    shadow: "зависимость от оценки, избегание конфликта, внешняя гармония вместо правды",
    gift: "справедливость, красота, партнерство, умение слышать обе стороны",
  },
  Scorpio: {
    month: "Мар-Хешван",
    hebrew: "Mar-Cheshvan",
    signName: "Скорпион",
    sefirah: "Кетер",
    title: "Сила трансформации",
    tikkun: "проходить глубину без контроля, подозрения и желания владеть чужой тайной",
    shadow: "ревность, крайности, молчаливое давление, страх уязвимости",
    gift: "глубина, верность правде, способность к обновлению после кризиса",
  },
  Sagittarius: {
    month: "Кислев",
    hebrew: "Kislev",
    signName: "Стрелец",
    sefirah: "Хохма",
    title: "Огонь смысла",
    tikkun: "соединить веру с ответственностью, а свободу с уважением к последствиям",
    shadow: "избыточные обещания, бегство от ограничений, уверенность без проверки",
    gift: "смысл, обучение, вера, широкий горизонт и способность вдохновлять",
  },
  Capricorn: {
    month: "Тевет",
    hebrew: "Tevet",
    signName: "Козерог",
    sefirah: "Бина",
    title: "Форма и ответственность",
    tikkun: "строить результат без ожесточения, холода и жизни только через долг",
    shadow: "жесткость, страх слабости, позднее разрешение себе радоваться",
    gift: "структура, зрелость, выдержка, способность подниматься шаг за шагом",
  },
  Aquarius: {
    month: "Шват",
    hebrew: "Shevat",
    signName: "Водолей",
    sefirah: "Даат",
    title: "Свобода соединения",
    tikkun: "быть свободным, не становясь отстраненным или эмоционально недоступным",
    shadow: "холодная дистанция, протест ради протеста, жизнь только идеей",
    gift: "видение будущего, дружба, нестандартность, связь с группой",
  },
  Pisces: {
    month: "Адар",
    hebrew: "Adar",
    signName: "Рыбы",
    sefirah: "Хесед",
    title: "Милость и растворение",
    tikkun: "сострадать без спасательства, верить без самообмана",
    shadow: "размытые границы, идеализация, уход от конкретного выбора",
    gift: "милосердие, воображение, духовная чувствительность, способность смягчать мир",
  },
};

const numberLayers = {
  1: { name: "Кетер", theme: "воля и первичный импульс", practice: "не торопиться доказывать силу; начинать с ясного намерения" },
  2: { name: "Хохма", theme: "озарение и внутреннее знание", practice: "записывать идеи и проверять их реальностью" },
  3: { name: "Бина", theme: "понимание, форма и зрелость", practice: "дать идее структуру, срок и границы" },
  4: { name: "Хесед", theme: "щедрость, расширение и доверие", practice: "делиться ресурсом без потери меры" },
  5: { name: "Гвура", theme: "граница, дисциплина и сила отказа", practice: "говорить нет раньше, чем накопится раздражение" },
  6: { name: "Тиферет", theme: "сердце, красота и согласование противоположностей", practice: "искать не победу, а честную середину" },
  7: { name: "Нецах", theme: "желание, движение и преодоление", practice: "направлять страсть в действие, а не в драму" },
  8: { name: "Ход", theme: "язык, анализ и точность символа", practice: "очищать речь от лишнего шума" },
  9: { name: "Йесод", theme: "связь, память и невидимый фундамент", practice: "укреплять режим, сон, доверие и внутреннюю опору" },
};

function reduceNumber(value) {
  let n = Math.abs(Number(value) || 0);
  while (n > 9) n = String(n).split("").reduce((sum, digit) => sum + Number(digit), 0);
  return n || 9;
}

function nameNumber(name) {
  const text = String(name || "").toLowerCase();
  let total = 0;
  for (const char of text) {
    if (/[a-zа-яёіїєґ]/i.test(char)) total += (char.codePointAt(0) % 9) + 1;
  }
  return reduceNumber(total);
}

function dayNumber(dateText) {
  return reduceNumber(String(dateText || "").replace(/\D/g, "").split("").reduce((sum, digit) => sum + Number(digit), 0));
}

const hebrewMonthByAlias = new Map();
for (const row of hebrewMonthRows) {
  for (const alias of row.aliases || [row.key]) {
    hebrewMonthByAlias.set(String(alias).toLowerCase(), row);
  }
}

function addDays(dateText, days) {
  const date = new Date(`${dateText}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function dayOfYear(year, month, day) {
  const start = Date.UTC(year, 0, 1);
  const current = Date.UTC(year, month - 1, day);
  return Math.floor((current - start) / 86400000) + 1;
}

function normalizeDegrees(value) {
  return ((value % 360) + 360) % 360;
}

function normalizeHours(value) {
  return ((value % 24) + 24) % 24;
}

function calculateSunsetUtc(dateText, latitude, longitude) {
  const [year, month, day] = String(dateText).split("-").map(Number);
  if (![year, month, day, latitude, longitude].every(Number.isFinite)) return null;

  const zenith = 90.833;
  const n = dayOfYear(year, month, day);
  const lngHour = longitude / 15;
  const t = n + ((18 - lngHour) / 24);
  const meanAnomaly = (0.9856 * t) - 3.289;
  const trueLongitude = normalizeDegrees(
    meanAnomaly
    + (1.916 * Math.sin(meanAnomaly * Math.PI / 180))
    + (0.02 * Math.sin(2 * meanAnomaly * Math.PI / 180))
    + 282.634
  );
  let rightAscension = Math.atan(0.91764 * Math.tan(trueLongitude * Math.PI / 180)) * 180 / Math.PI;
  rightAscension = normalizeDegrees(rightAscension);
  rightAscension += Math.floor(trueLongitude / 90) * 90 - Math.floor(rightAscension / 90) * 90;
  rightAscension /= 15;

  const sinDeclination = 0.39782 * Math.sin(trueLongitude * Math.PI / 180);
  const cosDeclination = Math.cos(Math.asin(sinDeclination));
  const cosHour = (
    Math.cos(zenith * Math.PI / 180)
    - (sinDeclination * Math.sin(latitude * Math.PI / 180))
  ) / (cosDeclination * Math.cos(latitude * Math.PI / 180));

  if (cosHour < -1 || cosHour > 1) return null;

  const hourAngle = Math.acos(cosHour) * 180 / Math.PI / 15;
  const localMeanTime = hourAngle + rightAscension - (0.06571 * t) - 6.622;
  const utcHour = normalizeHours(localMeanTime - lngHour);
  const base = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  base.setUTCMinutes(Math.round(utcHour * 60));
  return base;
}

function formatTimeInZone(date, timeZone) {
  if (!date || !timeZone) return null;
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(date);
}

function parseHebrewDate(dateText) {
  const date = new Date(`${dateText}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat("en-u-ca-hebrew", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).formatToParts(date);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const monthName = parts.find((part) => part.type === "month")?.value || "Nisan";
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const monthRow = hebrewMonthByAlias.get(monthName.toLowerCase()) || hebrewMonthByAlias.get("nisan");
  return {
    day,
    year,
    monthKey: monthRow.key,
    monthEnglish: monthName,
    monthRu: monthRow.ru,
    monthOrder: monthRow.order,
    zodiacSign: monthRow.zodiacSign,
    leapMonth: Boolean(monthRow.leapMonth),
  };
}

function calculateHebrewCalendar(profile) {
  const birth = profile.birthData;
  const sunsetUtc = calculateSunsetUtc(birth.localDate, Number(birth.latitude), Number(birth.longitude));
  const birthUtc = new Date(birth.datetimeUtc);
  const afterSunset = Boolean(sunsetUtc && birthUtc >= sunsetUtc);
  const civilDateUsed = afterSunset ? addDays(birth.localDate, 1) : birth.localDate;
  const hebrewDate = parseHebrewDate(civilDateUsed);

  return {
    ...hebrewDate,
    civilDateUsed,
    birthLocalDate: birth.localDate,
    birthLocalTime: birth.localTime,
    place: birth.place,
    timeZone: birth.timeZone,
    sunsetLocalTime: formatTimeInZone(sunsetUtc, birth.timeZone),
    sunsetUtc: sunsetUtc ? sunsetUtc.toISOString() : null,
    afterSunset,
    precision: sunsetUtc ? "calculated-sunset" : "calendar-date-without-polar-sunset",
  };
}

function calculateJewish(input) {
  const profile = calculateChart({ ...input, language: "ru", houseSystem: "whole-sign" });
  const hebrewCalendar = calculateHebrewCalendar(profile);
  const sun = profile.calculation.positions.find((position) => position.body === "Sun");
  const month = {
    ...(monthBySign[hebrewCalendar.zodiacSign] || monthBySign[sun.sign] || monthBySign.Aries),
    month: hebrewCalendar.monthRu,
    hebrew: hebrewCalendar.monthKey,
  };
  const nameLayer = numberLayers[nameNumber(input.name || profile.subject?.nickname)];
  const dateLayer = numberLayers[dayNumber(profile.birthData.localDate)];
  const synthesis = [
    `Еврейская дата рождения: ${hebrewCalendar.day} ${month.month} ${hebrewCalendar.year}. ${hebrewCalendar.afterSunset ? `Так как рождение указано после захода солнца (${hebrewCalendar.sunsetLocalTime}), взят следующий еврейский день.` : `Рождение указано до захода солнца (${hebrewCalendar.sunsetLocalTime || "заход не определен для этой широты"}), поэтому взята та же гражданская дата.`}`,
    `Основной месяц души в этой версии читается как ${month.month} (${month.signName}) по рассчитанному еврейскому календарю, а не только по солнечному знаку. Это не религиозный диагноз, а символический слой по каббалистической астрологии.`,
    `Главная тема: ${month.title}. Подарок месяца — ${month.gift}. Тиккун: ${month.tikkun}.`,
    `Числовой слой имени дает сфиру ${nameLayer.name}: ${nameLayer.theme}. Практика имени: ${nameLayer.practice}.`,
    `Числовой слой даты дает сфиру ${dateLayer.name}: ${dateLayer.theme}. Это показывает, через какой навык легче заземлять духовную задачу.`,
  ];
  const boldHypotheses = [
    `Смелая гипотеза: повторяющийся урок может включаться там, где "${month.shadow}" начинает управлять реакцией быстрее, чем осознанный выбор.`,
    `Смелая гипотеза: если человек идет по подарку месяца (${month.gift}), то сложная черта не исчезает, а становится материалом для зрелости.`,
    `Смелая гипотеза: имя и дата могут показывать два разных режима: имя тянет к "${nameLayer.theme}", а дата просит развивать "${dateLayer.theme}".`,
  ];

  return {
    subject: profile.subject,
    birthData: profile.birthData,
    sourceFrame: {
      branch: "Каббалистическая / еврейская астрология",
      primarySource: "Берг - Каббалистическая астрология и смысл нашей жизни",
      method: "еврейская дата считается по локальной гражданской дате, координатам места рождения и расчетному заходу солнца; если время рождения позже sunset, берется следующий еврейский день. Символика месяца затем связывается с каббалистическим зодиакальным месяцем.",
      limitation: "Расчет sunset использует локальную астрономическую формулу и координаты выбранного места. Для раввинского календарного решения, галахических минут и редких полярных случаев нужна отдельная религиозная проверка.",
    },
    hebrewCalendar,
    month,
    nameLayer,
    dateLayer,
    synthesis,
    boldHypotheses,
    practices: [
      `Практика месяца: наблюдать, где проявляется тень — ${month.shadow}; не подавлять ее, а переводить в осознанное действие.`,
      `Практика имени: ${nameLayer.practice}.`,
      `Практика даты: ${dateLayer.practice}.`,
      "На неделю: выбрать один маленький поступок, который увеличивает свет в конкретной ситуации: разговор, порядок, прощение, граница или помощь.",
    ],
    safetyNote: "Этот блок использует каббалистическую символику как язык самоисследования. Он не заменяет религиозную традицию, раввинистический совет, психологическую помощь или личное решение.",
  };
}

module.exports = {
  calculateJewish,
  calculateHebrewCalendar,
  calculateSunsetUtc,
  nameNumber,
  dayNumber,
};
