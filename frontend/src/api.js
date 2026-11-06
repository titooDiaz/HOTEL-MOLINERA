const TOKEN_KEY = "hotel-molinera-token";

export function getAuthToken() {
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
}

export function saveAuthToken(token, remember = true) {
  const destination = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  other.removeItem(TOKEN_KEY);
  destination.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

export async function apiRequest(url, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getAuthToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, { ...options, headers });
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(body?.error || `Error ${response.status} al comunicarse con el servidor.`);
  }
  return body;
}

export async function downloadProtectedFile(url, filename) {
  const headers = new Headers();
  const token = getAuthToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(url, { headers });
  if (!response.ok) {
    const body = await response.text();
    let message = body || `Error ${response.status} al descargar el archivo.`;
    try {
      message = JSON.parse(body)?.error || message;
    } catch {
      // The server may return a plain-text error body.
    }
    throw new Error(message);
  }
  const objectUrl = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export const postJson = (url, data) =>
  apiRequest(url, { method: "POST", body: JSON.stringify(data) });
