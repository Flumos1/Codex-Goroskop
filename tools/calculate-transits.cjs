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
  lahiriAyanamsha, siderealLongitude,
} = chartModule;

const projectRoot = path.resolve(__dirname, "..");
const rulesDir    = path.join(projectRoot, "generator", "rules");
const placesPath  = path.join(projectRoot, "data", "places.json");

// Load transit rules
function loadTransitRules() {
  const file = path.join(rulesDir, "psychological-transit-rules.json");
  return JSON.parse(fs.readFileSync(file, "utf8"));
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

// Natal points we track
const NATAL_TARGETS = ["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn"];
const ASC_POINT = "ASC";

// Orbs per transit planet (slow = tighter, fast = standard)
function defaultOrb(planet, aspect) {
  const tight = { Neptune: 1, Pluto: 1 };
  const standard = { Jupiter: 2, Saturn: 2, Uranus: 2, Mars: 1, Sun: 1 };
  return (tight[planet] ?? standard[planet] ?? 2);
}

function findActiveTransits(natalPositions, transitPositions, natalAscendant, transitIndex, customOrb) {
  const active = [];

  // Prepare natal points map
  const natalMap = {};
  for (const p of natalPositions) {
    natalMap[p.body] = p.tropicalLongitude;
  }
  if (natalAscendant) {
    natalMap[ASC_POINT] = natalAscendant.longitude;
  }

  for (const tPos of transitPositions) {
    const tPlanet = tPos.body;
    const tLon    = tPos.tropicalLongitude;

    for (const [natalName, natalLon] of Object.entries(natalMap)) {
      for (const aspDef of aspectDefinitions) {
        const distance = angularDistance(tLon, natalLon);
        const delta    = Math.abs(distance - aspDef.angle);
        const orb      = customOrb ?? defaultOrb(tPlanet, aspDef.name);
        if (delta > orb) continue;

        const key = `${tPlanet} ${aspDef.name} ${natalName}`;
        const rule = transitIndex.get(key);
        if (!rule) continue;

        // Determine applying vs separating
        // Transit planet is applying if it's moving toward exact aspect
        const signedDist = ((tLon - natalLon + 540) % 360) - 180;
        const currentAngle = distance;
        const phase = delta < 0.5 ? "exact" : (signedDist < aspDef.angle ? "applying" : "separating");

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

function main() {
  const argv = process.argv.slice(2);
  const args = parseTransitArgs(argv);

  // Resolve birth date
  let birthDate;
  try {
    birthDate = resolveInput(args);
  } catch (e) {
    console.error("Birth date error:", e.message);
    process.exit(1);
  }

  if (Number.isNaN(birthDate.getTime())) {
    console.error("Invalid birth date.");
    process.exit(1);
  }

  // Resolve transit date
  const transitDate = resolveTransitDate(args);

  // Calculate natal positions
  const natalPositions = calculatePositions(birthDate);

  // Resolve natal ASC if we have coordinates
  let natalAscendant = null;
  if (Number.isFinite(args.latitude) && Number.isFinite(args.longitude)) {
    // Import ASC finder — use the full natal profile
    const { calculateProfile } = require("./calculate-chart.cjs");
    try {
      const natalProfile = calculateProfile(args);
      natalAscendant = natalProfile.calculation.angles.ascendant;
    } catch {}
  }

  // Calculate transit positions (for transit date, no location needed)
  const transitPositions = calculatePositions(transitDate);

  // Load rules and find active transits
  const transitRules   = loadTransitRules();
  const transitIndex   = buildTransitIndex(transitRules);
  const activeTransits = findActiveTransits(
    natalPositions, transitPositions, natalAscendant, transitIndex, args.customOrb
  );

  const profile = buildTransitProfile(
    args,
    { birthData: { datetimeUtc: birthDate.toISOString() } },
    transitPositions,
    activeTransits,
    transitDate
  );

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

main();
