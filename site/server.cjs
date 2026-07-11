"use strict";
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const express    = require("express");
const path       = require("path");
const fs         = require("fs");
let OpenAI;
try { OpenAI = require("openai"); } catch { OpenAI = null; }

const { calculateProfile } = require("../tools/calculate-chart.cjs");
const { runTransits }      = require("../tools/calculate-transits.cjs");

const projectRoot = path.resolve(__dirname, "..");
const rulesDir    = path.join(projectRoot, "generator", "rules");
const publicDir   = path.join(__dirname, "public");

// Load all rules and build lookup indices
function loadAllRules() {
  const rules = [];
  for (const name of fs.readdirSync(rulesDir).filter(f => f.endsWith(".json"))) {
    const raw = JSON.parse(fs.readFileSync(path.join(rulesDir, name), "utf8"));
    const list = Array.isArray(raw) ? raw : (raw.rules || []);
    rules.push(...list);
  }
  return rules;
}

function buildRuleIndex(rules) {
  const byAspect    = new Map(); // "Moon trine Pluto" → rule
  const byHouse     = new Map(); // "Sun 10" → rule
  const bySign      = new Map(); // "Sun Gemini" → rule
  const byRulerId   = new Map(); // "rule-instance.western.ruler-of-1st-in-9th" → rule
  const byVedic     = new Map(); // "Sun:Mesha" → rule
  const byBirthday  = new Map(); // "5:15" → rule (month:day)
  const byKabbalah  = new Map(); // "Sun:Aries" → rule
  const byChinese   = new Map(); // "Rat" → rule
  const byNakshatra     = new Map(); // "Ashwini" → rule
  const byNakshatraPada = new Map(); // "Ashwini:1" → rule
  const byLunarMansion  = new Map(); // "Ashwini" → lunar-mansion rule

  for (const rule of rules) {
    const f = rule.factor || {};
    if (f.planetA && f.aspect && f.planetB) {
      byAspect.set(`${f.planetA} ${f.aspect} ${f.planetB}`, rule);
    } else if (f.planet && f.house) {
      const hNum = typeof f.house === "string"
        ? parseInt(f.house, 10)
        : f.house;
      byHouse.set(`${f.planet} ${hNum}`, rule);
    } else if (f.planet && f.sign) {
      bySign.set(`${f.planet} ${f.sign}`, rule);
    } else if (f.rulerOfHouse && f.placedInHouse) {
      byRulerId.set(rule.id, rule);
    } else if (f.graha && f.rashi) {
      byVedic.set(`${f.graha}:${f.rashi}`, rule);
    } else if (f.month && f.day) {
      byBirthday.set(`${f.month}:${f.day}`, rule);
    } else if (f.kabbalahPlanet && f.sign) {
      byKabbalah.set(`${f.kabbalahPlanet}:${f.sign}`, rule);
    } else if (f.chineseAnimal) {
      byChinese.set(f.chineseAnimal, rule);
    } else if (f.nakshatra && f.pada) {
      byNakshatraPada.set(`${f.nakshatra}:${f.pada}`, rule);
    } else if (f.nakshatra && f.mansionNum) {
      byLunarMansion.set(f.nakshatra, rule);
    } else if (f.nakshatra) {
      byNakshatra.set(f.nakshatra, rule);
    }
  }
  return { byAspect, byHouse, bySign, byRulerId, byVedic, byBirthday, byKabbalah, byChinese, byNakshatra, byNakshatraPada, byLunarMansion };
}

function findRuleForFactor(factor, idx) {
  const q = factor.query || "";

  // Aspect: "Moon trine Pluto"
  const c = factor.calculated || {};
  if (c.bodyA && c.aspect && c.bodyB) {
    return idx.byAspect.get(`${c.bodyA} ${c.aspect} ${c.bodyB}`)
        || idx.byAspect.get(`${c.bodyB} ${c.aspect} ${c.bodyA}`);
  }
  // House: "Sun in 10th house"
  if (c.body && c.house) {
    return idx.byHouse.get(`${c.body} ${c.house}`);
  }
  // Sign: "Sun in Gemini"
  const signMatch = q.match(/^(\w+) in (\w+)$/);
  if (signMatch && !signMatch[0].includes("house")) {
    return idx.bySign.get(`${signMatch[1]} ${signMatch[2]}`);
  }
  // Ruler: "ruler-of-1st-in-9th"
  if (q.startsWith("ruler-of-")) {
    const id = `rule-instance.western.${q}`;
    return idx.byRulerId.get(id);
  }
  // Vedic: "vedic:Sun:Mesha"
  if (q.startsWith("vedic:") && c.graha && c.rashi) {
    return idx.byVedic.get(`${c.graha}:${c.rashi}`);
  }
  // Kabbalah: "kabbalah:Sun:Aries"
  if (q.startsWith("kabbalah:") && c.kabbalahPlanet && c.sign) {
    return idx.byKabbalah.get(`${c.kabbalahPlanet}:${c.sign}`);
  }
  // Chinese zodiac: "chinese:Rat"
  if (q.startsWith("chinese:") && c.chineseAnimal) {
    return idx.byChinese.get(c.chineseAnimal);
  }
  // Nakshatra-pada: "nakshatra-pada:Ashwini:1"
  if (q.startsWith("nakshatra-pada:") && c.nakshatra && c.pada) {
    return idx.byNakshatraPada.get(`${c.nakshatra}:${c.pada}`);
  }
  // Lunar mansion: "lunar-mansion:Ashwini"
  if (q.startsWith("lunar-mansion:") && c.nakshatra) {
    return idx.byLunarMansion.get(c.nakshatra);
  }
  // Nakshatra: "nakshatra:Ashwini"
  if (q.startsWith("nakshatra:") && c.nakshatra) {
    return idx.byNakshatra.get(c.nakshatra);
  }
  return null;
}

// Significance scoring — higher = show first
const PLANET_WEIGHT = {
  Sun: 3.0, Moon: 3.0, Mercury: 2.0, Venus: 2.0, Mars: 2.0,
  Jupiter: 1.5, Saturn: 1.5, Uranus: 1.0, Neptune: 1.0, Pluto: 1.0,
};
const ANGULAR_HOUSES  = new Set([1, 4, 7, 10]);
const SUCCEDENT_HOUSES = new Set([2, 5, 8, 11]);
const ASPECT_WEIGHT = { conjunction: 1.4, opposition: 1.3, square: 1.2, trine: 1.1, sextile: 1.0 };
const DIGNITY_BONUS = { exalted: 0.8, "own sign": 0.5, friendly: 0.2, neutral: 0, inimical: -0.1, debilitated: -0.2 };

function scoreFactors(factor) {
  const c = factor.calculated || {};
  const rule = factor.rule || {};
  let score = 1.0;

  if (c.bodyA && c.aspect) {
    // aspect rule — tighter orb = stronger. A partile (orb 0) must score highest.
    const pa = PLANET_WEIGHT[c.bodyA] || 1;
    const pb = PLANET_WEIGHT[c.bodyB] || 1;
    const aw = ASPECT_WEIGHT[c.aspect] || 1;
    const orbPenalty = c.orb != null ? Math.max(0, 1 - c.orb / 10) : 0.8;
    score = (pa + pb) / 2 * aw * (0.7 + 0.3 * orbPenalty) + 2.0;
  } else if (c.body && c.house) {
    // house rule
    const pw = PLANET_WEIGHT[c.body] || 1;
    const hw = ANGULAR_HOUSES.has(c.house) ? 1.5 : SUCCEDENT_HOUSES.has(c.house) ? 1.2 : 1.0;
    score = pw * hw + 1.5;
  } else if (c.body && !c.graha) {
    // western sign rule
    const pw = PLANET_WEIGHT[c.body] || 1;
    score = pw + 1.0;
  } else if (c.graha) {
    // vedic rashi rule
    const pw = PLANET_WEIGHT[c.graha] || 1;
    const dignity = rule.dignity?.status || "neutral";
    const db = DIGNITY_BONUS[dignity] || 0;
    score = pw * 1.2 + db + 1.5;
  } else {
    // ruler-pipeline
    score = 1.2;
  }
  return score;
}

function mergeRules(profile, idx) {
  const factors = Array.isArray(profile.factors) ? profile.factors : [];
  return factors
    .map(factor => {
      const rule = findRuleForFactor(factor, idx);
      return { ...factor, rule: rule || null };
    })
    .filter(f => f.rule)
    .map(f => ({ ...f, significance: scoreFactors(f) }))
    .sort((a, b) => b.significance - a.significance);
}

// Load compatibility data
const compatData = (() => {
  const raw = JSON.parse(fs.readFileSync(path.join(rulesDir, "compatibility-rules.json"), "utf8"));
  const pairMap = new Map();
  for (const pair of raw.pairs) {
    const key = [pair.periodA, pair.periodB].sort().join("::");
    pairMap.set(key, pair);
  }
  return { periods: raw.periods, pairMap };
})();

function dateToPeriod(dateStr) {
  // dateStr: "YYYY-MM-DD"
  const parts = dateStr.split("-");
  const month = parseInt(parts[1], 10);
  const day   = parseInt(parts[2], 10);
  for (const p of compatData.periods) {
    const [sm, sd] = p.start;
    const [em, ed] = p.end;
    // Periods always span at most two adjacent months (e.g. Dec 26 – Jan 2 or
    // Mar 1 – Apr 5), so matching the two boundary months is sufficient.
    if (sm === em) {
      if (month === sm && day >= sd && day <= ed) return p;
    } else if ((month === sm && day >= sd) || (month === em && day <= ed)) {
      return p;
    }
  }
  return null;
}

// Load places
const places = (() => {
  const raw = JSON.parse(fs.readFileSync(path.join(projectRoot, "data", "places.json"), "utf8"));
  return Object.values(raw);
})();

// Load rules once at startup
const allRules = loadAllRules();
const ruleIndex = buildRuleIndex(allRules);
console.log(`Loaded ${allRules.length} rules`);

// ── Validation helpers ─────────────────────────────────────────────────────────
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

function isValidDate(s) {
  if (typeof s !== "string" || !DATE_RE.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}
function isValidTime(s) {
  if (typeof s !== "string" || !TIME_RE.test(s)) return false;
  const [h, mi] = s.split(":").map(Number);
  return h >= 0 && h <= 23 && mi >= 0 && mi <= 59;
}

// Log unexpected errors server-side; never leak internals to the client.
function serverError(res, e, where) {
  console.error(`[${where}]`, e && e.stack ? e.stack : e);
  res.status(500).json({ error: "Внутренняя ошибка сервера." });
}

const app  = express();
const PORT = process.env.PORT || 4000;

// Behind Render's reverse proxy, req.ip is the proxy's address unless we trust
// the first hop — required for per-IP rate limiting to work correctly.
app.set("trust proxy", 1);

// Security headers (manual — avoids a helmet dependency for this small app)
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src https://fonts.gstatic.com; " +
    "img-src 'self' data:; " +
    "connect-src 'self'");
  next();
});

app.use(express.json({ limit: "64kb" }));
app.use(express.static(publicDir));

app.get("/api/places", (_req, res) => {
  res.json(places.map(p => ({ key: p.key, name: p.name })));
});

app.post("/api/profile", rateLimit, (req, res) => {
  try {
    const { localDate, localTime, placeKey, name } = req.body || {};
    if (!isValidDate(localDate)) return res.status(400).json({ error: "Некорректная дата рождения." });
    if (localTime != null && localTime !== "" && !isValidTime(localTime)) {
      return res.status(400).json({ error: "Некорректное время рождения." });
    }
    const place = places.find(p => p.key === placeKey);
    if (!place) return res.status(400).json({ error: "Неизвестное место рождения." });

    const profile = calculateProfile({
      localDate,
      localTime: localTime || "12:00",
      timeZone: place.timeZone,
      latitude: place.latitude,
      longitude: place.longitude,
      name: typeof name === "string" ? name.slice(0, 100) : "",
      houseSystem: "equal-from-ascendant",
      mode: "both",
      language: "ru",
    });

    const matchedRules = mergeRules(profile, ruleIndex);
    res.json({ ...profile, matchedRules });
  } catch (e) {
    serverError(res, e, "profile");
  }
});

app.post("/api/transits", rateLimit, (req, res) => {
  try {
    const { localDate, localTime, placeKey, transitDate } = req.body || {};
    if (!isValidDate(localDate)) return res.status(400).json({ error: "Некорректная дата рождения." });
    if (localTime != null && localTime !== "" && !isValidTime(localTime)) {
      return res.status(400).json({ error: "Некорректное время рождения." });
    }
    if (transitDate != null && transitDate !== "" && !isValidDate(transitDate)) {
      return res.status(400).json({ error: "Некорректная дата транзита." });
    }
    const place = places.find(p => p.key === placeKey);
    if (!place) return res.status(400).json({ error: "Неизвестное место рождения." });

    const tDate = transitDate || new Date().toISOString().slice(0, 10);
    const profile = runTransits({
      localDate,
      localTime: localTime || "12:00",
      timeZone: place.timeZone,
      latitude: place.latitude,
      longitude: place.longitude,
      transitDate: tDate,
      language: "ru",
      houseSystem: "equal-from-ascendant",
    });
    res.json(profile);
  } catch (e) {
    serverError(res, e, "transits");
  }
});

app.get("/api/birthday/:month/:day", rateLimit, (req, res) => {
  try {
    const month = parseInt(req.params.month, 10);
    const day   = parseInt(req.params.day,   10);
    if (!month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
      return res.status(400).json({ error: "Invalid month or day" });
    }
    const rule = ruleIndex.byBirthday.get(`${month}:${day}`);
    if (!rule) return res.status(404).json({ error: "No birthday rule found for this date" });
    res.json({ month, day, rule });
  } catch (e) {
    serverError(res, e, "birthday");
  }
});

app.post("/api/compatibility", rateLimit, (req, res) => {
  try {
    const { dateA, dateB } = req.body || {};
    if (!isValidDate(dateA) || !isValidDate(dateB)) {
      return res.status(400).json({ error: "Некорректные даты рождения." });
    }

    const periodA = dateToPeriod(dateA);
    const periodB = dateToPeriod(dateB);
    if (!periodA) return res.status(400).json({ error: `Не удалось определить период для даты: ${dateA}` });
    if (!periodB) return res.status(400).json({ error: `Не удалось определить период для даты: ${dateB}` });

    const key = [periodA.id, periodB.id].sort().join("::");
    const pair = compatData.pairMap.get(key);

    res.json({
      personA: { date: dateA, periodId: periodA.id, periodName: periodA.ruShort, weekName: periodA.ruWeek },
      personB: { date: dateB, periodId: periodB.id, periodName: periodB.ruShort, weekName: periodB.ruWeek },
      pair: pair || null,
      samePeriod: periodA.id === periodB.id,
    });
  } catch (e) {
    serverError(res, e, "compatibility");
  }
});

// ── Rate limiting ────────────────────────────────────────────────────────────
// In-memory sliding-window limiter per client IP. Sweeps stale IPs on an
// interval so long-running processes don't accumulate one entry per visitor
// ever seen.
function createRateLimiter(windowMs, maxPerWindow) {
  const hits = new Map(); // ip → [timestamps]
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of hits) {
      if (!timestamps.some(t => now - t < windowMs)) hits.delete(ip);
    }
  }, windowMs);
  sweep.unref?.();

  return function isLimited(ip) {
    const now = Date.now();
    const recent = (hits.get(ip) || []).filter(t => now - t < windowMs);
    if (recent.length >= maxPerWindow) {
      hits.set(ip, recent);
      return true;
    }
    recent.push(now);
    hits.set(ip, recent);
    return false;
  };
}

// Calculation endpoints (profile/transits/birthday/compatibility) run
// non-trivial CPU work (ascendant search is O(360) trig + bisection per call).
const apiRateLimited = createRateLimiter(60 * 1000, 30);
function rateLimit(req, res, next) {
  if (apiRateLimited(req.ip)) {
    return res.status(429).json({ error: "Слишком много запросов. Попробуйте через минуту." });
  }
  next();
}

// ── AI Chat endpoint ─────────────────────────────────────────────────────────
const CHAT_WINDOW_MS = 10 * 60 * 1000;
const CHAT_MAX_PER_WINDOW = 20;
const chatRateLimited = createRateLimiter(CHAT_WINDOW_MS, CHAT_MAX_PER_WINDOW);

const CHAT_VALID_ROLES = new Set(["user", "assistant"]);
const MAX_MESSAGE_LEN = 1000;
const MAX_CONTEXT_LEN = 8000;

app.post("/api/chat", async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!OpenAI || !apiKey) {
    return res.status(503).json({ error: "AI чат не настроен. Добавьте OPENAI_API_KEY в переменные среды сервера." });
  }

  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  if (chatRateLimited(ip)) {
    return res.status(429).json({ error: "Слишком много запросов. Попробуйте позже." });
  }

  const body = req.body || {};
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return res.status(400).json({ error: "Пустое сообщение" });
  if (message.length > MAX_MESSAGE_LEN) {
    return res.status(400).json({ error: "Сообщение слишком длинное." });
  }

  const chartContext = typeof body.chartContext === "string"
    ? body.chartContext.slice(0, MAX_CONTEXT_LEN)
    : "";

  // Sanitize history: only user/assistant roles, string content, capped length.
  const history = (Array.isArray(body.history) ? body.history : [])
    .filter(m => m && CHAT_VALID_ROLES.has(m.role) && typeof m.content === "string")
    .slice(-6)
    .map(m => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_LEN) }));

  const systemPrompt = `Ты — профессиональный астролог-психолог. Ты отвечаешь на вопросы человека, опираясь исключительно на его натальную карту и астрологические данные. Говори простым, тёплым, доступным языком — без жаргона. Давай конкретные, практически полезные ответы.

${chartContext || "Данные карты не предоставлены."}

Правила:
- Отвечай на русском языке
- Ссылайся на конкретные планеты и позиции из карты
- Не выходи за рамки астрологической интерпретации
- Если вопрос не связан с астрологией — мягко перенаправь к теме карты
- Ответы: 3–6 предложений, ёмко и по делу`;

  try {
    const client = new OpenAI({ apiKey });
    const messages = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: message },
    ];
    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 600,
      messages,
    });
    res.json({ reply: resp.choices[0].message.content });
  } catch (e) {
    console.error("[chat]", e && e.stack ? e.stack : e);
    res.status(502).json({ error: "Сервис ИИ временно недоступен. Попробуйте позже." });
  }
});

app.listen(PORT, () => {
  console.log(`Codex Goroskop: http://localhost:${PORT}`);
});
