const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const libraryDir = path.join(projectRoot, "sources", "books", "library");
const extractedDir = path.join(projectRoot, "data", "extracted-text");
const ocrRunDir = path.join(projectRoot, "data", "ocr-runs");
const ocrPageCacheDir = path.join(projectRoot, "data", "ocr-page-cache");

const defaultTesseract = "C:\\Program Files\\Tesseract-OCR\\tesseract.exe";
const defaultMagick = "C:\\Program Files\\ImageMagick-7.1.2-Q16-HDRI\\magick.exe";
const defaultGhostscript = "C:\\Program Files\\gs\\gs10.07.1\\bin\\gswin64c.exe";

function parseArgs(argv) {
  const args = {
    dpi: 220,
    lang: "rus+eng",
    force: false,
    all: false,
    limit: null,
    psm: "3",
    priority: false,
    tesseract: process.env.TESSERACT_PATH || defaultTesseract,
    magick: process.env.MAGICK_PATH || defaultMagick,
    ghostscript: process.env.GHOSTSCRIPT_PATH || defaultGhostscript,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--all") args.all = true;
    else if (arg === "--priority") args.priority = true;
    else if (arg === "--file") args.file = argv[++i];
    else if (arg === "--limit") args.limit = Number(argv[++i]);
    else if (arg === "--dpi") args.dpi = Number(argv[++i]);
    else if (arg === "--lang") args.lang = argv[++i];
    else if (arg === "--psm") args.psm = argv[++i];
    else if (arg === "--force") args.force = true;
    else if (arg === "--log") args.log = argv[++i];
    else if (arg === "--tesseract") args.tesseract = argv[++i];
    else if (arg === "--magick") args.magick = argv[++i];
    else if (arg === "--ghostscript") args.ghostscript = argv[++i];
  }

  return args;
}

let logFile = null;

function setLogFile(filePath) {
  logFile = filePath ? path.resolve(filePath) : null;
  if (logFile) {
    ensureDir(path.dirname(logFile));
    fs.appendFileSync(logFile, `\n--- OCR run ${new Date().toISOString()} ---\n`, "utf8");
  }
}

function log(message) {
  const line = String(message);
  if (logFile) fs.appendFileSync(logFile, `${line}\n`, "utf8");
  else console.log(line);
}

function logError(message) {
  const line = String(message);
  if (logFile) fs.appendFileSync(logFile, `${line}\n`, "utf8");
  else console.error(line);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function slugify(input) {
  return input
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function categoryFor(filePath) {
  const marker = `${path.sep}library${path.sep}`;
  const index = filePath.indexOf(marker);
  if (index === -1) return "uncategorized";
  const rest = filePath.slice(index + marker.length);
  return rest.split(path.sep)[0] || "uncategorized";
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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function metaPathForPdf(filePath) {
  const category = categoryFor(filePath);
  const baseName = path.basename(filePath, ".pdf");
  return path.join(extractedDir, category, `${slugify(baseName)}.json`);
}

function textPathForPdf(filePath) {
  const category = categoryFor(filePath);
  const baseName = path.basename(filePath, ".pdf");
  return path.join(extractedDir, category, `${slugify(baseName)}.txt`);
}

function statusPathForPdf(filePath) {
  const category = categoryFor(filePath);
  const baseName = path.basename(filePath, ".pdf");
  return path.join(ocrRunDir, category, `${slugify(baseName)}.json`);
}

function pageCacheDirForPdf(filePath) {
  const category = categoryFor(filePath);
  const baseName = path.basename(filePath, ".pdf");
  return path.join(ocrPageCacheDir, category, slugify(baseName));
}

function existingCharCount(filePath) {
  const metaPath = metaPathForPdf(filePath);
  if (!fs.existsSync(metaPath)) return null;
  return readJson(metaPath).charCount || 0;
}

function pageCount(filePath) {
  const metaPath = metaPathForPdf(filePath);
  if (fs.existsSync(metaPath)) return readJson(metaPath).pages || null;
  return null;
}

function assertExecutable(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} not found: ${filePath}`);
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: options.encoding || "utf8",
    maxBuffer: options.maxBuffer || 64 * 1024 * 1024,
  });
  if (result.status !== 0) {
    const stderr = (result.stderr || "").trim();
    const stdout = (result.stdout || "").trim();
    throw new Error(`${path.basename(command)} failed: ${stderr || stdout || `exit ${result.status}`}`);
  }
  return result;
}

function cleanText(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function priorityRank(filePath) {
  const name = path.basename(filePath).toLowerCase();
  const category = categoryFor(filePath);
  if (name.includes("тайный язык дня рождения")) return 1;
  if (name.includes("48 кармических")) return 2;
  if (name.includes("гороскоп любви")) return 3;
  if (name.includes("астрология успеха")) return 4;
  if (name.includes("ректификация")) return 5;
  if (name.includes("прогностическая астрология")) return 6;
  if (name.includes("символические дирекции")) return 7;
  if (category === "09-chinese-eastern-astrology") return 8;
  if (category === "05-vedic-jyotish") return 9;
  if (category === "12-applied-esoteric-talismans-calendar") return 10;
  return 50;
}

function targets(args) {
  let files = [];
  if (args.file) {
    files = [path.resolve(args.file)];
  } else if (args.all || args.priority) {
    files = findPdfs(libraryDir).filter((filePath) => existingCharCount(filePath) === 0);
  } else {
    throw new Error("Usage: node tools/ocr-pdf-text.cjs --all | --priority | --file <pdf>");
  }

  if (!args.force) {
    files = files.filter((filePath) => {
      const statusPath = statusPathForPdf(filePath);
      if (!fs.existsSync(statusPath)) return true;
      const status = readJson(statusPath);
      return status.status !== "ok" || !status.charCount;
    });
  }

  files.sort((a, b) => priorityRank(a) - priorityRank(b) || path.basename(a).localeCompare(path.basename(b), "ru"));
  if (args.limit) files = files.slice(0, args.limit);
  return files;
}

function renderPage(args, filePath, pageNumber, outPng) {
  // ImageMagick delegates PDF rendering to Ghostscript and keeps the command line compact.
  run(args.magick, [
    "-density",
    String(args.dpi),
    `${filePath}[${pageNumber - 1}]`,
    "-alpha",
    "remove",
    "-colorspace",
    "Gray",
    "-resize",
    "1800x2400>",
    outPng,
  ]);
}

function ocrImage(args, imagePath) {
  const result = run(args.tesseract, [imagePath, "stdout", "-l", args.lang, "--psm", args.psm], {
    maxBuffer: 16 * 1024 * 1024,
  });
  return result.stdout || "";
}

function ocrOne(args, filePath) {
  const category = categoryFor(filePath);
  const pages = pageCount(filePath);
  if (!pages) throw new Error(`Unknown page count; run npm run extract:pdf first: ${filePath}`);

  const outCategory = path.join(extractedDir, category);
  const statusCategory = path.join(ocrRunDir, category);
  ensureDir(outCategory);
  ensureDir(statusCategory);

  const textPath = textPathForPdf(filePath);
  const metaPath = metaPathForPdf(filePath);
  const statusPath = statusPathForPdf(filePath);
  const pageCacheDir = pageCacheDirForPdf(filePath);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-goroskop-ocr-"));
  ensureDir(pageCacheDir);

  const startedAt = new Date().toISOString();
  const pageTexts = [];
  const errors = [];

  try {
    for (let page = 1; page <= pages; page += 1) {
      const imagePath = path.join(tmpDir, `page-${String(page).padStart(4, "0")}.png`);
      const pageCachePath = path.join(pageCacheDir, `page-${String(page).padStart(4, "0")}.txt`);
      try {
        let pageText = "";
        if (!args.force && fs.existsSync(pageCachePath)) {
          pageText = fs.readFileSync(pageCachePath, "utf8");
        } else {
          renderPage(args, filePath, page, imagePath);
          pageText = cleanText(ocrImage(args, imagePath));
          fs.writeFileSync(pageCachePath, pageText, "utf8");
        }
        pageTexts.push(`\n\n[[page ${page}]]\n\n${pageText}`);
      } catch (error) {
        errors.push({ page, error: error.message });
        pageTexts.push(`\n\n[[page ${page} OCR_ERROR]]\n\n`);
      } finally {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      }

      if (page === 1 || page % 25 === 0 || page === pages) {
        log(`${path.basename(filePath)}: ${page}/${pages} pages`);
        fs.writeFileSync(
          statusPath,
          JSON.stringify(
            {
              status: "running",
              sourcePdf: filePath,
              category,
              pages,
              processedPages: page,
              errors,
              updatedAt: new Date().toISOString(),
            },
            null,
            2
          ),
          "utf8"
        );
      }
    }

    const text = cleanText(pageTexts.join("\n"));
    fs.writeFileSync(textPath, text, "utf8");

    const oldMeta = fs.existsSync(metaPath) ? readJson(metaPath) : {};
    const meta = {
      ...oldMeta,
      sourcePdf: filePath,
      category,
      pages,
      textFile: textPath,
      charCount: text.length,
      ocr: {
        engine: "tesseract",
        language: args.lang,
        dpi: args.dpi,
        startedAt,
        finishedAt: new Date().toISOString(),
        errors,
      },
    };
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf8");

    const status = {
      status: errors.length ? "partial" : "ok",
      sourcePdf: filePath,
      category,
      pages,
      charCount: text.length,
      errors,
      textFile: textPath,
      finishedAt: meta.ocr.finishedAt,
    };
    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2), "utf8");
    return status;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  setLogFile(args.log);
  assertExecutable(args.tesseract, "Tesseract");
  assertExecutable(args.magick, "ImageMagick");
  assertExecutable(args.ghostscript, "Ghostscript");
  ensureDir(ocrRunDir);
  ensureDir(ocrPageCacheDir);

  const files = targets(args);
  log(`OCR targets: ${files.length}`);

  const results = [];
  for (const filePath of files) {
    log(`\nOCR: ${categoryFor(filePath)} / ${path.basename(filePath)}`);
    try {
      results.push(ocrOne(args, filePath));
    } catch (error) {
      const statusPath = statusPathForPdf(filePath);
      ensureDir(path.dirname(statusPath));
      const status = {
        status: "failed",
        sourcePdf: filePath,
        category: categoryFor(filePath),
        error: error.message,
        finishedAt: new Date().toISOString(),
      };
      fs.writeFileSync(statusPath, JSON.stringify(status, null, 2), "utf8");
      results.push(status);
      logError(`FAILED: ${error.message}`);
    }
  }

  const ok = results.filter((result) => result.status === "ok").length;
  const partial = results.filter((result) => result.status === "partial").length;
  const failed = results.filter((result) => result.status === "failed").length;
  log(`\nOCR finished: ok=${ok}, partial=${partial}, failed=${failed}`);
}

main();
