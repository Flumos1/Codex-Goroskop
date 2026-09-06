const report = require("../tools/generate-report.cjs");
const { deepRepairMojibake } = require("./text.cjs");

const ruNames = {
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
  conjunction: "соединение",
  sextile: "секстиль",
  square: "квадрат",
  trine: "трин",
  opposition: "оппозиция",
};

function localName(value, language = "ru") {
  return language === "ru" ? (ruNames[value] || value) : value;
}

function factorLabel(rule, language = "ru") {
  if (rule.factor?.aspect) {
    return `${localName(rule.factor.planetA, language)} ${localName(rule.factor.aspect, language)} ${localName(rule.factor.planetB, language)}`;
  }
  if (rule.factor?.planet) {
    return language === "ru"
      ? `${localName(rule.factor.planet, language)} в ${rule.factor.house}-м доме`
      : `${rule.factor.planet} in ${rule.factor.house}th house`;
  }
  return rule.id;
}

function textSet(rule, section, language) {
  if (language === "ru" && section === "simple" && rule.simpleRu) return rule.simpleRu;
  if (language === "ru" && section === "advanced" && rule.advancedRu) return rule.advancedRu;
  return rule[section];
}

function meaningfulText(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const letters = (text.match(/[A-Za-zА-Яа-яЁё]/g) || []).length;
  return letters >= 8 ? text : "";
}

function markdownToHtml(markdown) {
  const escape = (value) => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const lines = String(markdown || "").split(/\r?\n/);
  const html = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  for (const line of lines) {
    if (!line.trim()) {
      closeList();
      continue;
    }
    if (!/[A-Za-zА-Яа-яЁё0-9#-]/.test(line)) {
      closeList();
      continue;
    }
    if (line.startsWith("### ")) {
      closeList();
      html.push(`<h3>${escape(line.slice(4))}</h3>`);
    } else if (line.startsWith("## ")) {
      closeList();
      html.push(`<h2>${escape(line.slice(3))}</h2>`);
    } else if (line.startsWith("# ")) {
      closeList();
      html.push(`<h1>${escape(line.slice(2))}</h1>`);
    } else if (line.startsWith("- ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${escape(line.slice(2))}</li>`);
    } else {
      closeList();
      html.push(`<p>${escape(line)}</p>`);
    }
  }
  closeList();
  return html.join("\n");
}

function renderProfileReport(profile, matchedRules, mode = "both") {
  const language = profile.language || "ru";
  const birthData = profile.birthData || {};
  const subject = profile.subject || {};
  const asc = profile.calculation?.angles?.ascendant;
  const mc = profile.calculation?.angles?.midheaven;
  const themes = [...new Set(matchedRules.flatMap((rule) => language === "ru" && rule.themesRu ? rule.themesRu : (rule.themes || [])))].slice(0, 16);
  const factors = matchedRules.map((rule) => factorLabel(rule, language)).join("; ");
  const sourceIds = [...new Set(matchedRules.flatMap((rule) => rule.sourceIds || []))];

  const lines = [
    "# Натальная карта",
    "",
    subject.nickname || subject.name ? `- Человек: ${subject.nickname || subject.name}` : null,
    `- Данные рождения: ${[birthData.localDate && birthData.localTime ? `${birthData.localDate} ${birthData.localTime}` : null, birthData.timeZone, birthData.place].filter(Boolean).join(", ")}`,
    `- Система: ${(profile.systems || ["western"]).join(", ")}`,
    "",
    "## Расчетная сводка",
    "",
    asc ? `- Асцендент: ${localName(asc.sign, language)} ${Number(asc.degreeInSign).toFixed(2)}°` : null,
    mc ? `- MC / Середина неба: ${localName(mc.sign, language)} ${Number(mc.degreeInSign).toFixed(2)}°` : null,
    profile.calculation?.houseSystem ? `- Система домов: ${profile.calculation.houseSystem}` : null,
    "",
    "## Смысловой синтез",
    "",
    "Этот отчет объединяет рассчитанные положения карты с правилами интерпретации из базы проекта. Его стоит читать как символический и психологический портрет, а не как жесткое предсказание.",
    "",
    factors ? `- Факторы: ${factors}` : null,
    sourceIds.length ? `- Источники правил: ${sourceIds.join(", ")}` : null,
    "",
  ].filter((line) => line !== null);

  if (themes.length) {
    lines.push("## Повторяющиеся темы", "");
    for (const theme of themes) lines.push(`- ${theme}`);
    lines.push("");
  }

  for (const rule of matchedRules) {
    lines.push(`## ${factorLabel(rule, language)}`, "");
    lines.push(`- Метод: ${rule.methodFamily}`);
    lines.push(`- Уверенность: ${rule.confidence}`);
    lines.push("");

    if (mode === "simple" || mode === "both") {
      const simple = textSet(rule, "simple", language);
      if (simple) {
        lines.push("### Простое объяснение", "");
        for (const paragraph of [simple.summary, simple.pattern, simple.growth]) {
          const text = meaningfulText(paragraph);
          if (text) lines.push(text, "");
        }
        const reflection = meaningfulText(simple.reflection);
        if (reflection) lines.push(`Вопрос для размышления: ${reflection}`, "");
      }
    }

    if (mode === "advanced" || mode === "both") {
      const advanced = textSet(rule, "advanced", language);
      if (advanced) {
        lines.push("### Продвинутый слой", "");
        for (const paragraph of [advanced.technical, advanced.method, advanced.caution, advanced.constructiveChannel]) {
          const text = meaningfulText(paragraph);
          if (text) lines.push(text, "");
        }
      }
    }
  }

  lines.push("## Границы интерпретации", "");
  lines.push("Этот прототип избегает гарантированных предсказаний, медицинских диагнозов, предсказаний смерти, финансовой определенности и фаталистичных формулировок.");
  lines.push("");

  return lines.join("\n");
}

function generateReport(profile, mode = "both") {
  const rules = report.loadRules();
  const repairedProfile = deepRepairMojibake(profile);
  // findRules loads profiles from disk, so resolve inline factors here.
  const matchedRules = (repairedProfile.factors || [])
    .map((factor) => {
      if (factor.id) return rules.find((rule) => rule.id === factor.id);
      const input = factor.query || factor.label;
      return report.findRules(rules, { query: input })[0]?.rule;
    })
    .filter(Boolean)
    .map(deepRepairMojibake);

  const markdown = matchedRules.length
    ? renderProfileReport(repairedProfile, matchedRules, mode || repairedProfile.mode || "both")
    : [
      "# Отчет",
      "",
      "Для этой карты пока не найдено готовых правил интерпретации в базе. Расчет карты выполнен, а смысловой слой можно расширять новыми правилами.",
    ].join("\n");

  return {
    markdown,
    html: markdownToHtml(markdown),
    matchedRules: matchedRules.map((rule) => ({ id: rule.id, label: factorLabel(rule, repairedProfile.language || "ru") })),
  };
}

module.exports = {
  generateReport,
  markdownToHtml,
  renderProfileReport,
};
