const CodexProfile = (() => {
  const key = "codex-goroskop:birth-profile:v1";
  let placesPromise = null;
  const defaults = {
    name: "Demo User",
    localDate: "1990-04-10",
    localTime: "08:30",
    placeKey: "chisinau-md",
  };

  function read() {
    try {
      return { ...defaults, ...(JSON.parse(localStorage.getItem(key) || "{}") || {}) };
    } catch (error) {
      return { ...defaults };
    }
  }

  function write(profile) {
    const next = { ...read(), ...profile };
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch (error) {
      // Local storage can be blocked; pages still keep their form values.
    }
    return next;
  }

  function applyToForm(form, map = {}) {
    const profile = read();
    const fields = {
      name: map.name || "name",
      localDate: map.localDate || "localDate",
      localTime: map.localTime || "localTime",
      placeKey: map.placeKey || "placeKey",
    };
    Object.entries(fields).forEach(([profileKey, fieldName]) => {
      const field = form.elements[fieldName];
      if (!field || !profile[profileKey]) return;
      field.value = profile[profileKey];
      field.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  function readFromForm(form, map = {}) {
    const fields = {
      name: map.name || "name",
      localDate: map.localDate || "localDate",
      localTime: map.localTime || "localTime",
      placeKey: map.placeKey || "placeKey",
    };
    return Object.fromEntries(Object.entries(fields).map(([profileKey, fieldName]) => [
      profileKey,
      form.elements[fieldName]?.value,
    ]).filter(([, value]) => value));
  }

  function bindForm(form, map = {}) {
    const save = () => write(readFromForm(form, map));
    form.addEventListener("change", save);
    form.addEventListener("input", save);
    form.addEventListener("submit", save);
  }

  async function loadPlaces() {
    if (!placesPromise) {
      placesPromise = fetch("/api/places").then((response) => {
        if (!response.ok) throw new Error("Cannot load places.");
        return response.json();
      });
    }
    return placesPromise;
  }

  function groupName(place) {
    if (place.region) return place.region;
    if (place.country) return place.country;
    const parts = String(place.name || "").split(",").map((part) => part.trim()).filter(Boolean);
    return parts[parts.length - 1] || "Other";
  }

  function renderPlaceOptions(select, places, selectedValue) {
    const groups = new Map();
    places.forEach((place) => {
      const name = groupName(place);
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name).push(place);
    });

    select.replaceChildren();
    groups.forEach((items, name) => {
      const group = document.createElement("optgroup");
      group.label = name;
      items.forEach((place) => {
        const option = document.createElement("option");
        option.value = place.key;
        option.textContent = place.name;
        group.append(option);
      });
      select.append(group);
    });

    const preferredValue = selectedValue || read().placeKey || defaults.placeKey;
    if (places.some((place) => place.key === preferredValue)) {
      select.value = preferredValue;
    } else {
      select.value = defaults.placeKey;
    }
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }

  async function setupPlaceSelect(select, selectedValue) {
    const places = await loadPlaces();
    renderPlaceOptions(select, places, selectedValue);
    return places;
  }

  return { applyToForm, bindForm, loadPlaces, read, readFromForm, renderPlaceOptions, setupPlaceSelect, write };
})();

window.CodexProfile = CodexProfile;
