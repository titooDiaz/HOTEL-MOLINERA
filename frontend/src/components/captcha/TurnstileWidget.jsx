// Widget de Cloudflare Turnstile. Solo produce un token; el backend es quien lo valida.
import { useEffect, useRef } from "react";
import {
  TURNSTILE_SCRIPT_SRC,
  isCaptchaEnabled,
  turnstileSiteKey,
} from "./captchaConfig.js";
import "./turnstile.css";

let scriptPromise = null;

// Carga el script una sola vez, incluso si React monta el widget varias veces.
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = TURNSTILE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.turnstile) resolve(window.turnstile);
        else reject(new Error("Turnstile cargó pero no está disponible."));
      };
      script.onerror = () => {
        scriptPromise = null;
        script.remove();
        reject(new Error("No se pudo cargar el script de Turnstile."));
      };
      document.head.appendChild(script);
    });
  }

  return scriptPromise;
}

/**
 * Props:
 *  - action: nombre de la acción (`contact`, `register`). El backend exige que coincida.
 *  - onVerify: (token) => void
 *  - onExpire: () => void  (token caducado, error o timeout)
 *  - resetKey: al cambiar, se reinicia el widget para pedir un token nuevo.
 */
export default function TurnstileWidget({
  action,
  onVerify,
  onExpire,
  resetKey = 0,
  theme = "auto",
}) {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const handlersRef = useRef({ onVerify, onExpire });

  // Los callbacks cambian en cada render del formulario; se guardan aquí para no
  // volver a montar el widget (y perder el token) cada vez.
  useEffect(() => {
    handlersRef.current = { onVerify, onExpire };
  }, [onVerify, onExpire]);

  useEffect(() => {
    if (!isCaptchaEnabled) {
      if (import.meta.env.DEV) {
        console.warn(
          "VITE_TURNSTILE_SITE_KEY no está configurada: el captcha está desactivado en el frontend.",
        );
      }
      return undefined;
    }

    let cancelled = false;

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !containerRef.current || !turnstile) return;
        widgetRef.current = turnstile.render(containerRef.current, {
          sitekey: turnstileSiteKey,
          action,
          theme,
          language: "es",
          appearance: "always",
          size: "flexible",
          callback: (token) => handlersRef.current.onVerify?.(token),
          "expired-callback": () => handlersRef.current.onExpire?.(),
          "timeout-callback": () => handlersRef.current.onExpire?.(),
          "error-callback": () => handlersRef.current.onExpire?.(),
        });
      })
      .catch((error) => {
        console.error("No se pudo cargar el captcha:", error);
        handlersRef.current.onExpire?.();
      });

    return () => {
      cancelled = true;
      if (widgetRef.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetRef.current);
        } catch {
          // El contenedor ya pudo haber sido retirado; no hay nada que limpiar.
        }
      }
      widgetRef.current = null;
    };
  }, [action, theme]);

  useEffect(() => {
    if (!resetKey || widgetRef.current === null || !window.turnstile) return;
    window.turnstile.reset(widgetRef.current);
  }, [resetKey]);

  if (!isCaptchaEnabled) return null;

  return (
    <div className="turnstile-widget-wrap">
      <span className="turnstile-widget-label">Verificación de seguridad</span>
      <div ref={containerRef} className="turnstile-widget" />
    </div>
  );
}
