const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const graphDir = path.join(projectRoot, "data", "knowledge-graph");
const nodesPath = path.join(graphDir, "nodes.jsonl");
const edgesPath = path.join(graphDir, "edges.jsonl");

function writeJsonl(filePath, rows) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, rows.map((row) => JSON.stringify(row)).join("\n") + "\n", "utf8");
}

const nodes = [
  { id: "tradition.western", type: "tradition", label: "Western Astrology", system: "western", status: "draft" },
  { id: "tradition.vedic", type: "tradition", label: "Vedic Astrology / Jyotish", system: "vedic", status: "draft" },
  { id: "tradition.psychological", type: "tradition", label: "Psychological Astrology", system: "western", status: "draft" },
  { id: "theme.identity", type: "theme", label: "Identity", system: "shared", status: "draft" },
  { id: "theme.emotion", type: "theme", label: "Emotion and Need", system: "shared", status: "draft" },
  { id: "theme.boundary", type: "theme", label: "Boundary and Responsibility", system: "shared", status: "draft" },
  { id: "theme.transformation", type: "theme", label: "Transformation", system: "shared", status: "draft" },
  { id: "western.planet.sun", type: "concept", label: "Sun", system: "western", status: "draft" },
  { id: "western.planet.moon", type: "concept", label: "Moon", system: "western", status: "draft" },
  { id: "western.planet.saturn", type: "concept", label: "Saturn", system: "western", status: "draft" },
  { id: "western.planet.pluto", type: "concept", label: "Pluto", system: "western", status: "draft" },
  { id: "vedic.concept.graha", type: "concept", label: "Graha", system: "vedic", status: "draft" },
  { id: "vedic.concept.nakshatra", type: "concept", label: "Nakshatra", system: "vedic", status: "draft" },
  { id: "caution.no-medical-diagnosis", type: "caution", label: "No Medical Diagnosis", system: "shared", status: "active" },
  { id: "caution.no-guaranteed-prediction", type: "caution", label: "No Guaranteed Prediction", system: "shared", status: "active" }
];

const edges = [
  { from: "western.planet.sun", to: "tradition.western", type: "belongs_to", confidence: "high", sourceIds: [], notes: "" },
  { from: "western.planet.moon", to: "tradition.western", type: "belongs_to", confidence: "high", sourceIds: [], notes: "" },
  { from: "western.planet.saturn", to: "tradition.western", type: "belongs_to", confidence: "high", sourceIds: [], notes: "" },
  { from: "western.planet.pluto", to: "tradition.western", type: "belongs_to", confidence: "high", sourceIds: [], notes: "" },
  { from: "vedic.concept.graha", to: "tradition.vedic", type: "belongs_to", confidence: "high", sourceIds: [], notes: "" },
  { from: "vedic.concept.nakshatra", to: "tradition.vedic", type: "belongs_to", confidence: "high", sourceIds: [], notes: "" },
  { from: "western.planet.sun", to: "theme.identity", type: "symbolizes", confidence: "medium", sourceIds: [], notes: "Seed interpretation; refine after source extraction." },
  { from: "western.planet.moon", to: "theme.emotion", type: "symbolizes", confidence: "medium", sourceIds: [], notes: "Seed interpretation; refine after source extraction." },
  { from: "western.planet.saturn", to: "theme.boundary", type: "symbolizes", confidence: "medium", sourceIds: [], notes: "Seed interpretation; refine after source extraction." },
  { from: "western.planet.pluto", to: "theme.transformation", type: "symbolizes", confidence: "medium", sourceIds: [], notes: "Seed interpretation; refine after source extraction." },
  { from: "caution.no-medical-diagnosis", to: "generator.report", type: "limits", confidence: "high", sourceIds: [], notes: "Safety boundary for all report modes." },
  { from: "caution.no-guaranteed-prediction", to: "generator.report", type: "limits", confidence: "high", sourceIds: [], notes: "Safety boundary for all forecasting language." }
];

writeJsonl(nodesPath, nodes);
writeJsonl(edgesPath, edges);

console.log(`Wrote ${nodes.length} nodes to ${nodesPath}`);
console.log(`Wrote ${edges.length} edges to ${edgesPath}`);
