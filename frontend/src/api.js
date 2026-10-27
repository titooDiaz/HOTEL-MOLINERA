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

export const postJson = (url, data) =>
  apiRequest(url, { method: "POST", body: JSON.stringify(data) });
