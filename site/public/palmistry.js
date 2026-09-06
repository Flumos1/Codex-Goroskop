const state = { hasPhoto: false, imageMetrics: null, autoReading: null };
const guideTitles = {
  heart: "Линия сердца: эмоциональный стиль и близость",
  head: "Линия головы: мышление, решения и концентрация",
  life: "Линия жизни: тонус, ресурс и способ восстановления",
  fate: "Линия судьбы: направление, работа и ощущение задачи",
};
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
const mountTitles = {
  venus: "холм Венеры",
  moon: "холм Луны",
  jupiter: "холм Юпитера",
  mercury: "холм Меркурия",
  saturn: "холм Сатурна",
  apollo: "холм Аполлона",
};

function $(selector) {
  return document.querySelector(selector);
}

function list(selector, items, className) {
  $(selector).innerHTML = items.map((item) => `<div class="${className}">${item}</div>`).join("");
}

function payloadFromForm(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const autoLines = state.autoReading?.lines || {};
  return {
    handSide: data.handSide,
    handShape: state.autoReading?.handShape || "earth",
    hasPhoto: state.hasPhoto,
    imageMetrics: state.imageMetrics,
    autoReading: state.autoReading,
    lines: {
      heart: autoLines.heart || [],
      head: autoLines.head || [],
      life: autoLines.life || [],
      fate: autoLines.fate || [],
    },
    mounts: state.autoReading?.mounts || [],
  };
}

async function calculatePalmistry(payload) {
  const response = await fetch("/api/palmistry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Ошибка разбора ладони.");
  return result.palmistry;
}

function renderPalmistry(result) {
  $("#palm-side").textContent = { dominant: "Ведущая", right: "Правая", left: "Левая" }[result.hand.side] || result.hand.side;
  $("#palm-shape").textContent = result.hand.shapeTitle;
  $("#palm-lines").textContent = String(result.lines.length);
  $("#palm-mounts-count").textContent = String(result.mounts.length);

  list("#palm-tone", result.dominantTone, "highlight-item");
  list("#palm-synthesis", result.synthesis, "highlight-item");
  $("#palm-line-grid").innerHTML = result.lines.map((line) => `
    <article class="axis-card palm-line-card" data-line="${line.key}">
      <div class="axis-head">
        <strong>${line.title}</strong>
        <span>${line.features.length || 0}</span>
      </div>
      <p>${line.meanings.join(" ")}</p>
    </article>
  `).join("");
  $("#palm-mounts").innerHTML = result.mounts.length ? result.mounts.map((mount) => `
    <div class="anchor-card"><strong>${mount.title}</strong><p>${mount.meaning}</p></div>
  `).join("") : `<div class="empty-state">Выраженные холмы пока не выбраны.</div>`;
  list("#palm-hypotheses", result.boldHypotheses, "prediction-item bold-hypothesis");
  list("#palm-future", result.futureForecast || [], "prediction-item");
  renderMonthlyAdvice(result.monthlyAdviceSections || []);
  $("#palm-photo-note").textContent = result.photoNote;
  $("#palm-safety").textContent = result.safetyNote;
  if (result.imageMetrics) renderImageAnalysis(result.imageMetrics, result.recognitionReadiness);
  renderAutoReading(result.autoReading);
  bindLineCardHover();
}

function renderMonthlyAdvice(sections) {
  const container = $("#palm-advice");
  if (!sections.length) {
    container.innerHTML = `<div class="empty-state">Загрузите фото, чтобы получить совет на месяц.</div>`;
    return;
  }
  container.innerHTML = sections.map((section) => `
    <article class="monthly-advice-card">
      <h3>${section.title}</h3>
      <p>${section.text}</p>
    </article>
  `).join("");
}

function metricState(value, good, lowText, highText = "хорошо") {
  if (value >= good) return highText;
  return lowText;
}

function percent(value) {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

function renderAutoReading(autoReading) {
  if (!autoReading) {
    $("#palm-auto-reading").innerHTML = `<div class="empty-state">Загрузите фото, и программа сама выберет форму руки, линии и холмы по видимым зонам ладони.</div>`;
    return;
  }

  const lineText = Object.entries(autoReading.lines || {})
    .map(([key, values]) => {
      const readableValues = Array.isArray(values)
        ? values.map((value) => featureTitles[value] || value).join(", ")
        : values;
      return `<span class="auto-chip">${guideTitles[key]?.split(":")[0] || key}: ${readableValues || "нет явного признака"}</span>`;
    })
    .join("");
  const mountText = (autoReading.mounts || []).map((mount) => `<span class="auto-chip">${mountTitles[mount] || mount}</span>`).join("");
  const recognizedText = (autoReading.recognizedTraits || []).map((item) => `<li>${item}</li>`).join("");
  $("#palm-auto-reading").innerHTML = `
    <div class="auto-reading-head">
      <strong>Выбрано автоматически по фото</strong>
      <span>${percent(autoReading.confidence)} уверенности</span>
    </div>
    <p>${autoReading.summary}</p>
    <div class="auto-chip-row">
      <span class="auto-chip">Форма: ${autoReading.handShape}</span>
      ${lineText}
      ${mountText || `<span class="auto-chip">Холмы не выделились уверенно</span>`}
    </div>
    ${recognizedText ? `<ul class="auto-recognized-list">${recognizedText}</ul>` : ""}
    <p class="summary-note">Это предварительная компьютерная разметка по контрасту, дугам и зонам ладони. Для лучшего результата загрузите четкое фото всей ладони при ровном свете.</p>
  `;
}

function renderImageAnalysis(metrics, readiness = null) {
  if (!metrics) {
    $("#palm-image-analysis").innerHTML = `<div class="empty-state">После загрузки фото здесь появится оценка света, контраста и резкости.</div>`;
    return;
  }
  $("#palm-image-analysis").innerHTML = `
    <article class="axis-card">
      <div class="axis-head"><strong>Свет</strong><span>${metrics.brightness}%</span></div>
      <div class="axis-meter"><span style="width:${metrics.brightness}%"></span></div>
      <p>${metricState(metrics.brightness, 38, "темновато: лучше переснять при ровном свете", "света достаточно")}</p>
    </article>
    <article class="axis-card">
      <div class="axis-head"><strong>Контраст линий</strong><span>${metrics.contrast}%</span></div>
      <div class="axis-meter"><span style="width:${metrics.contrast}%"></span></div>
      <p>${metricState(metrics.contrast, 18, "линии могут сливаться с кожей", "линии должны читаться заметнее")}</p>
    </article>
    <article class="axis-card">
      <div class="axis-head"><strong>Резкость</strong><span>${metrics.sharpness}%</span></div>
      <div class="axis-meter"><span style="width:${metrics.sharpness}%"></span></div>
      <p>${metricState(metrics.sharpness, 14, "есть риск смаза: держите камеру неподвижно", "контуры достаточно резкие")}</p>
    </article>
    <article class="axis-card">
      <div class="axis-head"><strong>Готовность AI</strong><span>${readiness ?? "?"}%</span></div>
      <div class="axis-meter"><span style="width:${readiness ?? 0}%"></span></div>
      <p>${readiness === null ? "оценка появится после разбора" : readiness >= 34 ? "фото подходит для следующего этапа авторазметки" : "лучше улучшить свет и резкость перед AI-слоем"}</p>
    </article>
  `;
}

function analyzeImage(image) {
  const canvas = $("#palm-line-map");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const size = 640;
  canvas.width = size;
  canvas.height = size;
  context.fillStyle = "#fffefa";
  context.fillRect(0, 0, size, size);
  const scale = Math.min(size / image.naturalWidth, size / image.naturalHeight);
  const width = Math.round(image.naturalWidth * scale);
  const height = Math.round(image.naturalHeight * scale);
  const left = Math.round((size - width) / 2);
  const top = Math.round((size - height) / 2);
  context.drawImage(image, left, top, width, height);

  const source = context.getImageData(0, 0, size, size);
  const data = source.data;
  const gray = new Uint8ClampedArray(size * size);
  let sum = 0;
  for (let i = 0; i < gray.length; i += 1) {
    const offset = i * 4;
    const value = Math.round(data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114);
    gray[i] = value;
    sum += value;
  }
  const mean = sum / gray.length;
  let variance = 0;
  let edgeSum = 0;
  const edgeMap = new Uint8ClampedArray(size * size);
  const output = context.createImageData(size, size);
  for (let y = 1; y < size - 1; y += 1) {
    for (let x = 1; x < size - 1; x += 1) {
      const index = y * size + x;
      const gx = -gray[index - size - 1] - 2 * gray[index - 1] - gray[index + size - 1]
        + gray[index - size + 1] + 2 * gray[index + 1] + gray[index + size + 1];
      const gy = -gray[index - size - 1] - 2 * gray[index - size] - gray[index - size + 1]
        + gray[index + size - 1] + 2 * gray[index + size] + gray[index + size + 1];
      const edge = Math.min(255, Math.round(Math.sqrt(gx * gx + gy * gy)));
      edgeMap[index] = edge;
      edgeSum += edge;
      variance += (gray[index] - mean) ** 2;
      const offset = index * 4;
      const ink = edge > 46 ? 38 : 250;
      output.data[offset] = ink;
      output.data[offset + 1] = edge > 46 ? 94 : 253;
      output.data[offset + 2] = edge > 46 ? 91 : 248;
      output.data[offset + 3] = 255;
    }
  }
  context.putImageData(output, 0, 0);
  canvas.hidden = false;
  $("#palm-guide-overlay").hidden = false;
  $("#palm-preview").hidden = true;
  const metrics = {
    brightness: Math.round((mean / 255) * 100),
    contrast: Math.min(100, Math.round((Math.sqrt(variance / gray.length) / 64) * 100)),
    sharpness: Math.min(100, Math.round((edgeSum / gray.length / 34) * 100)),
  };
  return {
    metrics,
    autoReading: detectPalmFeatures({ gray, edgeMap, size, imageBox: { left, top, width, height }, metrics }),
  };
}

function regionAverage(map, size, box) {
  const x1 = Math.max(1, Math.round(box.x1));
  const y1 = Math.max(1, Math.round(box.y1));
  const x2 = Math.min(size - 1, Math.round(box.x2));
  const y2 = Math.min(size - 1, Math.round(box.y2));
  let sum = 0;
  let count = 0;
  for (let y = y1; y < y2; y += 1) {
    for (let x = x1; x < x2; x += 1) {
      sum += map[y * size + x];
      count += 1;
    }
  }
  return count ? sum / count : 0;
}

function relativeBox(imageBox, x1, y1, x2, y2) {
  return {
    x1: imageBox.left + imageBox.width * x1,
    y1: imageBox.top + imageBox.height * y1,
    x2: imageBox.left + imageBox.width * x2,
    y2: imageBox.top + imageBox.height * y2,
  };
}

function strongestMounts(scores) {
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .filter(([, score], index, list) => index < 3 && score > Math.max(7, list[0][1] * 0.74))
    .map(([key]) => key);
}

function detectPalmFeatures({ gray, edgeMap, size, imageBox, metrics }) {
  const fullEdge = regionAverage(edgeMap, size, relativeBox(imageBox, 0.12, 0.16, 0.88, 0.92));
  const brightnessTop = regionAverage(gray, size, relativeBox(imageBox, 0.18, 0.10, 0.82, 0.35));
  const brightnessBottom = regionAverage(gray, size, relativeBox(imageBox, 0.18, 0.62, 0.82, 0.94));
  const aspect = imageBox.height / Math.max(1, imageBox.width);

  const zones = {
    heart: regionAverage(edgeMap, size, relativeBox(imageBox, 0.18, 0.30, 0.84, 0.43)),
    heartLeft: regionAverage(edgeMap, size, relativeBox(imageBox, 0.18, 0.27, 0.48, 0.43)),
    heartRight: regionAverage(edgeMap, size, relativeBox(imageBox, 0.50, 0.29, 0.84, 0.46)),
    head: regionAverage(edgeMap, size, relativeBox(imageBox, 0.18, 0.43, 0.86, 0.57)),
    headLower: regionAverage(edgeMap, size, relativeBox(imageBox, 0.28, 0.52, 0.86, 0.66)),
    lifeOuter: regionAverage(edgeMap, size, relativeBox(imageBox, 0.14, 0.32, 0.46, 0.82)),
    lifeInner: regionAverage(edgeMap, size, relativeBox(imageBox, 0.30, 0.38, 0.54, 0.74)),
    fateUpper: regionAverage(edgeMap, size, relativeBox(imageBox, 0.44, 0.26, 0.58, 0.50)),
    fateLower: regionAverage(edgeMap, size, relativeBox(imageBox, 0.42, 0.52, 0.58, 0.86)),
  };

  const mountScores = {
    venus: regionAverage(edgeMap, size, relativeBox(imageBox, 0.12, 0.48, 0.36, 0.83)),
    moon: regionAverage(edgeMap, size, relativeBox(imageBox, 0.66, 0.52, 0.90, 0.88)),
    jupiter: regionAverage(edgeMap, size, relativeBox(imageBox, 0.18, 0.12, 0.38, 0.32)),
    saturn: regionAverage(edgeMap, size, relativeBox(imageBox, 0.38, 0.10, 0.56, 0.31)),
    apollo: regionAverage(edgeMap, size, relativeBox(imageBox, 0.56, 0.12, 0.73, 0.33)),
    mercury: regionAverage(edgeMap, size, relativeBox(imageBox, 0.72, 0.17, 0.90, 0.38)),
  };

  const lines = {
    heart: [],
    head: [],
    life: [],
    fate: [],
  };

  if (zones.heart > fullEdge * 0.96) lines.heart.push("long_clear");
  lines.heart.push(zones.heartRight > zones.heartLeft * 1.08 ? "curved" : "straight");
  if (zones.heart > fullEdge * 1.22 && metrics.contrast < 28) lines.heart.push("chained");

  if (zones.head > fullEdge * 0.92) lines.head.push("long_clear");
  lines.head.push(zones.headLower > zones.head * 1.08 ? "curved" : "straight");
  if (Math.abs(zones.head - zones.headLower) > fullEdge * 0.28 && metrics.sharpness < 24) lines.head.push("broken");

  if (Math.max(zones.lifeOuter, zones.lifeInner) > fullEdge * 0.95) lines.life.push("deep");
  lines.life.push(zones.lifeOuter > zones.lifeInner * 1.08 ? "wide_arc" : "close_arc");
  if (zones.lifeOuter > fullEdge * 1.2 && zones.fateLower > fullEdge) lines.life.push("forked");

  const fateScore = (zones.fateUpper + zones.fateLower) / 2;
  lines.fate.push(fateScore > fullEdge * 0.92 ? "strong" : "weak");
  if (zones.fateLower > zones.fateUpper * 1.12) lines.fate.push("starts_late");
  if (Math.abs(zones.fateUpper - zones.fateLower) > fullEdge * 0.34) lines.fate.push("broken");

  const handShape = aspect > 1.18
    ? (brightnessTop > brightnessBottom ? "air" : "water")
    : (fullEdge > 18 ? "earth" : "fire");

  const confidence = Math.min(92, Math.max(24,
    metrics.brightness * 0.2 + metrics.contrast * 0.25 + metrics.sharpness * 0.25 + Math.min(30, fullEdge)
  ));

  return {
    handShape,
    handShapeTitle: { earth: "земная", air: "воздушная", water: "водная", fire: "огненная" }[handShape],
    lines,
    mounts: strongestMounts(mountScores),
    confidence,
    evidence: {
      fullEdge: Math.round(fullEdge),
      zones: Object.fromEntries(Object.entries(zones).map(([key, value]) => [key, Math.round(value)])),
      mountScores: Object.fromEntries(Object.entries(mountScores).map(([key, value]) => [key, Math.round(value)])),
    },
    summary: `Фото похоже на ${ { earth: "плотную земную", air: "сухую воздушную", water: "мягкую водную", fire: "активную огненную" }[handShape] } руку; основные выводы собраны по контрасту верхней, средней, дуговой и центральной зон ладони.`,
  };
}

function applyAutoReading(form, autoReading) {
  if (!autoReading) return;
}

function setupPhotoPreview() {
  $("#palm-photo").addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    state.hasPhoto = Boolean(file);
    state.imageMetrics = null;
    if (!file) {
      $("#palm-preview").hidden = true;
      $("#palm-preview").removeAttribute("src");
      $("#palm-line-map").hidden = true;
      $("#palm-guide-overlay").hidden = true;
      $("#palm-guide-tooltip").hidden = true;
      $("#palm-empty").hidden = false;
      state.autoReading = null;
      renderImageAnalysis(null);
      renderAutoReading(null);
      return;
    }
    const url = URL.createObjectURL(file);
    $("#palm-preview").src = url;
    $("#palm-preview").onload = () => {
      const analysis = analyzeImage($("#palm-preview"));
      state.imageMetrics = analysis.metrics;
      state.autoReading = analysis.autoReading;
      applyAutoReading($("#palmistry-form"), state.autoReading);
      renderImageAnalysis(state.imageMetrics);
      renderAutoReading(state.autoReading);
      $("#palmistry-form").requestSubmit();
      URL.revokeObjectURL(url);
    };
    $("#palm-empty").hidden = true;
  });
}

function setGuideHighlight(key) {
  document.querySelectorAll(".palm-guide-overlay path").forEach((path) => {
    path.classList.toggle("active", Boolean(key && path.dataset.guide === key));
    path.classList.toggle("dimmed", Boolean(key && path.dataset.guide !== key));
  });
  document.querySelectorAll(".palm-line-card").forEach((card) => {
    card.classList.toggle("active", Boolean(key && card.dataset.line === key));
  });
}

function bindGuideOverlay() {
  const overlay = $("#palm-guide-overlay");
  const tooltip = $("#palm-guide-tooltip");
  overlay.querySelectorAll("path").forEach((path) => {
    path.addEventListener("mouseenter", () => {
      setGuideHighlight(path.dataset.guide);
      tooltip.textContent = guideTitles[path.dataset.guide] || "";
      tooltip.hidden = false;
    });
    path.addEventListener("mousemove", (event) => {
      const rect = $(".palm-photo-stage").getBoundingClientRect();
      tooltip.style.left = `${Math.min(rect.width - 190, Math.max(10, event.clientX - rect.left + 12))}px`;
      tooltip.style.top = `${Math.min(rect.height - 48, Math.max(10, event.clientY - rect.top - 12))}px`;
    });
  });
  overlay.addEventListener("mouseleave", () => {
    setGuideHighlight(null);
    tooltip.hidden = true;
  });
}

function bindLineCardHover() {
  document.querySelectorAll(".palm-line-card").forEach((card) => {
    card.addEventListener("mouseenter", () => setGuideHighlight(card.dataset.line));
    card.addEventListener("mouseleave", () => setGuideHighlight(null));
  });
}

async function init() {
  const form = $("#palmistry-form");
  bindGuideOverlay();
  setupPhotoPreview();
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button");
    button.disabled = true;
    $("#palmistry-status").textContent = "Собираю символический разбор ладони...";
    try {
      if (!state.autoReading) {
        $("#palmistry-status").textContent = "Сначала загрузите фото ладони: форма руки, линии и холмы определяются по снимку.";
        renderMonthlyAdvice([]);
        return;
      }
      renderPalmistry(await calculatePalmistry(payloadFromForm(form)));
      $("#palmistry-status").textContent = "Разбор готов.";
      if (window.innerWidth < 720) {
        setTimeout(() => $(".palmistry-workspace").scrollIntoView({ behavior: "smooth", block: "start" }), 150);
      }
    } catch (error) {
      $("#palmistry-status").textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
  renderMonthlyAdvice([]);
}

init();
