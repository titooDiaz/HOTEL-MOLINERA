// Permite cambiar la contraseña de la cuenta autenticada.
import { useState } from "react";
import { Lock } from "lucide-react";
import { apiRequest } from "../../api.js";
import SettingsCard from "./SettingsCard.jsx";
import "./SecurityCard.css";

export default function SecurityCard({ labels }) {
  const [values, setValues] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (values.newPassword !== values.confirmPassword) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await apiRequest("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: values.currentPassword, newPassword: values.newPassword }),
      });
      setValues({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setMessage(result.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SettingsCard icon={Lock} title={labels.title}>
      <form className="d-grid gap-3" onSubmit={submit}>
        <label className="settings-field-body">{labels.currentPasswordLabel}
          <input className="form-control mt-1" type="password" autoComplete="current-password" minLength="8" value={values.currentPassword} onChange={(event) => setValues((current) => ({ ...current, currentPassword: event.target.value }))} required />
        </label>
        <label className="settings-field-body">{labels.newPasswordLabel}
          <input className="form-control mt-1" type="password" autoComplete="new-password" minLength="8" value={values.newPassword} onChange={(event) => setValues((current) => ({ ...current, newPassword: event.target.value }))} required />
        </label>
        <label className="settings-field-body">{labels.confirmPasswordLabel}
          <input className="form-control mt-1" type="password" autoComplete="new-password" minLength="8" value={values.confirmPassword} onChange={(event) => setValues((current) => ({ ...current, confirmPassword: event.target.value }))} required />
        </label>
        {error && <p className="alert alert-danger mb-0" role="alert">{error}</p>}
        {message && <p className="alert alert-success mb-0" role="status">{message}</p>}
        <button className="settings-btn settings-btn-filled" type="submit" disabled={submitting}>
          {submitting ? "Actualizando..." : labels.changeButton}
        </button>
      </form>
      <p className="settings-muted mt-3 mb-0">La verificación en dos pasos aún no está configurada.</p>
    </SettingsCard>
  );
}
