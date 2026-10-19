// Organizamos la lógica de ReserveRegisterForm.
import { FormHeader, PasswordField } from "./ReserveModalFields.jsx";

export default function ReserveRegisterForm({
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
    <aside key="register" className="reserve-form-panel reserve-swap">
      <FormHeader hotelName={hotelName} labels={labels} />

      <div className="reserve-form-body">
        <button
          type="button"
          className="reserve-back"
          onClick={() => onChangeView("options")}
        >
          ← {labels.back}
        </button>

        <h3 className="reserve-form-title">{labels.registerTitle}</h3>
        <p className="reserve-form-subtitle">{labels.registerSubtitle}</p>

        <form onSubmit={onSubmit} className="reserve-form">
          <div className="reserve-field">
            <label htmlFor="reg-name">{labels.fullName}</label>
            <div className="reserve-input-wrap">
              <input
                id="reg-name"
                type="text"
                value={data.name}
                onChange={(event) => onChange("name", event.target.value)}
                autoComplete="name"
                placeholder={labels.namePlaceholder}
                required
              />
            </div>
          </div>

          <div className="reserve-grid-2">
            <div className="reserve-field">
              <label htmlFor="reg-email">{labels.email}</label>
              <div className="reserve-input-wrap">
                <input
                  id="reg-email"
                  type="email"
                  value={data.email}
                  onChange={(event) => onChange("email", event.target.value)}
                  autoComplete="email"
                  placeholder={labels.emailPlaceholder}
                  required
                />
              </div>
            </div>

            <div className="reserve-field">
              <label htmlFor="reg-phone">{labels.phone}</label>
              <div className="reserve-input-wrap">
                <input
                  id="reg-phone"
                  type="tel"
                  value={data.phone}
                  onChange={(event) => onChange("phone", event.target.value)}
                  autoComplete="tel"
                  placeholder={labels.phonePlaceholder}
                  required
                />
              </div>
            </div>
          </div>

          <div className="reserve-grid-2">
            <PasswordField
              id="reg-password"
              label={labels.password}
              value={data.password}
              autoComplete="new-password"
              showPass={showPass}
              onTogglePass={onTogglePass}
              labels={labels}
              onChange={(event) => onChange("password", event.target.value)}
            />
            <PasswordField
              id="reg-confirm"
              label={labels.confirmPassword}
              value={data.confirm}
              autoComplete="new-password"
              showPass={showPass}
              onTogglePass={onTogglePass}
              labels={labels}
              onChange={(event) => onChange("confirm", event.target.value)}
            />
          </div>

          <label className="reserve-check">
            <input
              type="checkbox"
              checked={data.terms}
              onChange={(event) => onChange("terms", event.target.checked)}
              required
            />
            <span>{labels.terms}</span>
          </label>

          {error && <p className="reserve-error">{error}</p>}

          <button type="submit" className="reserve-submit">
            {labels.registerSubmit}
          </button>

          <p className="reserve-switch">
            {labels.haveAccount}{" "}
            <button
              type="button"
              className="reserve-link"
              onClick={() => onChangeView("login")}
            >
              {labels.login}
            </button>
          </p>
        </form>
      </div>
    </aside>
  );
}
