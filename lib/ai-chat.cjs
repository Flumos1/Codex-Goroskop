const fs = require("fs");
const path = require("path");

function loadLocalEnv() {
  for (const file of [".env.local", ".env"]) {
    const envPath = path.join(__dirname, "..", file);
    if (!fs.existsSync(envPath)) continue;
    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

loadLocalEnv();

const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

function compactText(value, limit = 9000) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
}

function extractResponseText(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }
  const parts = [];
  for (const item of payload?.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") parts.push(content.text);
    }
  }
  return parts.join("\n").trim();
}

function localContextAnswer({ question, context, pageTitle }) {
  const cleanQuestion = compactText(question, 600);
  const cleanContext = compactText(context, 1800);
  return [
    "ChatGPT API пока не подключен: на сервере не найден `OPENAI_API_KEY`.",
    "",
    `Вопрос: ${cleanQuestion}`,
    "",
    "Что можно сделать по данным страницы прямо сейчас:",
    cleanContext
      ? `- опираться на видимый отчет: ${cleanContext}`
      : `- сначала рассчитать или загрузить данные на странице "${pageTitle || "модуля"}", чтобы появился контекст для разбора`,
    "- затем задать вопрос повторно после настройки ключа OpenAI API.",
    "",
    "Чтобы включить настоящие ответы ChatGPT mini, задайте `OPENAI_API_KEY` в переменной окружения или в локальном файле `.env.local`, затем перезапустите сервер.",
  ].join("\n");
}

function apiFallbackAnswer({ question, context, pageTitle, apiError }) {
  const answer = localContextAnswer({ question, context, pageTitle });
  if (!apiError) return answer;
  return answer.replace(
    "ChatGPT API пока не подключен: на сервере не найден `OPENAI_API_KEY`.",
    "ChatGPT API сейчас недоступен, поэтому включен локальный ответ по данным страницы."
  );
}

async function answerAiChat(input = {}) {
  const question = compactText(input.question, 1000);
  const context = compactText(input.context, 12000);
  const pageTitle = compactText(input.pageTitle, 160);

  if (!question) {
    throw new Error("Question is required.");
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      answer: localContextAnswer({ question, context, pageTitle }),
      model: "local-fallback",
      connected: false,
    };
  }

  const instructions = [
    "Ты контекстный AI-помощник проекта Codex Goroskop.",
    "Отвечай на русском языке, тепло, структурированно и подробно.",
    "Используй только предоставленный контекст страницы и не выдумывай точные факты, которых там нет.",
    "Астрологию, хиромантию, нумерологию и эзотерические слои подавай как символическую интерпретацию, а не медицинский, финансовый, юридический или фатальный прогноз.",
    "Если пользователь просит прогноз, формулируй вероятностно: тенденции, вопросы для наблюдения, практические шаги.",
  ].join(" ");

  let response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        instructions,
        input: [
          `Страница: ${pageTitle || "без названия"}`,
          "",
          "Контекст страницы:",
          context || "Контекст пока пуст.",
          "",
          "Вопрос пользователя:",
          question,
        ].join("\n"),
        max_output_tokens: 1200,
      }),
    });
  } catch (error) {
    return {
      answer: apiFallbackAnswer({ question, context, pageTitle, apiError: error.message }),
      model: `${DEFAULT_MODEL}:local-fallback`,
      connected: false,
      apiError: error.message,
    };
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      answer: apiFallbackAnswer({
        question,
        context,
        pageTitle,
        apiError: payload?.error?.message || `OpenAI API error: ${response.status}`,
      }),
      model: `${DEFAULT_MODEL}:local-fallback`,
      connected: false,
      apiError: payload?.error?.message || `OpenAI API error: ${response.status}`,
    };
  }

  return {
    answer: extractResponseText(payload) || "ChatGPT не вернул текстовый ответ.",
    model: DEFAULT_MODEL,
    connected: true,
  };
}

module.exports = {
  answerAiChat,
};
