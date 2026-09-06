const fs = require("fs");
const http = require("http");
const path = require("path");
const { calculateChart } = require("../lib/astro.cjs");
const { calculateDispositor } = require("../lib/dispositor.cjs");
const { generateReport } = require("../lib/report.cjs");
const { deepRepairMojibake } = require("../lib/text.cjs");
const { calculateVedic } = require("../lib/vedic.cjs");
const { calculateCompatibility } = require("../lib/compatibility.cjs");
const { calculateJewish } = require("../lib/jewish.cjs");
const { calculateRhythms } = require("../lib/rhythms.cjs");
const { calculatePalmistry } = require("../lib/palmistry.cjs");
const { calculateNumerology } = require("../lib/numerology.cjs");
const { answerAiChat } = require("../lib/ai-chat.cjs");
const { calculateTransits } = require("../lib/transits.cjs");
const { birthdayRule, periodCompatibility } = require("../lib/rule-index.cjs");

const projectRoot = path.resolve(__dirname, "..");
const publicDir = path.join(__dirname, "public");
const placesPath = path.join(projectRoot, "data", "places.json");
const portArgIndex = process.argv.indexOf("--port");
const port = Number(portArgIndex >= 0 ? process.argv[portArgIndex + 1] : (process.env.PORT || 4173));
const host = process.env.HOST || "0.0.0.0";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(body);
}

function sendJson(res, status, payload) {
  send(res, status, JSON.stringify(payload, null, 2));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body is too large."));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error("Invalid JSON body."));
      }
    });
  });
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = path.resolve(publicDir, `.${pathname}`);

  if (!filePath.startsWith(publicDir)) {
    send(res, 403, "Forbidden", "text/plain; charset=utf-8");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      send(res, 404, "Not found", "text/plain; charset=utf-8");
      return;
    }
    send(res, 200, content, contentTypes[path.extname(filePath)] || "application/octet-stream");
  });
}

async function handleApi(req, res) {
  try {
    if (req.method === "GET" && req.url.startsWith("/api/places")) {
      sendJson(res, 200, deepRepairMojibake(JSON.parse(fs.readFileSync(placesPath, "utf8"))));
      return;
    }

    if (req.method !== "POST") {
      sendJson(res, 405, { error: "Method not allowed." });
      return;
    }

    const input = await readBody(req);

    if (req.url === "/api/chart") {
      const profile = calculateChart(input);
      const dispositor = calculateDispositor(profile, { rulerSet: input.rulerSet || "traditional" });
      const report = generateReport(profile, input.mode || profile.mode || "both");
      sendJson(res, 200, { profile, dispositor, report });
      return;
    }

    if (req.url === "/api/report") {
      const profile = input.profile || calculateChart(input);
      sendJson(res, 200, { report: generateReport(profile, input.mode || "both") });
      return;
    }

    if (req.url === "/api/dispositor") {
      const profile = input.profile || calculateChart(input);
      sendJson(res, 200, { dispositor: calculateDispositor(profile, { rulerSet: input.rulerSet || "traditional" }) });
      return;
    }

    if (req.url === "/api/vedic") {
      sendJson(res, 200, { vedic: calculateVedic(input) });
      return;
    }

    if (req.url === "/api/compatibility") {
      sendJson(res, 200, { compatibility: calculateCompatibility(input) });
      return;
    }

    if (req.url === "/api/jewish") {
      sendJson(res, 200, { jewish: calculateJewish(input) });
      return;
    }

    if (req.url === "/api/rhythms") {
      sendJson(res, 200, { rhythms: calculateRhythms(input) });
      return;
    }

    if (req.url === "/api/palmistry") {
      sendJson(res, 200, { palmistry: calculatePalmistry(input) });
      return;
    }

    if (req.url === "/api/numerology") {
      sendJson(res, 200, { numerology: calculateNumerology(input) });
      return;
    }

    if (req.url === "/api/transits") {
      sendJson(res, 200, { transits: calculateTransits(input) });
      return;
    }

    // Goldschneider day-of-birth portrait. Accepts either an explicit
    // month/day pair or the localDate the other endpoints already take.
    if (req.url === "/api/birthday") {
      let { month, day } = input;
      if ((!month || !day) && typeof input.localDate === "string") {
        const parts = input.localDate.split("-");
        month = Number(parts[1]);
        day = Number(parts[2]);
      }
      month = Number(month);
      day = Number(day);
      if (!month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
        sendJson(res, 400, { error: "Некорректные месяц или день." });
        return;
      }
      const rule = birthdayRule(month, day);
      if (!rule) {
        sendJson(res, 404, { error: "Для этой даты нет портрета дня рождения." });
        return;
      }
      sendJson(res, 200, { birthday: { month, day, rule } });
      return;
    }

    // Goldschneider period-pair compatibility — distinct from the synastry
    // model behind /api/compatibility, which compares full charts.
    if (req.url === "/api/goldschneider") {
      sendJson(res, 200, { goldschneider: periodCompatibility(input.dateA, input.dateB) });
      return;
    }

    if (req.url === "/api/ai-chat") {
      sendJson(res, 200, await answerAiChat(input));
      return;
    }

    sendJson(res, 404, { error: "Unknown API endpoint." });
  } catch (error) {
    sendJson(res, 400, { error: error.message });
  }
}

function handler(req, res) {
  if (req.url.startsWith("/api/")) {
    handleApi(req, res);
    return;
  }
  serveStatic(req, res);
}

if (require.main === module) {
  const server = http.createServer(handler);
  server.listen(port, host, () => {
    console.log(`Codex Goroskop site: http://${host}:${port}`);
  });
}

module.exports = handler;
