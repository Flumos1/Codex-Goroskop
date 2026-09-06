function $(selector) {
  return document.querySelector(selector);
}

function list(selector, items, className) {
  $(selector).innerHTML = items.map((item) => `<div class="${className}">${item}</div>`).join("");
}

function payloadFromForm(form) {
  if (window.CodexProfile) CodexProfile.write(CodexProfile.readFromForm(form));
  return Object.fromEntries(new FormData(form).entries());
}

async function calculateNumerology(payload) {
  const response = await fetch("/api/numerology", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Ошибка расчета нумерологии.");
  return result.numerology;
}

function axisCard(label, entry) {
  return `
    <article class="axis-card">
      <div class="axis-head"><strong>${label}</strong><span>${entry.value}</span></div>
      <p><strong>${entry.profile.title}</strong> — ${entry.profile.meaning}.</p>
    </article>
  `;
}

function renderMonthlyAdvice(sections) {
  const container = $("#numerology-advice");
  if (!sections.length) {
    container.innerHTML = `<div class="empty-state">Рассчитайте числа, чтобы получить совет на месяц.</div>`;
    return;
  }
  container.innerHTML = sections.map((section) => `
    <article class="monthly-advice-card">
      <h3>${section.title}</h3>
      <p>${section.text}</p>
    </article>
  `).join("");
}

function renderNumerology(result) {
  $("#num-life-path").textContent = result.lifePath.value;
  $("#num-expression").textContent = result.expression.value;
  $("#num-soul-urge").textContent = result.soulUrge.value;
  $("#num-personality").textContent = result.personality.value;
  $("#numerology-title").textContent = `${result.subject.nickname}: ${result.lifePath.profile.title}`;

  renderList("#numerology-synthesis", result.synthesis);
  $("#numerology-axis-grid").innerHTML = [
    axisCard("Жизненный путь", result.lifePath),
    axisCard("Экспрессия", result.expression),
    axisCard("Число души", result.soulUrge),
    axisCard("Личность", result.personality),
    axisCard("День рождения", result.birthday),
  ].join("");

  $("#numerology-cycle").innerHTML = `
    <div class="anchor-card"><strong>Персональный год ${result.cycle.personalYear}</strong><p>${result.personalYearProfile.title}: ${result.personalYearProfile.theme}.</p></div>
    <div class="anchor-card"><strong>Персональный месяц ${result.cycle.personalMonth}</strong><p>Уточняет тему года на ближайшие 3-4 недели.</p></div>
    <div class="anchor-card"><strong>Персональный день ${result.cycle.personalDay}</strong><p>Тон дня на ${result.cycle.asOfDate}.</p></div>
  `;

  list("#numerology-hypotheses", result.boldHypotheses, "prediction-item bold-hypothesis");
  list("#numerology-forecast", result.futureForecast, "prediction-item");
  $("#numerology-method").innerHTML = `
    <div class="anchor-card"><strong>${result.sourceFrame.branch}</strong><p>${result.sourceFrame.primarySource}</p></div>
    <div class="anchor-card"><strong>Метод</strong><p>${result.sourceFrame.method}</p></div>
    <div class="anchor-card"><strong>Ограничение</strong><p>${result.sourceFrame.limitation}</p></div>
  `;

  renderMonthlyAdvice(result.monthlyAdviceSections || []);
  $("#numerology-safety").textContent = result.safetyNote;
}

function renderList(selector, items) {
  $(selector).innerHTML = items.map((item) => `<div class="highlight-item">${item}</div>`).join("");
}

async function init() {
  const form = $("#numerology-form");
  if (window.CodexProfile) {
    CodexProfile.applyToForm(form);
    CodexProfile.bindForm(form);
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button");
    button.disabled = true;
    $("#numerology-status").textContent = "Считаю числа...";
    try {
      renderNumerology(await calculateNumerology(payloadFromForm(form)));
      $("#numerology-status").textContent = "Нумерологический разбор готов.";
      if (window.innerWidth < 720) {
        setTimeout(() => $(".numerology-workspace").scrollIntoView({ behavior: "smooth", block: "start" }), 150);
      }
    } catch (error) {
      $("#numerology-status").textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
  form.requestSubmit();
}

init();
