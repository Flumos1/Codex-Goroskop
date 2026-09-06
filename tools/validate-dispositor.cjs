const { calculateDispositor, compactChainText } = require("../lib/dispositor.cjs");

function profile(positions) {
  return {
    language: "ru",
    calculation: {
      positions,
    },
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const ownSign = calculateDispositor(profile([
    { body: "Sun", sign: "Leo" },
    { body: "Moon", sign: "Cancer" },
  ]));
  assert(ownSign.placements.find((item) => item.body === "Sun").isInOwnSign, "Sun in Leo must be own sign.");

  const final = calculateDispositor(profile([
    { body: "Sun", sign: "Leo" },
    { body: "Mars", sign: "Leo" },
    { body: "Moon", sign: "Aries" },
  ]));
  assert(final.dominantFinal.body === "Sun", "Sun must be dominant final dispositor.");

  const reception = calculateDispositor(profile([
    { body: "Venus", sign: "Aries" },
    { body: "Mars", sign: "Taurus" },
  ]));
  assert(reception.receptions.length === 1, "Venus/Mars mutual reception must be detected.");

  const cycle = calculateDispositor(profile([
    { body: "Sun", sign: "Aries" },
    { body: "Mars", sign: "Sagittarius" },
    { body: "Jupiter", sign: "Leo" },
  ]));
  assert(cycle.chains.some((chain) => chain.cycle.length), "Cycle without final dispositor must be detected.");

  const chainText = compactChainText([
    { body: "Sun", ruler: "Mars" },
    { body: "Mars", ruler: "Saturn" },
    { body: "Saturn", ruler: "Saturn" },
  ], "ru");
  assert(chainText === "Солнце -> Марс -> Сатурн", "Compact chain text must avoid repeated adjacent bodies.");

  console.log("Dispositor validation passed.");
}

run();
