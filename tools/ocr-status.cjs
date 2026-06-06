const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const libraryDir = path.join(projectRoot, "sources", "books", "library");
const extractedDir = path.join(projectRoot, "data", "extracted-text");
const ocrRunDir = path.join(projectRoot, "data", "ocr-runs");

function slugify(input) {
  return input
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function findPdfs(dir) {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...findPdfs(fullPath));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".pdf")) result.push(fullPath);
  }
  return result;
}

function categoryFor(filePath) {
  const marker = `${path.sep}library${path.sep}`;
  const index = filePath.indexOf(marker);
  if (index === -1) return "uncategorized";
  const rest = filePath.slice(index + marker.length);
  return rest.split(path.sep)[0] || "uncategorized";
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function metaPathForPdf(filePath) {
  const category = categoryFor(filePath);
  const baseName = path.basename(filePath, ".pdf");
  return path.join(extractedDir, category, `${slugify(baseName)}.json`);
}

function statusPathForPdf(filePath) {
  const category = categoryFor(filePath);
  const baseName = path.basename(filePath, ".pdf");
  return path.join(ocrRunDir, category, `${slugify(baseName)}.json`);
}

function statusFor(filePath) {
  const metaPath = metaPathForPdf(filePath);
  const statusPath = statusPathForPdf(filePath);
  const meta = fs.existsSync(metaPath) ? readJson(metaPath) : null;
  const status = fs.existsSync(statusPath) ? readJson(statusPath) : null;
  const charCount = meta?.charCount || 0;
  if (charCount > 0) return { state: meta?.ocr ? "ocr-readable" : "text-readable", charCount, status };
  if (status?.status) return { state: `ocr-${status.status}`, charCount, status };
  return { state: "ocr-required", charCount, status };
}

const byCategory = {};
const totals = {
  pdfs: 0,
  textReadable: 0,
  ocrReadable: 0,
  ocrRequired: 0,
  ocrRunning: 0,
  ocrPartial: 0,
  ocrFailed: 0,
};

for (const filePath of findPdfs(libraryDir)) {
  const category = categoryFor(filePath);
  byCategory[category] ||= { pdfs: 0, textReadable: 0, ocrReadable: 0, ocrRequired: 0, ocrRunning: 0, ocrPartial: 0, ocrFailed: 0 };
  const state = statusFor(filePath).state;
  totals.pdfs += 1;
  byCategory[category].pdfs += 1;

  if (state === "text-readable") {
    totals.textReadable += 1;
    byCategory[category].textReadable += 1;
  } else if (state === "ocr-readable") {
    totals.ocrReadable += 1;
    byCategory[category].ocrReadable += 1;
  } else if (state === "ocr-partial") {
    totals.ocrPartial += 1;
    byCategory[category].ocrPartial += 1;
  } else if (state === "ocr-running") {
    totals.ocrRunning += 1;
    byCategory[category].ocrRunning += 1;
  } else if (state === "ocr-failed") {
    totals.ocrFailed += 1;
    byCategory[category].ocrFailed += 1;
  } else {
    totals.ocrRequired += 1;
    byCategory[category].ocrRequired += 1;
  }
}

console.log(JSON.stringify({ totals, byCategory }, null, 2));
