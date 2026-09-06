"use strict";

// Transit layer: which moving planets currently aspect the natal chart, with
// the interpretation text for each hit. Wraps tools/calculate-transits.cjs the
// same way lib/astro.cjs wraps the natal engine.
//
// Came from the `flumos-line` development line, where it lived only in the
// standalone Express prototype.

const fs = require("fs");
const path = require("path");
const { runTransits } = require("../tools/calculate-transits.cjs");
const { deepRepairMojibake } = require("./text.cjs");

const projectRoot = path.resolve(__dirname, "..");
const placesPath = path.join(projectRoot, "data", "places.json");

let cachedPlaces = null;
function getPlaces() {
  if (!cachedPlaces) {
    cachedPlaces = Object.values(JSON.parse(fs.readFileSync(placesPath, "utf8")));
  }
  return cachedPlaces;
}

function calculateTransits(input) {
  const place = input.placeKey ? getPlaces().find((p) => p.key === input.placeKey) : null;
  if (input.placeKey && !place) throw new Error("Неизвестное место рождения.");

  const latitude = place ? place.latitude : Number(input.latitude);
  const longitude = place ? place.longitude : Number(input.longitude);

  return deepRepairMojibake(
    runTransits({
      localDate: input.localDate,
      localTime: input.localTime || "12:00",
      timeZone: place ? place.timeZone : input.timeZone,
      latitude,
      longitude,
      transitDate: input.transitDate || new Date().toISOString().slice(0, 10),
      language: input.language || "ru",
      houseSystem: input.houseSystem || "equal-from-ascendant",
    })
  );
}

module.exports = { calculateTransits, getPlaces };
