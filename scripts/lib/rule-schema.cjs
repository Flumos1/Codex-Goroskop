"use strict";

/**
 * Shared rule-schema helper.
 *
 * tools/validate-project.cjs enforces a canonical rule shape (id, system,
 * methodFamily, factor, sourceIds, themes, simple.{summary,pattern,growth,
 * reflection}, advanced.{technical,method,caution,constructiveChannel},
 * confidence). Several book-derived generators (chinese, kabbalah, nakshatra,
 * nakshatra-pada, lunar-mansion) historically emitted a leaner shape and only
 * populated the fields the runtime (tools/calculate-chart.cjs) actually reads
 * — `factor` plus system-specific `simple`/`simpleRu` text.
 *
 * `ensureSchema` layers the missing canonical fields on top of a
 * generator-specific rule WITHOUT removing any existing field, so the runtime
 * keeps reading what it always read while the validator sees a complete rule.
 *
 * Callers pass only what they can derive honestly from the source; anything
 * already present on the rule is preserved.
 */
function ensureSchema(rule, opts) {
  const {
    system,
    methodFamily,
    sourceIds,
    themes,
    simple = {},
    advanced = {},
    confidence,
  } = opts;

  const merged = { ...rule };

  // id: canonical key. Generators use either `id` or `ruleId`; keep both so
  // callers that index by either continue to work.
  merged.id = rule.id || rule.ruleId;

  merged.system = rule.system || system;
  merged.methodFamily = rule.methodFamily || methodFamily;
  merged.sourceIds = rule.sourceIds || sourceIds;
  merged.themes = rule.themes || themes;

  merged.simple = { ...(rule.simple || {}), ...simple };
  merged.advanced = { ...(rule.advanced || {}), ...advanced };

  merged.confidence = rule.confidence || confidence || "medium";

  return merged;
}

module.exports = { ensureSchema };
