const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { calculateChart } = require("../lib/astro.cjs");
const { calculateDispositor } = require("../lib/dispositor.cjs");
const { generateReport } = require("../lib/report.cjs");
const { calculateVedic } = require("../lib/vedic.cjs");
const { calculateCompatibility } = require("../lib/compatibility.cjs");
const { calculateJewish } = require("../lib/jewish.cjs");
const { calculateRhythms } = require("../lib/rhythms.cjs");

const projectRoot = path.resolve(__dirname, "..");
const requiredFiles = [
  "site/server.cjs",
  "site/public/index.html",
  "site/public/western.html",
  "site/public/home.js",
  "site/public/profile.js",
  "site/public/app.js",
  "site/public/vedic.html",
  "site/public/vedic.js",
  "site/public/compatibility.html",
  "site/public/compatibility.js",
  "site/public/jewish.html",
  "site/public/jewish.js",
  "site/public/rhythms.html",
  "site/public/rhythms.js",
  "site/public/styles.css",
  "lib/astro.cjs",
  "lib/dispositor.cjs",
  "lib/report.cjs",
  "lib/text.cjs",
  "lib/vedic.cjs",
  "lib/compatibility.cjs",
  "lib/jewish.cjs",
  "lib/rhythms.cjs",
];

for (const file of requiredFiles) {
  const fullPath = path.join(projectRoot, file);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing site file: ${file}`);
  }
}

for (const file of ["site/server.cjs", "site/public/home.js", "site/public/profile.js", "site/public/app.js", "site/public/vedic.js", "site/public/compatibility.js", "site/public/jewish.js", "site/public/rhythms.js"]) {
  execFileSync(process.execPath, ["--check", path.join(projectRoot, file)], { stdio: "pipe" });
}

const profile = calculateChart({
  name: "Site Validation",
  localDate: "1990-04-10",
  localTime: "08:30",
  placeKey: "chisinau-md",
  houseSystem: "equal-from-ascendant",
  mode: "both",
  language: "ru",
});

const dispositor = calculateDispositor(profile);
const report = generateReport(profile, "both");

if (profile.calculation.positions.length !== 10) {
  throw new Error(`Expected 10 calculated positions, got ${profile.calculation.positions.length}.`);
}

if (!profile.calculation.angles.ascendant || !profile.calculation.angles.midheaven) {
  throw new Error("Expected Ascendant and Midheaven in site validation profile.");
}

if (!dispositor.dominantFinal) {
  throw new Error("Expected a dominant final dispositor in site validation profile.");
}

if (!report.html.includes("<h1>") || !report.markdown.startsWith("# ")) {
  throw new Error("Expected generated report markdown and HTML.");
}

const vedic = calculateVedic({
  name: "Vedic Site Validation",
  localDate: "1990-04-10",
  localTime: "08:30",
  placeKey: "chisinau-md",
  questionFocus: "work",
  language: "ru",
}, { targetDate: "2026-06-12T00:00:00Z" });

if (!vedic.lagna || !vedic.moon?.nakshatra || !vedic.currentDasha?.prediction?.length || !vedic.focusReading?.items?.length) {
  throw new Error("Expected Vedic lagna, Moon nakshatra, prediction text, and focus reading.");
}

const compatibility = calculateCompatibility({
  relationshipContext: "business",
  personA: {
    name: "A",
    localDate: "1990-04-10",
    localTime: "08:30",
    placeKey: "chisinau-md",
  },
  personB: {
    name: "B",
    localDate: "1992-09-18",
    localTime: "18:15",
    placeKey: "kyiv-ua",
  },
});

if (!compatibility.axes?.length || !compatibility.hypotheses?.length || !compatibility.deepResearch || !compatibility.forecast?.length) {
  throw new Error("Expected compatibility axes, hypotheses, deep research, and forecast.");
}

const jewish = calculateJewish({
  name: "Jewish Site Validation",
  localDate: "1990-04-10",
  localTime: "08:30",
  placeKey: "chisinau-md",
});

if (!jewish.month?.month || !jewish.synthesis?.length || !jewish.boldHypotheses?.length || !jewish.practices?.length) {
  throw new Error("Expected Jewish/Kabbalistic month, synthesis, hypotheses, and practices.");
}

const rhythms = calculateRhythms({
  name: "Rhythms Site Validation",
  localDate: "1990-04-10",
  localTime: "08:30",
  placeKey: "chisinau-md",
  startDate: "2026-06-12",
  days: 60,
});

if (rhythms.summaries.length !== 7 || rhythms.points.length < 30 || typeof rhythms.points[0]?.values?.luck !== "number") {
  throw new Error("Expected seven rhythm summaries, at least 30 points, and luck values.");
}

console.log("Site validation passed.");
