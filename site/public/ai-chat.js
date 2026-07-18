const aiQuestionSets = {
  palmistry: [
    "Что самое важное мне сделать в ближайший месяц по руке?",
    "Что рука говорит про отношения и близость?",
    "Куда лучше направить энергию в работе?",
    "Какие денежные решения сейчас сильнее всего поддержаны?",
    "Какие риски и ошибки мне лучше не повторять?",
    "Что попробовать нового в ближайшие 7 дней?",
    "Какие люди и места сейчас полезнее всего?",
    "Какой скрытый талант виден по линиям и холмам?",
    "Как понять, что я иду в правильном направлении?",
    "Сделай смелый, но осторожный прогноз на 3 месяца.",
  ],
  compatibility: [
    "Какая главная сила этой связи?",
    "Где у нас самый вероятный конфликт?",
    "Как лучше разговаривать, чтобы не ранить друг друга?",
    "Что укрепит доверие в ближайший месяц?",
    "Какая роль у каждого человека в этой паре?",
    "Где совместимость сильнее: чувства, дела или быт?",
    "Какие темы лучше не замалчивать?",
    "Какой прогноз для отношений на 3 месяца?",
    "Что сделать уже на этой неделе?",
    "Сформулируй честный вывод без фатальности.",
  ],
  rhythms: [
    "Какой ритм сейчас самый сильный?",
    "Когда лучше действовать, а когда восстановиться?",
    "Что делать с низкой энергией?",
    "Какие дни подходят для разговоров?",
    "Какие дни лучше для работы и денег?",
    "Как использовать интуицию без самообмана?",
    "Какой прогноз на ближайшие 2 недели?",
    "Какая привычка улучшит общий поток?",
    "Что не стоит начинать сейчас?",
    "Собери план месяца по графикам.",
  ],
  default: [
    "Объясни главный вывод этой страницы простыми словами.",
    "Какие 3 действия мне сделать в ближайшую неделю?",
    "Что здесь самое сильное и самое слабое?",
    "Какие вопросы мне стоит себе задать?",
    "Где возможна ошибка интерпретации?",
    "Сделай более смелый, но осторожный прогноз.",
    "Что важно в отношениях?",
    "Что важно в работе и деньгах?",
    "Как использовать этот отчет практически?",
    "Собери короткий план на месяц.",
  ],
};

function aiPageKind() {
  const path = window.location.pathname;
  if (path.includes("palmistry")) return "palmistry";
  if (path.includes("compatibility")) return "compatibility";
  if (path.includes("rhythms")) return "rhythms";
  if (path.includes("vedic")) return "vedic";
  if (path.includes("jewish")) return "jewish";
  if (path.includes("western")) return "western";
  return "default";
}

function aiVisibleContext() {
  const selectors = [
    "h1", "h2", "h3",
    ".summary-strip", ".highlights", ".axis-card", ".prediction-item",
    ".summary-note", ".anchor-card", ".report-view", ".monthly-advice",
    "#palm-auto-reading", "#palm-line-grid", "#palm-mounts",
  ];
  const text = selectors
    .flatMap((selector) => Array.from(document.querySelectorAll(selector)))
    .map((node) => node.innerText || node.textContent || "")
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text.slice(0, 12000);
}

function aiMessage(container, role, text) {
  const node = document.createElement("div");
  node.className = `ai-chat-message ${role}`;
  node.textContent = text;
  container.appendChild(node);
  container.scrollTop = container.scrollHeight;
  return node;
}

function aiBuildWidget() {
  if (document.querySelector("#ai-chat-widget")) return;

  const widget = document.createElement("aside");
  widget.id = "ai-chat-widget";
  widget.className = "ai-chat-widget collapsed";
  widget.innerHTML = `
    <button class="ai-chat-toggle" type="button" aria-label="Открыть AI чат">AI</button>
    <section class="ai-chat-panel" aria-label="AI чат по отчету">
      <header class="ai-chat-header">
        <div>
          <strong>ChatGPT по отчету</strong>
          <span>10 вопросов и свой вопрос по данным страницы</span>
        </div>
        <button class="ai-chat-close" type="button" aria-label="Закрыть AI чат">×</button>
      </header>
      <div class="ai-chat-questions"></div>
      <div class="ai-chat-messages"></div>
      <form class="ai-chat-form">
        <textarea name="question" rows="3" placeholder="Задайте вопрос по этому отчету"></textarea>
        <button type="submit">Спросить</button>
      </form>
    </section>
  `;
  document.body.appendChild(widget);

  const messages = widget.querySelector(".ai-chat-messages");
  const questionBox = widget.querySelector(".ai-chat-questions");
  const questions = aiQuestionSets[aiPageKind()] || aiQuestionSets.default;
  questionBox.innerHTML = questions.map((question) => `<button type="button">${question}</button>`).join("");

  widget.querySelector(".ai-chat-toggle").addEventListener("click", () => widget.classList.remove("collapsed"));
  widget.querySelector(".ai-chat-close").addEventListener("click", () => widget.classList.add("collapsed"));
  questionBox.addEventListener("click", (event) => {
    if (event.target.tagName !== "BUTTON") return;
    widget.querySelector("textarea").value = event.target.textContent;
    widget.querySelector(".ai-chat-form").requestSubmit();
  });

  widget.querySelector(".ai-chat-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const question = form.question.value.trim();
    if (!question) return;
    form.question.value = "";
    aiMessage(messages, "user", question);
    const pending = aiMessage(messages, "assistant", "Думаю по данным страницы...");
    form.querySelector("button").disabled = true;
    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageTitle: document.title,
          pageKind: aiPageKind(),
          context: aiVisibleContext(),
          question,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "AI чат недоступен.");
      pending.textContent = result.answer;
      if (!result.connected) pending.classList.add("local-fallback");
    } catch (error) {
      pending.textContent = error.message;
    } finally {
      form.querySelector("button").disabled = false;
      messages.scrollTop = messages.scrollHeight;
    }
  });
}

document.addEventListener("DOMContentLoaded", aiBuildWidget);
