"use strict";

const PLANET_GLYPHS = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂",
  Jupiter: "♃", Saturn: "♄", Uranus: "♅", Neptune: "♆", Pluto: "♇",
};
const SIGN_RU = {
  Aries: "Овен", Taurus: "Телец", Gemini: "Близнецы", Cancer: "Рак",
  Leo: "Лев", Virgo: "Дева", Libra: "Весы", Scorpio: "Скорпион",
  Sagittarius: "Стрелец", Capricorn: "Козерог", Aquarius: "Водолей", Pisces: "Рыбы",
};
const PLANET_RU = {
  Sun: "Солнце", Moon: "Луна", Mercury: "Меркурий", Venus: "Венера",
  Mars: "Марс", Jupiter: "Юпитер", Saturn: "Сатурн", Uranus: "Уран",
  Neptune: "Нептун", Pluto: "Плутон",
  ASC: "Асцендент", MC: "МС (Середина Неба)",
  "North Node": "Северный Узел", "South Node": "Южный Узел",
};
const ASPECT_RU = {
  conjunction: "соединение", opposition: "оппозиция", square: "квадрат",
  trine: "трин", sextile: "секстиль",
};
const TYPE_LABEL = {
  aspect: "Аспект", house: "Дом", sign: "Знак", ruler: "Управитель", transit: "Транзит",
  vedic: "Джйотиш", kabbalah: "Каббала", "chinese-zodiac": "Восточный зодиак",
};

const RASHI_RU = {
  Mesha: "Меша (Овен)", Vrishabha: "Вришабха (Телец)", Mithuna: "Митхуна (Близнецы)",
  Karka: "Карка (Рак)", Simha: "Симха (Лев)", Kanya: "Канья (Дева)",
  Tula: "Тула (Весы)", Vrishchika: "Вришчика (Скорпион)", Dhanu: "Дхану (Стрелец)",
  Makara: "Макара (Козерог)", Kumbha: "Кумбха (Водолей)", Meena: "Меена (Рыбы)",
};
const GRAHA_RU = {
  Sun: "Сурья", Moon: "Чандра", Mars: "Мангал", Mercury: "Будха",
  Jupiter: "Гуру", Venus: "Шукра", Saturn: "Шани",
};

// Escape user-controlled strings before inserting into innerHTML templates
function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function showFormError(id, message) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message || "";
  el.classList.toggle("hidden", !message);
}

// Load places into select
async function loadPlaces() {
  try {
    const res = await fetch("/api/places");
    if (!res.ok) throw new Error(res.statusText);
    const list = await res.json();
    const sel  = document.getElementById("place");
    for (const p of list) {
      const opt   = document.createElement("option");
      opt.value   = p.key;
      opt.textContent = p.name;
      sel.appendChild(opt);
    }
  } catch {
    showFormError("form-error",
      "Не удалось загрузить список городов. Проверьте, что сервер запущен, и обновите страницу.");
  }
}

// Toggle factor body
function toggleFactor(header) {
  const body = header.nextElementSibling;
  const open = body.classList.toggle("open");
  header.setAttribute("aria-expanded", open ? "true" : "false");
}

// Make an accordion header operable by keyboard (Enter / Space)
function makeHeaderAccessible(header) {
  header.setAttribute("role", "button");
  header.setAttribute("tabindex", "0");
  header.setAttribute("aria-expanded", "false");
  header.addEventListener("click", () => toggleFactor(header));
  header.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleFactor(header);
    }
  });
}

function makeFactorItem(title, typeKey, texts) {
  const item   = document.createElement("div");
  item.className = "factor-item";

  const header = document.createElement("div");
  header.className = "factor-header";
  header.innerHTML = `
    <span class="factor-title">${title}</span>
    <span class="factor-type type-${typeKey}">${TYPE_LABEL[typeKey] || typeKey}</span>
  `;
  makeHeaderAccessible(header);

  const body = document.createElement("div");
  body.className = "factor-body";

  if (texts) {
    if (texts.summary)          body.innerHTML += `<p><strong>${texts.summary}</strong></p>`;
    if (texts.description && !texts.summary) body.innerHTML += `<p>${texts.description.slice(0,400)}…</p>`;
    if (texts.pattern)          body.innerHTML += `<p>${texts.pattern}</p>`;
    if (texts.tikkun)           body.innerHTML += `<div class="label">${texts.tikkunTitle || "Тиккун (задача исправления)"}</div><p>${texts.tikkun.slice(0,350)}…</p>`;
    if (texts.monthlyInfluence) body.innerHTML += `<div class="label">Влияние месяца</div><p>${texts.monthlyInfluence}</p>`;
    if (texts.advice)           body.innerHTML += `<div class="label">Совет</div><p>${texts.advice}</p>`;
    if (texts.favorable)        body.innerHTML += `<div class="label">Благоприятно для</div><p>${texts.favorable}</p>`;
    if (texts.unfavorable)      body.innerHTML += `<div class="label">Неблагоприятно для</div><p>${texts.unfavorable}</p>`;
    if (texts.growth)           body.innerHTML += `<div class="label">Задача роста</div><p>${texts.growth}</p>`;
    if (texts.reflection)       body.innerHTML += `<div class="label">Вопрос для рефлексии</div><p>${texts.reflection}</p>`;
  }

  item.appendChild(header);
  item.appendChild(body);
  return item;
}

function renderPlanets(profile) {
  const tbody = document.getElementById("planets-body");
  tbody.innerHTML = "";

  const positions = profile.calculation?.positions || [];
  for (const p of positions) {
    const glyph = PLANET_GLYPHS[p.body] || "";
    const deg   = p.degreeInSign != null ? `${p.degreeInSign.toFixed(1)}°` : "";
    const house = p.house ? `<span class="house-num">${p.house}</span>` : "—";
    const sign  = SIGN_RU[p.sign] || p.sign;
    const tr    = document.createElement("tr");
    tr.innerHTML = `
      <td><span class="planet-glyph">${glyph}</span>${PLANET_RU[p.body] || p.body}</td>
      <td><span class="sign-badge">${sign}</span></td>
      <td>${deg}</td>
      <td>${house}</td>
    `;
    tbody.appendChild(tr);
  }

  // Angles
  const angles = profile.calculation?.angles;
  const anglesRow = document.getElementById("angles-row");
  anglesRow.innerHTML = "";
  if (angles?.ascendant) {
    const asc = angles.ascendant;
    anglesRow.innerHTML += `<div class="angle-chip">ASC <span>${SIGN_RU[asc.sign] || asc.sign} ${asc.degreeInSign?.toFixed(1)}°</span></div>`;
  }
  if (angles?.midheaven) {
    const mc = angles.midheaven;
    anglesRow.innerHTML += `<div class="angle-chip">MC <span>${SIGN_RU[mc.sign] || mc.sign} ${mc.degreeInSign?.toFixed(1)}°</span></div>`;
  }
}

function factorTitle(item) {
  const r = item.rule || {};
  const f = r.factor || {};
  if (f.chineseAnimal) {
    const ruGen = item.rule?.simpleRu?.animalRuGen || f.chineseAnimal;
    const yr = item.calculated?.birthYear || "";
    return { title: `Год ${ruGen} — Восточный зодиак${yr ? ` (${yr})` : ""}`, typeKey: "chinese-zodiac" };
  }
  if (f.kabbalahPlanet && f.sign)
    return { title: `Каббала: ${SIGN_RU[f.sign] || f.sign} — месяц ${f.hebrewMonth}`, typeKey: "kabbalah" };
  if (f.nakshatra && f.mansionNum) {
    const name = item.rule?.simpleRu?.name || f.nakshatra;
    return { title: `Лунная стоянка ${f.mansionNum}: ${name}`, typeKey: "vedic" };
  }
  if (f.nakshatra && f.pada) {
    const nkRu  = item.rule?.simpleRu?.nakshatraRu || f.nakshatra;
    const navRu = item.rule?.simpleRu?.navamshaSign || "";
    return { title: `Луна ${nkRu}, пада ${f.pada}${navRu ? ` (навамша ${navRu})` : ""}`, typeKey: "vedic" };
  }
  if (f.nakshatra) {
    const nkRu = item.rule?.simpleRu?.name || f.nakshatra;
    const ruler = item.rule?.simpleRu?.ruler || item.calculated?.ruler || "";
    return { title: `Луна в накшатре ${nkRu}${ruler ? ` (${ruler})` : ""}`, typeKey: "vedic" };
  }
  if (f.graha && f.rashi)
    return { title: `${GRAHA_RU[f.graha] || f.graha} в ${RASHI_RU[f.rashi] || f.rashi}`, typeKey: "vedic" };
  if (f.planetA && f.aspect && f.planetB)
    return { title: `${PLANET_RU[f.planetA] || f.planetA} — ${ASPECT_RU[f.aspect] || f.aspect} — ${PLANET_RU[f.planetB] || f.planetB}`, typeKey: "aspect" };
  if (f.planet && f.house)
    return { title: `${PLANET_RU[f.planet] || f.planet} в ${f.house} доме`, typeKey: "house" };
  if (f.planet && f.sign)
    return { title: `${PLANET_RU[f.planet] || f.planet} в ${SIGN_RU[f.sign] || f.sign}`, typeKey: "sign" };
  if (f.rulerOfHouse && f.placedInHouse)
    return { title: `Управитель ${f.rulerOfHouse} дома в ${f.placedInHouse} доме`, typeKey: "ruler" };
  return { title: item.query || r.id || "Правило", typeKey: "sign" };
}

// ─── Synthesis ────────────────────────────────────────────────────────────────
// Extract recurring themes across all matched factors
const THEME_KEYWORDS = {
  "Творчество и самовыражение": ["творч","искусств","выражени","созидани","вдохновени","художеств","красот","эстет","музык","поэ"],
  "Власть и лидерство":         ["власт","лидер","управлени","авторитет","контрол","командов","доминир","превосход","сил","побед"],
  "Отношения и партнёрство":    ["отношени","партнёр","любов","брак","союз","близост","общени","сватовств","семь","совместим"],
  "Трансформация и кризис":     ["трансформ","кризис","разрушени","смерт","возрожд","перемен","глубин","инициац","конец","начал"],
  "Духовный поиск":             ["духовн","поиск","смысл","вера","религи","медитац","интуиц","мистик","просветл","сознани","молитв"],
  "Карьера и призвание":        ["карьер","призван","профессион","цел","достижени","труд","работ","успех","репутац","амбиц"],
  "Свобода и независимость":    ["свобод","независим","приключ","путешеств","нестандарт","оригинальн","новатор","бунт","раскрепощ"],
  "Эмоции и психология":        ["эмоц","психол","чувств","страст","тревог","уязвим","тенев","депресс","страх","зависим"],
  "Материальный мир":           ["матери","деньг","финанс","собственност","имущ","стабильн","ресурс","богатств","накоплени"],
  "Интеллект и коммуникация":   ["интеллект","коммуник","речь","слов","обучени","знани","анализ","логик","язык","информ"],
  "Исцеление и здоровье":       ["исцелени","здоровь","лечени","терапи","восстановлени","очищени","целитель","медицин"],
  "Духи и предки":              ["предк","традиц","корен","история","наследи","прошл","память","рода","клан"],
};

// Map rule types/systems to human-readable system labels
function factorSystem(item) {
  const t = item.rule?.type || "";
  const s = item.rule?.system || "";
  if (t === "kabbalah") return "каббала";
  if (t === "chinese-zodiac") return "восточный зодиак";
  if (t === "nakshatra" || t === "nakshatra-pada") return "накшатры";
  if (t === "lunar-mansion") return "лунные стоянки";
  if (t === "birthday" || (item.rule?.factor?.month && item.rule?.factor?.day)) return "персонология";
  if (s === "vedic") return "ведическая";
  if (t === "aspect" || t === "house" || t === "sign" || t === "ruler") return "западная";
  const q = item.query || "";
  if (q.startsWith("vedic:")) return "ведическая";
  if (q.startsWith("kabbalah:")) return "каббала";
  if (q.startsWith("chinese:")) return "восточный зодиак";
  if (q.startsWith("nakshatra")) return "накшатры";
  return "западная";
}

// Shared theme accumulator: top-20 factors + all special-system factors,
// keyword hits weighted by significance, contributing systems tracked.
const SPECIAL_TYPES = new Set(["kabbalah","chinese-zodiac","nakshatra","nakshatra-pada","lunar-mansion","birthday"]);
const CROSS_SYSTEM_MIN = 2;   // themes confirmed by ≥2 systems are preferred
const SINGLE_SYSTEM_MIN_SCORE = 12;
const SYNTHESIS_TOP_FACTORS = 20;
const SYNTHESIS_MAX_THEMES = 3;

function computeThemeData(matched) {
  const topN    = matched.slice(0, SYNTHESIS_TOP_FACTORS);
  const special = matched.slice(SYNTHESIS_TOP_FACTORS).filter(r => SPECIAL_TYPES.has(r.rule?.type));
  const top     = [...new Set([...topN, ...special])];

  const themeData = {}; // theme → { score, systems: Set }
  for (const item of top) {
    const sig = item.significance || 1;
    const sys = factorSystem(item);
    const texts = item.rule?.simpleRu || item.rule?.simple || {};
    const blob = [
      texts.summary, texts.description, texts.pattern, texts.tikkun,
      texts.keywords?.join(" "), texts.favorable, texts.unfavorable,
      texts.animalDescription,
    ].filter(Boolean).join(" ").toLowerCase();

    for (const [theme, kws] of Object.entries(THEME_KEYWORDS)) {
      const hits = kws.filter(kw => blob.includes(kw)).length;
      if (hits > 0) {
        if (!themeData[theme]) themeData[theme] = { score: 0, systems: new Set() };
        themeData[theme].score  += hits * sig;
        themeData[theme].systems.add(sys);
      }
    }
  }
  return themeData;
}

function buildSynthesis(matched, profile) {
  if (matched.length < 3) return null;

  const themeData = computeThemeData(matched);

  // Require cross-system confirmation (≥2 different systems) or high single-system score
  const confirmed = Object.entries(themeData)
    .filter(([, d]) => d.systems.size >= CROSS_SYSTEM_MIN || d.score >= SINGLE_SYSTEM_MIN_SCORE)
    .sort((a, b) => {
      // Prefer cross-system; then by score
      const crossA = a[1].systems.size >= CROSS_SYSTEM_MIN ? 1 : 0;
      const crossB = b[1].systems.size >= CROSS_SYSTEM_MIN ? 1 : 0;
      if (crossB !== crossA) return crossB - crossA;
      return b[1].score - a[1].score;
    })
    .slice(0, SYNTHESIS_MAX_THEMES);

  // Fallback: top by score (no cross-system requirement)
  const topThemes = confirmed.length >= 2 ? confirmed :
    Object.entries(themeData).sort((a,b) => b[1].score - a[1].score).slice(0, SYNTHESIS_MAX_THEMES);

  if (topThemes.length === 0) return null;

  // Sun/Moon/ASC signs for context line
  const positions = profile.calculation?.positions || [];
  const sun  = positions.find(p => p.body === "Sun");
  const moon = positions.find(p => p.body === "Moon");
  const asc  = profile.calculation?.angles?.ascendant;

  let context = "";
  if (sun?.sign)  context += `${PLANET_GLYPHS.Sun} Солнце в ${SIGN_RU[sun.sign] || sun.sign}`;
  if (moon?.sign) context += `  ${PLANET_GLYPHS.Moon} Луна в ${SIGN_RU[moon.sign] || moon.sign}`;
  if (asc?.sign)  context += `  ↑ ASC ${SIGN_RU[asc.sign] || asc.sign}`;

  const themeChips = topThemes.map(([theme, d]) => {
    const cross = d.systems.size >= 2
      ? `<span class="synth-systems">${[...d.systems].join(" · ")}</span>`
      : "";
    return `<span class="synth-theme">${theme}${cross}</span>`;
  }).join("");

  return `
    <div class="synthesis-inner">
      <div class="synthesis-label">Ключевые темы карты</div>
      ${context ? `<div class="synthesis-context">${context}</div>` : ""}
      <div class="synthesis-themes">${themeChips}</div>
    </div>
  `;
}

function renderFactors(profile) {
  const container = document.getElementById("factors-list");
  container.innerHTML = "";

  const matched = profile.matchedRules || [];
  if (matched.length === 0) {
    container.innerHTML = `<p class="loading">Нет совпадений с правилами.</p>`;
    return;
  }

  // Split into groups
  const kabbalah = matched.filter(i => i.rule?.type === "kabbalah");
  const chinese  = matched.filter(i => i.rule?.type === "chinese-zodiac");
  const vedic    = matched.filter(i => i.rule?.system === "vedic" || ["nakshatra","nakshatra-pada","lunar-mansion"].includes(i.rule?.type));
  const western  = matched.filter(i => !["kabbalah","chinese-zodiac","nakshatra","nakshatra-pada","lunar-mansion"].includes(i.rule?.type) && i.rule?.system !== "vedic");
  const topN     = 5;

  function renderGroup(items, groupLabel, isTop) {
    if (!items.length) return;
    const groupEl = document.createElement("div");
    groupEl.className = "factor-group";
    if (groupLabel) {
      const lbl = document.createElement("div");
      lbl.className = "factor-group-label";
      lbl.textContent = groupLabel;
      groupEl.appendChild(lbl);
    }
    items.forEach((item, idx) => {
      const { title, typeKey } = factorTitle(item);
      const texts = item.rule?.simpleRu || item.rule?.simple;
      const el = makeFactorItem(title, typeKey, texts);
      if (isTop && idx < topN) el.classList.add("factor-top");
      groupEl.appendChild(el);
    });
    container.appendChild(groupEl);
  }

  // ── Synthesis block ──────────────────────────────────────────────────────────
  const synthesis = buildSynthesis(matched, profile);
  if (synthesis) {
    const synthEl = document.createElement("div");
    synthEl.className = "synthesis-block";
    synthEl.innerHTML = synthesis;
    container.appendChild(synthEl);
  }

  // Show stat line
  const stat = document.createElement("div");
  stat.className = "factors-stat";
  stat.innerHTML = `<span>${matched.length} интерпретаций</span> <span class="factors-stat-note">· топ-${topN} выделены · отсортировано по значимости</span>`;
  container.appendChild(stat);

  const hasOther = vedic.length || kabbalah.length || chinese.length;
  renderGroup(western,   western.length && hasOther ? "Западная астрология" : null, true);
  renderGroup(vedic,     vedic.length     ? "Джйотиш (ведическая)" : null, false);
  renderGroup(kabbalah,  kabbalah.length  ? "Каббалистическая астрология" : null, false);
  renderGroup(chinese,   chinese.length   ? "Восточный зодиак (Давыдов)" : null, false);
}

function renderVedic(profile) {
  const vedic = profile.calculation?.vedic;
  const el    = document.getElementById("vedic-content");
  el.innerHTML = "";
  if (!vedic) { el.innerHTML = `<p class="loading">Ведические данные недоступны (укажите место рождения).</p>`; return; }

  // Lagna
  const lagna = vedic.lagna;
  if (lagna) {
    const chip = document.createElement("div");
    chip.className = "angle-chip";
    chip.style.marginBottom = "14px";
    chip.innerHTML = `Лагна <span>${lagna.rashi || ""} ${lagna.degreeInRashi?.toFixed(1) || ""}°</span>`;
    el.appendChild(chip);
  }

  // Graha positions
  const grid = document.createElement("div");
  grid.className = "vedic-grid";
  const grahas = vedic.grahaPositions || [];
  for (const p of grahas) {
    const div = document.createElement("div");
    div.className = "vedic-planet";
    div.innerHTML = `
      <div class="vp-name">${PLANET_RU[p.graha] || p.graha}</div>
      <div class="vp-detail">
        ${p.rashi || ""} · ${p.nakshatra || ""}<br>
        Пада ${p.pada || "—"} · ${PLANET_RU[p.nakshatraRuler] || p.nakshatraRuler || ""}<br>
        Бхава ${p.bhava || "—"}
      </div>
    `;
    grid.appendChild(div);
  }
  el.appendChild(grid);

  // Dasha
  const dasha = vedic.vimshottariDasha;
  if (dasha) {
    const box = document.createElement("div");
    box.className = "dasha-box";
    box.innerHTML = `<strong>Вимшоттари даша:</strong> ${PLANET_RU[dasha.currentDashaLord] || dasha.currentDashaLord || "—"}
      ${dasha.dashaEnds ? ` — до ${dasha.dashaEnds}` : ""}
      ${dasha.yearsRemainingInDasha != null ? ` (осталось ${dasha.yearsRemainingInDasha.toFixed(1)} лет)` : ""}`;
    el.appendChild(box);
  }
}

function renderTransits(data) {
  const el = document.getElementById("transits-content");
  el.innerHTML = "";

  const transits = data.activeTransits || [];
  if (transits.length === 0) {
    el.innerHTML = `<p class="loading">Нет активных транзитов на эту дату.</p>`;
    return;
  }

  const summary = data.summary || {};
  const bar = document.createElement("div");
  bar.className = "transit-summary";
  bar.innerHTML = `
    <div class="transit-stat">Всего: <span>${summary.totalActiveTransits || transits.length}</span></div>
    <div class="transit-stat">Точных: <span>${summary.exactTransits || 0}</span></div>
    <div class="transit-stat">Нарастающих: <span>${summary.applyingTransits || 0}</span></div>
  `;
  el.appendChild(bar);

  for (const t of transits) {
    const calc  = t.calculated || {};
    const title = `${PLANET_RU[calc.transitPlanet] || calc.transitPlanet} — ${ASPECT_RU[calc.aspect] || calc.aspect} — нат. ${PLANET_RU[calc.natalPoint] || calc.natalPoint}`;

    const item   = document.createElement("div");
    item.className = "factor-item";

    const phaseClass = `phase-${t.phase}`;
    const phaseLabel = { exact: "точный", applying: "нарастающий", separating: "убывающий" }[t.phase] || t.phase;

    const header = document.createElement("div");
    header.className = "factor-header";
    header.innerHTML = `
      <span class="factor-title">${title}</span>
      <span style="display:flex;gap:6px;align-items:center">
        <span class="phase-badge ${phaseClass}">${phaseLabel} ${t.orbActual}°</span>
        <span class="factor-type type-transit">Транзит</span>
      </span>
    `;
    makeHeaderAccessible(header);

    const body   = document.createElement("div");
    body.className = "factor-body";
    const texts  = t.rule?.simple || {};
    if (texts.summary)    body.innerHTML += `<p><strong>${texts.summary}</strong></p>`;
    if (texts.pattern)    body.innerHTML += `<p>${texts.pattern}</p>`;
    if (texts.growth)     body.innerHTML += `<div class="label">Задача роста</div><p>${texts.growth}</p>`;
    if (texts.reflection) body.innerHTML += `<div class="label">Вопрос для рефлексии</div><p>${texts.reflection}</p>`;

    const timing = t.rule?.timing;
    if (timing?.typicalDurationRu) {
      body.innerHTML += `<div class="label">Длительность</div><p>${timing.typicalDurationRu}</p>`;
    }

    item.appendChild(header);
    item.appendChild(body);
    el.appendChild(item);
  }
}

// Main app state
let currentBirthData = null;
let currentProfile   = null;

async function loadProfile(e) {
  e.preventDefault();
  const btn = document.getElementById("submit-btn");
  btn.disabled = true;
  btn.textContent = "Рассчёт…";

  const localDate = document.getElementById("local-date").value;
  const localTime = document.getElementById("local-time").value;
  const placeKey  = document.getElementById("place").value;
  const name      = document.getElementById("name").value;

  currentBirthData = { localDate, localTime, placeKey };
  showFormError("form-error", "");

  try {
    const res     = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ localDate, localTime, placeKey, name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || res.statusText);
    }
    const profile = await res.json();

    currentProfile = profile;
    resetChat(); // new chart — fresh chat session and question limit

    document.getElementById("chart-name").textContent = name ? `— ${name}` : "";
    renderPlanets(profile);
    renderFactors(profile);
    renderVedic(profile);

    // Set transit date to today and load
    const today = new Date().toISOString().slice(0, 10);
    document.getElementById("transit-date").value = today;
    document.getElementById("results").classList.remove("hidden");
    document.getElementById("results").dataset.hasResults = "1";
    document.getElementById("action-buttons").classList.remove("hidden");

    await loadTransits();
  } catch (err) {
    showFormError("form-error", `Ошибка: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = "Рассчитать карту";
  }
}

// Guard against out-of-order responses when the user clicks repeatedly
let transitRequestSeq = 0;

async function loadTransits() {
  if (!currentBirthData) return;
  const seq = ++transitRequestSeq;
  const transitDate = document.getElementById("transit-date").value;
  const el  = document.getElementById("transits-content");
  const btn = document.getElementById("transit-btn");
  btn.disabled = true;
  el.innerHTML = `<p class="loading">Расчёт транзитов…</p>`;

  try {
    const res = await fetch("/api/transits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...currentBirthData, transitDate }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || res.statusText);
    }
    const data = await res.json();
    if (seq !== transitRequestSeq) return; // a newer request superseded this one
    renderTransits(data);
  } catch (err) {
    if (seq === transitRequestSeq) {
      el.innerHTML = `<p class="error-msg">Ошибка: ${escapeHtml(err.message)}</p>`;
    }
  } finally {
    if (seq === transitRequestSeq) btn.disabled = false;
  }
}

// ── Birthday mode ──────────────────────────────────────────────────────────────
const MONTH_RU = ["","января","февраля","марта","апреля","мая","июня",
                   "июля","августа","сентября","октября","ноября","декабря"];

async function loadBirthdayPortrait(e) {
  e.preventDefault();
  const btn  = document.getElementById("bd-submit-btn");
  btn.disabled = true;
  btn.textContent = "Загрузка…";

  const dateStr = document.getElementById("bd-date").value;
  const name    = document.getElementById("bd-name").value;
  if (!dateStr) { btn.disabled = false; btn.textContent = "Получить портрет"; return; }
  showFormError("bd-error", "");

  const [, month, day] = dateStr.split("-").map(Number);
  try {
    const res = await fetch(`/api/birthday/${month}/${day}`);
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || res.statusText); }
    const data = await res.json();
    const rule = data.rule;
    const ru   = rule.simpleRu || {};
    const period = rule.period || {};

    document.getElementById("bd-result-name").textContent =
      name ? `${name} — ${day} ${MONTH_RU[month]}` : `${day} ${MONTH_RU[month]}`;

    const dayTitleEl = document.getElementById("bd-day-title");
    if (ru.dayTitleShort) {
      dayTitleEl.textContent = ru.dayTitleShort.toUpperCase();
      dayTitleEl.classList.remove("hidden");
    } else {
      dayTitleEl.textContent = "";
      dayTitleEl.classList.add("hidden");
    }

    document.getElementById("bd-period-label").textContent =
      `${period.titleRu || ""} · ${period.sign || ""}`;

    document.getElementById("bd-summary").textContent  = ru.summary || "";

    const mkChips = (arr, containerId) => {
      const el = document.getElementById(containerId);
      el.innerHTML = (arr || []).map(t =>
        `<span class="trait-chip">${t}</span>`
      ).join("");
    };
    mkChips(ru.strengths,  "bd-strengths");
    mkChips(ru.weaknesses, "bd-weaknesses");

    document.getElementById("bd-advice").textContent = ru.advice || "";

    const bdResults = document.getElementById("birthday-results");
    bdResults.classList.remove("hidden");
    bdResults.dataset.hasResults = "1";
  } catch (err) {
    showFormError("bd-error", `Ошибка: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = "Получить портрет";
  }
}

// ── Mode switching ─────────────────────────────────────────────────────────────
// ── Compatibility mode ─────────────────────────────────────────────────────────
const CAT_LABELS = {
  love: "Любовь",
  marriage: "Брак",
  friendship: "Дружба",
  family: "Семья",
  work: "Работа",
};

async function loadCompatibility(e) {
  e.preventDefault();
  const btn = document.getElementById("compat-submit-btn");
  btn.disabled = true;
  btn.textContent = "Загрузка…";

  const dateA = document.getElementById("compat-date-a").value;
  const dateB = document.getElementById("compat-date-b").value;
  const nameA = document.getElementById("compat-name-a").value;
  const nameB = document.getElementById("compat-name-b").value;
  if (!dateA || !dateB) {
    btn.disabled = false;
    btn.textContent = "Анализировать совместимость";
    return;
  }

  try {
    const res = await fetch("/api/compatibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dateA, dateB }),
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error || res.statusText); }
    const data = await res.json();
    renderCompatibility(data, nameA, nameB);
  } catch (err) {
    document.getElementById("compat-result-content").innerHTML =
      `<p class="error-msg">Ошибка: ${escapeHtml(err.message)}</p>`;
    const compatResults = document.getElementById("compat-results");
    compatResults.classList.remove("hidden");
    compatResults.dataset.hasResults = "1";
  } finally {
    btn.disabled = false;
    btn.textContent = "Анализировать совместимость";
  }
}

function renderCompatibility(data, nameA, nameB) {
  const el = document.getElementById("compat-result-content");
  const { personA, personB, pair } = data;

  // User-typed names must be escaped before HTML insertion (XSS)
  const safeA = escapeHtml(nameA);
  const safeB = escapeHtml(nameB);

  let html = `<div class="compat-header">
    <div class="compat-periods">
      <div class="compat-period-box">
        <div class="compat-period-name">${nameA ? `<strong>${safeA}</strong> · ` : ""}${personA.periodName}</div>
        <div class="compat-period-week">${personA.weekName}</div>
      </div>
      <div class="compat-cross">×</div>
      <div class="compat-period-box">
        <div class="compat-period-name">${nameB ? `<strong>${safeB}</strong> · ` : ""}${personB.periodName}</div>
        <div class="compat-period-week">${personB.weekName}</div>
      </div>
    </div>
    <span class="source-badge">Гольдшнайдер · Совместимость</span>
  </div>`;

  if (!pair) {
    html += `<p class="bd-summary">Описание этой комбинации периодов не найдено в базе.</p>`;
  } else {
    html += `<div class="compat-relation-title">${pair.titleRu}</div>`;
    if (pair.textRu) {
      html += `<div class="compat-text">${pair.textRu}</div>`;
    }
    const cats = Object.keys(pair.compatCategories || {});
    if (cats.length > 0) {
      html += `<div class="compat-cats">`;
      for (const cat of cats) {
        html += `<span class="compat-cat compat-cat-${cat}">${CAT_LABELS[cat] || cat}</span>`;
      }
      html += `</div>`;
    }
  }

  html += `<div class="bd-disclaimer" style="margin-top:16px">
    По системе Гольдшнайдера «Тайный язык взаимоотношений». Анализ основан на персонологических периодах, не на точных датах.
  </div>`;

  el.innerHTML = html;
  const compatResults = document.getElementById("compat-results");
  compatResults.classList.remove("hidden");
  compatResults.dataset.hasResults = "1";
}

// ── Mode switching ─────────────────────────────────────────────────────────────
function switchMode(mode) {
  document.querySelectorAll(".mode-tab").forEach(t => {
    const active = t.dataset.mode === mode;
    t.classList.toggle("active", active);
    t.setAttribute("aria-selected", active ? "true" : "false");
  });
  const formSection    = document.getElementById("form-section");
  const natalResults   = document.getElementById("results");
  const bdSection      = document.getElementById("birthday-section");
  const bdResults      = document.getElementById("birthday-results");
  const compatSection  = document.getElementById("compatibility-section");
  const compatResults  = document.getElementById("compat-results");

  formSection.classList.toggle("hidden", mode !== "natal");
  natalResults.classList.toggle("hidden", mode !== "natal" || natalResults.dataset.hasResults !== "1");
  const actionBtns = document.getElementById("action-buttons");
  actionBtns.classList.toggle("hidden", mode !== "natal" || !currentProfile);
  bdSection.classList.toggle("hidden", mode !== "birthday");
  bdResults.classList.toggle("hidden", mode !== "birthday" || bdResults.dataset.hasResults !== "1");
  compatSection.classList.toggle("hidden", mode !== "compatibility");
  compatResults.classList.toggle("hidden", mode !== "compatibility" || compatResults.dataset.hasResults !== "1");
}

// ── Full Report ────────────────────────────────────────────────────────────────

function buildChartContext(profile) {
  if (!profile) return "";
  const positions = profile.calculation?.positions || [];
  const angles    = profile.calculation?.angles;
  const vedic     = profile.calculation?.vedic;
  const matched   = profile.matchedRules || [];

  let ctx = "=== НАТАЛЬНАЯ КАРТА ===\n";

  // Western planets
  ctx += "\nПланеты (западная астрология):\n";
  for (const p of positions) {
    ctx += `  ${PLANET_RU[p.body] || p.body}: ${SIGN_RU[p.sign] || p.sign}, ${p.house ? p.house + " дом" : ""}\n`;
  }
  if (angles?.ascendant) ctx += `  ASC: ${SIGN_RU[angles.ascendant.sign] || angles.ascendant.sign}\n`;
  if (angles?.midheaven) ctx += `  MC: ${SIGN_RU[angles.midheaven.sign] || angles.midheaven.sign}\n`;

  // Vedic moon/nakshatra
  if (vedic) {
    const moonV = (vedic.grahaPositions || []).find(p => p.graha === "Moon");
    if (moonV) {
      ctx += `\nВедическая астрология:\n  Луна: ${moonV.rashi}, накшатра ${moonV.nakshatra}, пада ${moonV.pada}\n`;
    }
    if (vedic.vimshottariDasha) {
      ctx += `  Даша: ${PLANET_RU[vedic.vimshottariDasha.currentDashaLord] || vedic.vimshottariDasha.currentDashaLord}`;
      if (vedic.vimshottariDasha.dashaEnds) ctx += ` (до ${vedic.vimshottariDasha.dashaEnds})`;
      ctx += "\n";
    }
  }

  // Top interpretations
  ctx += "\nКлючевые интерпретации:\n";
  for (const item of matched.slice(0, 15)) {
    const texts = item.rule?.simpleRu || item.rule?.simple || {};
    const { title } = factorTitle(item);
    const summary = texts.summary || texts.description || "";
    if (summary) ctx += `  [${title}]: ${summary.slice(0, 200)}\n`;
  }

  return ctx;
}

const SECTION_MAP = [
  { key: "personality", label: "Личность и характер",    types: ["sign","aspect"], planets: ["Sun","ASC"] },
  { key: "emotions",    label: "Эмоции и внутренний мир", types: ["sign","aspect"], planets: ["Moon","Venus"] },
  { key: "career",      label: "Карьера и призвание",     types: ["house","aspect"], houses: [10,6,2] },
  { key: "relations",   label: "Отношения",               types: ["house","aspect"], planets: ["Venus","Mars"] },
];

function buildFullReport(profile) {
  if (!profile) return "<p>Карта не загружена.</p>";

  const matched   = profile.matchedRules || [];
  const positions = profile.calculation?.positions || [];
  const angles    = profile.calculation?.angles;
  const vedic     = profile.calculation?.vedic;

  const sun  = positions.find(p => p.body === "Sun");
  const moon = positions.find(p => p.body === "Moon");
  const asc  = angles?.ascendant;
  const name = document.getElementById("name").value;

  let html = `<h1>${name ? escapeHtml(name) + " — " : ""}Натальная карта</h1>`;
  html += `<div class="report-subtitle">Комплексный астрологический разбор · Codex Goroskop</div>`;

  // Intro summary
  html += `<h2>Общий портрет</h2>`;
  const sunRu  = sun  ? (SIGN_RU[sun.sign]  || sun.sign)  : "—";
  const moonRu = moon ? (SIGN_RU[moon.sign] || moon.sign) : "—";
  const ascRu  = asc  ? (SIGN_RU[asc.sign]  || asc.sign)  : "—";
  html += `<div class="report-highlight">
    ${PLANET_GLYPHS.Sun} Солнце в <strong>${sunRu}</strong> &nbsp;·&nbsp;
    ${PLANET_GLYPHS.Moon} Луна в <strong>${moonRu}</strong> &nbsp;·&nbsp;
    ↑ ASC <strong>${ascRu}</strong>
  </div>`;
  html += `<p>Солнце определяет вашу главную жизненную задачу и индивидуальность. Луна — эмоциональную природу и подсознательные реакции. Асцендент — то, как вас воспринимают окружающие и ваш стиль поведения в мире.</p>`;

  // Synthesis themes
  const synth = buildSynthesisData(matched);
  if (synth && synth.length > 0) {
    html += `<h2>Ключевые темы карты</h2>`;
    html += `<p>Несколько астрологических систем одновременно указывают на следующие главные темы вашей жизни:</p>`;
    for (const [theme, d] of synth) {
      html += `<span class="report-theme-chip">${theme}</span>`;
    }
    html += "<br><br>";
    if (synth[0]) {
      html += `<p>Тема <strong>${synth[0][0]}</strong> подтверждается системами: ${[...synth[0][1].systems].join(", ")}. Это говорит о том, что данная область — один из центральных узлов вашей жизненной программы.</p>`;
    }
  }

  // Western interpretations by group
  const western = matched.filter(i =>
    !["kabbalah","chinese-zodiac","nakshatra","nakshatra-pada","lunar-mansion"].includes(i.rule?.type)
    && i.rule?.system !== "vedic"
    && i.rule?.type !== "transit"
  );
  const aspects = western.filter(i => i.rule?.type === "aspect" || (i.calculated?.bodyA && i.calculated?.aspect));
  const houses  = western.filter(i => i.rule?.type === "house"  || (i.calculated?.body && i.calculated?.house));
  const signs   = western.filter(i => i.rule?.type === "sign"   || (i.rule?.factor?.planet && i.rule?.factor?.sign));
  const rulers  = western.filter(i => i.rule?.type === "ruler");

  if (signs.length > 0) {
    html += `<h2>Планеты в знаках</h2>`;
    html += `<p>Положение планет в знаках зодиака показывает, как каждая планетарная энергия проявляется в вашей личности.</p>`;
    for (const item of signs.slice(0, 8)) {
      const { title } = factorTitle(item);
      const texts = item.rule?.simpleRu || item.rule?.simple || {};
      html += renderReportItem(title, texts);
    }
  }

  if (aspects.length > 0) {
    html += `<h2>Аспекты — взаимодействие планет</h2>`;
    html += `<p>Аспекты — это углы между планетами. Они показывают, как разные части вашей личности взаимодействуют между собой: усиливают, напрягают или гармонично дополняют друг друга.</p>`;
    for (const item of aspects.slice(0, 10)) {
      const { title } = factorTitle(item);
      const texts = item.rule?.simpleRu || item.rule?.simple || {};
      html += renderReportItem(title, texts);
    }
  }

  if (houses.length > 0) {
    html += `<h2>Планеты в домах</h2>`;
    html += `<p>Дома гороскопа — это сферы жизни. Где стоит планета, туда она направляет свою энергию.</p>`;
    for (const item of houses.slice(0, 8)) {
      const { title } = factorTitle(item);
      const texts = item.rule?.simpleRu || item.rule?.simple || {};
      html += renderReportItem(title, texts);
    }
  }

  if (rulers.length > 0) {
    html += `<h2>Управители домов</h2>`;
    html += `<p>Планета-управитель дома показывает, как связаны разные жизненные сферы.</p>`;
    for (const item of rulers.slice(0, 6)) {
      const { title } = factorTitle(item);
      const texts = item.rule?.simpleRu || item.rule?.simple || {};
      html += renderReportItem(title, texts);
    }
  }

  // Vedic
  const vedicItems = matched.filter(i =>
    i.rule?.system === "vedic" ||
    ["nakshatra","nakshatra-pada","lunar-mansion"].includes(i.rule?.type)
  );
  if (vedicItems.length > 0) {
    html += `<h2>Ведическая астрология (Джйотиш)</h2>`;
    html += `<p>Система Джйотиш — индийская астрология — рассматривает карту через другую систему знаков и накшатры (лунные стоянки). Она раскрывает кармический пласт личности.</p>`;
    if (vedic?.vimshottariDasha) {
      const lord = PLANET_RU[vedic.vimshottariDasha.currentDashaLord] || vedic.vimshottariDasha.currentDashaLord;
      html += `<div class="report-highlight">Сейчас вы находитесь в даше ${lord}${vedic.vimshottariDasha.dashaEnds ? " (до " + vedic.vimshottariDasha.dashaEnds + ")" : ""}. Это основной планетарный период, определяющий качество текущего отрезка жизни.</div>`;
    }
    for (const item of vedicItems.slice(0, 6)) {
      const { title } = factorTitle(item);
      const texts = item.rule?.simpleRu || item.rule?.simple || {};
      html += renderReportItem(title, texts);
    }
  }

  // Special systems
  const kabbalah = matched.filter(i => i.rule?.type === "kabbalah");
  const chinese  = matched.filter(i => i.rule?.type === "chinese-zodiac");
  const birthday = matched.filter(i => i.rule?.type === "birthday" || (i.rule?.factor?.month && i.rule?.factor?.day));

  if (kabbalah.length > 0) {
    html += `<h2>Каббалистическая астрология</h2>`;
    html += `<p>Каббалистическая астрология раскрывает душевную задачу (тиккун) — то, что было принесено из прошлых воплощений для исправления и развития в этой жизни.</p>`;
    for (const item of kabbalah) {
      const { title } = factorTitle(item);
      const texts = item.rule?.simpleRu || item.rule?.simple || {};
      html += renderReportItem(title, texts);
    }
  }

  if (chinese.length > 0) {
    html += `<h2>Восточный зодиак</h2>`;
    html += `<p>Китайский зодиак определяет базовый жизненный ритм и ключевые черты характера через архетип животного года рождения.</p>`;
    for (const item of chinese) {
      const { title } = factorTitle(item);
      const texts = item.rule?.simpleRu || item.rule?.simple || {};
      html += renderReportItem(title, texts);
    }
  }

  if (birthday.length > 0) {
    html += `<h2>Персонология (Гольдшнайдер)</h2>`;
    html += `<p>Система Гольдшнайдера — психологический портрет через дату рождения. Точность описания достигает 85–90%.</p>`;
    for (const item of birthday) {
      const { title } = factorTitle(item);
      const texts = item.rule?.simpleRu || item.rule?.simple || {};
      html += renderReportItem(title, texts);
    }
  }

  html += `<div class="report-subtitle" style="margin-top:40px;border-top:1px solid #333;padding-top:16px">Codex Goroskop · ${new Date().toLocaleDateString("ru-RU")} · Только для личного использования</div>`;
  return html;
}

function renderReportItem(title, texts) {
  let html = `<div style="margin-bottom:18px">`;
  html += `<div style="font-weight:500;color:var(--text);margin-bottom:4px">${title}</div>`;
  if (texts.summary)  html += `<p>${texts.summary}</p>`;
  if (texts.pattern && !texts.summary) html += `<p>${texts.pattern}</p>`;
  if (texts.description && !texts.summary && !texts.pattern) html += `<p>${texts.description.slice(0,300)}…</p>`;
  if (texts.tikkun)   html += `<div class="report-highlight">${texts.tikkun.slice(0,250)}…</div>`;
  if (texts.advice)   html += `<p style="color:var(--accent-dim,#aaa);font-size:13.5px">💡 ${texts.advice}</p>`;
  if (texts.favorable)   html += `<p class="report-fav">✓ Благоприятно: ${texts.favorable.slice(0, 180)}</p>`;
  if (texts.unfavorable) html += `<p class="report-unfav">✗ Неблагоприятно: ${texts.unfavorable.slice(0, 180)}</p>`;
  if (texts.keywords?.length) html += texts.keywords.slice(0,6).map(k => `<span class="report-tag">${k}</span>`).join("");
  html += `</div>`;
  return html;
}

function buildSynthesisData(matched) {
  if (matched.length < 3) return null;
  const themeData = computeThemeData(matched);
  return Object.entries(themeData)
    .filter(([,d]) => d.systems.size >= CROSS_SYSTEM_MIN || d.score >= SINGLE_SYSTEM_MIN_SCORE)
    .sort((a,b) => b[1].score - a[1].score)
    .slice(0, SYNTHESIS_MAX_THEMES);
}

// ── Report Modal ───────────────────────────────────────────────────────────────
document.getElementById("full-report-btn").addEventListener("click", () => {
  const content = document.getElementById("report-content");
  content.innerHTML = buildFullReport(currentProfile);
  document.getElementById("report-modal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
});

document.getElementById("report-close-btn").addEventListener("click", () => closeReportModal());

document.getElementById("report-print-btn").addEventListener("click", () => {
  window.print();
});

// Close on backdrop click
document.getElementById("report-modal").addEventListener("click", e => {
  if (e.target === document.getElementById("report-modal")) {
    closeReportModal();
  }
});

function closeReportModal() {
  document.getElementById("report-modal").classList.add("hidden");
  document.body.style.overflow = "";
}

// Close modal / chat with Escape
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  const modal = document.getElementById("report-modal");
  if (!modal.classList.contains("hidden")) { closeReportModal(); return; }
  const chat = document.getElementById("chat-widget");
  if (!chat.classList.contains("hidden")) chat.classList.add("hidden");
});

// ── AI Chat ────────────────────────────────────────────────────────────────────
let chatHistory    = [];
let chatQuestions  = 0;
const MAX_QUESTIONS = 10;

// Reset chat state when a new chart is calculated
function resetChat() {
  chatHistory   = [];
  chatQuestions = 0;
  const input = document.getElementById("chat-input");
  const send  = document.getElementById("chat-send-btn");
  if (input) input.disabled = false;
  if (send)  send.disabled  = false;
  const messages = document.getElementById("chat-messages");
  if (messages) messages.innerHTML = "";
  updateChatCounter();
}

function appendChatMsg(role, text) {
  const el = document.getElementById("chat-messages");
  const msg = document.createElement("div");
  msg.className = `chat-msg ${role}`;
  msg.textContent = text;
  el.appendChild(msg);
  el.scrollTop = el.scrollHeight;
}

function updateChatCounter() {
  const left = MAX_QUESTIONS - chatQuestions;
  document.getElementById("chat-counter").textContent =
    left > 0 ? `${left} вопр. осталось` : "Лимит исчерпан";
}

function openChat() {
  const widget = document.getElementById("chat-widget");
  widget.classList.remove("hidden");
  if (chatHistory.length === 0) {
    const el = document.getElementById("chat-messages");
    el.innerHTML = "";
    appendChatMsg("assistant", "Здравствуйте! Я готов рассказать о вашей натальной карте. Задайте любой вопрос о характере, отношениях, карьере или любой другой теме жизни — я отвечу, опираясь на данные карты.");
  }
  document.getElementById("chat-input").focus();
}

async function sendChatMessage() {
  if (chatQuestions >= MAX_QUESTIONS) return;
  const input = document.getElementById("chat-input");
  const msg   = input.value.trim();
  if (!msg) return;
  if (!currentProfile) { appendChatMsg("system-msg", "Сначала рассчитайте карту."); return; }

  input.value = "";
  appendChatMsg("user", msg);
  chatQuestions++;
  updateChatCounter();

  const sendBtn = document.getElementById("chat-send-btn");
  sendBtn.disabled = true;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: msg,
        chartContext: buildChartContext(currentProfile),
        history: chatHistory,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);
    const reply = data.reply;
    appendChatMsg("assistant", reply);
    chatHistory.push({ role: "user", content: msg });
    chatHistory.push({ role: "assistant", content: reply });
    if (chatQuestions >= MAX_QUESTIONS) {
      appendChatMsg("system-msg", "Вы задали все 10 вопросов. Чтобы продолжить — рассчитайте карту заново.");
      document.getElementById("chat-input").disabled = true;
      sendBtn.disabled = true;
    }
  } catch (err) {
    appendChatMsg("system-msg", `Ошибка: ${err.message}`);
  } finally {
    sendBtn.disabled = chatQuestions >= MAX_QUESTIONS;
  }
}

document.getElementById("chat-btn").addEventListener("click", openChat);
document.getElementById("chat-close-btn").addEventListener("click", () => {
  document.getElementById("chat-widget").classList.add("hidden");
});
document.getElementById("chat-send-btn").addEventListener("click", sendChatMessage);
document.getElementById("chat-input").addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
});

// Init
loadPlaces();
document.getElementById("chart-form").addEventListener("submit", loadProfile);
document.getElementById("transit-btn").addEventListener("click", loadTransits);
document.getElementById("birthday-form").addEventListener("submit", loadBirthdayPortrait);
document.getElementById("compat-form").addEventListener("submit", loadCompatibility);
document.querySelectorAll(".mode-tab").forEach(tab =>
  tab.addEventListener("click", () => switchMode(tab.dataset.mode))
);
