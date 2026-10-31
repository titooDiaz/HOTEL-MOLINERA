// Segundo paso del inicio de sesión: el usuario escribe el código que recibió por correo.
import { useEffect, useState } from "react";
import { FormHeader } from "./ReserveModalFields.jsx";

export default function ReserveTwoFactorForm({
  hotelName,
  labels,
  challenge,
  code,
  onCodeChange,
  onSubmit,
  onResend,
  onBack,
  error,
  notice,
  submitting,
}) {
  // Cuenta regresiva para poder pedir otro código; el servidor aplica la misma espera.
  const [secondsLeft, setSecondsLeft] = useState(challenge.resendSeconds ?? 60);

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const timer = setTimeout(() => setSecondsLeft((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const resend = async () => {
    const waitSeconds = await onResend();
    if (waitSeconds) setSecondsLeft(waitSeconds);
  };

  return (
    <aside key="verify" className="reserve-form-panel reserve-swap">
      <FormHeader hotelName={hotelName} labels={labels} />

      <div className="reserve-form-body">
        <button type="button" className="reserve-back" onClick={onBack}>
          ← {labels.back}
        </button>

        <h3 className="reserve-form-title">{labels.verifyTitle}</h3>
        <p className="reserve-form-subtitle">
          {labels.verifySubtitle.replace("{email}", challenge.email)}{" "}
          {labels.verifyExpires.replace("{minutes}", challenge.codeMinutes ?? 10)}
        </p>

        <form onSubmit={onSubmit} className="reserve-form">
          <div className="reserve-field">
            <label htmlFor="two-factor-code">{labels.verifyCodeLabel}</label>
            <div className="reserve-input-wrap">
              <input
                id="two-factor-code"
                className="reserve-code-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(event) => onCodeChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
                autoFocus
                required
              />
            </div>
          </div>

          {error && <p className="reserve-error">{error}</p>}
          {notice && !error && <p className="reserve-notice" role="status">{notice}</p>}

          <button type="submit" className="reserve-submit" disabled={submitting || code.length !== 6}>
            {labels.verifySubmit}
          </button>

          <p className="reserve-switch">
            <button
              type="button"
              className="reserve-link"
              onClick={resend}
              disabled={secondsLeft > 0}
            >
              {secondsLeft > 0
                ? labels.verifyResendIn.replace("{seconds}", secondsLeft)
                : labels.verifyResend}
            </button>
          </p>
        </form>
      </div>
    </aside>
  );
}
