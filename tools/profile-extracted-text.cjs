const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const extractedDir = path.join(projectRoot, "data", "extracted-text");
const outputDir = path.join(projectRoot, "research", "source-profiles");

const stopWords = new Set(
  [
    "что", "это", "как", "для", "или", "при", "его", "она", "они", "все", "так", "уже", "еще",
    "the", "and", "for", "with", "that", "this", "from", "are", "was", "were",
    "астрология", "астрологии", "гороскоп", "карта", "книга"
  ]
);

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

function findTextFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...findTextFiles(fullPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".txt")) {
      result.push(fullPath);
    }
  }
  return result;
}

function termFrequency(text) {
  const words = text
    .toLowerCase()
    .match(/[\p{L}]{4,}/gu) || [];

  const counts = new Map();
  for (const word of words) {
    if (stopWords.has(word)) continue;
    counts.set(word, (counts.get(word) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40)
    .map(([term, count]) => ({ term, count }));
}

function possibleHeadings(text) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 6 && line.length <= 90)
    .filter((line) =>
      /^(глава|часть|раздел|урок|[0-9]+[.)]\s+|[IVX]+[.)]\s+)/i.test(line) ||
      /^[А-ЯЁA-Z][А-ЯЁA-Z\s.,:;-]{8,}$/.test(line)
    )
    .slice(0, 80);
}

function profile(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const baseName = path.basename(filePath, ".txt");
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const firstLines = lines.slice(0, 40);
  const headings = possibleHeadings(text);
  const topTerms = termFrequency(text);

  return {
    baseName,
    filePath,
    charCount: text.length,
    lineCount: lines.length,
    firstLines,
    headings,
    topTerms,
  };
}

function renderMarkdown(data) {
  return [
    `# Source Profile: ${data.baseName}`,
    "",
    `- Text file: ${data.filePath}`,
    `- Characters: ${data.charCount}`,
    `- Non-empty lines: ${data.lineCount}`,
    "",
    "## First Lines",
    "",
    ...data.firstLines.map((line) => `- ${line}`),
    "",
    "## Possible Headings",
    "",
    ...(data.headings.length ? data.headings.map((line) => `- ${line}`) : ["- No headings detected."]),
    "",
    "## Top Terms",
    "",
    ...data.topTerms.map((item) => `- ${item.term}: ${item.count}`),
    "",
  ].join("\n");
}

function main() {
  const args = process.argv.slice(2);
  const fileIndex = args.indexOf("--file");
  const all = args.includes("--all");

  let files = [];
  if (all) {
    files = findTextFiles(extractedDir);
  } else if (fileIndex !== -1 && args[fileIndex + 1]) {
    files = [path.resolve(args[fileIndex + 1])];
  } else {
    console.log("Usage:");
    console.log("  node ./tools/profile-extracted-text.cjs --all");
    console.log("  node ./tools/profile-extracted-text.cjs --file \"path/to/text.txt\"");
    process.exit(0);
  }

  ensureDir(outputDir);

  for (const file of files) {
    const data = profile(file);
    const outPath = path.join(outputDir, `${slugify(data.baseName)}.md`);
    fs.writeFileSync(outPath, renderMarkdown(data), "utf8");
    console.log(`Profile written: ${outPath}`);
  }
}

main();
