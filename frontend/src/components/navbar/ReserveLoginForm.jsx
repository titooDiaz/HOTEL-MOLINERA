import { FormHeader, PasswordField } from "./ReserveModalFields.jsx";

export default function ReserveLoginForm({
  hotelName,
  labels,
  data,
  onChange,
  onSubmit,
  onChangeView,
  showPass,
  onTogglePass,
  error,
}) {
  return (
    <aside key="login" className="reserve-form-panel reserve-swap">
      <FormHeader hotelName={hotelName} labels={labels} />

      <div className="reserve-form-body">
        <button
          type="button"
          className="reserve-back"
          onClick={() => onChangeView("options")}
        >
          ← {labels.back}
        </button>

        <h3 className="reserve-form-title">{labels.loginTitle}</h3>
        <p className="reserve-form-subtitle">{labels.loginSubtitle}</p>

        <form onSubmit={onSubmit} className="reserve-form">
          <div className="reserve-field">
            <label htmlFor="login-email">{labels.email}</label>
            <div className="reserve-input-wrap">
              <input
                id="login-email"
                type="email"
                value={data.email}
                onChange={(event) => onChange("email", event.target.value)}
                autoComplete="email"
                placeholder={labels.emailPlaceholder}
                required
              />
            </div>
          </div>

          <PasswordField
            id="login-password"
            label={labels.password}
            value={data.password}
            autoComplete="current-password"
            showPass={showPass}
            onTogglePass={onTogglePass}
            labels={labels}
            onChange={(event) => onChange("password", event.target.value)}
          />

          <div className="reserve-row">
            <label className="reserve-check">
              <input
                type="checkbox"
                checked={data.remember}
                onChange={(event) => onChange("remember", event.target.checked)}
              />
              <span>{labels.remember}</span>
            </label>
            <button type="button" className="reserve-link">
              {labels.forgot}
            </button>
          </div>

          {error && <p className="reserve-error">{error}</p>}

          <button type="submit" className="reserve-submit">
            {labels.loginSubmit}
          </button>

          <p className="reserve-switch">
            {labels.noAccount}{" "}
            <button
              type="button"
              className="reserve-link"
              onClick={() => onChangeView("register")}
            >
              {labels.register}
            </button>
          </p>
        </form>
      </div>
    </aside>
  );
}
