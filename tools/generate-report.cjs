const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const rulesDir = path.join(projectRoot, "generator", "rules");
const outputDir = path.join(projectRoot, "generator", "outputs");

function parseArgs(argv) {
  const args = { mode: "both", format: "markdown" };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--query") args.query = argv[++i];
    else if (arg === "--queries") args.queries = argv[++i];
    else if (arg === "--id") args.id = argv[++i];
    else if (arg === "--ids") args.ids = argv[++i];
    else if (arg === "--mode") args.mode = argv[++i];
    else if (arg === "--out") args.out = argv[++i];
    else if (arg === "--profile") args.profile = argv[++i];
    else if (arg === "--list") args.list = true;
    else if (arg === "--json") args.format = "json";
  }
  return args;
}

function loadProfile(profilePath) {
  const fullPath = path.isAbsolute(profilePath) ? profilePath : path.join(projectRoot, profilePath);
  const profile = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  return { ...profile, _profilePath: fullPath };
}

function normalize(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function loadRules() {
  return fs
    .readdirSync(rulesDir)
    .filter((name) => name.endsWith(".json"))
    .flatMap((name) => {
      const filePath = path.join(rulesDir, name);
      return JSON.parse(fs.readFileSync(filePath, "utf8")).map((rule) => ({
        ...rule,
        _file: name,
      }));
    });
}

function localName(value, language) {
  if (language !== "ru") return value;
  const names = {
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
  return names[value] || value;
}

function factorLabel(rule, language = "en") {
  if (rule.factor?.aspect) {
    if (language === "ru") {
      return `${localName(rule.factor.planetA, language)} ${localName(rule.factor.aspect, language)} ${localName(rule.factor.planetB, language)}`;
    }
    return `${rule.factor.planetA} ${rule.factor.aspect} ${rule.factor.planetB}`;
  }
  if (rule.factor?.planet) {
    if (language === "ru") {
      return `${localName(rule.factor.planet, language)} в ${rule.factor.house}-м доме`;
    }
    return `${rule.factor.planet} in ${rule.factor.house}th house`;
  }
  if (rule.factor?.reportType) {
    return `${rule.system} ${rule.factor.reportType}`;
  }
  return rule.id;
}

function searchableText(rule) {
  return normalize([
    rule.id,
    rule.system,
    rule.methodFamily,
    factorLabel(rule),
    ...(rule.themes || []),
  ].join(" "));
}

function findRule(rules, args) {
  if (args.id) {
    return rules.find((rule) => rule.id === args.id);
  }
  if (!args.query) return null;

  const query = normalize(args.query);
  const exact = rules.find((rule) => searchableText(rule).includes(query));
  if (exact) return exact;

  const queryTerms = query.split(" ").filter(Boolean);
  return rules
    .map((rule) => {
      const text = searchableText(rule);
      const score = queryTerms.reduce((sum, term) => sum + (text.includes(term) ? 1 : 0), 0);
      return { rule, score };
    })
    .sort((a, b) => b.score - a.score)[0]?.rule;
}

function splitList(input) {
  return String(input || "")
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function findRules(rules, args) {
  if (args.profile) {
    const profile = loadProfile(args.profile);
    const factors = Array.isArray(profile.factors) ? profile.factors : [];
    return factors.map((factor) => {
      const input = factor.id || factor.query || factor.label;
      const rule = factor.id
        ? rules.find((item) => item.id === factor.id)
        : findRule(rules, { query: factor.query || factor.label });
      return { input, rule, profile };
    });
  }

  if (args.ids) {
    return splitList(args.ids).map((id) => {
      const rule = rules.find((item) => item.id === id);
      return { input: id, rule };
    });
  }

  if (args.queries) {
    return splitList(args.queries).map((query) => ({
      input: query,
      rule: findRule(rules, { query }),
    }));
  }

  const rule = findRule(rules, args);
  return [{ input: args.id || args.query, rule }];
}

function languageFromProfile(profile, fallback = "en") {
  return normalize(profile?.language || fallback) === "ru" ? "ru" : "en";
}

function textSet(rule, section, language) {
  if (language === "ru" && section === "simple" && rule.simpleRu) return rule.simpleRu;
  if (language === "ru" && section === "advanced" && rule.advancedRu) return rule.advancedRu;
  return rule[section];
}

function labels(language) {
  if (language !== "ru") {
    return {
      report: "Report",
      ruleId: "Rule ID",
      system: "System",
      methodFamily: "Method family",
      confidence: "Confidence",
      sourceRule: "Source rule",
      sourceIds: "Source IDs",
      simple: "Simple Explanation",
      advanced: "Advanced Explanation",
      reflection: "Reflection",
      composite: "Composite Report",
      factors: "Factors",
      systems: "Systems",
      methodFamilies: "Method families",
      synthesisNote: "Synthesis Note",
      synthesisText: "This report combines several source-backed interpretation rules. It should be read as a reflective symbolic synthesis, not as a fixed prediction.",
    repeatedThemes: "Repeated Themes",
      calculationSummary: "Calculation Summary",
      ascendant: "Ascendant",
      midheaven: "Midheaven",
      houseSystem: "House system",
      safetyNote: "Safety Note",
      safetyText: "This prototype avoids guaranteed predictions, medical diagnosis, death prediction, financial certainty, relationship determinism, and fear-based fatalism.",
      subject: "Subject",
      birthData: "Birth data",
      requestedSystems: "Requested systems",
      language: "Language",
      userContext: "User Context",
    };
  }

  return {
    report: "Отчет",
    ruleId: "ID правила",
    system: "Система",
    methodFamily: "Метод",
    confidence: "Уверенность",
    sourceRule: "Правило источника",
    sourceIds: "ID источников",
    simple: "Простое объяснение",
    advanced: "Продвинутый слой",
    reflection: "Вопрос для размышления",
    composite: "Сводный отчет",
    factors: "Факторы",
    systems: "Системы",
    methodFamilies: "Методы",
    synthesisNote: "Заметка о синтезе",
    synthesisText: "Этот отчет объединяет несколько интерпретационных правил, связанных с источниками. Его стоит читать как рефлексивный символический синтез, а не как фиксированное предсказание.",
    repeatedThemes: "Повторяющиеся темы",
    calculationSummary: "Расчетная сводка",
    ascendant: "Асцендент",
    midheaven: "MC / Середина неба",
    houseSystem: "Система домов",
    safetyNote: "Границы интерпретации",
    safetyText: "Этот прототип избегает гарантированных предсказаний, медицинских диагнозов, предсказаний смерти, финансовой определенности, детерминизма в отношениях и пугающих фаталистичных формулировок.",
    subject: "Человек",
    birthData: "Данные рождения",
    requestedSystems: "Запрошенные системы",
    language: "Язык",
    userContext: "Контекст",
  };
}

function renderMarkdown(rule, mode, language = "en") {
  const t = labels(language);
  const lines = [
    `# ${t.report}: ${factorLabel(rule, language)}`,
    "",
    `- ${t.ruleId}: ${rule.id}`,
    `- ${t.system}: ${rule.system}`,
    `- ${t.methodFamily}: ${rule.methodFamily}`,
    `- ${t.confidence}: ${rule.confidence}`,
    `- ${t.sourceRule}: ${rule.sourceRule || (rule.sourceRules || []).join(", ")}`,
    `- ${t.sourceIds}: ${(rule.sourceIds || []).join(", ")}`,
    "",
  ];

  if (mode === "simple" || mode === "both") {
    const simple = textSet(rule, "simple", language);
    lines.push(`## ${t.simple}`, "");
    lines.push(simple.summary, "", simple.pattern, "", simple.growth, "");
    lines.push(`${t.reflection}: ${simple.reflection}`, "");
  }

  if (mode === "advanced" || mode === "both") {
    const advanced = textSet(rule, "advanced", language);
    lines.push(`## ${t.advanced}`, "");
    lines.push(advanced.technical, "", advanced.method, "", advanced.caution, "");
    lines.push(advanced.constructiveChannel, "");
  }

  return lines.join("\n");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function renderCompositeMarkdown(rules, mode, language = "en") {
  const t = labels(language);
  const systems = unique(rules.map((rule) => rule.system));
  const methodFamilies = unique(rules.map((rule) => rule.methodFamily));
  const sourceIds = unique(rules.flatMap((rule) => rule.sourceIds || []));
  const themes = unique(rules.flatMap((rule) => language === "ru" && rule.themesRu ? rule.themesRu : (rule.themes || [])));

  const lines = [
    `# ${t.composite}`,
    "",
    `- ${t.factors}: ${rules.map((rule) => factorLabel(rule, language)).join("; ")}`,
    `- ${t.systems}: ${systems.join(", ")}`,
    `- ${t.methodFamilies}: ${methodFamilies.join(", ")}`,
    `- ${t.sourceIds}: ${sourceIds.join(", ")}`,
    "",
    `## ${t.synthesisNote}`,
    "",
    t.synthesisText,
    "",
  ];

  if (themes.length) {
    lines.push(`## ${t.repeatedThemes}`, "");
    for (const theme of themes.slice(0, 18)) lines.push(`- ${theme}`);
    lines.push("");
  }

  for (const rule of rules) {
    lines.push(`## ${factorLabel(rule, language)}`, "");
    lines.push(`- ${t.ruleId}: ${rule.id}`);
    lines.push(`- ${t.system}: ${rule.system}`);
    lines.push(`- ${t.confidence}: ${rule.confidence}`);
    lines.push("");

    if (mode === "simple" || mode === "both") {
      const simple = textSet(rule, "simple", language);
      lines.push(`### ${t.simple}`, "");
      lines.push(simple.summary, "", simple.pattern, "", simple.growth, "");
      lines.push(`${t.reflection}: ${simple.reflection}`, "");
    }

    if (mode === "advanced" || mode === "both") {
      const advanced = textSet(rule, "advanced", language);
      lines.push(`### ${t.advanced}`, "");
      lines.push(advanced.technical, "", advanced.method, "", advanced.caution, "");
      lines.push(advanced.constructiveChannel, "");
    }
  }

  lines.push(`## ${t.safetyNote}`, "");
  lines.push(t.safetyText);
  lines.push("");

  return lines.join("\n");
}

function renderProfileMarkdown(profile, rules, mode) {
  const language = languageFromProfile(profile);
  const t = labels(language);
  const subject = profile.subject || {};
  const birthData = profile.birthData || {};
  const lines = [
    `# ${profile.title || "Codex Goroskop Report"}`,
    "",
  ];

  if (subject.name || subject.nickname) {
    lines.push(`- ${t.subject}: ${subject.name || subject.nickname}`);
  }
  if (birthData.datetimeUtc || birthData.date || birthData.time || birthData.place) {
    const localBirth = birthData.localDate && birthData.localTime
      ? `${birthData.localDate} ${birthData.localTime}${birthData.timeZone ? ` (${birthData.timeZone})` : ""}`
      : null;
    lines.push(`- ${t.birthData}: ${[localBirth, birthData.datetimeUtc, birthData.date, birthData.time, birthData.place].filter(Boolean).join(", ")}`);
  }
  if (profile.systems?.length) {
    lines.push(`- ${t.requestedSystems}: ${profile.systems.join(", ")}`);
  }
  if (profile.language) {
    lines.push(`- ${t.language}: ${profile.language}`);
  }
  lines.push("");

  if (profile.context) {
    lines.push(`## ${t.userContext}`, "", profile.context, "");
  }

  if (profile.calculation?.angles?.ascendant) {
    const ascendant = profile.calculation.angles.ascendant;
    const midheaven = profile.calculation.angles.midheaven;
    const houseSystem = profile.calculation.houses?.length ? profile.calculation.houseSystem || "equal-from-ascendant" : null;
    lines.push(`## ${t.calculationSummary}`, "");
    lines.push(`- ${t.ascendant}: ${localName(ascendant.sign, language)} ${Number(ascendant.degreeInSign).toFixed(2)}°`);
    if (midheaven) lines.push(`- ${t.midheaven}: ${localName(midheaven.sign, language)} ${Number(midheaven.degreeInSign).toFixed(2)}°`);
    if (houseSystem) lines.push(`- ${t.houseSystem}: ${houseSystem}`);
    lines.push("");
  }

  lines.push(renderCompositeMarkdown(rules, mode, language).replace(new RegExp(`^# ${t.composite}\\n\\n`), ""));
  return lines.join("\n");
}

function listRules(rules) {
  return rules
    .map((rule) => `${rule.id}\t${factorLabel(rule)}\t${rule.system}\t${rule._file}`)
    .join("\n");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const rules = loadRules();
  const profile = args.profile ? loadProfile(args.profile) : null;

  if (args.list) {
    console.log(listRules(rules));
    return;
  }

  const matches = findRules(rules, args);
  const missing = matches.filter((match) => !match.rule);
  if (missing.length) {
    console.error(`No matching rule found for: ${missing.map((match) => match.input).join(", ")}`);
    console.error("Use --list to see available rules.");
    process.exit(1);
  }
  const matchedRules = matches.map((match) => match.rule);

  const mode = profile?.mode || args.mode;

  if (!["simple", "advanced", "both"].includes(mode)) {
    console.error("--mode must be simple, advanced, or both.");
    process.exit(1);
  }

  const output = args.format === "json"
    ? JSON.stringify(profile ? { profile, rules: matchedRules } : (matchedRules.length === 1 ? matchedRules[0] : matchedRules), null, 2)
    : profile
      ? renderProfileMarkdown(profile, matchedRules, mode)
      : matchedRules.length === 1
        ? renderMarkdown(matchedRules[0], mode)
        : renderCompositeMarkdown(matchedRules, mode);

  if (args.out) {
    fs.mkdirSync(outputDir, { recursive: true });
    const outPath = path.isAbsolute(args.out) ? args.out : path.join(outputDir, args.out);
    fs.writeFileSync(outPath, output, "utf8");
    console.log(`Report written: ${outPath}`);
  } else {
    console.log(output);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  factorLabel,
  findRules,
  labels,
  languageFromProfile,
  listRules,
  loadRules,
  renderCompositeMarkdown,
  renderMarkdown,
  renderProfileMarkdown,
};
