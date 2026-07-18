const fs = require("fs");
const path = require("path");
const Astronomy = require("astronomy-engine");

const projectRoot = path.resolve(__dirname, "..");
const outputDir = path.join(projectRoot, "generator", "profiles");
const placesPath = path.join(projectRoot, "data", "places.json");

const bodies = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const siderealSigns = ["Mesha", "Vrishabha", "Mithuna", "Karkata", "Simha", "Kanya", "Tula", "Vrischika", "Dhanu", "Makara", "Kumbha", "Meena"];
const nakshatras = [
  "Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu","Pushya","Ashlesha",
  "Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha",
  "Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishtha","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"
];
const nakshatraRulers = ["Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury",
  "Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury",
  "Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury"];
const vimshottariYears = { Sun:6, Moon:10, Mars:7, Rahu:18, Jupiter:16, Saturn:19, Mercury:17, Ketu:7, Venus:20 };
// Traditional Western sign rulers (Ptolemaic + modern outer planets as co-rulers)
const signRuler = {
  Aries:"Mars", Taurus:"Venus", Gemini:"Mercury", Cancer:"Moon", Leo:"Sun", Virgo:"Mercury",
  Libra:"Venus", Scorpio:"Pluto", Sagittarius:"Jupiter", Capricorn:"Saturn",
  Aquarius:"Uranus", Pisces:"Neptune",
};
// Build available rule query set dynamically from all rule files
const rulesDir = path.join(projectRoot, "generator", "rules");
const availableRuleQueries = new Set();

// Register rule arrays into availableRuleQueries. Exported so non-Node
// runtimes (Cloudflare Workers) can inject rules loaded from elsewhere.
function registerAvailableRules(ruleLists) {
  for (let rules of ruleLists) {
    if (!Array.isArray(rules)) { rules = rules.rules || []; }
    for (const rule of rules) {
      const f = rule.factor || {};
      if (f.planetA && f.aspect && f.planetB) {
        availableRuleQueries.add(`${f.planetA} ${f.aspect} ${f.planetB}`);
        availableRuleQueries.add(`${f.planetB} ${f.aspect} ${f.planetA}`);
      } else if (f.planet && f.house) {
        availableRuleQueries.add(`${f.planet} in ${f.house}th house`);
      } else if (f.planet && f.sign) {
        availableRuleQueries.add(`${f.planet} in ${f.sign}`);
      } else if (f.rulerOfHouse && f.placedInHouse) {
        availableRuleQueries.add(`rule-instance.western.ruler-of-${f.rulerOfHouse}-in-${f.placedInHouse}`);
      } else if (f.graha && f.rashi) {
        availableRuleQueries.add(`vedic:${f.graha}:${f.rashi}`);
      } else if (f.kabbalahPlanet && f.sign) {
        availableRuleQueries.add(`kabbalah:${f.kabbalahPlanet}:${f.sign}`);
      } else if (f.chineseAnimal) {
        availableRuleQueries.add(`chinese:${f.chineseAnimal}`);
      } else if (f.nakshatra && f.pada) {
        availableRuleQueries.add(`nakshatra-pada:${f.nakshatra}:${f.pada}`);
      } else if (f.nakshatra && f.mansionNum) {
        availableRuleQueries.add(`lunar-mansion:${f.nakshatra}`);
      } else if (f.nakshatra) {
        availableRuleQueries.add(`nakshatra:${f.nakshatra}`);
      }
    }
  }
}

// Node: scan the rules directory at load time. In runtimes without a real
// filesystem the scan fails silently and registerAvailableRules must be
// called by the host before calculateProfile.
try {
  const lists = [];
  for (const ruleFile of fs.readdirSync(rulesDir).filter(f => f.endsWith(".json"))) {
    try { lists.push(JSON.parse(fs.readFileSync(path.join(rulesDir, ruleFile), "utf8"))); } catch { continue; }
  }
  registerAvailableRules(lists);
} catch { /* no filesystem — host injects rules */ }
const meanObliquityDeg = 23.4392911;
const supportedHouseSystems = new Set(["equal-from-ascendant", "whole-sign"]);

const aspectDefinitions = [
  { name: "conjunction", angle: 0, orb: 8 },
  { name: "sextile", angle: 60, orb: 5 },
  { name: "square", angle: 90, orb: 6 },
  { name: "trine", angle: 120, orb: 6 },
  { name: "opposition", angle: 180, orb: 8 },
];

function parseArgs(argv) {
  const args = { name: "Calculated Demo User", mode: "both", language: "ru", place: "", houseSystem: "equal-from-ascendant" };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--datetime") args.datetime = argv[++i];
    else if (arg === "--local-date") args.localDate = argv[++i];
    else if (arg === "--local-time") args.localTime = argv[++i];
    else if (arg === "--timezone") args.timeZone = argv[++i];
    else if (arg === "--place-key") args.placeKey = argv[++i];
    else if (arg === "--name") args.name = argv[++i];
    else if (arg === "--place") args.place = argv[++i];
    else if (arg === "--lat" || arg === "--latitude") args.latitude = Number(argv[++i]);
    else if (arg === "--lon" || arg === "--longitude") args.longitude = Number(argv[++i]);
    else if (arg === "--mode") args.mode = argv[++i];
    else if (arg === "--language") args.language = argv[++i];
    else if (arg === "--house-system") args.houseSystem = argv[++i];
    else if (arg === "--out") args.out = argv[++i];
  }
  return args;
}

function normalizeText(input) {
  return String(input || "").toLowerCase().trim();
}

// Host-injected places for runtimes without a filesystem (Cloudflare Workers).
let injectedPlaces = null;
function setPlaces(places) {
  injectedPlaces = Array.isArray(places) ? places : Object.values(places || {});
}

function loadPlaces() {
  if (injectedPlaces) return injectedPlaces;
  try {
    if (!fs.existsSync(placesPath)) return [];
    return JSON.parse(fs.readFileSync(placesPath, "utf8"));
  } catch { return []; }
}

function findPlace(input, places) {
  const query = normalizeText(input);
  if (!query) return null;
  return places.find((place) => {
    if (normalizeText(place.key) === query) return true;
    if (normalizeText(place.name) === query) return true;
    return (place.aliases || []).some((alias) => normalizeText(alias) === query);
  }) || null;
}

function datePartsInTimeZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(byType.year),
    month: Number(byType.month),
    day: Number(byType.day),
    hour: Number(byType.hour),
    minute: Number(byType.minute),
    second: Number(byType.second),
  };
}

function parseLocalDateTime(localDate, localTime) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDate || "");
  const timeMatch = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(localTime || "");
  if (!match || !timeMatch) {
    throw new Error("Local input must use --local-date YYYY-MM-DD and --local-time HH:mm.");
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(timeMatch[1]),
    minute: Number(timeMatch[2]),
    second: Number(timeMatch[3] || 0),
  };
}

function zonedTimeToUtc(localDate, localTime, timeZone) {
  const target = parseLocalDateTime(localDate, localTime);
  const targetMs = Date.UTC(target.year, target.month - 1, target.day, target.hour, target.minute, target.second);
  let guessMs = targetMs;

  for (let i = 0; i < 4; i += 1) {
    const parts = datePartsInTimeZone(new Date(guessMs), timeZone);
    const zonedMs = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    const delta = zonedMs - targetMs;
    if (delta === 0) break;
    guessMs -= delta;
  }

  return new Date(guessMs);
}

function resolveInput(args) {
  if (!supportedHouseSystems.has(args.houseSystem)) {
    throw new Error(`Unsupported --house-system: ${args.houseSystem}. Supported values: ${[...supportedHouseSystems].join(", ")}.`);
  }

  const places = loadPlaces();
  const place = findPlace(args.placeKey || args.place, places);

  if (place) {
    args.place = place.name;
    args.latitude = args.latitude ?? place.latitude;
    args.longitude = args.longitude ?? place.longitude;
    args.timeZone = args.timeZone || place.timeZone;
    args.placeKey = place.key;
  }

  if (args.localDate || args.localTime) {
    if (!args.localDate || !args.localTime) {
      throw new Error("Use both --local-date and --local-time for local birth time input.");
    }
    if (!args.timeZone) {
      throw new Error("Local time input requires --timezone or a known --place-key from data/places.json.");
    }
    const date = zonedTimeToUtc(args.localDate, args.localTime, args.timeZone);
    args.datetime = date.toISOString();
    args.inputMode = "local-time";
    return date;
  }

  if (!args.datetime) {
    throw new Error("Missing --datetime or local input. Examples: --datetime 1990-01-01T12:00:00Z or --local-date 1990-01-01 --local-time 12:00 --place-key chisinau-md.");
  }

  args.inputMode = "utc";
  return new Date(args.datetime);
}

function normalizeDegrees(value) {
  return ((value % 360) + 360) % 360;
}

function degreesToRadians(value) {
  return value * Math.PI / 180;
}

function radiansToDegrees(value) {
  return value * 180 / Math.PI;
}

function signForLongitude(longitude) {
  const normalized = normalizeDegrees(longitude);
  const signIndex = Math.floor(normalized / 30);
  return { sign: signs[signIndex], signIndex, degreeInSign: normalized - signIndex * 30 };
}

// Lahiri ayanamsha (degrees) for a given JS Date
// Uses IAU formula: ayanamsha ≈ 23.85 - 50.2388475"/year from J2000.0, offset to Lahiri epoch
function lahiriAyanamsha(date) {
  const jd = Astronomy.MakeTime(date).tt + 2451545.0;
  const T = (jd - 2451545.0) / 36525.0; // Julian centuries from J2000
  // Lahiri ayanamsha at J2000.0 = 23.853 degrees; precession rate ~50.2388475 arcsec/year
  // T is in Julian centuries (100 years), so T*100 = years from J2000
  const ayanamsha = 23.853 + (T * 100 * 50.2388475 / 3600);
  return normalizeDegrees(ayanamsha);
}

function siderealLongitude(tropicalLon, ayanamsha) {
  return normalizeDegrees(tropicalLon - ayanamsha);
}

function nakshatraForLongitude(siderealLon) {
  const normalized = normalizeDegrees(siderealLon);
  const index = Math.floor(normalized / (360 / 27));
  const pada = Math.floor((normalized % (360 / 27)) / (360 / 108)) + 1;
  return { nakshatra: nakshatras[index], nakshatraIndex: index, pada, ruler: nakshatraRulers[index] };
}

function siderealSignForLongitude(siderealLon) {
  const normalized = normalizeDegrees(siderealLon);
  const signIndex = Math.floor(normalized / 30);
  return { sign: siderealSigns[signIndex], signIndex, degreeInSign: normalized - signIndex * 30 };
}

// Fixed Vimshottari cycle order (120-year total); each birth starts mid-cycle
// at the Moon's nakshatra ruler and proceeds through this sequence.
const VIMSHOTTARI_ORDER = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
const MS_PER_YEAR = 365.25 * 24 * 3600 * 1000;

// Vimshottari dasha lord active on referenceDate (defaults to now), found by
// walking the fixed 9-lord cycle forward from the birth (Moon-nakshatra) dasha
// rather than just reporting the first dasha's balance at birth.
function vimshottariDashaFromMoon(moonSiderealLon, birthDate, referenceDate = new Date()) {
  const nk = nakshatraForLongitude(moonSiderealLon);
  const nakshatraSpan = 360 / 27;
  const degInNakshatra = normalizeDegrees(moonSiderealLon) % nakshatraSpan;
  const fractionElapsed = degInNakshatra / nakshatraSpan;
  const startLord = nk.ruler;
  const startLordYears = vimshottariYears[startLord];
  const yearsRemainingAtBirth = startLordYears * (1 - fractionElapsed);

  let idx = VIMSHOTTARI_ORDER.indexOf(startLord);
  let lord = startLord;
  let periodStart = birthDate.getTime();
  let periodEnd = periodStart + yearsRemainingAtBirth * MS_PER_YEAR;

  const refMs = referenceDate.getTime();
  let guard = 0;
  while (periodEnd < refMs && guard < 200) {
    idx = (idx + 1) % VIMSHOTTARI_ORDER.length;
    lord = VIMSHOTTARI_ORDER[idx];
    periodStart = periodEnd;
    periodEnd = periodStart + vimshottariYears[lord] * MS_PER_YEAR;
    guard += 1;
  }

  const yearsRemaining = Math.max(0, (periodEnd - refMs) / MS_PER_YEAR);
  return {
    currentDashaLord: lord,
    yearsRemainingInDasha: Number(yearsRemaining.toFixed(2)),
    dashaEnds: new Date(periodEnd).toISOString().slice(0, 10),
  };
}

function angularDistance(a, b) {
  const diff = Math.abs(normalizeDegrees(a) - normalizeDegrees(b));
  return diff > 180 ? 360 - diff : diff;
}

function signedAngularDifference(a, b) {
  return ((normalizeDegrees(a) - normalizeDegrees(b) + 540) % 360) - 180;
}

function eclipticToEquatorial(longitude) {
  const lambda = degreesToRadians(normalizeDegrees(longitude));
  const epsilon = degreesToRadians(meanObliquityDeg);
  const ra = normalizeDegrees(radiansToDegrees(Math.atan2(Math.sin(lambda) * Math.cos(epsilon), Math.cos(lambda))));
  const dec = radiansToDegrees(Math.asin(Math.sin(lambda) * Math.sin(epsilon)));
  return { ra, dec };
}

function altitudeForEclipticLongitude(longitude, localSiderealDegrees, latitude) {
  const { ra, dec } = eclipticToEquatorial(longitude);
  const hourAngle = degreesToRadians(signedAngularDifference(localSiderealDegrees, ra));
  const lat = degreesToRadians(latitude);
  const decRad = degreesToRadians(dec);
  const sinAlt = Math.sin(lat) * Math.sin(decRad) + Math.cos(lat) * Math.cos(decRad) * Math.cos(hourAngle);
  return radiansToDegrees(Math.asin(Math.max(-1, Math.min(1, sinAlt))));
}

function isRising(longitude, localSiderealDegrees) {
  const { ra } = eclipticToEquatorial(longitude);
  const hourAngle = degreesToRadians(signedAngularDifference(localSiderealDegrees, ra));
  return Math.sin(hourAngle) < 0;
}

function findAscendant(date, latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const localSiderealDegrees = normalizeDegrees((Astronomy.SiderealTime(date) * 15) + longitude);
  const samples = [];
  for (let degree = 0; degree <= 360; degree += 1) {
    samples.push({
      longitude: degree,
      altitude: altitudeForEclipticLongitude(degree, localSiderealDegrees, latitude),
    });
  }

  const roots = [];
  for (let i = 0; i < samples.length - 1; i += 1) {
    const current = samples[i];
    const next = samples[i + 1];
    if (current.altitude === 0) {
      roots.push(current.longitude);
      continue;
    }
    if (Math.sign(current.altitude) === Math.sign(next.altitude)) continue;

    let low = current.longitude;
    let high = next.longitude;
    let lowAlt = current.altitude;
    for (let step = 0; step < 32; step += 1) {
      const mid = (low + high) / 2;
      const midAlt = altitudeForEclipticLongitude(mid, localSiderealDegrees, latitude);
      if (Math.sign(lowAlt) === Math.sign(midAlt)) {
        low = mid;
        lowAlt = midAlt;
      } else {
        high = mid;
      }
    }
    roots.push(normalizeDegrees((low + high) / 2));
  }

  const ascendant = roots.find((root) => isRising(root, localSiderealDegrees));
  if (ascendant == null) return null;

  const sign = signForLongitude(ascendant);
  return {
    longitude: Number(normalizeDegrees(ascendant).toFixed(6)),
    sign: sign.sign,
    degreeInSign: Number(sign.degreeInSign.toFixed(6)),
    localSiderealDegrees: Number(localSiderealDegrees.toFixed(6)),
  };
}

function angleForLongitude(longitude) {
  const sign = signForLongitude(longitude);
  return {
    longitude: Number(normalizeDegrees(longitude).toFixed(6)),
    sign: sign.sign,
    degreeInSign: Number(sign.degreeInSign.toFixed(6)),
  };
}

function findMidheaven(date, longitude) {
  if (!Number.isFinite(longitude)) return null;
  const localSiderealDegrees = normalizeDegrees((Astronomy.SiderealTime(date) * 15) + longitude);
  const ramc = degreesToRadians(localSiderealDegrees);
  const epsilon = degreesToRadians(meanObliquityDeg);
  const mcLongitude = normalizeDegrees(radiansToDegrees(Math.atan2(Math.sin(ramc) / Math.cos(epsilon), Math.cos(ramc))));
  return {
    ...angleForLongitude(mcLongitude),
    localSiderealDegrees: Number(localSiderealDegrees.toFixed(6)),
  };
}

function calculateEqualHouses(ascendantLongitude) {
  return Array.from({ length: 12 }, (_, index) => {
    const cuspLongitude = normalizeDegrees(ascendantLongitude + index * 30);
    const sign = signForLongitude(cuspLongitude);
    return {
      house: index + 1,
      cuspLongitude: Number(cuspLongitude.toFixed(6)),
      sign: sign.sign,
      degreeInSign: Number(sign.degreeInSign.toFixed(6)),
    };
  });
}

function calculateWholeSignHouses(ascendantLongitude) {
  const firstHouseStart = Math.floor(normalizeDegrees(ascendantLongitude) / 30) * 30;
  return Array.from({ length: 12 }, (_, index) => {
    const cuspLongitude = normalizeDegrees(firstHouseStart + index * 30);
    const sign = signForLongitude(cuspLongitude);
    return {
      house: index + 1,
      cuspLongitude: Number(cuspLongitude.toFixed(6)),
      sign: sign.sign,
      degreeInSign: Number(sign.degreeInSign.toFixed(6)),
    };
  });
}

function housePlacementStartLongitude(ascendantLongitude, houseSystem) {
  if (houseSystem === "whole-sign") {
    return Math.floor(normalizeDegrees(ascendantLongitude) / 30) * 30;
  }
  return ascendantLongitude;
}

function houseForLongitude(longitude, placementStartLongitude) {
  return Math.floor(normalizeDegrees(longitude - placementStartLongitude) / 30) + 1;
}

function applyHousePlacements(positions, anglesAndHouses) {
  if (!anglesAndHouses.ascendant || !Number.isFinite(anglesAndHouses.placementStartLongitude)) return positions;
  return positions.map((position) => ({
    ...position,
    house: houseForLongitude(position.tropicalLongitude, anglesAndHouses.placementStartLongitude),
  }));
}

function calculatePositions(date) {
  const ayanamsha = lahiriAyanamsha(date);
  return bodies.map((body) => {
    const longitude = body === "Sun"
      ? Astronomy.SunPosition(date).elon
      : Astronomy.Ecliptic(Astronomy.GeoVector(body, date, true)).elon;
    const sign = signForLongitude(longitude);
    const siderealLon = siderealLongitude(longitude, ayanamsha);
    const siderealSign = siderealSignForLongitude(siderealLon);
    const nk = nakshatraForLongitude(siderealLon);
    return {
      body,
      tropicalLongitude: Number(normalizeDegrees(longitude).toFixed(6)),
      sign: sign.sign,
      degreeInSign: Number(sign.degreeInSign.toFixed(6)),
      vedic: {
        siderealLongitude: Number(siderealLon.toFixed(6)),
        rashi: siderealSign.sign,
        degreeInRashi: Number(siderealSign.degreeInSign.toFixed(6)),
        nakshatra: nk.nakshatra,
        pada: nk.pada,
        nakshatraRuler: nk.ruler,
      },
    };
  });
}

function calculateAnglesAndHouses(date, args) {
  const ascendant = findAscendant(date, args.latitude, args.longitude);
  const midheaven = findMidheaven(date, args.longitude);
  if (!ascendant) {
    return {
      houseSystem: null,
      ascendant: null,
      descendant: null,
      midheaven,
      imumCoeli: midheaven ? angleForLongitude(midheaven.longitude + 180) : null,
      houses: [],
      placementStartLongitude: null,
    };
  }

  const descendant = angleForLongitude(ascendant.longitude + 180);
  const imumCoeli = midheaven ? angleForLongitude(midheaven.longitude + 180) : null;
  const houseSystem = args.houseSystem;
  return {
    houseSystem,
    ascendant,
    descendant,
    midheaven,
    imumCoeli,
    houses: houseSystem === "whole-sign"
      ? calculateWholeSignHouses(ascendant.longitude)
      : calculateEqualHouses(ascendant.longitude),
    placementStartLongitude: housePlacementStartLongitude(ascendant.longitude, houseSystem),
  };
}

function calculateAspects(positions) {
  const aspects = [];
  for (let i = 0; i < positions.length; i += 1) {
    for (let j = i + 1; j < positions.length; j += 1) {
      const a = positions[i];
      const b = positions[j];
      const distance = angularDistance(a.tropicalLongitude, b.tropicalLongitude);
      for (const aspect of aspectDefinitions) {
        const delta = Math.abs(distance - aspect.angle);
        if (delta <= aspect.orb) {
          const query = `${a.body} ${aspect.name} ${b.body}`;
          const reverseQuery = `${b.body} ${aspect.name} ${a.body}`;
          aspects.push({
            bodyA: a.body,
            aspect: aspect.name,
            bodyB: b.body,
            orb: Number(delta.toFixed(3)),
            exactAngle: aspect.angle,
            query,
            matchedRuleQuery: availableRuleQueries.has(query)
              ? query
              : availableRuleQueries.has(reverseQuery)
                ? reverseQuery
                : null,
          });
        }
      }
    }
  }
  return aspects;
}

function buildProfile(args, positions, aspects, anglesAndHouses, birthDate) {
  const aspectFactors = aspects
    .filter((aspect) => aspect.matchedRuleQuery)
    .map((aspect) => ({
      query: aspect.matchedRuleQuery,
      calculated: {
        bodyA: aspect.bodyA,
        aspect: aspect.aspect,
        bodyB: aspect.bodyB,
        orb: aspect.orb,
      },
    }));
  const houseFactors = positions
    .filter((position) => position.house)
    .map((position) => {
      const query = `${position.body} in ${position.house}th house`;
      return { position, query };
    })
    .filter(({ query }) => availableRuleQueries.has(query))
    .map(({ position, query }) => ({
      query,
      calculated: {
        body: position.body,
        house: position.house,
        houseSystem: anglesAndHouses.houseSystem,
      },
    }));
  const signFactors = positions
    .map((position) => {
      const query = `${position.body} in ${position.sign}`;
      return { position, query };
    })
    .filter(({ query }) => availableRuleQueries.has(query))
    .map(({ position, query }) => ({
      query,
      calculated: { body: position.body, sign: position.sign },
    }));
  // Ruler pipeline: for each house, find its sign ruler, then find that ruler's house
  const rulerFactors = [];
  if (anglesAndHouses.houses && anglesAndHouses.houses.length > 0) {
    anglesAndHouses.houses.forEach((house) => {
      const houseNum = house.house;
      const cuspSign = house.sign;
      const ruler = signRuler[cuspSign];
      if (!ruler) return;
      const rulerPosition = positions.find(p => p.body === ruler);
      if (!rulerPosition || !rulerPosition.house) return;
      const fromH = `${houseNum}${['st','nd','rd'][houseNum-1]||'th'}`;
      const toH = `${rulerPosition.house}${['st','nd','rd'][rulerPosition.house-1]||'th'}`;
      const query = `ruler-of-${fromH}-in-${toH}`;
      if (availableRuleQueries.has(`rule-instance.western.${query}`)) {
        rulerFactors.push({
          query,
          calculated: {
            sourceHouse: houseNum,
            cuspSign,
            ruler,
            rulerHouse: rulerPosition.house,
          },
        });
      }
    });
  }
  const CLASSICAL_GRAHAS = new Set(["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"]);
  const vedicRashiFactors = positions
    .filter(p => CLASSICAL_GRAHAS.has(p.body) && p.vedic?.rashi)
    .filter(p => availableRuleQueries.has(`vedic:${p.body}:${p.vedic.rashi}`))
    .map(p => ({
      query: `vedic:${p.body}:${p.vedic.rashi}`,
      calculated: { graha: p.body, rashi: p.vedic.rashi, system: "vedic" },
    }));
  const kabbalahFactors = positions
    .filter(p => p.body === "Sun" && availableRuleQueries.has(`kabbalah:Sun:${p.sign}`))
    .map(p => ({
      query: `kabbalah:Sun:${p.sign}`,
      calculated: { kabbalahPlanet: "Sun", sign: p.sign, system: "kabbalah" },
    }));
  // Chinese zodiac: corrected for Chinese New Year boundary (Jan/Feb births)
  const CHINESE_ANIMALS = ["Rat","Ox","Tiger","Rabbit","Dragon","Snake","Horse","Goat","Monkey","Rooster","Dog","Pig"];
  // Chinese New Year dates (MM-DD) per year 1900-2050 — accurate to ±1 day
  const CNY = {
    1900:"01-31",1901:"02-19",1902:"02-08",1903:"01-29",1904:"02-16",1905:"02-04",1906:"01-25",1907:"02-13",
    1908:"02-02",1909:"01-22",1910:"02-10",1911:"01-30",1912:"02-18",1913:"02-06",1914:"01-26",1915:"02-14",
    1916:"02-03",1917:"01-23",1918:"02-11",1919:"02-01",1920:"02-20",1921:"02-08",1922:"01-28",1923:"02-16",
    1924:"02-05",1925:"01-25",1926:"02-13",1927:"02-02",1928:"01-23",1929:"02-10",1930:"01-30",1931:"02-17",
    1932:"02-06",1933:"01-26",1934:"02-14",1935:"02-04",1936:"01-24",1937:"02-11",1938:"01-31",1939:"02-19",
    1940:"02-08",1941:"01-27",1942:"02-15",1943:"02-05",1944:"01-25",1945:"02-13",1946:"02-02",1947:"01-22",
    1948:"02-10",1949:"01-29",1950:"02-17",1951:"02-06",1952:"01-27",1953:"02-14",1954:"02-03",1955:"01-24",
    1956:"02-12",1957:"01-31",1958:"02-18",1959:"02-08",1960:"01-28",1961:"02-15",1962:"02-05",1963:"01-25",
    1964:"02-13",1965:"02-02",1966:"01-21",1967:"02-09",1968:"01-30",1969:"02-17",1970:"02-06",1971:"01-27",
    1972:"02-15",1973:"02-03",1974:"01-23",1975:"02-11",1976:"01-31",1977:"02-18",1978:"02-07",1979:"01-28",
    1980:"02-16",1981:"02-05",1982:"01-25",1983:"02-13",1984:"02-02",1985:"02-20",1986:"02-09",1987:"01-29",
    1988:"02-17",1989:"02-06",1990:"01-27",1991:"02-15",1992:"02-04",1993:"01-23",1994:"02-10",1995:"01-31",
    1996:"02-19",1997:"02-07",1998:"01-28",1999:"02-16",2000:"02-05",2001:"01-24",2002:"02-12",2003:"02-01",
    2004:"01-22",2005:"02-09",2006:"01-29",2007:"02-18",2008:"02-07",2009:"01-26",2010:"02-14",2011:"02-03",
    2012:"01-23",2013:"02-10",2014:"01-31",2015:"02-19",2016:"02-08",2017:"01-28",2018:"02-16",2019:"02-05",
    2020:"01-25",2021:"02-12",2022:"02-01",2023:"01-22",2024:"02-10",2025:"01-29",2026:"02-17",2027:"02-06",
    2028:"01-26",2029:"02-13",2030:"02-03",2031:"01-23",2032:"02-11",2033:"01-31",2034:"02-19",2035:"02-08",
    2036:"01-28",2037:"02-15",2038:"02-04",2039:"01-24",2040:"02-12",2041:"02-01",2042:"01-22",2043:"02-10",
    2044:"01-30",2045:"02-17",2046:"02-06",2047:"01-26",2048:"02-14",2049:"02-02",2050:"01-23",
  };
  function chineseZodiacYear(date) {
    if (!date) return null;
    const y = date.getFullYear();
    const mmdd = String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
    const cnyMmdd = CNY[y];
    // Before Chinese New Year → use previous year's animal
    const effectiveYear = (cnyMmdd && mmdd < cnyMmdd) ? y - 1 : y;
    return { animal: CHINESE_ANIMALS[((effectiveYear - 1900) % 12 + 12) % 12], effectiveYear };
  }
  const chineseResult = chineseZodiacYear(birthDate);
  const birthYear = birthDate ? birthDate.getFullYear() : null;
  const chineseAnimal = chineseResult?.animal || null;
  const chineseFactors = (chineseAnimal && availableRuleQueries.has(`chinese:${chineseAnimal}`))
    ? [{ query: `chinese:${chineseAnimal}`, calculated: { chineseAnimal, birthYear: chineseResult?.effectiveYear || birthYear, system: "chinese" } }]
    : [];
  // Moon nakshatra + pada factors
  const moonPos = positions.find(p => p.body === "Moon");
  const moonNakshatra = moonPos?.vedic?.nakshatra;
  const moonPada      = moonPos?.vedic?.pada;
  const nakshatraFactors = (moonNakshatra && availableRuleQueries.has(`nakshatra:${moonNakshatra}`))
    ? [{ query: `nakshatra:${moonNakshatra}`, calculated: { nakshatra: moonNakshatra, ruler: moonPos.vedic.nakshatraRuler, system: "vedic-nakshatra" } }]
    : [];
  const nakshatraPadaFactors = (moonNakshatra && moonPada && availableRuleQueries.has(`nakshatra-pada:${moonNakshatra}:${moonPada}`))
    ? [{ query: `nakshatra-pada:${moonNakshatra}:${moonPada}`, calculated: { nakshatra: moonNakshatra, pada: moonPada, ruler: moonPos.vedic.nakshatraRuler, system: "vedic-nakshatra-pada" } }]
    : [];
  const lunarMansionFactors = (moonNakshatra && availableRuleQueries.has(`lunar-mansion:${moonNakshatra}`))
    ? [{ query: `lunar-mansion:${moonNakshatra}`, calculated: { nakshatra: moonNakshatra, ruler: moonPos.vedic.nakshatraRuler, system: "lunar-mansion" } }]
    : [];
  const factors = [...aspectFactors, ...houseFactors, ...signFactors, ...rulerFactors, ...vedicRashiFactors, ...kabbalahFactors, ...chineseFactors, ...nakshatraFactors, ...nakshatraPadaFactors, ...lunarMansionFactors];

  function buildVedicSummary(positions, birthDate, anglesAndHouses) {
    const ayanamsha = lahiriAyanamsha(birthDate);
    const moon = positions.find(p => p.body === "Moon");
    const dasha = moon ? vimshottariDashaFromMoon(moon.vedic.siderealLongitude, birthDate) : null;

    // Sidereal Lagna = tropical ASC minus ayanamsha
    let lagnaLon = null;
    let lagnaRashi = null;
    let lagnaRashiIndex = null;
    let lagnaDeg = null;
    if (anglesAndHouses.ascendant) {
      lagnaLon = normalizeDegrees(anglesAndHouses.ascendant.longitude - ayanamsha);
      const lagnaSign = siderealSignForLongitude(lagnaLon);
      lagnaRashi = lagnaSign.sign;
      lagnaRashiIndex = lagnaSign.signIndex;
      lagnaDeg = Number(lagnaSign.degreeInSign.toFixed(4));
    }

    // Whole-sign bhavas from Lagna
    const grahaWithBhava = positions.map(p => {
      const rashiIndex = p.vedic ? siderealSignForLongitude(p.vedic.siderealLongitude).signIndex : null;
      const bhava = (lagnaRashiIndex != null && rashiIndex != null)
        ? ((rashiIndex - lagnaRashiIndex + 12) % 12) + 1
        : null;
      return {
        graha: p.body,
        rashi: p.vedic.rashi,
        degreeInRashi: p.vedic.degreeInRashi,
        nakshatra: p.vedic.nakshatra,
        pada: p.vedic.pada,
        nakshatraRuler: p.vedic.nakshatraRuler,
        bhava,
      };
    });

    return {
      ayanamsha: { system: "Lahiri", degrees: Number(ayanamsha.toFixed(4)) },
      lagna: lagnaRashi ? {
        rashi: lagnaRashi,
        longitude: Number(lagnaLon.toFixed(4)),
        degreeInRashi: lagnaDeg,
        houseSystem: "whole-sign",
      } : null,
      grahaPositions: grahaWithBhava,
      vimshottariDasha: dasha,
    };
  }

  return {
    title: "Calculated Natal Prototype",
    mode: args.mode,
    language: args.language,
    systems: ["western"],
    subject: { nickname: args.name },
    birthData: {
      datetimeUtc: args.datetime,
      localDate: args.localDate || null,
      localTime: args.localTime || null,
      timeZone: args.timeZone || null,
      place: args.place,
      placeKey: args.placeKey || null,
      latitude: args.latitude ?? null,
      longitude: args.longitude ?? null,
      quality: args.inputMode === "local-time"
        ? `prototype-local-time-registry-${args.houseSystem}`
        : `prototype-utc-${args.houseSystem}`,
    },
    calculation: {
      engine: "astronomy-engine",
      zodiac: "tropical",
      assumptions: [
        args.inputMode === "local-time"
          ? "Local birth time is converted to UTC using an explicit IANA timezone or local place registry."
          : "Input datetime is treated as UTC.",
        "Place lookup is limited to data/places.json unless latitude, longitude, and timezone are provided manually.",
        "No external geocoding yet.",
        args.houseSystem === "whole-sign"
          ? "Houses use a prototype Whole Sign system from the Ascendant sign."
          : "Ascendant and houses use a prototype Equal House system from the Ascendant.",
        "House cusps are not Placidus, Koch, Regiomontanus, or Vedic bhava calculations.",
        "Vedic sidereal positions use Lahiri ayanamsha (prototype formula). Verify against Swiss Ephemeris for production use.",
      ],
      positions,
      aspects,
      houseSystem: anglesAndHouses.houseSystem,
      housePlacementStartLongitude: anglesAndHouses.placementStartLongitude,
      angles: {
        ascendant: anglesAndHouses.ascendant,
        descendant: anglesAndHouses.descendant,
        midheaven: anglesAndHouses.midheaven,
        imumCoeli: anglesAndHouses.imumCoeli,
      },
      houses: anglesAndHouses.houses,
      vedic: buildVedicSummary(positions, birthDate, anglesAndHouses),
    },
    context: args.language === "ru"
      ? "Прототип расчетного профиля. Факторы выбраны только из тех правил генератора, которые уже есть в базе."
      : "Prototype calculation profile. Factors are selected from currently available generator rules only.",
    factors,
  };
}

function calculateProfile(args) {
  let date;
  date = resolveInput(args);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date input: ${args.datetime || `${args.localDate} ${args.localTime}`}`);
  }

  const anglesAndHouses = calculateAnglesAndHouses(date, args);
  const positions = applyHousePlacements(calculatePositions(date), anglesAndHouses);
  return buildProfile(args, positions, calculateAspects(positions), anglesAndHouses, date);
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  let profile;
  try {
    profile = calculateProfile(args);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  const output = JSON.stringify(profile, null, 2);

  if (args.out) {
    fs.mkdirSync(outputDir, { recursive: true });
    const outPath = path.isAbsolute(args.out) ? args.out : path.join(outputDir, args.out);
    fs.writeFileSync(outPath, output, "utf8");
    console.log(`Profile written: ${outPath}`);
  } else {
    console.log(output);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  calculateProfile,
  parseArgs,
  resolveInput,
  calculatePositions,
  angularDistance,
  normalizeDegrees,
  signForLongitude,
  lahiriAyanamsha,
  siderealLongitude,
  nakshatraForLongitude,
  siderealSignForLongitude,
  aspectDefinitions,
  bodies,
  signs,
  signRuler,
  availableRuleQueries,
  registerAvailableRules,
  setPlaces,
};
