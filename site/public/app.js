const state = {
  places: [],
  result: null,
};

const storageVersion = 3;
const storageKey = `codex-goroskop:last-result:v${storageVersion}`;

const planetGlyphs = {
  Sun: "☉",
  Moon: "☽",
  Mercury: "☿",
  Venus: "♀",
  Mars: "♂",
  Jupiter: "♃",
  Saturn: "♄",
  Uranus: "♅",
  Neptune: "♆",
  Pluto: "♇",
};

const signGlyphs = {
  Aries: "♈",
  Taurus: "♉",
  Gemini: "♊",
  Cancer: "♋",
  Leo: "♌",
  Virgo: "♍",
  Libra: "♎",
  Scorpio: "♏",
  Sagittarius: "♐",
  Capricorn: "♑",
  Aquarius: "♒",
  Pisces: "♓",
};

const namesRu = {
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
  conjunction: "соединение",
  sextile: "секстиль",
  square: "квадрат",
  trine: "трин",
  opposition: "оппозиция",
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

function $(selector) {
  return document.querySelector(selector);
}

function localName(value) {
  return namesRu[value] || value || "-";
}

function degree(value) {
  return `${Number(value || 0).toFixed(2)}°`;
}

function polar(cx, cy, radius, longitude) {
  const angle = (longitude - 90) * Math.PI / 180;
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
  };
}

function zodiacPath(cx, cy, inner, outer, start, end) {
  const a = polar(cx, cy, outer, start);
  const b = polar(cx, cy, outer, end);
  const c = polar(cx, cy, inner, end);
  const d = polar(cx, cy, inner, start);
  const large = end - start > 180 ? 1 : 0;
  return [
    `M ${a.x} ${a.y}`,
    `A ${outer} ${outer} 0 ${large} 1 ${b.x} ${b.y}`,
    `L ${c.x} ${c.y}`,
    `A ${inner} ${inner} 0 ${large} 0 ${d.x} ${d.y}`,
    "Z",
  ].join(" ");
}

function renderChart(profile) {
  const positions = profile.calculation.positions || [];
  const aspects = profile.calculation.aspects || [];
  const houses = profile.calculation.houses || [];
  const cx = 350;
  const cy = 350;
  const signs = Object.keys(signGlyphs);
  const colors = ["#f4d58d", "#d7b377", "#91a8a4", "#7d9a8c", "#cf8f76", "#e1c16e", "#87a6b8", "#c4a3a3", "#8a7fba", "#a8b77d", "#78a7a0", "#b495c4"];

  const signBands = signs.map((sign, index) => {
    const start = index * 30;
    const end = start + 30;
    const label = polar(cx, cy, 294, start + 15);
    return `
      <path d="${zodiacPath(cx, cy, 260, 326, start, end)}" fill="${colors[index]}" opacity="0.55" stroke="#fff8ea" stroke-width="1"/>
      <text x="${label.x}" y="${label.y}" text-anchor="middle" dominant-baseline="middle" font-size="24" fill="#202126">${signGlyphs[sign]}</text>
    `;
  }).join("");

  const ticks = Array.from({ length: 72 }, (_, i) => {
    const lon = i * 5;
    const major = i % 6 === 0;
    const p1 = polar(cx, cy, major ? 250 : 256, lon);
    const p2 = polar(cx, cy, 260, lon);
    return `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="#7f7564" stroke-width="${major ? 1.4 : 0.7}" opacity="${major ? 0.75 : 0.38}"/>`;
  }).join("");

  const houseLines = houses.map((house) => {
    const p1 = polar(cx, cy, 82, house.cuspLongitude);
    const p2 = polar(cx, cy, 246, house.cuspLongitude);
    const label = polar(cx, cy, 104, house.cuspLongitude + 14);
    return `
      <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="#9c927f" stroke-width="1" opacity="0.55"/>
      <text x="${label.x}" y="${label.y}" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="#6c6d75">${house.house}</text>
    `;
  }).join("");

  const aspectLines = aspects.filter((aspect) => aspect.orb <= 4.5).map((aspect) => {
    const a = positions.find((item) => item.body === aspect.bodyA);
    const b = positions.find((item) => item.body === aspect.bodyB);
    if (!a || !b) return "";
    const p1 = polar(cx, cy, 178, a.tropicalLongitude);
    const p2 = polar(cx, cy, 178, b.tropicalLongitude);
    const hard = ["square", "opposition"].includes(aspect.aspect);
    return `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${hard ? "#9a4038" : "#265e5b"}" stroke-width="1.2" opacity="0.55">
      <title>${localName(aspect.bodyA)} ${localName(aspect.aspect)} ${localName(aspect.bodyB)}, орб ${degree(aspect.orb)}</title>
    </line>`;
  }).join("");

  const planets = positions.map((position, index) => {
    const p = polar(cx, cy, 220 - (index % 2) * 16, position.tropicalLongitude);
    const line = polar(cx, cy, 250, position.tropicalLongitude);
    return `
      <line x1="${line.x}" y1="${line.y}" x2="${p.x}" y2="${p.y}" stroke="#3f3a31" stroke-width="1" opacity="0.42"/>
      <g>
        <title>${localName(position.body)} в ${localName(position.sign)} ${degree(position.degreeInSign)}, дом ${position.house || "-"}</title>
        <circle cx="${p.x}" cy="${p.y}" r="17" fill="#fffdf8" stroke="#2d3334" stroke-width="1.2"/>
        <text x="${p.x}" y="${p.y + 1}" text-anchor="middle" dominant-baseline="middle" font-size="20" fill="#202126">${planetGlyphs[position.body] || position.body[0]}</text>
      </g>
    `;
  }).join("");

  $("#chart-stage").innerHTML = `
    <svg class="chart-svg" viewBox="0 0 700 700" role="img" aria-label="Натальная карта">
      <rect width="700" height="700" fill="#fbf8ef"/>
      <circle cx="${cx}" cy="${cy}" r="332" fill="#fffdf8" stroke="#d8d1c2"/>
      ${signBands}
      ${ticks}
      <circle cx="${cx}" cy="${cy}" r="250" fill="none" stroke="#4b514d" stroke-width="1.6"/>
      <circle cx="${cx}" cy="${cy}" r="184" fill="#fffdf8" stroke="#d8d1c2"/>
      <circle cx="${cx}" cy="${cy}" r="82" fill="#f4f1ea" stroke="#d8d1c2"/>
      ${houseLines}
      ${aspectLines}
      ${planets}
    </svg>
  `;
}

function renderSummary(profile, dispositor) {
  const asc = profile.calculation.angles.ascendant;
  const mc = profile.calculation.angles.midheaven;
  $("#asc-value").textContent = asc ? `${localName(asc.sign)} ${degree(asc.degreeInSign)}` : "-";
  $("#mc-value").textContent = mc ? `${localName(mc.sign)} ${degree(mc.degreeInSign)}` : "-";
  $("#aspect-count").textContent = String(profile.calculation.aspects.length);
  $("#final-dispositor").textContent = dispositor.dominantFinal?.bodyName || "-";
}

function renderPositions(profile) {
  $("#positions-body").innerHTML = profile.calculation.positions.map((position) => `
    <tr>
      <td>${planetGlyphs[position.body] || ""} ${localName(position.body)}</td>
      <td>${signGlyphs[position.sign] || ""} ${localName(position.sign)}</td>
      <td>${degree(position.degreeInSign)}</td>
      <td>${position.house || "-"}</td>
    </tr>
  `).join("");
}

function renderHighlights(profile, dispositor) {
  const asc = profile.calculation.angles.ascendant;
  const strongAspects = profile.calculation.aspects.filter((aspect) => aspect.orb <= 2).slice(0, 4);
  const items = [
    asc ? `Асцендент в знаке ${localName(asc.sign)} задает первый тон карты и способ входа в ситуации.` : null,
    dispositor.summary,
    ...strongAspects.map((aspect) => `${localName(aspect.bodyA)} ${localName(aspect.aspect)} ${localName(aspect.bodyB)} с орбом ${degree(aspect.orb)}.`),
  ].filter(Boolean);

  $("#highlights").innerHTML = items.map((item) => `<div class="highlight-item">${item}</div>`).join("");
}

function renderAspects(profile) {
  const aspects = [...profile.calculation.aspects].sort((a, b) => a.orb - b.orb);
  $("#aspects-list").innerHTML = aspects.length ? aspects.map((aspect) => `
    <div class="aspect-card">
      <div>
        <strong>${localName(aspect.bodyA)} ${localName(aspect.aspect)} ${localName(aspect.bodyB)}</strong>
        <div class="aspect-meta">Точный угол ${aspect.exactAngle}°, орб ${degree(aspect.orb)}</div>
      </div>
      <span class="aspect-badge">${aspect.matchedRuleQuery ? "есть трактовка" : "расчет"}</span>
    </div>
  `).join("") : `<div class="empty-state">Аспекты не найдены.</div>`;
}

function renderDispositor(dispositor) {
  $("#dispositor-summary").textContent = dispositor.summary;
  const cycles = dispositor.chains.filter((chain) => chain.cycleNames.length).length;
  const chips = [
    dispositor.dominantFinal ? `Центр: ${dispositor.dominantFinal.bodyName}` : "Единого центра нет",
    `Рецепции: ${dispositor.receptions.length}`,
    `Циклы: ${cycles}`,
    `Школа: ${dispositor.rulerSet === "modern" ? "современная" : "традиционная"}`,
  ];
  $("#dispositor-stats").innerHTML = chips.map((chip) => `<span class="stat-chip">${chip}</span>`).join("");
  $("#chains-list").innerHTML = dispositor.chains.map((chain) => `
    <div class="chain-card">
      <strong>${chain.bodyName}</strong>
      <div>${chain.chainText || "Нет цепочки"}</div>
      <div class="aspect-meta">${chain.finalDispositorName ? `Финал: ${chain.finalDispositorName}` : `Цикл: ${chain.cycleNames.join(", ") || "не найден"}`}</div>
    </div>
  `).join("");
  $("#rulers-list").innerHTML = dispositor.placements.map((item) => `
    <div class="ruler-card">
      <strong>${item.bodyName} в ${item.signName}</strong>
      <div>Управитель: ${item.rulerName}</div>
      <div class="aspect-meta">${item.isInOwnSign ? "Планета в собственном знаке." : "Планета передает тему своему управителю."}</div>
    </div>
  `).join("");
}

function renderReport(report) {
  const template = document.createElement("template");
  template.innerHTML = report.html;
  template.content.querySelectorAll("p").forEach((paragraph) => {
    if (!/[A-Za-zА-Яа-яЁё0-9]/.test(paragraph.textContent || "")) paragraph.remove();
  });
  $("#report-view").replaceChildren(template.content.cloneNode(true));
}

function renderAll(result) {
  state.result = result;
  try {
    localStorage.setItem(storageKey, JSON.stringify(result));
  } catch (error) {
    // Browsers may block storage in hardened contexts; the app can work without it.
  }
  renderSummary(result.profile, result.dispositor);
  renderChart(result.profile);
  renderPositions(result.profile);
  renderHighlights(result.profile, result.dispositor);
  renderAspects(result.profile);
  renderDispositor(result.dispositor);
  renderReport(result.report);
}

async function loadPlaces() {
  const select = $("#place-select");
  if (window.CodexProfile) {
    state.places = await CodexProfile.setupPlaceSelect(select);
  } else {
    const response = await fetch("/api/places");
    state.places = await response.json();
    select.innerHTML = state.places.map((place) => `<option value="${place.key}">${place.name}</option>`).join("");
    select.value = "chisinau-md";
  }
  syncPlaceFields();
}

function syncPlaceFields() {
  const selectedPlace = state.places.find((place) => place.key === $("#place-select").value);
  if (!selectedPlace) return;
  const lat = document.querySelector('[name="latitude"]');
  const lon = document.querySelector('[name="longitude"]');
  const tz = document.querySelector('[name="timeZone"]');
  lat.placeholder = String(selectedPlace.latitude);
  lon.placeholder = String(selectedPlace.longitude);
  tz.placeholder = selectedPlace.timeZone;
}

function formPayload(form) {
  if (window.CodexProfile) CodexProfile.write(CodexProfile.readFromForm(form));
  const data = Object.fromEntries(new FormData(form).entries());
  const selectedPlace = state.places.find((place) => place.key === data.placeKey);
  return {
    ...data,
    language: "ru",
    timeZone: data.timeZone || selectedPlace?.timeZone,
    latitude: data.latitude || undefined,
    longitude: data.longitude || undefined,
  };
}

async function calculate(payload) {
  const response = await fetch("/api/chart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Ошибка расчета.");
  return result;
}

function setupTabs() {
  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((item) => item.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      $(`#tab-${button.dataset.tab}`).classList.add("active");
    });
  });
}

function downloadReport() {
  const markdown = state.result?.report?.markdown;
  if (!markdown) return;
  const name = (state.result.profile?.subject?.nickname || "codex-goroskop")
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-|-$/g, "") || "codex-goroskop";
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${name}-report.md`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

function restoreLastResult() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return false;
    const result = JSON.parse(raw);
    if (!result?.profile || !result?.report) return false;
    renderAll(result);
    $("#status-line").textContent = "Восстановлен последний расчет.";
    return true;
  } catch (error) {
    return false;
  }
}

function jumpToResult() {
  $(".workspace").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function init() {
  setupTabs();
  await loadPlaces();

  const form = $("#birth-form");
  if (window.CodexProfile) {
    CodexProfile.applyToForm(form);
    CodexProfile.bindForm(form);
    syncPlaceFields();
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button");
    button.disabled = true;
    $("#status-line").textContent = "Считаю карту и собираю отчет...";
    try {
      const result = await calculate(formPayload(form));
      renderAll(result);
      $("#status-line").textContent = "Расчет готов.";
      if (window.innerWidth < 720) setTimeout(jumpToResult, 150);
    } catch (error) {
      $("#status-line").textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });

  $("#jump-result").addEventListener("click", jumpToResult);
  $("#download-report").addEventListener("click", downloadReport);
  $("#print-report").addEventListener("click", () => window.print());
  $("#place-select").addEventListener("change", syncPlaceFields);

  if (!restoreLastResult()) form.requestSubmit();
}

init();
