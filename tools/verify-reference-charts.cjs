const fs = require("fs");
const path = require("path");
const { calculateProfile } = require("./calculate-chart.cjs");

const projectRoot = path.resolve(__dirname, "..");
const referencePath = path.join(projectRoot, "data", "reference-charts.json");

function parseArgs(argv) {
  return {
    includeCandidates: argv.includes("--include-candidates"),
    strictReferences: argv.includes("--strict-references"),
  };
}

function normalizeDegrees(value) {
  return ((value % 360) + 360) % 360;
}

function angularDistance(a, b) {
  const diff = Math.abs(normalizeDegrees(a) - normalizeDegrees(b));
  return diff > 180 ? 360 - diff : diff;
}

function fail(message, errors) {
  errors.push(message);
}

function compareAngle(actual, expected, tolerance, label, errors) {
  if (!Number.isFinite(actual) || !Number.isFinite(expected)) {
    fail(`${label}: expected numeric angles, got actual=${actual}, expected=${expected}`, errors);
    return;
  }
  const delta = angularDistance(actual, expected);
  if (delta > tolerance) fail(`${label}: expected ${expected} +/- ${tolerance} deg, got ${actual} (delta ${delta.toFixed(6)})`, errors);
}

function comparePlain(actual, expected, label, errors) {
  if (actual !== expected) fail(`${label}: expected ${expected}, got ${actual}`, errors);
}

function findByHouse(houses, houseNumber) {
  return houses.find((house) => house.house === houseNumber);
}

function findByBody(positions, body) {
  return positions.find((position) => position.body === body);
}

function verifyChart(chart) {
  const errors = [];
  if (!chart.id) fail("Reference chart missing id", errors);
  if (!chart.status) fail(`${chart.id || "<missing-id>"} missing status`, errors);
  if (!chart.args) fail(`${chart.id || "<missing-id>"} missing args`, errors);
  if (!chart.expected) fail(`${chart.id || "<missing-id>"} missing expected`, errors);
  if (errors.length) return errors;

  const profile = calculateProfile({ ...chart.args });
  const expected = chart.expected;
  const tolerances = {
    ascendantDeg: 0.25,
    midheavenDeg: 0.25,
    houseCuspDeg: 0.25,
    positionDeg: 0.1,
    ...(chart.tolerances || {}),
  };
  const prefix = chart.id;

  if (expected.datetimeUtc) comparePlain(profile.birthData.datetimeUtc, expected.datetimeUtc, `${prefix}.datetimeUtc`, errors);
  if (expected.houseSystem) comparePlain(profile.calculation.houseSystem, expected.houseSystem, `${prefix}.houseSystem`, errors);

  if (expected.ascendant) {
    const ascendant = profile.calculation.angles.ascendant;
    if (!ascendant) {
      fail(`${prefix}.ascendant: calculation did not produce Ascendant`, errors);
    } else {
      if (expected.ascendant.sign) comparePlain(ascendant.sign, expected.ascendant.sign, `${prefix}.ascendant.sign`, errors);
      if (Number.isFinite(expected.ascendant.longitude)) {
        compareAngle(ascendant.longitude, expected.ascendant.longitude, tolerances.ascendantDeg, `${prefix}.ascendant.longitude`, errors);
      }
      if (Number.isFinite(expected.ascendant.degreeInSign)) {
        compareAngle(ascendant.degreeInSign, expected.ascendant.degreeInSign, tolerances.ascendantDeg, `${prefix}.ascendant.degreeInSign`, errors);
      }
    }
  }

  if (expected.midheaven) {
    const midheaven = profile.calculation.angles.midheaven;
    if (!midheaven) {
      fail(`${prefix}.midheaven: calculation did not produce Midheaven`, errors);
    } else {
      if (expected.midheaven.sign) comparePlain(midheaven.sign, expected.midheaven.sign, `${prefix}.midheaven.sign`, errors);
      if (Number.isFinite(expected.midheaven.longitude)) {
        compareAngle(midheaven.longitude, expected.midheaven.longitude, tolerances.midheavenDeg, `${prefix}.midheaven.longitude`, errors);
      }
      if (Number.isFinite(expected.midheaven.degreeInSign)) {
        compareAngle(midheaven.degreeInSign, expected.midheaven.degreeInSign, tolerances.midheavenDeg, `${prefix}.midheaven.degreeInSign`, errors);
      }
    }
  }

  for (const expectedHouse of expected.houses || []) {
    const house = findByHouse(profile.calculation.houses || [], expectedHouse.house);
    if (!house) {
      fail(`${prefix}.houses.${expectedHouse.house}: missing calculated house`, errors);
      continue;
    }
    if (expectedHouse.sign) comparePlain(house.sign, expectedHouse.sign, `${prefix}.houses.${expectedHouse.house}.sign`, errors);
    if (Number.isFinite(expectedHouse.cuspLongitude)) {
      compareAngle(house.cuspLongitude, expectedHouse.cuspLongitude, tolerances.houseCuspDeg, `${prefix}.houses.${expectedHouse.house}.cuspLongitude`, errors);
    }
    if (Number.isFinite(expectedHouse.degreeInSign)) {
      compareAngle(house.degreeInSign, expectedHouse.degreeInSign, tolerances.houseCuspDeg, `${prefix}.houses.${expectedHouse.house}.degreeInSign`, errors);
    }
  }

  for (const expectedPosition of expected.positions || []) {
    const position = findByBody(profile.calculation.positions || [], expectedPosition.body);
    if (!position) {
      fail(`${prefix}.positions.${expectedPosition.body}: missing calculated body`, errors);
      continue;
    }
    if (expectedPosition.sign) comparePlain(position.sign, expectedPosition.sign, `${prefix}.positions.${expectedPosition.body}.sign`, errors);
    if (expectedPosition.house) comparePlain(position.house, expectedPosition.house, `${prefix}.positions.${expectedPosition.body}.house`, errors);
    if (Number.isFinite(expectedPosition.tropicalLongitude)) {
      compareAngle(position.tropicalLongitude, expectedPosition.tropicalLongitude, tolerances.positionDeg, `${prefix}.positions.${expectedPosition.body}.tropicalLongitude`, errors);
    }
  }

  const factorQueries = profile.factors.map((factor) => factor.query);
  for (const expectedFactor of expected.factors || []) {
    if (!factorQueries.includes(expectedFactor)) fail(`${prefix}.factors: missing ${expectedFactor}`, errors);
  }

  return errors;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const charts = JSON.parse(fs.readFileSync(referencePath, "utf8"));
  const activeCharts = charts.filter((chart) => chart.status === "reference" || (args.includeCandidates && chart.status === "candidate"));
  const skipped = charts.length - activeCharts.length;
  const errors = [];

  for (const chart of activeCharts) {
    errors.push(...verifyChart(chart));
  }

  const referenceCount = activeCharts.filter((chart) => chart.status === "reference").length;
  const candidateCount = activeCharts.filter((chart) => chart.status === "candidate").length;

  console.log(`Reference charts checked: ${activeCharts.length}`);
  console.log(`- reference: ${referenceCount}`);
  console.log(`- candidate: ${candidateCount}`);
  if (skipped) console.log(`- skipped: ${skipped}`);

  if (args.strictReferences && referenceCount === 0) {
    errors.push("No status=reference charts are available yet. Add externally verified reference charts or run without --strict-references.");
  }

  if (errors.length) {
    console.log("");
    console.log("Errors:");
    for (const error of errors) console.log(`- ${error}`);
    process.exit(1);
  }

  console.log("Reference chart verification passed.");
}

main();
