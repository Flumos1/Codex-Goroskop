const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const rulesDir = path.join(projectRoot, "generator", "rules");
const graphDir = path.join(projectRoot, "data", "knowledge-graph");

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--id") args.id = argv[++i];
    else if (arg === "--query") args.query = argv[++i];
    else if (arg === "--json") args.json = true;
  }
  return args;
}

function normalize(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readJsonl(filePath) {
  const text = fs.readFileSync(filePath, "utf8").trim();
  if (!text) return [];
  return text.split(/\n/).map((line) => JSON.parse(line));
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
    ...(rule.themesRu || []),
  ].join(" "));
}

function loadRules() {
  return fs
    .readdirSync(rulesDir)
    .filter((name) => name.endsWith(".json"))
    .flatMap((name) => {
      const filePath = path.join(rulesDir, name);
      return JSON.parse(fs.readFileSync(filePath, "utf8")).map((rule) => ({
        ...rule,
        _file: path.relative(projectRoot, filePath),
      }));
    });
}

function findRule(rules, args) {
  if (args.id) return rules.find((rule) => rule.id === args.id);
  const query = normalize(args.query);
  if (!query) return null;
  return rules.find((rule) => searchableText(rule).includes(query)) || null;
}

function findGraphRule(nodes, args) {
  const candidates = nodes.filter((node) => node.type === "rule");
  if (args.id) return candidates.find((node) => node.id === args.id);
  const query = normalize(args.query);
  if (!query) return null;
  return candidates.find((node) => normalize(`${node.id} ${node.label}`).includes(query)) || null;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.id && !args.query) {
    console.error("Use --id rule-id or --query \"Moon square Saturn\".");
    process.exit(1);
  }

  const rules = loadRules();
  const nodes = readJsonl(path.join(graphDir, "nodes.jsonl"));
  const edges = readJsonl(path.join(graphDir, "edges.jsonl"));
  const rule = findRule(rules, args);
  const graphOnlyRule = rule ? null : findGraphRule(nodes, args);
  if (!rule && !graphOnlyRule) {
    console.error(`Rule not found: ${args.id || args.query}`);
    process.exit(1);
  }

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const ruleId = rule?.id || graphOnlyRule.id;
  const relatedEdges = edges.filter((edge) => edge.from === ruleId || edge.to === ruleId || (edge.sourceIds || []).includes(ruleId));
  const sourceIds = rule?.sourceIds?.length
    ? rule.sourceIds
    : [...new Set(relatedEdges.flatMap((edge) => edge.sourceIds || []))];
  const sourceNodes = sourceIds.map((sourceId) => nodeById.get(sourceId)).filter(Boolean);
  const ruleNode = nodeById.get(ruleId) || null;

  const trace = {
    id: ruleId,
    label: rule ? factorLabel(rule) : graphOnlyRule.label,
    file: rule?._file || null,
    system: rule?.system || graphOnlyRule.system,
    methodFamily: rule?.methodFamily || null,
    confidence: rule?.confidence || null,
    sourceRule: rule?.sourceRule || null,
    sourceRules: rule?.sourceRules || [],
    sourceIds,
    sourceNodes,
    themes: rule?.themes || [],
    graphNode: ruleNode,
    relatedEdges,
  };

  if (args.json) {
    console.log(JSON.stringify(trace, null, 2));
    return;
  }

  console.log(`# ${trace.label}`);
  console.log("");
  console.log(`- Rule ID: ${trace.id}`);
  console.log(`- File: ${trace.file || "graph-only rule"}`);
  console.log(`- System: ${trace.system}`);
  console.log(`- Method: ${trace.methodFamily || "n/a"}`);
  console.log(`- Confidence: ${trace.confidence || "n/a"}`);
  console.log(`- Source rule: ${trace.sourceRule || trace.sourceRules.join("; ") || "n/a"}`);
  console.log(`- Source IDs: ${trace.sourceIds.join(", ") || "n/a"}`);
  console.log("");
  console.log("## Sources");
  for (const source of sourceNodes) {
    console.log(`- ${source.id}: ${source.label} (${source.category || source.system || "uncategorized"})`);
  }
  if (!sourceNodes.length) console.log("- none");
  console.log("");
  console.log("## Graph Links");
  for (const edge of relatedEdges) {
    console.log(`- ${edge.from} --${edge.type}--> ${edge.to}`);
  }
  if (!relatedEdges.length) console.log("- none");
}

main();
