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
};
const ASPECT_RU = {
  conjunction: "соединение", opposition: "оппозиция", square: "квадрат",
  trine: "трин", sextile: "секстиль",
};
const TYPE_LABEL = {
  aspect: "Аспект", house: "Дом", sign: "Знак", ruler: "Управитель", transit: "Транзит",
  vedic: "Джйотиш",
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

// Load places into select
async function loadPlaces() {
  const res  = await fetch("/api/places");
  const list = await res.json();
  const sel  = document.getElementById("place");
  for (const p of list) {
    const opt   = document.createElement("option");
    opt.value   = p.key;
    opt.textContent = p.name;
    sel.appendChild(opt);
  }
}

// Toggle factor body
function toggleFactor(header) {
  const body = header.nextElementSibling;
  body.classList.toggle("open");
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
  header.addEventListener("click", () => toggleFactor(header));

  const body = document.createElement("div");
  body.className = "factor-body";

  if (texts) {
    if (texts.summary)    body.innerHTML += `<p><strong>${texts.summary}</strong></p>`;
    if (texts.pattern)    body.innerHTML += `<p>${texts.pattern}</p>`;
    if (texts.growth)     body.innerHTML += `<div class="label">Задача роста</div><p>${texts.growth}</p>`;
    if (texts.reflection) body.innerHTML += `<div class="label">Вопрос для рефлексии</div><p>${texts.reflection}</p>`;
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

function renderFactors(profile) {
  const container = document.getElementById("factors-list");
  container.innerHTML = "";

  const matched = profile.matchedRules || [];
  if (matched.length === 0) {
    container.innerHTML = `<p class="loading">Нет совпадений с правилами.</p>`;
    return;
  }

  // Split into Western and Vedic groups
  const western = matched.filter(i => (i.rule?.system || "western") !== "vedic");
  const vedic   = matched.filter(i => i.rule?.system === "vedic");
  const topN    = 5;

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

  // Show stat line
  const stat = document.createElement("div");
  stat.className = "factors-stat";
  stat.innerHTML = `<span>${matched.length} интерпретаций</span> <span class="factors-stat-note">· топ-${topN} выделены · отсортировано по значимости</span>`;
  container.appendChild(stat);

  renderGroup(western, western.length && vedic.length ? "Западная астрология" : null, true);
  renderGroup(vedic,   vedic.length   ? "Джйотиш (ведическая)" : null, false);
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
    header.addEventListener("click", () => toggleFactor(header));

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

  try {
    const res     = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ localDate, localTime, placeKey, name }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || res.statusText);
    }
    const profile = await res.json();

    document.getElementById("chart-name").textContent = name ? `— ${name}` : "";
    renderPlanets(profile);
    renderFactors(profile);
    renderVedic(profile);

    // Set transit date to today and load
    const today = new Date().toISOString().slice(0, 10);
    document.getElementById("transit-date").value = today;
    document.getElementById("results").classList.remove("hidden");

    await loadTransits();
  } catch (err) {
    alert(`Ошибка: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = "Рассчитать карту";
  }
}

async function loadTransits() {
  if (!currentBirthData) return;
  const transitDate = document.getElementById("transit-date").value;
  const el = document.getElementById("transits-content");
  el.innerHTML = `<p class="loading">Расчёт транзитов…</p>`;

  try {
    const res = await fetch("/api/transits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...currentBirthData, transitDate }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || res.statusText);
    }
    const data = await res.json();
    renderTransits(data);
  } catch (err) {
    el.innerHTML = `<p class="error-msg">Ошибка: ${err.message}</p>`;
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

  const [year, month, day] = dateStr.split("-").map(Number);
  try {
    const res = await fetch(`/api/birthday/${month}/${day}`);
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || res.statusText); }
    const data = await res.json();
    const rule = data.rule;
    const ru   = rule.simpleRu || {};
    const period = rule.period || {};

    document.getElementById("bd-result-name").textContent =
      name ? `${name} — ${day} ${MONTH_RU[month]}` : `${day} ${MONTH_RU[month]}`;
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

    document.getElementById("birthday-results").classList.remove("hidden");
  } catch (err) {
    alert(`Ошибка: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = "Получить портрет";
  }
}

// ── Mode switching ─────────────────────────────────────────────────────────────
function switchMode(mode) {
  const natalForm    = document.getElementById("form-section");
  const natalResults = document.getElementById("results");
  const bdForm       = document.getElementById("birthday-section");
  const bdResults    = document.getElementById("birthday-results");

  document.querySelectorAll(".mode-tab").forEach(t =>
    t.classList.toggle("active", t.dataset.mode === mode)
  );

  if (mode === "natal") {
    natalForm.classList.remove("hidden");
    bdForm.classList.add("hidden");
    bdResults.classList.add("hidden");
  } else {
    natalForm.classList.add("hidden");
    natalResults.classList.add("hidden");
    bdForm.classList.remove("hidden");
  }
}

// Init
loadPlaces();
document.getElementById("chart-form").addEventListener("submit", loadProfile);
document.getElementById("transit-btn").addEventListener("click", loadTransits);
document.getElementById("birthday-form").addEventListener("submit", loadBirthdayPortrait);
document.querySelectorAll(".mode-tab").forEach(tab =>
  tab.addEventListener("click", () => switchMode(tab.dataset.mode))
);
