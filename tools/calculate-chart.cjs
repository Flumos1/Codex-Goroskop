const fs = require("fs");
const path = require("path");
const Astronomy = require("astronomy-engine");

const projectRoot = path.resolve(__dirname, "..");
const outputDir = path.join(projectRoot, "generator", "profiles");
const placesPath = path.join(projectRoot, "data", "places.json");

const bodies = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const availableRuleQueries = new Set([
  "Moon square Saturn",
  "Venus square Saturn",
  "Venus trine Jupiter",
  "Sun square Neptune",
  "Jupiter square Saturn",
  "Saturn in 7th house",
  "Venus in 10th house",
  "Mars in 10th house",
  "Saturn in 11th house",
  "Moon in 4th house",
]);
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
    else if (arg === "--lat") args.latitude = Number(argv[++i]);
    else if (arg === "--lon") args.longitude = Number(argv[++i]);
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

function loadPlaces() {
  if (!fs.existsSync(placesPath)) return [];
  return JSON.parse(fs.readFileSync(placesPath, "utf8"));
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
  return bodies.map((body) => {
    const longitude = body === "Sun"
      ? Astronomy.SunPosition(date).elon
      : Astronomy.Ecliptic(Astronomy.GeoVector(body, date, true)).elon;
    const sign = signForLongitude(longitude);
    return {
      body,
      tropicalLongitude: Number(normalizeDegrees(longitude).toFixed(6)),
      sign: sign.sign,
      degreeInSign: Number(sign.degreeInSign.toFixed(6)),
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

function buildProfile(args, positions, aspects, anglesAndHouses) {
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
  const factors = [...aspectFactors, ...houseFactors];

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
        "No Vedic sidereal ayanamsa yet.",
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
  return buildProfile(args, positions, calculateAspects(positions), anglesAndHouses);
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
};
