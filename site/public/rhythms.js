const state = { places: [], result: null, activeKeys: new Set(), highlightedKey: null };

function $(selector) {
  return document.querySelector(selector);
}

async function loadPlaces() {
  const response = await fetch("/api/places");
  state.places = await response.json();
  $("#rhythms-place-select").innerHTML = state.places.map((place) => `<option value="${place.key}">${place.name}</option>`).join("");
  $("#rhythms-place-select").value = "chisinau-md";
  document.querySelector('[name="startDate"]').value = new Date().toISOString().slice(0, 10);
}

function payloadFromForm(form) {
  if (window.CodexProfile) CodexProfile.write(CodexProfile.readFromForm(form));
  const data = Object.fromEntries(new FormData(form).entries());
  const days = Number(data.period || data.days || 30);
  form.elements.days.value = String(days);
  return { ...data, days };
}

async function calculateRhythms(payload) {
  const response = await fetch("/api/rhythms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Ошибка построения графиков.");
  return result.rhythms;
}

function x(index, total) {
  return 64 + (index / Math.max(1, total - 1)) * 970;
}

function y(value) {
  return 450 - (Number(value) / 100) * 360;
}

function pathFor(points, key) {
  return points.map((point, index) => `${index ? "L" : "M"} ${x(index, points.length).toFixed(2)} ${y(point.values[key]).toFixed(2)}`).join(" ");
}

function formatTickDate(dateText, total) {
  const date = new Date(`${dateText}T00:00:00Z`);
  if (total > 180) {
    return date.toLocaleDateString("ru-RU", { month: "short", year: "2-digit" }).replace(".", "");
  }
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

function dateTicks(points) {
  if (points.length <= 10) {
    return points.map((point, index) => ({ point, index }));
  }
  const targetCount = points.length > 180 ? 12 : points.length > 45 ? 8 : 6;
  const step = Math.max(1, Math.round((points.length - 1) / (targetCount - 1)));
  const ticks = [];
  for (let index = 0; index < points.length; index += step) {
    ticks.push({ point: points[index], index });
  }
  const lastIndex = points.length - 1;
  if (ticks[ticks.length - 1]?.index !== lastIndex) {
    ticks.push({ point: points[lastIndex], index: lastIndex });
  }
  return ticks;
}

function activeSummaries(result) {
  return result.summaries.filter((curve) => state.activeKeys.has(curve.key));
}

function trendFor(result, key) {
  const now = result.points[0]?.values?.[key] ?? 0;
  const next = result.points[1]?.values?.[key] ?? now;
  if (next > now + 1) return { symbol: "↑", label: "растет", className: "trend-up" };
  if (next < now - 1) return { symbol: "↓", label: "снижается", className: "trend-down" };
  return { symbol: "→", label: "ровно", className: "trend-flat" };
}

function renderControls(result) {
  if (!state.activeKeys.size) {
    state.activeKeys = new Set(result.summaries.map((curve) => curve.key));
  }
  $("#rhythm-controls").innerHTML = result.summaries.map((curve) => `
    <label class="rhythm-toggle">
      <input type="checkbox" value="${curve.key}" ${state.activeKeys.has(curve.key) ? "checked" : ""}>
      <span class="toggle-swatch" style="background:${curve.color}"></span>
      <strong>${curve.short}</strong>
    </label>
  `).join("");
  $("#rhythm-controls").querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      state.activeKeys = new Set(Array.from($("#rhythm-controls").querySelectorAll('input[type="checkbox"]:checked')).map((item) => item.value));
      renderVisibleRhythms();
    });
  });
}

function renderChart(result) {
  const summaries = activeSummaries(result);
  const grid = [0, 25, 50, 75, 100].map((value) => `
    <line x1="54" y1="${y(value)}" x2="1046" y2="${y(value)}" stroke="#d8d1c2" stroke-width="1"/>
    <text x="20" y="${y(value) + 4}" font-size="12" fill="#6c6d75">${value}</text>
  `).join("");
  const ticks = dateTicks(result.points).map(({ point, index }) => `
    <line x1="${x(index, result.points.length)}" y1="450" x2="${x(index, result.points.length)}" y2="458" stroke="#6c6d75" stroke-width="1"/>
    <text x="${x(index, result.points.length)}" y="482" font-size="12" fill="#6c6d75" text-anchor="middle">${formatTickDate(point.date, result.points.length)}</text>
  `).join("");
  const lines = summaries.map((curve) => `
    <path class="rhythm-line" data-key="${curve.key}" d="${pathFor(result.points, curve.key)}" fill="none" stroke="${curve.color}" stroke-width="${state.highlightedKey === curve.key ? 5 : curve.key === "luck" ? 4 : 2.4}" stroke-linecap="round" opacity="${!state.highlightedKey || state.highlightedKey === curve.key ? curve.key === "luck" ? 0.95 : 0.82 : 0.22}">
      <title>${curve.title}</title>
    </path>
  `).join("");
  const hitLines = summaries.map((curve) => `
    <path class="rhythm-hit-line" data-key="${curve.key}" d="${pathFor(result.points, curve.key)}" fill="none" stroke="transparent" stroke-width="18" stroke-linecap="round" pointer-events="stroke"></path>
  `).join("");
  const legend = summaries.map((curve, index) => `
    <g transform="translate(${64 + (index % 4) * 245}, ${index < 4 ? 24 : 48})">
      <rect width="14" height="14" rx="3" fill="${curve.color}"></rect>
      <text x="22" y="12" font-size="13" fill="#202126">${curve.short}</text>
    </g>
  `).join("");
  $("#rhythms-chart").innerHTML = `
    <rect width="1100" height="520" fill="#fffefa"></rect>
    ${grid}
    <line x1="54" y1="450" x2="1046" y2="450" stroke="#6c6d75" stroke-width="1.2"/>
    ${ticks}
    ${lines}
    ${hitLines}
    ${legend}
  `;
  attachChartHover(result);
}

function nearestPointFromEvent(event, svg, result) {
  const rect = svg.getBoundingClientRect();
  const ratio = 1100 / Math.max(1, rect.width);
  const svgX = (event.clientX - rect.left) * ratio;
  const index = Math.max(0, Math.min(result.points.length - 1, Math.round(((svgX - 64) / 970) * (result.points.length - 1))));
  return { index, point: result.points[index] };
}

function showTooltip(event, curve, point) {
  const tooltip = $("#rhythm-tooltip");
  const rect = $(".chart-panel").getBoundingClientRect();
  tooltip.hidden = false;
  tooltip.innerHTML = `<strong>${curve.title}</strong><span>${point.date}: ${point.values[curve.key]}%</span>`;
  const left = Math.min(rect.width - 190, Math.max(10, event.clientX - rect.left + 12));
  const top = Math.min(rect.height - 58, Math.max(10, event.clientY - rect.top - 12));
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function attachChartHover(result) {
  const svg = $("#rhythms-chart");
  const tooltip = $("#rhythm-tooltip");
  const setHighlight = (key) => {
    state.highlightedKey = key;
    svg.querySelectorAll(".rhythm-line").forEach((path) => {
      const curve = result.summaries.find((item) => item.key === path.dataset.key);
      const highlighted = key && path.dataset.key === key;
      path.setAttribute("stroke-width", highlighted ? "5" : curve?.key === "luck" ? "4" : "2.4");
      path.setAttribute("opacity", !key || highlighted ? curve?.key === "luck" ? "0.95" : "0.82" : "0.22");
    });
  };
  svg.querySelectorAll(".rhythm-hit-line").forEach((line) => {
    line.addEventListener("mouseenter", () => {
      setHighlight(line.dataset.key);
    });
    line.addEventListener("mousemove", (event) => {
      const curve = result.summaries.find((item) => item.key === line.dataset.key);
      if (!curve) return;
      const { point } = nearestPointFromEvent(event, svg, result);
      showTooltip(event, curve, point);
    });
  });
  svg.addEventListener("mouseleave", () => {
    setHighlight(null);
    tooltip.hidden = true;
  });
}

function renderVisibleRhythms() {
  const result = state.result;
  if (!result) return;
  const last = result.points[result.points.length - 1];
  const summaries = activeSummaries(result);
  $("#rhythms-range").textContent = `${result.startDate} - ${last.date}`;
  $("#body-now").textContent = `${result.points[0].values.body}%`;
  $("#emotion-now").textContent = `${result.points[0].values.emotion}%`;
  $("#luck-now").textContent = `${result.points[0].values.luck}%`;
  renderChart(result);
  $("#rhythm-cards").innerHTML = summaries.map((curve) => `
    <article class="rhythm-card">
      <div class="axis-head"><strong>${curve.title}</strong><span>${curve.value}% <b class="trend-arrow ${trendFor(result, curve.key).className}" title="${trendFor(result, curve.key).label}">${trendFor(result, curve.key).symbol}</b></span></div>
      <div class="axis-meter"><span style="width:${curve.value}%; background:${curve.color}"></span></div>
      <p><b>${curve.state}</b>: ${curve.advice}</p>
      <small>${curve.markers}. ${curve.meaning}.</small>
    </article>
  `).join("");
  $("#rhythms-safety").textContent = result.safetyNote;
}

function renderRhythms(result) {
  state.result = result;
  state.activeKeys = new Set(result.summaries.map((curve) => curve.key));
  const last = result.points[result.points.length - 1];
  $("#rhythms-range").textContent = `${result.startDate} - ${last.date}`;
  $("#body-now").textContent = `${result.points[0].values.body}%`;
  $("#emotion-now").textContent = `${result.points[0].values.emotion}%`;
  $("#luck-now").textContent = `${result.points[0].values.luck}%`;
  renderControls(result);
  renderVisibleRhythms();
}

async function init() {
  await loadPlaces();
  const form = $("#rhythms-form");
  if (window.CodexProfile) {
    CodexProfile.applyToForm(form);
    CodexProfile.bindForm(form);
  }
  $("#rhythms-period").addEventListener("change", () => {
    form.elements.days.value = $("#rhythms-period").value;
    form.requestSubmit();
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button");
    button.disabled = true;
    $("#rhythms-status").textContent = "Строю семь графиков...";
    try {
      renderRhythms(await calculateRhythms(payloadFromForm(form)));
      $("#rhythms-status").textContent = "Графики готовы.";
      if (window.innerWidth < 720) {
        setTimeout(() => $(".rhythms-workspace").scrollIntoView({ behavior: "smooth", block: "start" }), 150);
      }
    } catch (error) {
      $("#rhythms-status").textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
  form.requestSubmit();
}

init();
