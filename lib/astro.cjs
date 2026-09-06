const { calculateProfile } = require("../tools/calculate-chart.cjs");
const { deepRepairMojibake } = require("./text.cjs");
const { matchProfileRules } = require("./rule-index.cjs");

function calculateChart(input) {
  const args = {
    name: input.name || "Гость",
    localDate: input.localDate,
    localTime: input.localTime,
    timeZone: input.timeZone,
    placeKey: input.placeKey,
    place: input.place,
    latitude: input.latitude === "" || input.latitude === undefined ? undefined : Number(input.latitude),
    longitude: input.longitude === "" || input.longitude === undefined ? undefined : Number(input.longitude),
    houseSystem: input.houseSystem || "equal-from-ascendant",
    mode: input.mode || "both",
    language: input.language || "ru",
  };

  if (input.datetime) args.datetime = input.datetime;

  const profile = deepRepairMojibake(calculateProfile(args));

  // Attach the interpretation texts from the full rule set (16 files), ranked
  // by significance. Without this the chart carries bare positions only.
  profile.matchedRules = matchProfileRules(profile);

  return profile;
}

module.exports = {
  calculateChart,
};
