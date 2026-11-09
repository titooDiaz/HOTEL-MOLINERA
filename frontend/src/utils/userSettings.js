const REGIONAL_STORAGE_KEY = "hotel-molinera-regional";
const NOTIFICATION_STORAGE_KEY = "hotel-molinera-notifications";

export function getRegionalSettings() {
  try {
    return {
      timezone: "caracas",
      "date-format": "dmy",
      ...JSON.parse(localStorage.getItem(REGIONAL_STORAGE_KEY) || "{}"),
    };
  } catch {
    return { timezone: "caracas", "date-format": "dmy" };
  }
}

export function areNotificationsEnabled() {
  try {
    const saved = JSON.parse(localStorage.getItem(NOTIFICATION_STORAGE_KEY) || "{}");
    return saved.push !== false;
  } catch {
    return true;
  }
}

export function formatConfiguredDate(value, options = {}) {
  if (!value) return "—";
  const settings = getRegionalSettings();
  const locale = settings["date-format"] === "mdy" ? "en-US" : "es-VE";
  const timeZone = {
    caracas: "America/Caracas",
    mexico: "America/Mexico_City",
    madrid: "Europe/Madrid",
  }[settings.timezone] || "America/Caracas";
  const source = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T00:00:00`
    : value;
  const date = new Date(source);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(date);
}
