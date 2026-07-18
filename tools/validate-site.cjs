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
const { calculatePalmistry } = require("../lib/palmistry.cjs");
const { answerAiChat } = require("../lib/ai-chat.cjs");

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
  "site/public/palmistry.html",
  "site/public/palmistry.js",
  "site/public/ai-chat.js",
  "site/public/styles.css",
  "data/hebrew-calendar-months.json",
  "data/palmistry-rules.json",
  "lib/astro.cjs",
  "lib/dispositor.cjs",
  "lib/report.cjs",
  "lib/text.cjs",
  "lib/vedic.cjs",
  "lib/compatibility.cjs",
  "lib/jewish.cjs",
  "lib/rhythms.cjs",
  "lib/palmistry.cjs",
  "lib/ai-chat.cjs",
];

for (const file of requiredFiles) {
  const fullPath = path.join(projectRoot, file);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing site file: ${file}`);
  }
}

for (const file of ["site/server.cjs", "site/public/home.js", "site/public/profile.js", "site/public/app.js", "site/public/vedic.js", "site/public/compatibility.js", "site/public/jewish.js", "site/public/rhythms.js", "site/public/palmistry.js", "site/public/ai-chat.js", "lib/ai-chat.cjs"]) {
  execFileSync(process.execPath, ["--check", path.join(projectRoot, file)], { stdio: "pipe" });
}

for (const file of ["index.html", "western.html", "vedic.html", "compatibility.html", "jewish.html", "rhythms.html", "palmistry.html"]) {
  const content = fs.readFileSync(path.join(projectRoot, "site", "public", file), "utf8");
  if (!content.includes("/ai-chat.js?v=20260613-1")) {
    throw new Error(`Expected AI chat script on ${file}.`);
  }
}

const places = JSON.parse(fs.readFileSync(path.join(projectRoot, "data/places.json"), "utf8"));
const requiredPlaceKeys = ["kyiv-ua", "lviv-ua", "warsaw-pl", "tokyo-jp", "toronto-ca", "sydney-au", "dubai-ae"];
if (places.length < 50 || requiredPlaceKeys.some((key) => !places.some((place) => place.key === key))) {
  throw new Error("Expected expanded international place list for shared birth profile.");
}

const hebrewMonths = JSON.parse(fs.readFileSync(path.join(projectRoot, "data/hebrew-calendar-months.json"), "utf8"));
if (hebrewMonths.length < 14 || !hebrewMonths.some((month) => month.key === "Adar II")) {
  throw new Error("Expected Hebrew calendar mini database with leap-month support.");
}

const profileScript = fs.readFileSync(path.join(projectRoot, "site/public/profile.js"), "utf8");
if (!profileScript.includes("setupPlaceSelect") || !profileScript.includes("renderPlaceOptions") || !profileScript.includes("window.CodexProfile") || !profileScript.includes("codex-goroskop:birth-profile:v1")) {
  throw new Error("Expected shared profile script to manage reusable place selection.");
}

const textChecks = [
  ["site/public/palmistry.html", "Хиромантия"],
  ["site/public/palmistry.js", "Линия сердца"],
  ["lib/palmistry.cjs", "Линия сердца"],
  ["data/palmistry-rules.json", "Земная рука"],
];

for (const [file, expectedText] of textChecks) {
  const content = fs.readFileSync(path.join(projectRoot, file), "utf8");
  if (!content.includes(expectedText) || /[�]|пїЅ|Р[Ґ›џЎЏЋЊЉЄ]/.test(content)) {
    throw new Error(`Expected readable UTF-8 Russian text in ${file}.`);
  }
}

const palmistryHtml = fs.readFileSync(path.join(projectRoot, "site/public/palmistry.html"), "utf8");
if (palmistryHtml.includes('name="handShape"') || !palmistryHtml.includes("palmistry.js?v=20260613-4")) {
  throw new Error("Expected palmistry hand shape to be photo-detected and the current script version to load.");
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

if (!jewish.hebrewCalendar?.sunsetUtc || jewish.sourceFrame.limitation.includes("пока не рассчитываются")) {
  throw new Error("Expected Jewish calendar to calculate Hebrew date and sunset.");
}

const jewishAfterSunset = calculateJewish({
  name: "Jewish Sunset Validation",
  localDate: "1990-04-10",
  localTime: "23:30",
  placeKey: "chisinau-md",
});

if (!jewishAfterSunset.hebrewCalendar.afterSunset || jewishAfterSunset.hebrewCalendar.day <= jewish.hebrewCalendar.day) {
  throw new Error("Expected Jewish calendar day to advance after local sunset.");
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

const palmistry = calculatePalmistry({
  handSide: "dominant",
  handShape: "earth",
  hasPhoto: true,
  imageMetrics: { brightness: 45, contrast: 22, sharpness: 18 },
  autoReading: {
    confidence: 66,
    handShape: "earth",
    handShapeTitle: "земная",
    summary: "Авторазметка обнаружила плотную земную руку и контрастные основные линии.",
  },
  lines: {
    heart: ["long_clear"],
    head: ["long_clear", "straight"],
    life: ["deep", "wide_arc"],
    fate: ["weak"],
  },
  mounts: ["venus", "jupiter"],
});

if (!palmistry.dominantTone?.length || palmistry.lines.length !== 4 || !palmistry.boldHypotheses?.length || !palmistry.futureForecast?.length || !palmistry.safetyNote || !palmistry.recognitionReadiness || !palmistry.autoReading || !palmistry.recognizedTraits?.length || palmistry.monthlyAdvice.length < 1900 || palmistry.monthlyAdviceSections?.length !== 10) {
  throw new Error("Expected palmistry tone, four line readings, hypotheses, future forecast, recognized traits, long monthly advice, auto reading, and safety note.");
}

if (typeof answerAiChat !== "function") {
  throw new Error("Expected AI chat answer function.");
}

console.log("Site validation passed.");
