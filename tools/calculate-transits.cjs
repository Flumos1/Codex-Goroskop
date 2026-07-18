/**
 * Transit calculator: finds current (or specified-date) transits to a natal chart.
 *
 * Usage:
 *   npm run transits -- --datetime 1990-06-15T12:00:00Z [birth] --transit-date 2026-06-08 [optional]
 *   npm run transits -- --local-date 1990-06-15 --local-time 12:00 --place-key moscow-ru
 *
 * Outputs JSON with active transits and their interpretive rules.
 */
"use strict";
const fs   = require("fs");
const path = require("path");

const chartModule = require("./calculate-chart.cjs");
const {
  calculatePositions, angularDistance, normalizeDegrees,
  resolveInput, parseArgs, aspectDefinitions,
  lahiriAyanamsha, siderealLongitude, calculateProfile,
} = chartModule;

const projectRoot = path.resolve(__dirname, "..");
const rulesDir    = path.join(projectRoot, "generator", "rules");
const placesPath  = path.join(projectRoot, "data", "places.json");

// Load transit rules (slow planets + fast planets merged)
function loadTransitRules() {
  const slow = path.join(rulesDir, "psychological-transit-rules.json");
  const fast = path.join(rulesDir, "psychological-fast-transit-rules.json");
  const rules = JSON.parse(fs.readFileSync(slow, "utf8"));
  if (fs.existsSync(fast)) {
    rules.push(...JSON.parse(fs.readFileSync(fast, "utf8")));
  }
  return rules;
}

// Build lookup: "Jupiter conjunction Sun" → rule
function buildTransitIndex(rules) {
  const idx = new Map();
  for (const r of rules) {
    const { transitPlanet, aspect, natalPoint } = r.factor;
    idx.set(`${transitPlanet} ${aspect} ${natalPoint}`, r);
  }
  return idx;
}

function parseTransitArgs(argv) {
  const args = parseArgs(argv);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--transit-date") args.transitDate = argv[++i];
    if (argv[i] === "--transit-datetime") args.transitDatetime = argv[++i];
    if (argv[i] === "--orb") args.customOrb = Number(argv[++i]);
    if (argv[i] === "--language") args.language = argv[++i];
  }
  return args;
}

function resolveTransitDate(args) {
  if (args.transitDatetime) return new Date(args.transitDatetime);
  if (args.transitDate)     return new Date(args.transitDate + "T12:00:00Z");
  return new Date(); // today
}

// Natal points we track (all 10 planets come from calculatePositions automatically)
// Angles (ASC, MC) are added separately from the natal profile when coordinates are available.
const ASC_POINT = "ASC";
const MC_POINT  = "MC";

// Orbs per transit planet
function defaultOrb(planet) {
  const tight    = { Neptune: 1, Pluto: 1 };
  const standard = { Jupiter: 2, Saturn: 2, Uranus: 2, Mars: 1, Sun: 1 };
  const fast     = { Moon: 1, Mercury: 1, Venus: 1 };
  return (tight[planet] ?? standard[planet] ?? fast[planet] ?? 2);
}

function findActiveTransits(natalPositions, transitPositions, nextTransitMap, natalAscendant, natalMidheaven, transitIndex, customOrb) {
  const active = [];

  // Prepare natal points map (all 10 planets + angles when available)
  const natalMap = {};
  for (const p of natalPositions) {
    natalMap[p.body] = p.tropicalLongitude;
  }
  if (natalAscendant)  natalMap[ASC_POINT] = natalAscendant.longitude;
  if (natalMidheaven)  natalMap[MC_POINT]  = natalMidheaven.longitude;

  for (const tPos of transitPositions) {
    const tPlanet = tPos.body;
    const tLon    = tPos.tropicalLongitude;

    for (const [natalName, natalLon] of Object.entries(natalMap)) {
      for (const aspDef of aspectDefinitions) {
        const distance = angularDistance(tLon, natalLon);
        const delta    = Math.abs(distance - aspDef.angle);
        const orb      = customOrb ?? defaultOrb(tPlanet);
        if (delta > orb) continue;

        const key = `${tPlanet} ${aspDef.name} ${natalName}`;
        const rule = transitIndex.get(key);
        if (!rule) continue;

        // Applying vs separating: compare the orb now against the orb one day
        // later using the planet's actual next-day position. This works for any
        // aspect angle and correctly handles retrograde motion.
        let phase;
        if (delta < 0.5) {
          phase = "exact";
        } else if (nextTransitMap && nextTransitMap[tPlanet] != null) {
          const deltaNext = Math.abs(angularDistance(nextTransitMap[tPlanet], natalLon) - aspDef.angle);
          phase = deltaNext < delta ? "applying" : "separating";
        } else {
          phase = "applying";
        }

        active.push({
          transitPlanet: tPlanet,
          aspect: aspDef.name,
          natalPoint: natalName,
          orbActual: Number(delta.toFixed(3)),
          orbAllowed: orb,
          phase,
          transitLongitude: tLon,
          natalLongitude: Number(natalLon),
          transitSign: tPos.sign,
          query: key,
          rule,
        });
      }
    }
  }

  // Sort: exact first, then by orb
  active.sort((a, b) => a.orbActual - b.orbActual);
  return active;
}

function buildTransitProfile(args, natalProfile, transitPositions, activeTransits, transitDate) {
  const lang = args.language || "ru";
  return {
    title: "Transit Profile",
    mode: "transit",
    language: lang,
    subject: { nickname: args.name || "Unknown" },
    birthData: natalProfile.birthData,
    transitData: {
      date: transitDate.toISOString().slice(0, 10),
      datetime: transitDate.toISOString(),
      transitPositions: transitPositions.map(p => ({
        body: p.body,
        tropicalLongitude: p.tropicalLongitude,
        sign: p.sign,
        degreeInSign: p.degreeInSign,
      })),
    },
    activeTransits: activeTransits.map(t => ({
      query: t.query,
      phase: t.phase,
      orbActual: t.orbActual,
      calculated: {
        transitPlanet: t.transitPlanet,
        aspect: t.aspect,
        natalPoint: t.natalPoint,
        transitSign: t.transitSign,
        natalLongitude: t.natalLongitude,
      },
      rule: {
        id: t.rule.id,
        timing: t.rule.timing,
        themes: t.rule.themes,
        simple: lang === "ru" ? t.rule.simpleRu : t.rule.simple,
        advanced: lang === "ru" ? t.rule.advancedRu : t.rule.advanced,
      },
    })),
    summary: {
      totalActiveTransits: activeTransits.length,
      exactTransits: activeTransits.filter(t => t.phase === "exact").length,
      applyingTransits: activeTransits.filter(t => t.phase === "applying").length,
    },
    context: lang === "ru"
      ? "Транзитный профиль. Показаны все активные транзиты в пределах допустимых орбов на указанную дату."
      : "Transit profile. All active transits within allowed orbs for the specified date.",
  };
}

// Transit rule index is static; build it once and reuse across calls.
let _transitIndex = null;
function getTransitIndex() {
  if (!_transitIndex) _transitIndex = buildTransitIndex(loadTransitRules());
  return _transitIndex;
}

// Host-injected transit rules for runtimes without a filesystem
// (Cloudflare Workers): pre-builds the index so loadTransitRules is never hit.
function setTransitRules(rules) {
  _transitIndex = buildTransitIndex(rules);
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Compute a transit profile in-process. Accepts the same args shape as the
 * chart calculator (localDate/localTime/timeZone/latitude/longitude or datetime)
 * plus transitDate/transitDatetime, customOrb, language, name.
 * Throws on invalid input; never calls process.exit.
 */
function runTransits(args) {
  const birthDate = resolveInput(args);
  if (Number.isNaN(birthDate.getTime())) {
    throw new Error("Invalid birth date.");
  }

  const transitDate = resolveTransitDate(args);

  const natalPositions = calculatePositions(birthDate);

  // Resolve natal ASC and MC if we have coordinates
  let natalAscendant  = null;
  let natalMidheaven  = null;
  if (Number.isFinite(args.latitude) && Number.isFinite(args.longitude)) {
    try {
      const natalProfile = calculateProfile(args);
      natalAscendant = natalProfile.calculation.angles.ascendant;
      natalMidheaven = natalProfile.calculation.angles.midheaven;
    } catch {}
  }

  // Transit positions on the date, plus one day later for applying/separating.
  const transitPositions = calculatePositions(transitDate);
  const nextPositions     = calculatePositions(new Date(transitDate.getTime() + DAY_MS));
  const nextTransitMap = {};
  for (const p of nextPositions) nextTransitMap[p.body] = p.tropicalLongitude;

  const activeTransits = findActiveTransits(
    natalPositions, transitPositions, nextTransitMap,
    natalAscendant, natalMidheaven, getTransitIndex(), args.customOrb
  );

  return buildTransitProfile(
    args,
    { birthData: { datetimeUtc: birthDate.toISOString() } },
    transitPositions,
    activeTransits,
    transitDate
  );
}

function main() {
  const argv = process.argv.slice(2);
  const args = parseTransitArgs(argv);

  let profile;
  try {
    profile = runTransits(args);
  } catch (e) {
    console.error("Transit error:", e.message);
    process.exit(1);
  }

  const output = JSON.stringify(profile, null, 2);

  if (args.out) {
    const outDir  = path.join(projectRoot, "generator", "profiles");
    const outPath = path.isAbsolute(args.out) ? args.out : path.join(outDir, args.out);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, output, "utf8");
    console.log(`Transit profile written: ${outPath}`);
  } else {
    console.log(output);
  }
}

if (require.main === module) main();

module.exports = { runTransits, loadTransitRules, buildTransitIndex, findActiveTransits, defaultOrb, setTransitRules };
