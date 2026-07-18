const state = {
  places: [],
  result: null,
};

function $(selector) {
  return document.querySelector(selector);
}

function optionList() {
  return state.places.map((place) => `<option value="${place.key}">${place.name}</option>`).join("");
}

async function loadPlaces() {
  if (window.CodexProfile) {
    state.places = await CodexProfile.loadPlaces();
    CodexProfile.renderPlaceOptions($("#place-a"), state.places);
    CodexProfile.renderPlaceOptions($("#place-b"), state.places, "kyiv-ua");
  } else {
    const response = await fetch("/api/places");
    state.places = await response.json();
    $("#place-a").innerHTML = optionList();
    $("#place-b").innerHTML = optionList();
    $("#place-a").value = "chisinau-md";
    $("#place-b").value = "kyiv-ua";
  }
}

function payloadFromForm(form) {
  if (window.CodexProfile) {
    CodexProfile.write(CodexProfile.readFromForm(form, {
      name: "nameA",
      localDate: "localDateA",
      localTime: "localTimeA",
      placeKey: "placeKeyA",
    }));
  }
  const data = Object.fromEntries(new FormData(form).entries());
  return {
    relationshipContext: data.relationshipContext,
    personA: {
      name: data.nameA,
      localDate: data.localDateA,
      localTime: data.localTimeA,
      placeKey: data.placeKeyA,
    },
    personB: {
      name: data.nameB,
      localDate: data.localDateB,
      localTime: data.localTimeB,
      placeKey: data.placeKeyB,
    },
  };
}

async function calculateCompatibility(payload) {
  const response = await fetch("/api/compatibility", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Ошибка расчета совместимости.");
  return result.compatibility;
}

function renderList(selector, items, className) {
  $(selector).innerHTML = items.map((item) => `<div class="${className}">${item}</div>`).join("");
}

function renderCompatibility(result) {
  state.result = result;
  const topAxis = [...result.axes].sort((a, b) => b.intensity - a.intensity)[0];
  $("#relationship-label").textContent = result.relationshipLabel;
  $("#aspect-total").textContent = String(result.closeAspects.length);
  $("#top-axis").textContent = topAxis?.title || "-";
  $("#hypothesis-count").textContent = String(result.hypotheses.length);
  renderList("#compatibility-summary", result.summary, "highlight-item");

  $("#axis-grid").innerHTML = result.axes.map((axis) => `
    <article class="axis-card">
      <div class="axis-head">
        <strong>${axis.title}</strong>
        <span>${axis.intensity}/10</span>
      </div>
      <div class="axis-meter"><span style="width:${Math.min(100, axis.intensity * 10)}%"></span></div>
      <p>${axis.reading}</p>
    </article>
  `).join("");

  renderList("#hypotheses-list", result.hypotheses, "prediction-item bold-hypothesis");
  $("#deep-research").innerHTML = Object.values(result.deepResearch).map((item) => `
    <div class="anchor-card"><p>${item}</p></div>
  `).join("");
  $("#close-aspects").innerHTML = result.closeAspects.map((aspect) => `
    <div class="aspect-card">
      <div>
        <strong>${aspect.bodyAName} A ${aspect.aspectName} ${aspect.bodyBName} B</strong>
        <div class="aspect-meta">Орб ${aspect.orb.toFixed(2)}°, дистанция ${aspect.distance.toFixed(2)}°</div>
      </div>
      <span class="aspect-badge">${aspect.tone}</span>
    </div>
  `).join("");
  renderList("#compatibility-forecast", result.forecast, "prediction-item");
  $("#compatibility-safety").textContent = result.safetyNote;
}

async function init() {
  await loadPlaces();
  const form = $("#compatibility-form");
  if (window.CodexProfile) {
    const personAMap = {
      name: "nameA",
      localDate: "localDateA",
      localTime: "localTimeA",
      placeKey: "placeKeyA",
    };
    CodexProfile.applyToForm(form, personAMap);
    CodexProfile.bindForm(form, personAMap);
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button");
    button.disabled = true;
    $("#compatibility-status").textContent = "Считаю две карты и синастрию...";
    try {
      renderCompatibility(await calculateCompatibility(payloadFromForm(form)));
      $("#compatibility-status").textContent = "Расширенный отчет готов.";
      if (window.innerWidth < 720) {
        setTimeout(() => $(".compatibility-workspace").scrollIntoView({ behavior: "smooth", block: "start" }), 150);
      }
    } catch (error) {
      $("#compatibility-status").textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
  form.requestSubmit();
}

init();
