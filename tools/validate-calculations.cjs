const fs = require("fs");
const path = require("path");
const { calculateProfile } = require("./calculate-chart.cjs");

const projectRoot = path.resolve(__dirname, "..");
const fixturesPath = path.join(projectRoot, "data", "calculation-fixtures.json");

function fail(message) {
  throw new Error(message);
}

function approx(actual, expected, tolerance, label) {
  if (Math.abs(actual - expected) > tolerance) {
    fail(`${label}: expected ${expected} +/- ${tolerance}, got ${actual}`);
  }
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) fail(`${label}: expected ${expected}, got ${actual}`);
}

function assertIncludesAll(actual, expected, label) {
  const missing = expected.filter((item) => !actual.includes(item));
  if (missing.length) fail(`${label}: missing ${missing.join(", ")}`);
}

function validateFixture(fixture) {
  const profile = calculateProfile({ ...fixture.args });
  const expected = fixture.expected;
  const prefix = fixture.name;

  assertEqual(profile.birthData.datetimeUtc, expected.datetimeUtc, `${prefix}.datetimeUtc`);
  assertEqual(profile.calculation.houseSystem, expected.houseSystem, `${prefix}.houseSystem`);
  assertEqual(profile.calculation.angles.ascendant.sign, expected.ascendant.sign, `${prefix}.ascendant.sign`);
  approx(
    profile.calculation.angles.ascendant.degreeInSign,
    expected.ascendant.degreeInSign,
    expected.ascendant.toleranceDeg ?? 0.02,
    `${prefix}.ascendant.degreeInSign`,
  );

  if (expected.firstHouseCusp) {
    const firstHouse = profile.calculation.houses.find((house) => house.house === 1);
    assertEqual(firstHouse.sign, expected.firstHouseCusp.sign, `${prefix}.firstHouse.sign`);
    approx(
      firstHouse.degreeInSign,
      expected.firstHouseCusp.degreeInSign,
      expected.firstHouseCusp.toleranceDeg ?? 0.02,
      `${prefix}.firstHouse.degreeInSign`,
    );
  }

  for (const expectedPosition of expected.positions || []) {
    const position = profile.calculation.positions.find((item) => item.body === expectedPosition.body);
    if (!position) fail(`${prefix}.positions: missing ${expectedPosition.body}`);
    if (expectedPosition.sign) assertEqual(position.sign, expectedPosition.sign, `${prefix}.${expectedPosition.body}.sign`);
    if (expectedPosition.house) assertEqual(position.house, expectedPosition.house, `${prefix}.${expectedPosition.body}.house`);
  }

  assertIncludesAll(
    profile.factors.map((factor) => factor.query),
    expected.factors || [],
    `${prefix}.factors`,
  );
}

function main() {
  const fixtures = JSON.parse(fs.readFileSync(fixturesPath, "utf8"));
  for (const fixture of fixtures) validateFixture(fixture);
  console.log(`Calculation fixtures: ${fixtures.length}`);
  console.log("Calculation validation passed.");
}

main();
