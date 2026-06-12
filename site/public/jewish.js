const state = { places: [] };

function $(selector) {
  return document.querySelector(selector);
}

function renderList(selector, items, className) {
  $(selector).innerHTML = items.map((item) => `<div class="${className}">${item}</div>`).join("");
}

async function loadPlaces() {
  const response = await fetch("/api/places");
  state.places = await response.json();
  $("#jewish-place-select").innerHTML = state.places.map((place) => `<option value="${place.key}">${place.name}</option>`).join("");
  $("#jewish-place-select").value = "chisinau-md";
}

function payloadFromForm(form) {
  if (window.CodexProfile) CodexProfile.write(CodexProfile.readFromForm(form));
  return Object.fromEntries(new FormData(form).entries());
}

async function calculateJewish(payload) {
  const response = await fetch("/api/jewish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Ошибка расчета еврейского блока.");
  return result.jewish;
}

function renderJewish(result) {
  $("#jewish-month").textContent = result.month.month;
  $("#jewish-sign").textContent = result.month.signName;
  $("#jewish-name-layer").textContent = result.nameLayer.name;
  $("#jewish-date-layer").textContent = result.dateLayer.name;
  $("#jewish-title").textContent = `${result.month.month}: ${result.month.title}`;
  renderList("#jewish-synthesis", result.synthesis, "highlight-item");
  $("#jewish-tikkun").innerHTML = `
    <div class="anchor-card"><strong>Тиккун</strong><p>${result.month.tikkun}</p></div>
    <div class="anchor-card"><strong>Тень</strong><p>${result.month.shadow}</p></div>
    <div class="anchor-card"><strong>Дар</strong><p>${result.month.gift}</p></div>
  `;
  renderList("#jewish-hypotheses", result.boldHypotheses, "prediction-item bold-hypothesis");
  renderList("#jewish-practices", result.practices, "prediction-item");
  $("#jewish-method").innerHTML = `
    <div class="anchor-card"><strong>${result.sourceFrame.branch}</strong><p>${result.sourceFrame.primarySource}</p></div>
    <div class="anchor-card"><strong>Метод</strong><p>${result.sourceFrame.method}</p></div>
    <div class="anchor-card"><strong>Ограничение</strong><p>${result.sourceFrame.limitation}</p></div>
  `;
  $("#jewish-safety").textContent = result.safetyNote;
}

async function init() {
  await loadPlaces();
  const form = $("#jewish-form");
  if (window.CodexProfile) {
    CodexProfile.applyToForm(form);
    CodexProfile.bindForm(form);
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button");
    button.disabled = true;
    $("#jewish-status").textContent = "Считаю каббалистический слой...";
    try {
      renderJewish(await calculateJewish(payloadFromForm(form)));
      $("#jewish-status").textContent = "Еврейский блок готов.";
      if (window.innerWidth < 720) {
        setTimeout(() => $(".jewish-workspace").scrollIntoView({ behavior: "smooth", block: "start" }), 150);
      }
    } catch (error) {
      $("#jewish-status").textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
  form.requestSubmit();
}

init();
