/**
 * Assemble the Cloudflare Workers static-assets directory (workers/dist):
 *   - copies the frontend from site/public/
 *   - writes minified data bundles into dist/_data/ (served to the Worker
 *     via the ASSETS binding only; direct /_data/* requests get 404 from
 *     the Worker because of run_worker_first)
 *
 * Bundles:
 *   _data/rules-all.json      — every generator rule array concatenated
 *                               (server-side index + availableRuleQueries)
 *   _data/transit-rules.json  — slow + fast transit rules (transit engine)
 *   _data/compatibility.json  — Goldschneider periods + pairs
 *   _data/places.json         — birth places
 *
 * Usage: node workers/scripts/build-assets.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const rulesDir = path.join(root, "generator", "rules");
const publicDir = path.join(root, "site", "public");
const distDir = path.join(root, "workers", "dist");
const dataDir = path.join(distDir, "_data");

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(dataDir, { recursive: true });

// 1. Frontend
fs.cpSync(publicDir, distDir, { recursive: true });

// Security headers for directly-served static assets (requests that match an
// asset never invoke the Worker, so the Worker can't append headers there).
fs.writeFileSync(path.join(distDir, "_headers"), `/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: no-referrer
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'
`, "utf8");

// 2. Rule bundles (minified: JSON.stringify without indentation)
const written = [];
function writeJson(name, value) {
  const out = path.join(dataDir, name);
  const text = JSON.stringify(value);
  fs.writeFileSync(out, text, "utf8");
  written.push(`${name}  ${(text.length / 1048576).toFixed(2)} MB`);
}

const allRules = [];
for (const name of fs.readdirSync(rulesDir).filter(f => f.endsWith(".json"))) {
  const raw = JSON.parse(fs.readFileSync(path.join(rulesDir, name), "utf8"));
  const list = Array.isArray(raw) ? raw : (raw.rules || []);
  allRules.push(...list);
}
writeJson("rules-all.json", allRules);

const transitRules = JSON.parse(fs.readFileSync(path.join(rulesDir, "psychological-transit-rules.json"), "utf8"));
transitRules.push(...JSON.parse(fs.readFileSync(path.join(rulesDir, "psychological-fast-transit-rules.json"), "utf8")));
writeJson("transit-rules.json", transitRules);

const compat = JSON.parse(fs.readFileSync(path.join(rulesDir, "compatibility-rules.json"), "utf8"));
writeJson("compatibility.json", { periods: compat.periods, pairs: compat.pairs });

writeJson("places.json", JSON.parse(fs.readFileSync(path.join(root, "data", "places.json"), "utf8")));

console.log(`Assets built → ${distDir}`);
console.log(written.map(l => `  ${l}`).join("\n"));
console.log(`  rules total: ${allRules.length}`);
