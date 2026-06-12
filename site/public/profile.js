const CodexProfile = (() => {
  const key = "codex-goroskop:birth-profile:v1";
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

  return { applyToForm, bindForm, read, readFromForm, write };
})();
