/** "$120.000" (pesos colombianos, sin decimales). */
export function formatCOP(value) {
  return `$${new Intl.NumberFormat("es-CO").format(Math.round(value))}`;
}

/** Fecha local de hoy en formato AAAA-MM-DD (lo que espera <input type="date">). */
export function todayISO() {
  return new Date().toLocaleDateString("en-CA");
}

/** Número de noches entre dos fechas AAAA-MM-DD (0 si falta alguna o son inválidas). */
export function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const diff = (new Date(checkOut) - new Date(checkIn)) / 86400000;
  return Number.isFinite(diff) ? Math.round(diff) : 0;
}

/** POST con JSON. Lanza un error si el servidor no responde con 2xx. */
export async function postJson(url, data) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status} al enviar los datos`);
  }

  return response;
}