"use strict";
const fs   = require("fs");
const path = require("path");
const { ensureSchema } = require("./lib/rule-schema.cjs");

// 28 Chinese/Mongolian/Indian lunar mansions from Davydov «Dao Lunnogo Kalendarya» 2008
// Mapped to our 27-nakshatra system (Abhijit #21 merged with Shravana)
const MANSIONS = [
  {
    num: 1, chineseName: "ВЭЙ", mongolName: "БРАНИ", indianName: "БХАРАНИ",
    nakshatra: "Bharani",
    titleRu: "Бхарани",
    favorable: "проповеди, наставления; найм работников; начало лечения; купля-продажа; дизайн и оформление",
    unfavorable: "похоронные обряды; сватовство; дела, связанные с отдачей",
  },
  {
    num: 2, chineseName: "МАО", mongolName: "ГИРДИГ", indianName: "КРИТТИКА",
    nakshatra: "Krittika",
    titleRu: "Криттика — созвездие искусств, музыки, танцев",
    favorable: "работники умственного труда; учёба; торжества и застолья; обмен; возведение храмов",
    unfavorable: "начало новых дел; отправление в дорогу; похоронные обряды",
  },
  {
    num: 3, chineseName: "БИ", mongolName: "НАРМА", indianName: "РОХИНИ",
    nakshatra: "Rohini",
    titleRu: "Рохини — созвездие удачи, счастливого случая, богатства, изобилия",
    favorable: "любые начинания; обряды для долголетия и умножения богатств; изготовление лекарств; начало лечения",
    unfavorable: "встречи, занятия, праздники, соревнования, споры; обряды по усопшим родственницам",
  },
  {
    num: 4, chineseName: "ЦЗУЙ", mongolName: "ГО", indianName: "МРИГАШИРА",
    nakshatra: "Mrigashira",
    titleRu: "Мригашира",
    favorable: "освящение храмов, молитвы; поклонение и обряды для долголетия и богатства; земледельческие, строительные работы; наставничество",
    unfavorable: "путешествия; переводы сочинений; начало нового строительства",
  },
  {
    num: 5, chineseName: "ШЭНЬ", mongolName: "ЛАГ", indianName: "АРДРА",
    nakshatra: "Ardra",
    titleRu: "Ардра — звезда путешественников",
    favorable: "поклонение и изучение духовных знаний; обучение искусствам, наукам, ремёслу; земледельческие работы со стихией воды; решение юридических вопросов",
    unfavorable: "поездки и переезды; кройка и шитьё одежды; строительство",
  },
  {
    num: 6, chineseName: "ЦЗИН", mongolName: "НАВСО", indianName: "ПУНАРВАСА",
    nakshatra: "Punarvasu",
    titleRu: "Пунарваса — созвездие удачи и изобилия",
    favorable: "учёба, наставничество и проповеди; постижение духовных знаний; начало важных дел — брак, строительство, путешествие, заключение сделок",
    unfavorable: "затевание споров; переводы сочинений на другие языки",
  },
  {
    num: 7, chineseName: "ГУЙ", mongolName: "ЖАД", indianName: "ПУШЬЯ",
    nakshatra: "Pushya",
    titleRu: "Пушья — созвездие гармонии, медитации, творчества",
    favorable: "строительство нового дома, устройство очагов и каминов; изготовление мебели; начало лечения для быстрого выздоровления",
    unfavorable: "отдача вещей из дома; полевые работы; переезд на новое место",
  },
  {
    num: 8, chineseName: "ЛЮ", mongolName: "ГАГ", indianName: "АШЛЕША",
    nakshatra: "Ashlesha",
    titleRu: "Ашлеша",
    favorable: "начало нового дела; состязания, конкурсы, соревнования; строительство, купля-продажа, юридические иски",
    unfavorable: "командировки; переезд на другое место жительства; изготовление лекарств",
  },
  {
    num: 9, chineseName: "СИН", mongolName: "ЧУ", indianName: "МАГХА",
    nakshatra: "Magha",
    titleRu: "Магха — день милосердия и добродетели",
    favorable: "благотворительность; учёба; строительство нового дома; стрижка волос",
    unfavorable: "путешествия; работа с землёй; кройка одежды; вступление в брак; похороны",
  },
  {
    num: 10, chineseName: "ЧЖАН", mongolName: "ДЭ", indianName: "ПУРВА ПХАЛГУНИ",
    nakshatra: "Purva Phalguni",
    titleRu: "Пурва Пхалгуни — покровительствует духовным людям",
    favorable: "интимные отношения; службы и обряды для достатка и долголетия",
    unfavorable: "поездки; приведение невестки в дом; похоронные обряды",
  },
  {
    num: 11, chineseName: "И", mongolName: "БО", indianName: "УТТАРА ПХАЛГУНИ",
    nakshatra: "Uttara Phalguni",
    titleRu: "Уттара Пхалгуни",
    favorable: "переезд на другое место жительства; изучение наук и передача знаний; интеллектуальный труд и духовные искания; начало курса восстановительной терапии",
    unfavorable: "земледельческие работы; путешествия; похоронные обряды; переделка одежды",
  },
  {
    num: 12, chineseName: "ЧЖЭНЬ", mongolName: "МЭШИ", indianName: "ХАСТА",
    nakshatra: "Hasta",
    titleRu: "Хаста",
    favorable: "срочные и безотлагательные дела; обучение, добродетельные поступки, медитативные практики; изготовление лекарств; начало курса восстановительных мероприятий",
    unfavorable: "путешествия; переезды; похоронные службы",
  },
  {
    num: 13, chineseName: "ЦЗЯО", mongolName: "ВАГВА", indianName: "ЧИТРА",
    nakshatra: "Chitra",
    titleRu: "Читра — творчество, гармония и искусство. Музыка, пение, танец, живопись",
    favorable: "изготовление лекарств; возвращение долгов; лечебные мероприятия; приготовление кисломолочных продуктов",
    unfavorable: "медитативные практики; путешествия и переезды; похоронные обряды; много читать не рекомендуется",
  },
  {
    num: 14, chineseName: "КАН", mongolName: "САРИ", indianName: "СВАТИ",
    nakshatra: "Swati",
    titleRu: "Свати",
    favorable: "обучение; изготовление лекарств; строительство; путешествия; купля-продажа; земельные работы; налаживание новых контактов",
    unfavorable: "переезд на новое место жительства; похоронные обряды",
  },
  {
    num: 15, chineseName: "ДИ", mongolName: "САГА", indianName: "ВИШАКХА",
    nakshatra: "Vishakha",
    titleRu: "Вишакха",
    favorable: "медитативные практики; строительные работы; земледелие; починка одежды; живопись",
    unfavorable: "торговля; переезды; решение спорных ситуаций",
  },
  {
    num: 16, chineseName: "ФАН", mongolName: "ЛХАМЦАМ", indianName: "АНУРАДХА",
    nakshatra: "Anuradha",
    titleRu: "Анурадха",
    favorable: "путешествия; торговля; сельскохозяйственные работы; строительство; встречи и новые деловые контакты; изготовление лекарств; медитативные практики",
    unfavorable: "изменение обстановки в доме",
  },
  {
    num: 17, chineseName: "СИНЬ", mongolName: "НРОН", indianName: "ДЖАЙШТХА",
    nakshatra: "Jyeshtha",
    titleRu: "Джайштха",
    favorable: "служебные и общественные дела; обряды для здоровья, долголетия и богатства; медитация, созерцание, психофизический тренинг и обучение наукам",
    unfavorable: "приготовление лекарств; брачные и похоронные дела",
  },
  {
    num: 18, chineseName: "ВЭЙ", mongolName: "НРУБ", indianName: "МУЛА",
    nakshatra: "Mula",
    titleRu: "Мула",
    favorable: "практика внутреннего самосовершенствования; коммерческие мероприятия; переезды; уплата долгов; купля-продажа, обмены",
    unfavorable: "начало путешествия; свадебные и похоронные мероприятия",
  },
  {
    num: 19, chineseName: "ЦЗИ", mongolName: "ЧУДОД", indianName: "ПУРВА АШАДХА",
    nakshatra: "Purva Ashadha",
    titleRu: "Пурва Ашадха — созвездие достатка и богатства",
    favorable: "начало курса терапии, очистительных и восстановительных процедур; купля-продажа; путешествия; любые добрые дела; возможность найти клад",
    unfavorable: "похоронные и свадебные обряды; вынос вещей из дома",
  },
  {
    num: 20, chineseName: "ДОУ", mongolName: "ЧУМАД", indianName: "УТТАРА АШАДХА",
    nakshatra: "Uttara Ashadha",
    titleRu: "Уттара Ашадха — созвездие творчества",
    favorable: "обучение, наставничество; строительство нового дома",
    unfavorable: "отправка в дорогу; отдача вещей из дома",
  },
  {
    num: 21, chineseName: "НЮ", mongolName: "ДОШИН", indianName: "АБХИДЖИТ (Шравана)",
    nakshatra: "Shravana",  // Abhijit mapped to nearest nakshatra
    titleRu: "Абхиджит — созвездие искусства (пение, танцы)",
    favorable: "коммерция; путешествия; покупка одежды; работы с водой; изготовление лекарств; купля-продажа; освящение культовых предметов",
    unfavorable: "сватовство; знакомства с целью женитьбы; приглашение гостей на свадебные торжества",
  },
  {
    num: 22, chineseName: "НЮЙ", mongolName: "ЖИШИН", indianName: "ШРАВАНА",
    nakshatra: "Shravana",
    titleRu: "Шравана",
    favorable: "поклонение богам и святым местам; выполнение важных и неотложных дел; купля-продажа; упражнения для долголетия",
    unfavorable: "одевание новых одежд; большие собрания людей; много читать не рекомендуется",
  },
  {
    num: 23, chineseName: "СЮЙ", mongolName: "МОНДЭ", indianName: "ДХАНИШТХА",
    nakshatra: "Dhanishtha",
    titleRu: "Дхаништха — созвездие путешественников, созидания, познания нового, творчества",
    favorable: "изготовление лекарств; строительство нового дома; купля-продажа; путешествия; посев; кройка одежды; молитвы",
    unfavorable: "переезд на новое место; сватовство, свадьбы, похороны",
  },
  {
    num: 24, chineseName: "ВЭЙ", mongolName: "МОНДУ", indianName: "ШАТАБХИША",
    nakshatra: "Shatabhisha",
    titleRu: "Шатабхиша — созвездие богатства и достатка",
    favorable: "новые начинания; строительство; земляные работы",
    unfavorable: "путешествия; стрижка волос; свадьбы и сватовство; кройка одежды",
  },
  {
    num: 25, chineseName: "ШИ", mongolName: "ТУМДОД", indianName: "ПУРВА БХАДРАПАДА",
    nakshatra: "Purva Bhadrapada",
    titleRu: "Пурва Бхадрапада",
    favorable: "изготовление лекарств; продажа вещей и товаров; молитвы; начало путешествия; начало новых дел и строительства",
    unfavorable: "свадьбы; кройка одежды",
  },
  {
    num: 26, chineseName: "БИ", mongolName: "ТУММАД", indianName: "УТТАРА БХАДРАПАДА",
    nakshatra: "Uttara Bhadrapada",
    titleRu: "Уттара Бхадрапада — созвездие благоденствия",
    favorable: "путешествия; изготовление лекарств; строительство; купля-продажа; почитание предков — к богатству и признанию",
    unfavorable: "шитьё одежды",
  },
  {
    num: 27, chineseName: "КУЙ", mongolName: "НАМДУ", indianName: "РЕВАТИ",
    nakshatra: "Revati",
    titleRu: "Ревати — созвездие творчества и созерцания",
    favorable: "изготовление лекарств; наставничество и обучение; медитации",
    unfavorable: "начало ремонта или строительства; земляные работы",
  },
  {
    num: 28, chineseName: "ЛОУ", mongolName: "ТАГИР", indianName: "АШВИНИ",
    nakshatra: "Ashwini",
    titleRu: "Ашвини",
    favorable: "собрания, совещания, встречи и воссоединение людей; строительство; ирригационные работы; изготовление лекарств; сбор урожая; преодоление препятствий; начало курса терапии по омоложению и долголетию",
    unfavorable: "переезд; женитьба",
  },
];

const rules = MANSIONS.map(m => {
  const summary = `${m.titleRu}. Благоприятно: ${m.favorable}. Неблагоприятно: ${m.unfavorable}.`;
  return ensureSchema({
    ruleId: `lunar-mansion:${m.nakshatra}:${m.num}`,
    type: "lunar-mansion",
    factor: {
      nakshatra: m.nakshatra,
      mansionNum: m.num,
      chineseName: m.chineseName,
      indianName: m.indianName,
    },
    simpleRu: {
      name: m.titleRu,
      nakshatraIndiRu: m.indianName,
      nakshatraChinRu: m.chineseName,
      favorable: m.favorable,
      unfavorable: m.unfavorable,
      summary,
    },
  }, {
    system: "lunar-calendar",
    methodFamily: "lunar-mansions",
    sourceIds: ["source.davydov-dao-lunar-calendar"],
    themes: [m.nakshatra.toLowerCase(), "lunar-mansion", "muhurta", `mansion-${m.num}`],
    confidence: "medium",
    simple: {
      summary,
      pattern: `Лунная стоянка ${m.titleRu} (${m.chineseName}) задаёт благоприятные и неблагоприятные виды деятельности дня.`,
      growth: `Согласование дел с лунной стоянкой ${m.titleRu} помогает выбирать удачное время для начинаний.`,
      reflection: `Какие дела вы планируете, когда Луна проходит стоянку ${m.titleRu}?`,
    },
    advanced: {
      technical: `Лунная стоянка №${m.num}: китайское название ${m.chineseName}, индийское ${m.indianName} (${m.nakshatra}).`,
      method: `Китайско-монгольско-индийская система 28 лунных стоянок (Давыдов «Дао лунного календаря»); для каждой стоянки заданы благоприятные и неблагоприятные виды деятельности.`,
      caution: `Электив по лунной стоянке — вспомогательный слой мухурты; учитывайте также тити, вару и накшатру Луны.`,
      constructiveChannel: `Начинать благоприятные для стоянки ${m.titleRu} дела и воздерживаться от неблагоприятных.`,
    },
  });
});

// Deduplicate: Shravana appears for both #21 (Abhijit) and #22. Keep the primary (#22) and rename #21.
for (const r of rules) {
  if (r.factor.mansionNum === 21) {
    r.ruleId = `lunar-mansion:Abhijit:21`;
    r.id = r.ruleId;
    r.factor.nakshatra = "Shravana"; // fallback mapping preserved
  }
}

const outPath = path.join(__dirname, "..", "generator", "rules", "lunar-mansion-rules.json");
fs.writeFileSync(outPath, JSON.stringify(rules, null, 2), "utf8");
console.log(`Written ${rules.length} lunar mansion rules → ${outPath}`);
