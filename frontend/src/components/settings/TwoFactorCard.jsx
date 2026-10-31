// Permite activar o desactivar la verificación en dos pasos por correo de la cuenta autenticada.
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { apiRequest } from "../../api.js";
import { useAuth } from "../../context/authContext.js";
import SettingsCard from "./SettingsCard.jsx";

export default function TwoFactorCard() {
  const { user, updateSessionUser } = useAuth();
  const enabled = Boolean(user?.twoFactorEnabled);

  const [challenge, setChallenge] = useState(null); // Desafío pendiente de confirmar al activar.
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Cuenta regresiva para poder reenviar el código.
  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const timer = setTimeout(() => setSecondsLeft((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  // Ejecuta una acción mostrando el estado de carga y los errores del servidor.
  const run = async (action) => {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await action();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const post = (url, body = {}) => apiRequest(url, { method: "POST", body: JSON.stringify(body) });

  const requestActivation = () => run(async () => {
    const result = await post("/api/me/2fa/request");
    setChallenge(result);
    setCode("");
    setSecondsLeft(result.resendSeconds ?? 60);
  });

  const resendCode = () => run(async () => {
    const result = await post("/api/me/2fa/resend", { challengeToken: challenge.challengeToken });
    setSecondsLeft(result.resendSeconds ?? 60);
    setMessage(result.message);
  });

  const confirmActivation = (event) => {
    event.preventDefault();
    run(async () => {
      const result = await post("/api/me/2fa/confirm", { challengeToken: challenge.challengeToken, code });
      updateSessionUser(result.user);
      setChallenge(null);
      setMessage(result.message);
    });
  };

  const disable = (event) => {
    event.preventDefault();
    run(async () => {
      const result = await post("/api/me/2fa/disable", { password });
      updateSessionUser(result.user);
      setPassword("");
      setMessage(result.message);
    });
  };

  const status = (
    <>
      {error && <p className="alert alert-danger mb-0" role="alert">{error}</p>}
      {message && <p className="alert alert-success mb-0" role="status">{message}</p>}
    </>
  );

  return (
    <SettingsCard icon={ShieldCheck} title="Verificación en dos pasos">
      {enabled ? (
        <form className="d-grid gap-3" onSubmit={disable}>
          <p className="settings-muted mb-0">
            Está <strong>activada</strong>. Al iniciar sesión te enviaremos un código de 6 dígitos a {user.email}.
          </p>
          <label className="settings-field-body">Contraseña actual (para desactivarla)
            <input className="form-control mt-1" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {status}
          <button className="settings-btn" type="submit" disabled={busy}>
            {busy ? "Desactivando..." : "Desactivar verificación"}
          </button>
        </form>
      ) : challenge ? (
        <form className="d-grid gap-3" onSubmit={confirmActivation}>
          <p className="settings-muted mb-0">
            Enviamos un código de 6 dígitos a {challenge.email}. Vence en {challenge.codeMinutes} minutos.
          </p>
          <label className="settings-field-body">Código de verificación
            <input
              className="form-control mt-1"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              required
            />
          </label>
          {status}
          <button className="settings-btn settings-btn-filled" type="submit" disabled={busy || code.length !== 6}>
            {busy ? "Verificando..." : "Confirmar y activar"}
          </button>
          <button className="settings-btn" type="button" onClick={resendCode} disabled={busy || secondsLeft > 0}>
            {secondsLeft > 0 ? `Reenviar código en ${secondsLeft} s` : "Reenviar código"}
          </button>
          <button className="settings-btn" type="button" onClick={() => { setChallenge(null); setError(""); setMessage(""); }}>
            Cancelar
          </button>
        </form>
      ) : (
        <div className="d-grid gap-3">
          <p className="settings-muted mb-0">
            Añade una capa extra de seguridad: además de tu contraseña, te pediremos un código que enviaremos a {user?.email}.
          </p>
          {status}
          <button className="settings-btn settings-btn-filled" type="button" onClick={requestActivation} disabled={busy}>
            {busy ? "Enviando código..." : "Activar verificación"}
          </button>
        </div>
      )}
    </SettingsCard>
  );
}
