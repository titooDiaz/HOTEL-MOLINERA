// Configuración compartida del captcha (sin JSX para no romper Fast Refresh).
const DEVELOPMENT_TEST_SITE_KEY = "1x00000000000000000000AA";
const configuredSiteKey = (import.meta.env.VITE_TURNSTILE_SITE_KEY || "").trim();
// El widget debe seguir visible al desarrollar localmente aunque todavía no
// se haya creado una clave del sitio. Esta clave solo funciona en pruebas.
const SITE_KEY = configuredSiteKey || (
  import.meta.env.DEV ? DEVELOPMENT_TEST_SITE_KEY : ""
);

// Claves de prueba oficiales: nunca protegen de verdad.
const TEST_SITE_KEYS = new Set([
  "1x00000000000000000000AA",
  "2x00000000000000000000AB",
  "1x00000000000000000000BB",
  "2x00000000000000000000BB",
  "3x00000000000000000000FF",
]);

if (import.meta.env.PROD && TEST_SITE_KEYS.has(SITE_KEY)) {
  console.error(
    "VITE_TURNSTILE_SITE_KEY es una clave de prueba: configura la clave real antes de publicar.",
  );
}

export const turnstileSiteKey = SITE_KEY;
export const isCaptchaEnabled = Boolean(SITE_KEY);
export const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
