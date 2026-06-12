const state = {
  places: [],
  result: null,
};

const storageKey = "codex-goroskop:vedic:last-result:v1";

function $(selector) {
  return document.querySelector(selector);
}

function degree(value) {
  return `${Number(value || 0).toFixed(2)}°`;
}

function syncPlaceFields() {
  const selectedPlace = state.places.find((place) => place.key === $("#vedic-place-select").value);
  if (!selectedPlace) return;
  document.querySelector('[name="latitude"]').placeholder = String(selectedPlace.latitude);
  document.querySelector('[name="longitude"]').placeholder = String(selectedPlace.longitude);
  document.querySelector('[name="timeZone"]').placeholder = selectedPlace.timeZone;
}

async function loadPlaces() {
  const response = await fetch("/api/places");
  state.places = await response.json();
  const select = $("#vedic-place-select");
  select.innerHTML = state.places.map((place) => `<option value="${place.key}">${place.name}</option>`).join("");
  select.value = "chisinau-md";
  syncPlaceFields();
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

async function calculateVedic(payload) {
  const response = await fetch("/api/vedic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Ошибка расчета Джйотиша.");
  return result.vedic;
}

function renderList(selector, items, className) {
  $(selector).innerHTML = items.map((item) => `<div class="${className}">${item}</div>`).join("");
}

function renderVedic(vedic) {
  state.result = vedic;
  try {
    localStorage.setItem(storageKey, JSON.stringify(vedic));
  } catch (error) {
    // The page still works when storage is unavailable.
  }

  $("#vedic-lagna").textContent = `${vedic.lagna.signName} ${degree(vedic.lagna.degreeInSign)}`;
  $("#vedic-moon").textContent = `${vedic.moon.rashiName} ${degree(vedic.moon.degreeInRashi)}`;
  $("#vedic-nakshatra").textContent = `${vedic.moon.nakshatra.name}, пада ${vedic.moon.nakshatra.pada}`;
  $("#vedic-dasha").textContent = vedic.currentDasha.lordName;

  $("#vedic-method").innerHTML = `
    <strong>${vedic.method.system}</strong>
    <span>${vedic.method.zodiac}</span>
    <span>Айанамша: ${vedic.method.ayanamsaDegrees}° (${vedic.method.ayanamsa})</span>
    <span>Слой: ${vedic.method.chartLayer}</span>
    <span>Дата прогноза: ${vedic.method.targetDate}</span>
  `;

  renderList("#vedic-human-summary", vedic.humanSummary, "highlight-item");
  renderList("#vedic-prediction", vedic.currentDasha.prediction, "prediction-item");
  $("#vedic-focus-title").textContent = vedic.focusReading.title;
  $("#vedic-focus-summary").textContent = vedic.focusReading.summary;
  renderList("#vedic-focus-list", vedic.focusReading.items, "prediction-item");

  $("#vedic-anchors").innerHTML = `
    <div class="anchor-card">
      <strong>${vedic.lagna.title}</strong>
      <p>${vedic.lagna.explanation}</p>
    </div>
    <div class="anchor-card">
      <strong>Луна: ${vedic.moon.rashiName}, накшатра ${vedic.moon.nakshatra.name}</strong>
      <p>${vedic.moon.explanation}</p>
    </div>
    <div class="anchor-card">
      <strong>Махадаша: ${vedic.currentDasha.lordName}</strong>
      <p>Период примерно с ${vedic.currentDasha.startDate} до ${vedic.currentDasha.endDate}. Осталось около ${vedic.currentDasha.remainingYears} лет. Управляемые дома: ${vedic.currentDasha.ownedHouseText}.</p>
    </div>
  `;

  $("#vedic-positions").innerHTML = vedic.positions.map((position) => `
    <tr>
      <td>${position.bodyName}</td>
      <td>${position.rashiName} ${degree(position.degreeInRashi)}</td>
      <td>${position.house}</td>
      <td>${position.roleTone}; управляет: ${position.ownedHouseText}</td>
    </tr>
  `).join("");

  $("#vedic-safety").textContent = `${vedic.safetyNote} ${vedic.method.limitation}`;
}

function restoreLastResult() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return false;
    const result = JSON.parse(raw);
    if (!result?.lagna || !result?.currentDasha) return false;
    renderVedic(result);
    $("#vedic-status").textContent = "Восстановлен последний ведический расчет.";
    return true;
  } catch (error) {
    return false;
  }
}

async function init() {
  await loadPlaces();
  const form = $("#vedic-form");
  if (window.CodexProfile) {
    CodexProfile.applyToForm(form);
    CodexProfile.bindForm(form);
    syncPlaceFields();
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button");
    button.disabled = true;
    $("#vedic-status").textContent = "Считаю лагну, накшатру и период...";
    try {
      renderVedic(await calculateVedic(formPayload(form)));
      $("#vedic-status").textContent = "Ведический расчет готов.";
      if (window.innerWidth < 720) {
        setTimeout(() => $(".vedic-workspace").scrollIntoView({ behavior: "smooth", block: "start" }), 150);
      }
    } catch (error) {
      $("#vedic-status").textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });

  $("#vedic-place-select").addEventListener("change", syncPlaceFields);
  if (!restoreLastResult()) form.requestSubmit();
}

init();
