const fs = require("fs");
const path = require("path");

const rulesPath = path.join(__dirname, "..", "data", "palmistry-rules.json");

function loadRules() {
  return JSON.parse(fs.readFileSync(rulesPath, "utf8"));
}

function clean(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function pickLineMeanings(lineRules, selected = []) {
  return selected.map((feature) => lineRules?.[feature]).filter(Boolean);
}

function boundedMetric(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function formatFeatureList(items) {
  const featureTitles = {
    long_clear: "длинная и четкая",
    curved: "изогнутая",
    straight: "прямая",
    chained: "цепочкой",
    broken: "прерывистая",
    deep: "глубокая",
    wide_arc: "широкая дуга",
    close_arc: "близко к большому пальцу",
    forked: "вилка на конце",
    strong: "сильная",
    weak: "слабая/тонкая",
    starts_late: "начинается поздно",
  };
  return items.length ? items.map((item) => featureTitles[item] || item).join(", ") : "нет уверенного признака";
}

function buildMonthlyAdvice({ handShape, heartFeatures, headFeatures, lifeFeatures, fateFeatures, mounts }) {
  const hasMount = (key) => mounts.some((mount) => mount.key === key);
  const goWhere = mounts.some((mount) => mount.key === "jupiter")
    ? "идите туда, где можно заявить о себе: переговоры, собеседование, публичная роль, встреча с человеком выше по опыту или статусу"
    : mounts.some((mount) => mount.key === "moon")
      ? "идите туда, где расширяется воображение: вода, дорога, новое место, выставка, тихая прогулка, пространство без привычного шума"
      : mounts.some((mount) => mount.key === "mercury")
        ? "идите в коммуникацию: короткие встречи, переписка, продажи, обмен идеями, обучение через разговор"
        : "идите в простую практику: место, где можно спокойно сделать дело, увидеть результат и не распыляться";
  const tryWhat = headFeatures.includes("curved")
    ? "попробуйте творческий формат решения задачи: карта идей, голосовая заметка, визуальный план, разговор без жесткого сценария"
    : "попробуйте строгий формат: список из трех задач, дедлайн на неделю, один измеримый результат и короткий отчет самому себе";
  const doWhat = lifeFeatures.includes("wide_arc")
    ? "делайте больше движения и смены пространства: короткие поездки, прогулки, новые маршруты, работа вне привычного места"
    : "делайте ставку на режим: сон, вода, регулярное питание, порядок в доме и один повторяемый ритуал восстановления";
  const avoidWhat = heartFeatures.includes("chained")
    ? "не принимайте резких решений на эмоциональной волне, не проверяйте близких молчанием и не додумывайте за другого"
    : "не уходите в холодную рациональность там, где нужен честный теплый разговор";
  const careerMove = fateFeatures.includes("strong")
    ? "в делах просите больше ответственности или фиксируйте новую роль: линия судьбы поддерживает движение к статусу"
    : "в делах тестируйте варианты малыми ставками: линия судьбы больше про гибкий маршрут, чем про один окончательный выбор";
  const shapeAdvice = {
    earth: "Земная рука просит материального результата: деньги, тело, дом, рабочий порядок, конкретная польза. Месяц лучше строить через факты, а не обещания.",
    air: "Воздушная рука просит ясности и обмена: учиться, писать, договариваться, сортировать идеи. Месяц выиграет от разговоров, схем и чистой информации.",
    water: "Водная рука просит бережности к чувствам: меньше давления, больше восстановления, творчества и честного контакта с внутренним состоянием.",
    fire: "Огненная рука просит действия: начинать, пробовать, показывать себя, но не сжигать силы одним рывком. Нужен выход энергии и ясная граница.",
  }[handShape.shapeKey] || "Форма руки просит наблюдать, где энергия идет легко, а где тело и внимание быстро устают.";

  return [
    {
      title: "1. Главный вопрос месяца",
      text: `${shapeAdvice} Вопрос, на который рука отвечает первой: где вам пора перестать ждать внешнего разрешения и собрать практический маршрут на 30 дней? Начните с одного направления, где результат можно увидеть руками: разговор проведен, документ отправлен, маршрут пройден, вещь разобрана, решение принято.`,
    },
    {
      title: "2. Отношения и близость",
      text: heartFeatures.includes("long_clear")
        ? "Что происходит в отношениях? Линия сердца говорит: человеку важно не просто присутствие, а живое тепло и честность. На месяц совет такой: проговорите одну тему, которую обычно обходите. Не требуйте идеального ответа сразу, но смотрите, есть ли встречное движение."
        : "Что происходит в отношениях? Сердечный слой осторожнее: доверие лучше проверять временем, поступками и спокойной регулярностью. В этом месяце не ускоряйте сближение искусственно; лучше наблюдайте, кто стабилен, а кто появляется только на эмоциях.",
    },
    {
      title: "3. Работа и направление",
      text: fateFeatures.includes("strong")
        ? "Куда двигаться в работе? Линия судьбы поддерживает более ясную роль: просите ответственность, фиксируйте цену, должность, формат участия. В ближайший месяц полезно сделать шаг, который укрепляет статус, а не просто добавляет занятости."
        : "Куда двигаться в работе? Судьбоносная линия больше похожа на гибкий маршрут: тестируйте несколько вариантов малыми ставками. Не выбирайте навсегда; выберите то, что можно проверить за неделю и быстро усилить или закрыть.",
    },
    {
      title: "4. Деньги и ценность",
      text: hasMount("jupiter")
        ? "Где деньги? Холм Юпитера говорит: деньги приходят там, где вы не прячетесь, а называете свою ценность. В этом месяце стоит поднять цену, обсудить условия, попросить рекомендацию или показать результат тем, кто принимает решения."
        : "Где деньги? Ставка не на резкий скачок, а на наведение порядка: пересчитать обязательства, убрать лишние траты энергии, закрыть мелкий долг, сделать одну полезную услугу лучше. Деньги идут через ясность и повторяемость.",
    },
    {
      title: "5. Энергия и ресурс",
      text: `${doWhat}. Что поддержит ресурс? Линия жизни показывает, что в этом месяце нельзя тащить все на силе воли. Каждый вечер отмечайте, что дало энергию, а что ее забрало. Это не медицинский вывод, а практический способ увидеть, где вы сами истощаете свой ритм.`,
    },
    {
      title: "6. Обучение и решения",
      text: `${tryWhat}. Как принимать решения? ${headFeatures.includes("straight") ? "Линия головы просит факты, сроки и проверяемость: не верьте красивому обещанию без конкретного плана." : "Линия головы просит образ, интуитивную связку и творческую проверку: сначала соберите картину, потом превращайте ее в план."}`,
    },
    {
      title: "7. Куда идти и с кем встречаться",
      text: `${goWhere}. Выбирайте места, после которых появляется спокойное желание действовать. Если после встречи хочется срочно доказывать свою ценность, лучше взять паузу. Если появляется ясность, идея или телесное облегчение, направление подходит.`,
    },
    {
      title: "8. Что пробовать нового",
      text: `Что пробовать? Добавьте один эксперимент на неделю: новый формат работы, новый маршрут, новый способ общения, короткое обучение или разговор с человеком, который видит вашу ситуацию иначе. ${careerMove}. Эксперимент должен быть маленьким, но реальным.`,
    },
    {
      title: "9. Чего избегать",
      text: `${avoidWhat}. Не обещайте больше, чем реально можете выдержать телом и графиком. Не соглашайтесь на проекты, где непонятны сроки, деньги, роль или личная выгода. Не тяните старые обязательства из вины: в этом месяце важнее качество выбора, чем количество направлений.`,
    },
    {
      title: "10. Контрольный прогноз",
      text: `Как понять, что месяц идет правильно? В конце каждой недели ответьте на три вопроса: где я стал свободнее, где я снова действовал по старой привычке, какой один шаг даст больше всего пользы на следующей неделе. ${hasMount("moon") ? "Холм Луны добавляет подсказку: сны, дороги, вода и тишина могут дать неожиданный ответ." : "Главный знак будет не мистический, а практический: больше ясности, меньше суеты, больше точных действий."}`,
    },
  ];
}

function calculatePalmistry(input = {}) {
  const rules = loadRules();
  const rawMetrics = input.imageMetrics && typeof input.imageMetrics === "object" ? input.imageMetrics : null;
  const imageMetrics = rawMetrics ? {
    brightness: boundedMetric(rawMetrics.brightness),
    contrast: boundedMetric(rawMetrics.contrast),
    sharpness: boundedMetric(rawMetrics.sharpness),
  } : null;
  const requestedHandShapeKey = clean(input.handShape, "earth");
  const handShapeKey = rules.handShapes[requestedHandShapeKey] ? requestedHandShapeKey : "earth";
  const handShape = rules.handShapes[handShapeKey];
  const selectedMounts = Array.isArray(input.mounts)
    ? input.mounts.filter((key) => Object.hasOwn(rules.mounts, key))
    : [];
  const lineInput = input.lines || {};
  const autoReading = input.autoReading && typeof input.autoReading === "object" ? input.autoReading : null;
  const lineTitles = {
    heart: "Линия сердца",
    head: "Линия головы",
    life: "Линия жизни",
    fate: "Линия судьбы",
  };
  const mountTitles = {
    venus: "Холм Венеры",
    moon: "Холм Луны",
    jupiter: "Холм Юпитера",
    mercury: "Холм Меркурия",
    saturn: "Холм Сатурна",
    apollo: "Холм Аполлона",
  };

  const lines = Object.entries(rules.lines).map(([key, lineRules]) => {
    const features = Array.isArray(lineInput[key])
      ? lineInput[key].filter((feature) => Object.hasOwn(lineRules, feature))
      : [];
    const meanings = pickLineMeanings(lineRules, features);
    return {
      key,
      title: lineTitles[key],
      features,
      meanings: meanings.length ? meanings : ["признак пока не выбран, поэтому трактовка остается общей и осторожной"],
    };
  });

  const mounts = selectedMounts.map((key) => ({
    key,
    title: mountTitles[key],
    meaning: rules.mounts[key],
  })).filter((item) => item.title && item.meaning);

  const dominantTone = [
    `${handShape.title}: ${handShape.meaning}.`,
    `Теневая сторона: ${handShape.shadow}.`,
    `Практический ключ: ${handShape.advice}.`,
  ];

  const heart = lines.find((line) => line.key === "heart");
  const head = lines.find((line) => line.key === "head");
  const life = lines.find((line) => line.key === "life");
  const synthesis = [
    `По форме ладони главный акцент идет на "${handShape.title.toLowerCase()}": это не приговор характера, а удобная символическая рамка для разговора о привычном стиле реакции.`,
    heart?.meanings[0] ? `Эмоциональный слой: ${heart.meanings[0]}.` : "",
    head?.meanings[0] ? `Ментальный слой: ${head.meanings[0]}.` : "",
    life?.meanings[0] ? `Ресурсный слой: ${life.meanings[0]}.` : "",
  ].filter(Boolean);

  const heartFeatures = lines.find((line) => line.key === "heart")?.features || [];
  const headFeatures = lines.find((line) => line.key === "head")?.features || [];
  const lifeFeatures = lines.find((line) => line.key === "life")?.features || [];
  const fateFeatures = lines.find((line) => line.key === "fate")?.features || [];

  const boldHypotheses = [
    heartFeatures.includes("long_clear")
      ? "В отношениях человек, вероятно, не умеет долго жить в эмоциональном вакууме: если тепло исчезает, он будет искать прямой разговор, подтверждение близости или новый источник живого контакта."
      : "В чувствах возможна осторожная стратегия: человек может проверять другого временем, делом и устойчивостью, прежде чем открывать сильную привязанность.",
    headFeatures.includes("straight")
      ? "Решения, скорее всего, проходят через фильтр логики: красивые обещания не сработают без конкретики, сроков и понятной выгоды."
      : "Мышление может идти ассоциативно: важные решения часто рождаются не в сухом плане, а после образа, сна, разговора или внезапной внутренней связки.",
    lifeFeatures.includes("wide_arc")
      ? "Судя по дуге жизненной линии, сильнее всего человека оживляет пространство: поездки, смена среды, свобода маршрута и право самому выбирать темп."
      : "Ресурс больше привязан к стабильной среде: дом, привычный круг, сон, телесный режим и отсутствие хаотичных обязательств могут решать больше, чем мотивация.",
    fateFeatures.includes("starts_late")
      ? "Карьерная траектория может раскрыться не сразу: вероятен период проб, после которого появляется более точное направление и желание собирать свой статус заново."
      : "Судьбоносная линия указывает на сценарий, где путь строится через текущие возможности: важнее ловить момент, чем ждать идеального плана.",
    mounts.some((mount) => mount.key === "jupiter")
      ? "Холм Юпитера усиливает гипотезу амбиций: человеку важно не просто делать, а чувствовать рост, уважение и право влиять."
      : "Если холмы выражены мягче, чем линии, ключ к будущему скорее в привычках и выборе среды, а не в резком прорыве через статус.",
  ];

  const futureForecast = [
    fateFeatures.includes("strong")
      ? "Ближайшие 3-6 месяцев: вероятен период усиления профессиональной линии. Хорошо заходят переговоры о роли, статусе, цене работы, новом проекте или самостоятельном направлении."
      : "Ближайшие 3-6 месяцев: будущее больше похоже на гибкую развилку, чем на один жесткий маршрут. Лучшие результаты придут через несколько параллельных проб и быстрый отказ от лишнего.",
    heartFeatures.includes("chained")
      ? "В личной сфере возможны эмоциональные волны: старые сомнения могут вернуться, чтобы человек наконец назвал свои настоящие условия близости."
      : "В личной сфере прогноз спокойнее: если говорить прямо и не тянуть с недовольством, отношения могут стать теплее и честнее без резких драм.",
    headFeatures.includes("broken")
      ? "В мышлении виден сценарий переобучения: может появиться новая тема, инструмент или человек, который заставит пересобрать планы."
      : "В делах стоит ставить на концентрацию: один ясный план на 30 дней даст больше, чем десять красивых, но расплывчатых идей.",
    lifeFeatures.includes("forked")
      ? "Линия жизни с развилкой усиливает вероятность смены маршрута: поездка, переезд, новая роль или расширение круга общения могут стать поворотной точкой."
      : "По ресурсу прогноз просит не рывка, а режима: тело и настроение будут лучше отвечать на регулярность, сон и понятный график.",
    mounts.some((mount) => mount.key === "moon")
      ? "Интуитивный слой заметен: сны, случайные совпадения и тяга к дальним местам могут подсказать направление, которое логика догонит позже."
      : "Главная ставка будущего сейчас не на мистический знак, а на точный выбор: что оставить, что завершить и куда вкладывать энергию ежедневно.",
  ];

  const qualityReading = imageMetrics ? [
    imageMetrics.brightness < 38 ? "снимок темноват, поэтому тонкие линии могут теряться" : "света достаточно для первичного чтения ладони",
    imageMetrics.contrast < 18 ? "контраст линий слабый: ручные признаки важнее автоматической карты" : "контраст позволяет смелее смотреть на главные борозды",
    imageMetrics.sharpness < 14 ? "есть риск смаза, лучше сделать еще один кадр с неподвижной камерой" : "резкость подходит для визуальной разметки",
  ] : [];
  const recognitionReadiness = imageMetrics
    ? Math.round((imageMetrics.brightness * 0.25) + (imageMetrics.contrast * 0.4) + (imageMetrics.sharpness * 0.35))
    : 0;
  const recognizedTraits = [
    `Форма руки: ${handShape.title}.`,
    `Линия сердца: ${formatFeatureList(heartFeatures)}.`,
    `Линия головы: ${formatFeatureList(headFeatures)}.`,
    `Линия жизни: ${formatFeatureList(lifeFeatures)}.`,
    `Линия судьбы: ${formatFeatureList(fateFeatures)}.`,
    `Холмы: ${mounts.length ? mounts.map((mount) => mount.title).join(", ") : "не выделились уверенно"}.`,
  ];
  const monthlyAdviceSections = buildMonthlyAdvice({ handShape, heartFeatures, headFeatures, lifeFeatures, fateFeatures, mounts });
  const monthlyAdvice = monthlyAdviceSections.map((section) => `${section.title}: ${section.text}`).join("\n\n");

  return {
    hand: {
      side: ["dominant", "right", "left"].includes(input.handSide) ? input.handSide : "dominant",
      shapeKey: handShapeKey,
      shapeTitle: handShape.title,
    },
    dominantTone,
    lines,
    mounts,
    imageMetrics,
    autoReading: autoReading ? {
      confidence: boundedMetric(autoReading.confidence),
      handShape: autoReading.handShapeTitle || autoReading.handShape || handShape.title,
      lines: {
        heart: formatFeatureList(heartFeatures),
        head: formatFeatureList(headFeatures),
        life: formatFeatureList(lifeFeatures),
        fate: formatFeatureList(fateFeatures),
      },
      mounts: mounts.map((mount) => mount.title),
      recognizedTraits,
      summary: autoReading.summary || "Авторазметка построена по зонам контраста на фото ладони.",
    } : null,
    recognizedTraits,
    qualityReading,
    recognitionReadiness,
    synthesis,
    boldHypotheses,
    futureForecast,
    monthlyAdviceSections,
    monthlyAdvice,
    photoNote: input.hasPhoto ? `Фото добавлено: в этой версии оно используется для визуального контекста и ручной разметки.${qualityReading.length ? ` Качество снимка: ${qualityReading.join("; ")}.` : " Автоматическое распознавание линий будет следующим слоем."}` : "Фото не добавлено: отчет построен по выбранным признакам.",
    safetyNote: rules.safetyNote,
  };
}

module.exports = {
  calculatePalmistry,
};
