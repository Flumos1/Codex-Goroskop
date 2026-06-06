const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const ruleFiles = [
  path.join(projectRoot, "generator", "rules", "psychological-aspects.json"),
  path.join(projectRoot, "generator", "rules", "psychological-house-placements.json"),
  path.join(projectRoot, "generator", "rules", "compatibility-report-framework.json"),
  path.join(projectRoot, "generator", "rules", "vedic-report-framework.json"),
];
const outputDir = path.join(projectRoot, "generator", "samples");

function renderRule(rule) {
  const factorLabel = rule.factor.aspect
    ? `${rule.factor.planetA} ${rule.factor.aspect} ${rule.factor.planetB}`
    : rule.factor.planet
      ? `${rule.factor.planet} in ${rule.factor.house}th house`
      : `${rule.system} ${rule.factor.reportType}`;

  return [
    `# Sample Report: ${factorLabel}`,
    "",
    `- System: ${rule.system}`,
    `- Method family: ${rule.methodFamily}`,
    `- Confidence: ${rule.confidence}`,
    `- Source rule: ${rule.sourceRule || (rule.sourceRules || []).join(", ")}`,
    `- Source IDs: ${rule.sourceIds.join(", ")}`,
    "",
    "## Simple Explanation",
    "",
    rule.simple.summary,
    "",
    rule.simple.pattern,
    "",
    rule.simple.growth,
    "",
    `Reflection: ${rule.simple.reflection}`,
    "",
    "## Advanced Explanation",
    "",
    rule.advanced.technical,
    "",
    rule.advanced.method,
    "",
    rule.advanced.caution,
    "",
    rule.advanced.constructiveChannel,
    "",
  ].join("\n");
}

fs.mkdirSync(outputDir, { recursive: true });

const rules = ruleFiles.flatMap((filePath) => JSON.parse(fs.readFileSync(filePath, "utf8")));
for (const rule of rules) {
  const name = rule.factor.aspect
    ? `${rule.factor.planetA}-${rule.factor.aspect}-${rule.factor.planetB}.md`.toLowerCase()
    : rule.factor.planet
      ? `${rule.factor.planet}-in-${rule.factor.house}th-house.md`.toLowerCase()
      : `${rule.system}-${rule.factor.reportType}.md`.toLowerCase();
  const outputPath = path.join(outputDir, name);
  fs.writeFileSync(outputPath, renderRule(rule), "utf8");
  console.log(`Sample written: ${outputPath}`);
}
