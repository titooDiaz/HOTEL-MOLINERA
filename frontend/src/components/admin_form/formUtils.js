// Organizamos la lógica de formUtils.
/** Formato monetario venezolano sin decimales. */
export function formatCOP(value) {
  return `Bs. ${new Intl.NumberFormat("es-VE").format(Math.round(value))}`;
}

/** Fecha local de hoy en formato AAAA-MM-DD (lo que espera <input type="date">). */
export function todayISO() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Caracas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

/** Número de noches entre dos fechas AAAA-MM-DD (0 si falta alguna o son inválidas). */
export function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const diff = (new Date(checkOut) - new Date(checkIn)) / 86400000;
  return Number.isFinite(diff) ? Math.round(diff) : 0;
}

/** POST con JSON y la sesión actual. El servidor proporciona el detalle de validación. */
export { postJson } from "../../api.js";