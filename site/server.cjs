"use strict";
const express    = require("express");
const path       = require("path");
const fs         = require("fs");
const { spawnSync } = require("child_process");

const { calculateProfile } = require("../tools/calculate-chart.cjs");

const projectRoot = path.resolve(__dirname, "..");
const rulesDir    = path.join(projectRoot, "generator", "rules");

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
  const byAspect  = new Map(); // "Moon trine Pluto" → rule
  const byHouse   = new Map(); // "Sun 10" → rule
  const bySign    = new Map(); // "Sun Gemini" → rule
  const byRulerId = new Map(); // "rule-instance.western.ruler-of-1st-in-9th" → rule
  const byVedic   = new Map(); // "Sun:Mesha" → rule

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
    }
  }
  return { byAspect, byHouse, bySign, byRulerId, byVedic };
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
  return null;
}

function mergeRules(profile, idx) {
  const factors = Array.isArray(profile.factors) ? profile.factors : [];
  return factors.map(factor => {
    const rule = findRuleForFactor(factor, idx);
    return { ...factor, rule: rule || null };
  }).filter(f => f.rule); // only return factors with a matched rule
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

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(express.static(__dirname));

app.get("/api/places", (_req, res) => {
  res.json(places.map(p => ({ key: p.key, name: p.name })));
});

app.post("/api/profile", (req, res) => {
  try {
    const { localDate, localTime, placeKey, name } = req.body;
    const place = places.find(p => p.key === placeKey);
    if (!place) return res.status(400).json({ error: `Unknown place key: ${placeKey}` });

    const profile = calculateProfile({
      localDate,
      localTime: localTime || "12:00",
      timeZone: place.timeZone,
      latitude: place.latitude,
      longitude: place.longitude,
      name: name || "",
      houseSystem: "equal-from-ascendant",
      mode: "both",
      language: "ru",
    });

    // Merge rule texts into factors
    const matchedRules = mergeRules(profile, ruleIndex);
    res.json({ ...profile, matchedRules });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/transits", (req, res) => {
  try {
    const { localDate, localTime, placeKey, transitDate } = req.body;
    const place = places.find(p => p.key === placeKey);
    if (!place) return res.status(400).json({ error: `Unknown place key: ${placeKey}` });

    const tDate = transitDate || new Date().toISOString().slice(0, 10);
    const result = spawnSync(process.execPath, [
      path.resolve(__dirname, "../tools/calculate-transits.cjs"),
      "--local-date", localDate,
      "--local-time", localTime || "12:00",
      "--timezone", place.timeZone,
      "--latitude", String(place.latitude),
      "--longitude", String(place.longitude),
      "--transit-date", tDate,
      "--language", "ru",
    ], { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });

    if (result.status !== 0) {
      return res.status(500).json({ error: result.stderr || "Transit calculation failed" });
    }
    res.json(JSON.parse(result.stdout));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Codex Goroskop: http://localhost:${PORT}`);
});
