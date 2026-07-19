const fs = require("fs");
const path = require("path");

const rulesPath = path.join(__dirname, "..", "data", "numerology-rules.json");

function loadRules() {
  return JSON.parse(fs.readFileSync(rulesPath, "utf8"));
}

const LATIN_ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const CYRILLIC_ALPHABET = "абвгдежзийклмнопрстуфхцчшщъыьэюя";
const VOWELS = new Set(["a", "e", "i", "o", "u", "y", "а", "е", "ё", "и", "о", "у", "ы", "э", "ю", "я"]);

// Pythagorean numerology assigns 1-9 to letters in alphabet order, repeating
// every 9 letters. The same ((position % 9) + 1) formula reproduces the
// standard Latin table (A=1...I=9, J=1...) and the common Cyrillic adaptation
// (А=1...И=1, С=1, Ъ=1...) without hand-listing every letter twice.
function letterValue(char) {
  const latinIndex = LATIN_ALPHABET.indexOf(char);
  if (latinIndex >= 0) return (latinIndex % 9) + 1;
  const cyrillicIndex = CYRILLIC_ALPHABET.indexOf(char);
  if (cyrillicIndex >= 0) return (cyrillicIndex % 9) + 1;
  return 0;
}

function nameLetters(name) {
  return String(name || "").toLowerCase().replace(/[^a-zа-яё]/gi, "").split("");
}

// Reduces to a single digit, EXCEPT master numbers 11/22/33, which stop the
// reduction — the traditional numerology convention (they carry amplified
// meaning and are read on their own rather than folded into 2/4/6).
function reduceKeepMaster(value) {
  let n = Math.abs(Math.trunc(Number(value) || 0));
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split("").reduce((sum, digit) => sum + Number(digit), 0);
  }
  return n;
}

// Reduces fully to 1-9 regardless of master numbers — used for the
// today-relative Personal Year/Month/Day cycle, which conventionally runs
// on a plain 1-9 wheel rather than surfacing master numbers.
function reduceToDigit(value) {
  let n = Math.abs(Math.trunc(Number(value) || 0));
  while (n > 9) {
    n = String(n).split("").reduce((sum, digit) => sum + Number(digit), 0);
  }
  return n || 9;
}

function parseDateParts(dateText) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateText || ""));
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12) return null;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day < 1 || day > daysInMonth) return null;
  return { year, month, day };
}

// Life Path: the traditional "component method" — reduce month, day, and
// year separately (each may stop at a master number) before summing and
// reducing again, rather than digit-summing the whole date at once. This is
// what correctly surfaces a master number from, say, a day of 22 or an
// 11th-month birth.
function computeLifePath({ year, month, day }) {
  const monthNumber = reduceKeepMaster(month);
  const dayNumber = reduceKeepMaster(day);
  const yearDigitSum = String(year).split("").reduce((sum, digit) => sum + Number(digit), 0);
  const yearNumber = reduceKeepMaster(yearDigitSum);
  return reduceKeepMaster(monthNumber + dayNumber + yearNumber);
}

function computeBirthdayNumber(day) {
  return reduceKeepMaster(day);
}

function computeNameNumbers(name) {
  const letters = nameLetters(name);
  let expressionSum = 0;
  let vowelSum = 0;
  let consonantSum = 0;
  for (const char of letters) {
    const value = letterValue(char);
    if (!value) continue;
    expressionSum += value;
    if (VOWELS.has(char)) vowelSum += value;
    else consonantSum += value;
  }
  return {
    expression: reduceKeepMaster(expressionSum),
    soulUrge: reduceKeepMaster(vowelSum),
    personality: reduceKeepMaster(consonantSum),
  };
}

function computePersonalCycle({ month, day }, today = new Date()) {
  const currentYear = today.getUTCFullYear();
  const currentMonth = today.getUTCMonth() + 1;
  const currentDay = today.getUTCDate();
  const yearDigitSum = String(currentYear).split("").reduce((sum, digit) => sum + Number(digit), 0);
  const personalYear = reduceToDigit(month + day + yearDigitSum);
  const personalMonth = reduceToDigit(personalYear + currentMonth);
  const personalDay = reduceToDigit(personalMonth + currentDay);
  return { personalYear, personalMonth, personalDay, asOfDate: today.toISOString().slice(0, 10) };
}

function numberProfile(rules, key) {
  return rules.numbers[String(key)] || rules.numbers["9"];
}

function buildMonthlyAdvice({ lifePath, expression, soulUrge, personality, personalYearProfile }) {
  return [
    {
      title: "1. Главный вопрос месяца",
      text: `Число жизненного пути ${lifePath.value} ставит вопрос: ${lifePath.profile.meaning}. Где в ближайший месяц вы избегаете именно этого качества, хотя оно и есть ваш естественный ресурс?`,
    },
    {
      title: "2. Отношения и близость",
      text: `Число души (${soulUrge.value}) показывает, чего человек внутренне хочет от близости: ${soulUrge.profile.meaning}. В этом месяце стоит назвать это желание вслух хотя бы одному близкому человеку, а не ждать, что его угадают.`,
    },
    {
      title: "3. Работа и направление",
      text: `Число экспрессии (${expression.value}) — это то, как человек показывает себя миру: ${expression.profile.meaning}. Лучший карьерный шаг сейчас — тот, что использует именно эту сильную сторону, а не компенсирует ее слабую версию.`,
    },
    {
      title: "4. Тень месяца",
      text: `Обратная сторона жизненного пути: ${lifePath.profile.shadow}. Стоит заметить этот паттерн в первую неделю месяца, пока он не набрал силу.`,
    },
    {
      title: "5. Практический совет",
      text: `${lifePath.profile.advice}.`,
    },
    {
      title: "6. Год, в котором вы находитесь",
      text: `${personalYearProfile.title}: ${personalYearProfile.theme}.`,
    },
    {
      title: "7. Что делать в этом персональном году",
      text: `${personalYearProfile.advice}.`,
    },
    {
      title: "8. Личность вовне",
      text: `Число личности (${personality.value === soulUrge.value ? "совпадает с числом души, что редко и означает цельность между внутренним желанием и внешним образом" : "формирует отдельный слой того, как вас видят со стороны, отличный от внутреннего числа души"}). Проверьте месяц вопросом: совпадает ли то, что вы транслируете, с тем, чего вы на самом деле хотите?`,
    },
    {
      title: "9. Чего избегать",
      text: `Не стоит компенсировать тень числа пути (${lifePath.profile.shadow}) через избыточный контроль или избегание. Лучше назвать паттерн прямо и выбрать один маленький шаг в другую сторону.`,
    },
    {
      title: "10. Контрольный вопрос месяца",
      text: "В конце месяца спросите себя: где я действовал из сильной стороны своих чисел, а где — из их тени? Это не судьба, а зеркало для практических решений.",
    },
  ];
}

function calculateNumerology(input = {}) {
  const rules = loadRules();
  const name = typeof input.name === "string" && input.name.trim() ? input.name.trim() : "Гость";
  const dateParts = parseDateParts(input.localDate || input.birthDate);
  if (!dateParts) {
    throw new Error("Введите корректную дату рождения в формате ГГГГ-ММ-ДД.");
  }

  const lifePathValue = computeLifePath(dateParts);
  const nameNumbers = computeNameNumbers(name);
  const birthdayValue = computeBirthdayNumber(dateParts.day);
  const cycle = computePersonalCycle(dateParts);

  const lifePath = { value: lifePathValue, profile: numberProfile(rules, lifePathValue) };
  const expression = { value: nameNumbers.expression, profile: numberProfile(rules, nameNumbers.expression) };
  const soulUrge = { value: nameNumbers.soulUrge, profile: numberProfile(rules, nameNumbers.soulUrge) };
  const personality = { value: nameNumbers.personality, profile: numberProfile(rules, nameNumbers.personality) };
  const birthday = { value: birthdayValue, profile: numberProfile(rules, birthdayValue) };
  const personalYearProfile = rules.personalYear[String(cycle.personalYear)];

  const synthesis = [
    `Жизненный путь ${lifePath.value} (${lifePath.profile.title}) — главная тема воплощения: ${lifePath.profile.meaning}.`,
    `Число экспрессии ${expression.value} (${expression.profile.title}) показывает природный стиль самовыражения и работы: ${expression.profile.meaning}.`,
    `Число души ${soulUrge.value} (${soulUrge.profile.title}) — внутреннее желание, которое не всегда видно снаружи: ${soulUrge.profile.meaning}.`,
    `Число личности ${personality.value} (${personality.profile.title}) — то, как человек считывается при первом впечатлении: ${personality.profile.meaning}.`,
    `Число дня рождения ${birthday.value} добавляет частный акцент таланта: ${birthday.profile.meaning}.`,
  ];

  const boldHypotheses = [
    `Смелая гипотеза: если число души (${soulUrge.value}) и число личности (${personality.value}) заметно расходятся, человек может ощущать разрыв между тем, чего хочет внутри, и тем, как его воспринимают снаружи.`,
    `Смелая гипотеза: тень жизненного пути — "${lifePath.profile.shadow}" — вероятно активируется именно в стрессе, а не в спокойные периоды.`,
    `Смелая гипотеза: число экспрессии (${expression.value}) указывает на talent, который может быть недооценен самим человеком именно потому, что дается легко: ${expression.profile.meaning}.`,
  ];

  const futureForecast = [
    `Персональный год ${cycle.personalYear} (${personalYearProfile.title}): ${personalYearProfile.theme}.`,
    `Персональный месяц ${cycle.personalMonth} уточняет год более узкой темой на ближайшие 3-4 недели: используйте общий совет года (${personalYearProfile.advice}), сузив его до одного конкретного действия.`,
    `Персональный день ${cycle.personalDay} — это тон именно сегодняшнего дня внутри более широкого месяца и года; воспринимайте его как настройку, а не как отдельное предсказание.`,
  ];

  const monthlyAdviceSections = buildMonthlyAdvice({ lifePath, expression, soulUrge, personality, personalYearProfile });
  const monthlyAdvice = monthlyAdviceSections.map((section) => `${section.title}: ${section.text}`).join("\n\n");

  return {
    subject: { nickname: name },
    birthData: { localDate: input.localDate || input.birthDate },
    sourceFrame: {
      branch: "Пифагорейская нумерология",
      primarySource: "Классическая система приведения чисел имени и даты рождения (компонентный метод жизненного пути, мастер-числа 11/22/33)",
      method: "Жизненный путь считается отдельным приведением месяца, дня и года с последующим суммированием (компонентный метод). Экспрессия/душа/личность считаются по буквам полного имени через таблицу «позиция в алфавите по модулю 9» — общую для латиницы и кириллицы. Персональные год/месяц/день считаются от даты рождения относительно сегодняшней даты и всегда приводятся к 1-9.",
      limitation: "Мастер-числа (11, 22, 33) сохраняются только в жизненном пути, экспрессии, душе, личности и числе дня рождения — персональный цикл традиционно приводится к 1-9 без исключений.",
    },
    lifePath,
    expression,
    soulUrge,
    personality,
    birthday,
    cycle,
    personalYearProfile,
    synthesis,
    boldHypotheses,
    futureForecast,
    monthlyAdviceSections,
    monthlyAdvice,
    safetyNote: rules.safetyNote,
  };
}

module.exports = {
  calculateNumerology,
  reduceKeepMaster,
  reduceToDigit,
  computeLifePath,
  computeNameNumbers,
  computePersonalCycle,
};
