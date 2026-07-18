/**
 * Cloudflare Workers port of site/server.cjs.
 *
 * Same endpoints, validation, rate limits, and security headers as the
 * Express server. Differences forced by the runtime:
 *   - rule/data JSON lives in static assets (dist/_data/*), fetched through
 *     the ASSETS binding and cached per isolate — Workers have no filesystem
 *     and bundling 11MB of JSON would blow the script-size limit;
 *   - OpenAI is called with plain fetch (no SDK);
 *   - the rate limiter is per-isolate (best effort) — set a Cloudflare WAF
 *     rate rule for a hard guarantee.
 */
import chart from "../../tools/calculate-chart.cjs";
import transits from "../../tools/calculate-transits.cjs";

const { calculateProfile, registerAvailableRules, setPlaces } = chart;
const { runTransits, setTransitRules } = transits;

// ── Data loading (lazy, cached per isolate) ──────────────────────────────────
async function fetchData(env, name) {
  const resp = await env.ASSETS.fetch(`https://assets.local/_data/${name}`);
  if (!resp.ok) throw new Error(`asset ${name}: HTTP ${resp.status}`);
  return resp.json();
}

let placesPromise = null;
function getPlaces(env) {
  if (!placesPromise) {
    placesPromise = fetchData(env, "places.json").then(places => {
      setPlaces(places);
      return places;
    }).catch(e => { placesPromise = null; throw e; });
  }
  return placesPromise;
}

let rulesPromise = null;
function getRuleIndex(env) {
  if (!rulesPromise) {
    rulesPromise = fetchData(env, "rules-all.json").then(rules => {
      registerAvailableRules([rules]);
      return buildRuleIndex(rules);
    }).catch(e => { rulesPromise = null; throw e; });
  }
  return rulesPromise;
}

let transitRulesPromise = null;
function ensureTransitRules(env) {
  if (!transitRulesPromise) {
    transitRulesPromise = fetchData(env, "transit-rules.json").then(rules => {
      setTransitRules(rules);
      return true;
    }).catch(e => { transitRulesPromise = null; throw e; });
  }
  return transitRulesPromise;
}

let compatPromise = null;
function getCompatData(env) {
  if (!compatPromise) {
    compatPromise = fetchData(env, "compatibility.json").then(raw => {
      const pairMap = new Map();
      for (const pair of raw.pairs) {
        const key = [pair.periodA, pair.periodB].sort().join("::");
        pairMap.set(key, pair);
      }
      return { periods: raw.periods, pairMap };
    }).catch(e => { compatPromise = null; throw e; });
  }
  return compatPromise;
}

// ── Rule index + matching (ported verbatim from server.cjs) ──────────────────
function buildRuleIndex(rules) {
  const byAspect = new Map();
  const byHouse = new Map();
  const bySign = new Map();
  const byRulerId = new Map();
  const byVedic = new Map();
  const byBirthday = new Map();
  const byKabbalah = new Map();
  const byChinese = new Map();
  const byNakshatra = new Map();
  const byNakshatraPada = new Map();
  const byLunarMansion = new Map();

  for (const rule of rules) {
    const f = rule.factor || {};
    if (f.planetA && f.aspect && f.planetB) {
      byAspect.set(`${f.planetA} ${f.aspect} ${f.planetB}`, rule);
    } else if (f.planet && f.house) {
      const hNum = typeof f.house === "string" ? parseInt(f.house, 10) : f.house;
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
  const c = factor.calculated || {};
  if (c.bodyA && c.aspect && c.bodyB) {
    return idx.byAspect.get(`${c.bodyA} ${c.aspect} ${c.bodyB}`)
        || idx.byAspect.get(`${c.bodyB} ${c.aspect} ${c.bodyA}`);
  }
  if (c.body && c.house) {
    return idx.byHouse.get(`${c.body} ${c.house}`);
  }
  const signMatch = q.match(/^(\w+) in (\w+)$/);
  if (signMatch && !signMatch[0].includes("house")) {
    return idx.bySign.get(`${signMatch[1]} ${signMatch[2]}`);
  }
  if (q.startsWith("ruler-of-")) {
    return idx.byRulerId.get(`rule-instance.western.${q}`);
  }
  if (q.startsWith("vedic:") && c.graha && c.rashi) {
    return idx.byVedic.get(`${c.graha}:${c.rashi}`);
  }
  if (q.startsWith("kabbalah:") && c.kabbalahPlanet && c.sign) {
    return idx.byKabbalah.get(`${c.kabbalahPlanet}:${c.sign}`);
  }
  if (q.startsWith("chinese:") && c.chineseAnimal) {
    return idx.byChinese.get(c.chineseAnimal);
  }
  if (q.startsWith("nakshatra-pada:") && c.nakshatra && c.pada) {
    return idx.byNakshatraPada.get(`${c.nakshatra}:${c.pada}`);
  }
  if (q.startsWith("lunar-mansion:") && c.nakshatra) {
    return idx.byLunarMansion.get(c.nakshatra);
  }
  if (q.startsWith("nakshatra:") && c.nakshatra) {
    return idx.byNakshatra.get(c.nakshatra);
  }
  return null;
}

const PLANET_WEIGHT = {
  Sun: 3.0, Moon: 3.0, Mercury: 2.0, Venus: 2.0, Mars: 2.0,
  Jupiter: 1.5, Saturn: 1.5, Uranus: 1.0, Neptune: 1.0, Pluto: 1.0,
};
const ANGULAR_HOUSES = new Set([1, 4, 7, 10]);
const SUCCEDENT_HOUSES = new Set([2, 5, 8, 11]);
const ASPECT_WEIGHT = { conjunction: 1.4, opposition: 1.3, square: 1.2, trine: 1.1, sextile: 1.0 };
const DIGNITY_BONUS = { exalted: 0.8, "own sign": 0.5, friendly: 0.2, neutral: 0, inimical: -0.1, debilitated: -0.2 };

function scoreFactors(factor) {
  const c = factor.calculated || {};
  const rule = factor.rule || {};
  let score = 1.0;
  if (c.bodyA && c.aspect) {
    const pa = PLANET_WEIGHT[c.bodyA] || 1;
    const pb = PLANET_WEIGHT[c.bodyB] || 1;
    const aw = ASPECT_WEIGHT[c.aspect] || 1;
    const orbPenalty = c.orb != null ? Math.max(0, 1 - c.orb / 10) : 0.8;
    score = (pa + pb) / 2 * aw * (0.7 + 0.3 * orbPenalty) + 2.0;
  } else if (c.body && c.house) {
    const pw = PLANET_WEIGHT[c.body] || 1;
    const hw = ANGULAR_HOUSES.has(c.house) ? 1.5 : SUCCEDENT_HOUSES.has(c.house) ? 1.2 : 1.0;
    score = pw * hw + 1.5;
  } else if (c.body && !c.graha) {
    const pw = PLANET_WEIGHT[c.body] || 1;
    score = pw + 1.0;
  } else if (c.graha) {
    const pw = PLANET_WEIGHT[c.graha] || 1;
    const dignity = rule.dignity?.status || "neutral";
    const db = DIGNITY_BONUS[dignity] || 0;
    score = pw * 1.2 + db + 1.5;
  } else {
    score = 1.2;
  }
  return score;
}

function mergeRules(profile, idx) {
  const factors = Array.isArray(profile.factors) ? profile.factors : [];
  return factors
    .map(factor => ({ ...factor, rule: findRuleForFactor(factor, idx) || null }))
    .filter(f => f.rule)
    .map(f => ({ ...f, significance: scoreFactors(f) }))
    .sort((a, b) => b.significance - a.significance);
}

function dateToPeriod(dateStr, periods) {
  const parts = dateStr.split("-");
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  for (const p of periods) {
    const [sm, sd] = p.start;
    const [em, ed] = p.end;
    if (sm === em) {
      if (month === sm && day >= sd && day <= ed) return p;
    } else if ((month === sm && day >= sd) || (month === em && day <= ed)) {
      return p;
    }
  }
  return null;
}

// ── Validation ───────────────────────────────────────────────────────────────
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

// ── Rate limiting ────────────────────────────────────────────────────────────
// Primary limiter is the account-scoped Rate Limiting binding (env.*_RATE_
// LIMITER), which holds across isolates. If the binding is missing (e.g. an
// older runtime or misconfig), fall back to a best-effort per-isolate window.
function createRateLimiter(windowMs, maxPerWindow) {
  const hits = new Map();
  let lastSweep = Date.now();
  return function isLimited(ip) {
    const now = Date.now();
    if (now - lastSweep > windowMs) {
      for (const [k, timestamps] of hits) {
        if (!timestamps.some(t => now - t < windowMs)) hits.delete(k);
      }
      lastSweep = now;
    }
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
const apiFallback = createRateLimiter(60 * 1000, 30);
const chatFallback = createRateLimiter(10 * 60 * 1000, 20);

async function isRateLimited(binding, fallback, key) {
  if (binding) {
    try {
      const { success } = await binding.limit({ key });
      return !success;
    } catch {
      /* binding failed — fall through to in-memory */
    }
  }
  return fallback(key);
}

// ── Responses ────────────────────────────────────────────────────────────────
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy":
    "default-src 'self'; " +
    "script-src 'self'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src https://fonts.gstatic.com; " +
    "img-src 'self' data:; " +
    "connect-src 'self'",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...SECURITY_HEADERS },
  });
}
const badRequest = msg => json({ error: msg }, 400);
const tooMany = msg => json({ error: msg }, 429);

function clientIp(request) {
  return request.headers.get("CF-Connecting-IP") || "unknown";
}

async function readJsonBody(request) {
  const text = await request.text();
  if (text.length > 64 * 1024) throw new Error("body too large");
  return text ? JSON.parse(text) : {};
}

// ── Endpoints ────────────────────────────────────────────────────────────────
async function handlePlaces(env) {
  const places = await getPlaces(env);
  return json(places.map(p => ({ key: p.key, name: p.name })));
}

async function handleProfile(request, env) {
  const { localDate, localTime, placeKey, name } = await readJsonBody(request);
  if (!isValidDate(localDate)) return badRequest("Некорректная дата рождения.");
  if (localTime != null && localTime !== "" && !isValidTime(localTime)) {
    return badRequest("Некорректное время рождения.");
  }
  const places = await getPlaces(env);
  const place = places.find(p => p.key === placeKey);
  if (!place) return badRequest("Неизвестное место рождения.");

  const ruleIndex = await getRuleIndex(env);
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
  return json({ ...profile, matchedRules: mergeRules(profile, ruleIndex) });
}

async function handleTransits(request, env) {
  const { localDate, localTime, placeKey, transitDate } = await readJsonBody(request);
  if (!isValidDate(localDate)) return badRequest("Некорректная дата рождения.");
  if (localTime != null && localTime !== "" && !isValidTime(localTime)) {
    return badRequest("Некорректное время рождения.");
  }
  if (transitDate != null && transitDate !== "" && !isValidDate(transitDate)) {
    return badRequest("Некорректная дата транзита.");
  }
  const places = await getPlaces(env);
  const place = places.find(p => p.key === placeKey);
  if (!place) return badRequest("Неизвестное место рождения.");

  await ensureTransitRules(env);
  const profile = runTransits({
    localDate,
    localTime: localTime || "12:00",
    timeZone: place.timeZone,
    latitude: place.latitude,
    longitude: place.longitude,
    transitDate: transitDate || new Date().toISOString().slice(0, 10),
    language: "ru",
    houseSystem: "equal-from-ascendant",
  });
  return json(profile);
}

async function handleBirthday(env, month, day) {
  const m = parseInt(month, 10);
  const d = parseInt(day, 10);
  if (!m || !d || m < 1 || m > 12 || d < 1 || d > 31) {
    return badRequest("Invalid month or day");
  }
  const ruleIndex = await getRuleIndex(env);
  const rule = ruleIndex.byBirthday.get(`${m}:${d}`);
  if (!rule) return json({ error: "No birthday rule found for this date" }, 404);
  return json({ month: m, day: d, rule });
}

async function handleCompatibility(request, env) {
  const { dateA, dateB } = await readJsonBody(request);
  if (!isValidDate(dateA) || !isValidDate(dateB)) {
    return badRequest("Некорректные даты рождения.");
  }
  const compat = await getCompatData(env);
  const periodA = dateToPeriod(dateA, compat.periods);
  const periodB = dateToPeriod(dateB, compat.periods);
  if (!periodA) return badRequest(`Не удалось определить период для даты: ${dateA}`);
  if (!periodB) return badRequest(`Не удалось определить период для даты: ${dateB}`);

  const key = [periodA.id, periodB.id].sort().join("::");
  return json({
    personA: { date: dateA, periodId: periodA.id, periodName: periodA.ruShort, weekName: periodA.ruWeek },
    personB: { date: dateB, periodId: periodB.id, periodName: periodB.ruShort, weekName: periodB.ruWeek },
    pair: compat.pairMap.get(key) || null,
    samePeriod: periodA.id === periodB.id,
  });
}

const CHAT_VALID_ROLES = new Set(["user", "assistant"]);
const MAX_MESSAGE_LEN = 1000;
const MAX_CONTEXT_LEN = 8000;

async function handleChat(request, env) {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    return json({ error: "AI чат не настроен. Добавьте OPENAI_API_KEY в секреты воркера." }, 503);
  }
  if (await isRateLimited(env.CHAT_RATE_LIMITER, chatFallback, clientIp(request))) {
    return tooMany("Слишком много запросов. Попробуйте позже.");
  }

  const body = await readJsonBody(request);
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return badRequest("Пустое сообщение");
  if (message.length > MAX_MESSAGE_LEN) return badRequest("Сообщение слишком длинное.");

  const chartContext = typeof body.chartContext === "string"
    ? body.chartContext.slice(0, MAX_CONTEXT_LEN)
    : "";

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
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 600,
        messages: [
          { role: "system", content: systemPrompt },
          ...history,
          { role: "user", content: message },
        ],
      }),
    });
    if (!resp.ok) throw new Error(`OpenAI HTTP ${resp.status}`);
    const data = await resp.json();
    return json({ reply: data.choices[0].message.content });
  } catch (e) {
    console.error("[chat]", e && e.stack ? e.stack : e);
    return json({ error: "Сервис ИИ временно недоступен. Попробуйте позже." }, 502);
  }
}

// ── Router ───────────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // Data bundles are for the Worker only — never serve them to clients.
    if (pathname.startsWith("/_data/")) {
      return json({ error: "Not found" }, 404);
    }

    try {
      if (pathname === "/api/places" && method === "GET") {
        return await handlePlaces(env);
      }

      if (pathname.startsWith("/api/") && pathname !== "/api/chat") {
        if (await isRateLimited(env.API_RATE_LIMITER, apiFallback, clientIp(request))) {
          return tooMany("Слишком много запросов. Попробуйте через минуту.");
        }
      }

      if (pathname === "/api/profile" && method === "POST") return await handleProfile(request, env);
      if (pathname === "/api/transits" && method === "POST") return await handleTransits(request, env);
      if (pathname === "/api/compatibility" && method === "POST") return await handleCompatibility(request, env);
      if (pathname === "/api/chat" && method === "POST") return await handleChat(request, env);

      const birthdayMatch = pathname.match(/^\/api\/birthday\/(\d{1,2})\/(\d{1,2})$/);
      if (birthdayMatch && method === "GET") {
        return await handleBirthday(env, birthdayMatch[1], birthdayMatch[2]);
      }

      if (pathname.startsWith("/api/")) {
        return json({ error: "Not found" }, 404);
      }

      // Everything else: static frontend, with security headers appended.
      const assetResp = await env.ASSETS.fetch(request);
      const headers = new Headers(assetResp.headers);
      for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers.set(k, v);
      return new Response(assetResp.body, { status: assetResp.status, headers });
    } catch (e) {
      if (e instanceof SyntaxError || (e && e.message === "body too large")) {
        return badRequest("Некорректный запрос.");
      }
      console.error("[worker]", e && e.stack ? e.stack : e);
      return json({ error: "Внутренняя ошибка сервера." }, 500);
    }
  },
};
