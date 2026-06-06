const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");

const graphDir = path.join(projectRoot, "data", "knowledge-graph");
const rulesDir = path.join(projectRoot, "generator", "rules");
const profilesDir = path.join(projectRoot, "generator", "profiles");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readJsonl(filePath) {
  const text = fs.readFileSync(filePath, "utf8").trim();
  if (!text) return [];
  return text.split(/\n/).map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(`${filePath}:${index + 1}: ${error.message}`);
    }
  });
}

function listFiles(dir, extension) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(extension))
    .map((name) => path.join(dir, name));
}

function normalize(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function factorLabel(rule) {
  if (rule.factor?.aspect) return `${rule.factor.planetA} ${rule.factor.aspect} ${rule.factor.planetB}`;
  if (rule.factor?.planet) return `${rule.factor.planet} in ${rule.factor.house}th house`;
  if (rule.factor?.reportType) return `${rule.system} ${rule.factor.reportType}`;
  return rule.id;
}

function searchableText(rule) {
  return normalize([
    rule.id,
    rule.system,
    rule.methodFamily,
    factorLabel(rule),
    ...(rule.themes || []),
  ].join(" "));
}

function findRule(rules, query) {
  const normalized = normalize(query);
  return rules.find((rule) => searchableText(rule).includes(normalized));
}

function required(value, label, errors) {
  if (value === undefined || value === null || value === "") errors.push(`Missing ${label}`);
}

function validateRule(rule, filePath, errors) {
  const prefix = `${path.relative(projectRoot, filePath)}:${rule.id || "<missing-id>"}`;
  required(rule.id, `${prefix}.id`, errors);
  required(rule.system, `${prefix}.system`, errors);
  required(rule.methodFamily, `${prefix}.methodFamily`, errors);
  required(rule.factor, `${prefix}.factor`, errors);
  required(rule.sourceIds, `${prefix}.sourceIds`, errors);
  required(rule.themes, `${prefix}.themes`, errors);
  required(rule.simple, `${prefix}.simple`, errors);
  required(rule.advanced, `${prefix}.advanced`, errors);
  required(rule.confidence, `${prefix}.confidence`, errors);

  for (const field of ["summary", "pattern", "growth", "reflection"]) {
    required(rule.simple?.[field], `${prefix}.simple.${field}`, errors);
  }

  for (const field of ["technical", "method", "caution", "constructiveChannel"]) {
    required(rule.advanced?.[field], `${prefix}.advanced.${field}`, errors);
  }
}

function main() {
  const errors = [];
  const warnings = [];

  const nodes = readJsonl(path.join(graphDir, "nodes.jsonl"));
  const edges = readJsonl(path.join(graphDir, "edges.jsonl"));
  const nodeIds = new Set(nodes.map((node) => node.id));

  for (const node of nodes) {
    if (!node.id) errors.push("Graph node missing id");
    if (!node.type) errors.push(`Graph node ${node.id} missing type`);
    if (!node.label) warnings.push(`Graph node ${node.id} missing label`);
  }

  for (const edge of edges) {
    if (!edge.from || !edge.to || !edge.type) {
      errors.push(`Graph edge missing from/to/type: ${JSON.stringify(edge)}`);
      continue;
    }
    if (!nodeIds.has(edge.from)) warnings.push(`Graph edge from missing node: ${edge.from}`);
    if (!nodeIds.has(edge.to)) warnings.push(`Graph edge to missing node: ${edge.to}`);
    for (const sourceId of edge.sourceIds || []) {
      if (!nodeIds.has(sourceId)) warnings.push(`Graph edge sourceId missing node: ${sourceId}`);
    }
  }

  const ruleFiles = listFiles(rulesDir, ".json");
  const rules = [];
  for (const filePath of ruleFiles) {
    const fileRules = readJson(filePath);
    if (!Array.isArray(fileRules)) errors.push(`${path.relative(projectRoot, filePath)} must contain a JSON array`);
    for (const rule of fileRules) {
      validateRule(rule, filePath, errors);
      rules.push(rule);
      if (!nodeIds.has(rule.id)) warnings.push(`Rule missing graph node: ${rule.id}`);
      for (const sourceId of rule.sourceIds || []) {
        if (!nodeIds.has(sourceId)) warnings.push(`Rule sourceId missing graph node: ${sourceId}`);
      }
    }
  }

  const ruleIds = new Set(rules.map((rule) => rule.id));
  for (const profilePath of listFiles(profilesDir, ".json")) {
    const profile = readJson(profilePath);
    if (!Array.isArray(profile.factors)) errors.push(`${path.relative(projectRoot, profilePath)} missing factors array`);
    for (const factor of profile.factors || []) {
      if (factor.id && !ruleIds.has(factor.id)) {
        errors.push(`${path.relative(projectRoot, profilePath)} references unknown rule id: ${factor.id}`);
      }
      if (factor.query && !findRule(rules, factor.query)) {
        errors.push(`${path.relative(projectRoot, profilePath)} query does not resolve: ${factor.query}`);
      }
    }
  }

  console.log(`Graph nodes: ${nodes.length}`);
  console.log(`Graph edges: ${edges.length}`);
  console.log(`Generator rules: ${rules.length}`);
  console.log(`Profiles: ${listFiles(profilesDir, ".json").length}`);

  if (warnings.length) {
    console.log("");
    console.log("Warnings:");
    for (const warning of warnings) console.log(`- ${warning}`);
  }

  if (errors.length) {
    console.log("");
    console.log("Errors:");
    for (const error of errors) console.log(`- ${error}`);
    process.exit(1);
  }

  console.log("");
  console.log("Validation passed.");
}

main();
