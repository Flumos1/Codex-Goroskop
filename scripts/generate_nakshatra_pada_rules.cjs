"use strict";
const fs = require("fs");
const path = require("path");
const { ensureSchema } = require("./lib/rule-schema.cjs");

// 27 nakshatras with core themes
const NAKSHATRAS = [
  { en:"Ashwini",          ru:"Ашвини",          ruler:"Ketu",    rulerRu:"Кету",    theme:"начало, исцеление, стремительность",       theme2:"новые старты и спонтанное исцеление" },
  { en:"Bharani",          ru:"Бхарани",          ruler:"Venus",   rulerRu:"Венера",  theme:"рождение, жизнь, смерть, дисциплина",       theme2:"переносить тяжесть и порождать новое" },
  { en:"Krittika",         ru:"Криттика",         ruler:"Sun",     rulerRu:"Солнце",  theme:"очищение огнём, острота, решимость",        theme2:"отсекать лишнее и стремиться к сути" },
  { en:"Rohini",           ru:"Рохини",           ruler:"Moon",    rulerRu:"Луна",    theme:"плодородие, красота, рост, чувственность",  theme2:"расцветать и привлекать изобилие" },
  { en:"Mrigashira",       ru:"Мригашира",        ruler:"Mars",    rulerRu:"Марс",    theme:"поиск, любопытство, нежность",              theme2:"искать и следовать внутреннему зову" },
  { en:"Ardra",            ru:"Ардра",            ruler:"Rahu",    rulerRu:"Раху",    theme:"буря, разрушение, обновление, слёзы",       theme2:"проходить через кризис к освобождению" },
  { en:"Punarvasu",        ru:"Пунарвасу",        ruler:"Jupiter", rulerRu:"Юпитер", theme:"возвращение, обновление, оптимизм",          theme2:"восстанавливаться и обретать радость" },
  { en:"Pushya",           ru:"Пушья",            ruler:"Saturn",  rulerRu:"Сатурн",  theme:"питание, защита, забота, процветание",      theme2:"нести плоды и укреплять основу" },
  { en:"Ashlesha",         ru:"Ашлеша",           ruler:"Mercury", rulerRu:"Меркурий",theme:"проникновение, мудрость, скрытость, яд",    theme2:"видеть суть и работать с глубинными силами" },
  { en:"Magha",            ru:"Магха",            ruler:"Ketu",    rulerRu:"Кету",    theme:"власть, традиция, предки, величие",         theme2:"черпать силу из рода и прошлого" },
  { en:"Purva Phalguni",   ru:"Пурва Пхалгуни",   ruler:"Venus",   rulerRu:"Венера",  theme:"наслаждение, творчество, расслабление",     theme2:"наслаждаться жизнью и выражать себя" },
  { en:"Uttara Phalguni",  ru:"Уттара Пхалгуни",  ruler:"Sun",     rulerRu:"Солнце",  theme:"союз, щедрость, социальность, свет",        theme2:"служить через дружбу и союз" },
  { en:"Hasta",            ru:"Хаста",            ruler:"Moon",    rulerRu:"Луна",    theme:"мастерство рук, умение, чистота",           theme2:"воплощать идеи через умелые действия" },
  { en:"Chitra",           ru:"Читра",            ruler:"Mars",    rulerRu:"Марс",    theme:"красота, архитектура, блеск, творение",     theme2:"создавать прекрасное и сверкать" },
  { en:"Swati",            ru:"Свати",            ruler:"Rahu",    rulerRu:"Раху",    theme:"независимость, движение, гибкость",         theme2:"сохранять свободу и адаптироваться" },
  { en:"Vishakha",         ru:"Вишакха",          ruler:"Jupiter", rulerRu:"Юпитер", theme:"целеустремлённость, победа, ревность",       theme2:"преследовать цель невзирая на препятствия" },
  { en:"Anuradha",         ru:"Анурадха",         ruler:"Saturn",  rulerRu:"Сатурн",  theme:"преданность, дружба, победа над тьмой",     theme2:"строить прочные союзы и хранить верность" },
  { en:"Jyeshtha",         ru:"Джйештха",         ruler:"Mercury", rulerRu:"Меркурий",theme:"старшинство, защита, скрытая сила",         theme2:"нести ответственность и защищать слабых" },
  { en:"Mula",             ru:"Мула",             ruler:"Ketu",    rulerRu:"Кету",    theme:"корни, разрушение иллюзий, исследование",   theme2:"вырывать с корнем и искать первопричины" },
  { en:"Purva Ashadha",    ru:"Пурва Ашадха",     ruler:"Venus",   rulerRu:"Венера",  theme:"непобедимость, очищение водой, гордость",   theme2:"воодушевлять и непоколебимо двигаться вперёд" },
  { en:"Uttara Ashadha",   ru:"Уттара Ашадха",    ruler:"Sun",     rulerRu:"Солнце",  theme:"окончательная победа, честь, стойкость",    theme2:"завершать начатое и добиваться признания" },
  { en:"Shravana",         ru:"Шравана",          ruler:"Moon",    rulerRu:"Луна",    theme:"слушание, знание, связность, традиция",     theme2:"учиться слушать и передавать мудрость" },
  { en:"Dhanishtha",       ru:"Дхаништха",        ruler:"Mars",    rulerRu:"Марс",    theme:"богатство, ритм, музыка, щедрость",         theme2:"накапливать и щедро делиться" },
  { en:"Shatabhisha",      ru:"Шатабхиша",        ruler:"Rahu",    rulerRu:"Раху",    theme:"исцеление, тайна, уединение, освобождение",  theme2:"исследовать скрытое и исцелять одиночеством" },
  { en:"Purva Bhadrapada", ru:"Пурва Бхадрапада", ruler:"Jupiter", rulerRu:"Юпитер", theme:"трансформация, огонь, отречение, мощь",     theme2:"жертвовать малым ради высшей цели" },
  { en:"Uttara Bhadrapada",ru:"Уттара Бхадрапада",ruler:"Saturn",  rulerRu:"Сатурн",  theme:"глубина, мудрость, устойчивость, дождь",    theme2:"нести глубокое знание и распределять благо" },
  { en:"Revati",           ru:"Ревати",           ruler:"Mercury", rulerRu:"Меркурий",theme:"завершение, защита, сострадание, переход",   theme2:"завершать цикл и готовиться к возрождению" },
];

// 12 navamsha signs (0=Aries .. 11=Pisces)
const NAVAMSHA = [
  { en:"Aries",       ru:"Овен",     rulerRu:"Марс",    essence:"напор, инициатива, самоутверждение" },
  { en:"Taurus",      ru:"Телец",    rulerRu:"Венера",  essence:"устойчивость, чувственность, накопление" },
  { en:"Gemini",      ru:"Близнецы", rulerRu:"Меркурий",essence:"гибкость, общение, интеллект" },
  { en:"Cancer",      ru:"Рак",      rulerRu:"Луна",    essence:"чувствительность, забота, интуиция" },
  { en:"Leo",         ru:"Лев",      rulerRu:"Солнце",  essence:"творчество, лидерство, самовыражение" },
  { en:"Virgo",       ru:"Дева",     rulerRu:"Меркурий",essence:"анализ, служение, точность" },
  { en:"Libra",       ru:"Весы",     rulerRu:"Венера",  essence:"гармония, партнёрство, справедливость" },
  { en:"Scorpio",     ru:"Скорпион", rulerRu:"Марс/Кету",essence:"глубина, трансформация, скрытые силы" },
  { en:"Sagittarius", ru:"Стрелец",  rulerRu:"Юпитер",  essence:"расширение, философия, свобода" },
  { en:"Capricorn",   ru:"Козерог",  rulerRu:"Сатурн",  essence:"дисциплина, амбиции, структура" },
  { en:"Aquarius",    ru:"Водолей",  rulerRu:"Сатурн/Раху",essence:"независимость, новаторство, идеализм" },
  { en:"Pisces",      ru:"Рыбы",     rulerRu:"Юпитер/Кету",essence:"духовность, сострадание, растворение" },
];

// Blend descriptions for each pada based on nakshatra + navamsha energies
function blend(nk, nav, pada) {
  const padaNum = ["первой", "второй", "третьей", "четвёртой"][pada - 1];
  const navSign = nav.ru;
  const navEss  = nav.essence;
  const nkTheme = nk.theme2;

  const opens = [
    `В ${padaNum} паде ${nk.ru} энергия накшатры — ${nkTheme} — окрашивается навамшей ${navSign}.`,
    `${nk.ru} в ${padaNum} паде работает через навамшу ${navSign}, усиливая стремление ${nkTheme}.`,
    `${padaNum.charAt(0).toUpperCase() + padaNum.slice(1)} пада ${nk.ru} несёт в себе навамшу ${navSign}: здесь задача ${nkTheme}.`,
  ];
  const mids = [
    `Навамша придаёт качества ${navEss}.`,
    `Добавляется измерение ${navSign}: ${navEss}.`,
    `Навамша ${navSign} вносит: ${navEss}.`,
  ];
  const closes = [
    `Управители — ${nk.rulerRu} (накшатра) и ${nav.rulerRu} (навамша) — вместе задают вектор этой пады.`,
    `${nk.rulerRu} и ${nav.rulerRu} совместно формируют тон и задачи этой пады.`,
    `Взаимодействие ${nk.rulerRu} и ${nav.rulerRu} определяет глубинный потенциал этого сочетания.`,
  ];

  const seed = nk.en.charCodeAt(0) + pada;
  return opens[seed % opens.length] + " " + mids[seed % mids.length] + " " + closes[(seed + 1) % closes.length];
}

const rules = [];

for (let i = 0; i < NAKSHATRAS.length; i++) {
  const nk = NAKSHATRAS[i];
  for (let pada = 1; pada <= 4; pada++) {
    const padaIndex = i * 4 + (pada - 1);
    const navIndex  = padaIndex % 12;
    const nav       = NAVAMSHA[navIndex];

    const summary = blend(nk, nav, pada);
    rules.push(ensureSchema({
      ruleId: `nakshatra-pada:${nk.en}:${pada}`,
      type: "nakshatra-pada",
      factor: {
        nakshatra: nk.en,
        pada,
        nakshatraIndex: i,
        navamshaSign: nav.en,
        navamshaSignRu: nav.ru,
      },
      simpleRu: {
        name: `${nk.ru}, пада ${pada}`,
        nakshatraRu: nk.ru,
        navamshaSign: nav.ru,
        ruler: nk.rulerRu,
        navamshaRuler: nav.rulerRu,
        summary,
        keywords: [
          ...nk.theme.split(", ").slice(0, 2),
          ...nav.essence.split(", ").slice(0, 2),
        ],
      },
    }, {
      system: "vedic",
      methodFamily: "vedic-nakshatra",
      sourceIds: ["source.vedic-nakshatra-tradition"],
      themes: [nk.en.toLowerCase(), "nakshatra-pada", "navamsha", nav.en.toLowerCase()],
      confidence: "medium",
      simple: {
        summary,
        pattern: `Тема накшатры ${nk.ru} (${nk.theme}) окрашивается навамшей ${nav.ru}.`,
        growth: `Соединение управителей ${nk.rulerRu} и ${nav.rulerRu} задаёт задачи роста этой пады.`,
        reflection: `Как ${pada}-я пада ${nk.ru} через навамшу ${nav.ru} проявляется в вашей жизни?`,
      },
      advanced: {
        technical: `Накшатра ${nk.en}, пада ${pada}; навамша-знак ${nav.en}. Управитель накшатры: ${nk.rulerRu}; управитель навамши: ${nav.rulerRu}.`,
        method: `Пада — четверть накшатры (3°20'), сопоставленная со знаком навамши (D9); значение = тема накшатры, преломлённая через навамша-знак.`,
        caution: `Пада уточняет накшатру, но не заменяет анализ раши, дома и даши; используется вместе с ними.`,
        constructiveChannel: `Проживать тему накшатры ${nk.ru} через конструктивные качества навамши ${nav.ru}.`,
      },
    }));
  }
}

const outPath = path.join(__dirname, "..", "generator", "rules", "nakshatra-pada-rules.json");
fs.writeFileSync(outPath, JSON.stringify(rules, null, 2), "utf8");
console.log(`Written ${rules.length} nakshatra-pada rules → ${outPath}`);
