const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");

const projectRoot = path.resolve(__dirname, "..");
const libraryDir = path.join(projectRoot, "sources", "books", "library");
const outputDir = path.join(projectRoot, "data", "extracted-text");

const supportedArgs = new Set(["--all", "--file"]);
const args = process.argv.slice(2);

function usage() {
  console.log("Usage:");
  console.log("  npm run extract:pdf -- --all");
  console.log("  npm run extract:pdf -- --file \"path/to/book.pdf\"");
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

function findPdfs(dir) {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...findPdfs(fullPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".pdf")) {
      result.push(fullPath);
    }
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

async function extractOne(filePath) {
  const data = fs.readFileSync(filePath);
  const parsed = await pdf(data);
  const category = categoryFor(filePath);
  const baseName = path.basename(filePath, ".pdf");
  const outCategory = path.join(outputDir, category);
  ensureDir(outCategory);

  const textPath = path.join(outCategory, `${slugify(baseName)}.txt`);
  const metaPath = path.join(outCategory, `${slugify(baseName)}.json`);

  const cleanText = parsed.text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();

  fs.writeFileSync(textPath, cleanText, "utf8");
  fs.writeFileSync(
    metaPath,
    JSON.stringify(
      {
        sourcePdf: filePath,
        category,
        pages: parsed.numpages,
        info: parsed.info || {},
        metadata: parsed.metadata || null,
        extractedAt: new Date().toISOString(),
        textFile: textPath,
        charCount: cleanText.length,
      },
      null,
      2
    ),
    "utf8"
  );

  return { filePath, category, pages: parsed.numpages, charCount: cleanText.length, textPath };
}

async function main() {
  if (args.length === 0 || args.some((arg) => arg.startsWith("--") && !supportedArgs.has(arg))) {
    usage();
    process.exit(args.length === 0 ? 0 : 1);
  }

  let files = [];
  const allIndex = args.indexOf("--all");
  const fileIndex = args.indexOf("--file");

  if (allIndex !== -1) {
    files = findPdfs(libraryDir);
  } else if (fileIndex !== -1 && args[fileIndex + 1]) {
    files = [path.resolve(args[fileIndex + 1])];
  } else {
    usage();
    process.exit(1);
  }

  ensureDir(outputDir);

  for (const file of files) {
    try {
      const result = await extractOne(file);
      console.log(`${result.category}: ${path.basename(file)} -> ${result.pages} pages, ${result.charCount} chars`);
    } catch (error) {
      console.error(`FAILED: ${file}`);
      console.error(error.message);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
