// Formulario de registro que recopila los datos de contacto y valida la contraseña.
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
        <p className="reserve-required-note">
          <span aria-hidden="true">*</span> Los campos marcados son obligatorios.
        </p>

        <form onSubmit={onSubmit} className="reserve-form">
          <div className="reserve-field">
            <label htmlFor="reg-name">{labels.fullName} <span className="reserve-required-mark" aria-hidden="true">*</span></label>
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
              <label htmlFor="reg-document-type">{labels.documentType} <span className="reserve-required-mark" aria-hidden="true">*</span></label>
              <div className="reserve-input-wrap">
                <select className="reserve-field-control" id="reg-document-type" value={data.documentType} onChange={(event) => onChange("documentType", event.target.value)} required>
                  <option value="CC">{labels.documentTypeCC}</option>
                  <option value="CE">{labels.documentTypeCE}</option>
                  <option value="PA">{labels.documentTypePA}</option>
                  <option value="NIT">{labels.documentTypeNIT}</option>
                  <option value="OTRO">{labels.documentTypeOther}</option>
                </select>
              </div>
            </div>
            <div className="reserve-field">
              <label htmlFor="reg-document-number">{labels.documentNumber} <span className="reserve-required-mark" aria-hidden="true">*</span></label>
              <div className="reserve-input-wrap">
                <input id="reg-document-number" type="text" value={data.documentNumber} onChange={(event) => onChange("documentNumber", event.target.value)} autoComplete="off" placeholder={labels.documentNumberPlaceholder} required />
              </div>
            </div>
          </div>

          <div className="reserve-grid-2">
            <div className="reserve-field">
              <label htmlFor="reg-email">{labels.email} <span className="reserve-required-mark" aria-hidden="true">*</span></label>
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
              <label htmlFor="reg-phone">{labels.phone} <span className="reserve-required-mark" aria-hidden="true">*</span></label>
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
            <div className="reserve-field"><label htmlFor="reg-birth-date">{labels.birthDate}</label><input className="reserve-field-control" id="reg-birth-date" type="date" value={data.birthDate} onChange={(event) => onChange("birthDate", event.target.value)} /></div>
            <div className="reserve-field"><label htmlFor="reg-nationality">{labels.nationality}</label><input className="reserve-field-control" id="reg-nationality" type="text" value={data.nationality} onChange={(event) => onChange("nationality", event.target.value)} placeholder={labels.nationalityPlaceholder} /></div>
          </div>

          <div className="reserve-grid-2">
            <div className="reserve-field"><label htmlFor="reg-city">{labels.city}</label><input className="reserve-field-control" id="reg-city" type="text" value={data.city} onChange={(event) => onChange("city", event.target.value)} /></div>
            <div className="reserve-field"><label htmlFor="reg-address">{labels.address}</label><input className="reserve-field-control" id="reg-address" type="text" value={data.address} onChange={(event) => onChange("address", event.target.value)} /></div>
          </div>

          <div className="reserve-grid-2">
            <div className="reserve-field"><label htmlFor="reg-emergency-name">{labels.emergencyName} <span className="reserve-required-mark" aria-hidden="true">*</span></label><input className="reserve-field-control" id="reg-emergency-name" type="text" value={data.emergencyName} onChange={(event) => onChange("emergencyName", event.target.value)} required /></div>
            <div className="reserve-field"><label htmlFor="reg-emergency-phone">{labels.emergencyPhone} <span className="reserve-required-mark" aria-hidden="true">*</span></label><input className="reserve-field-control" id="reg-emergency-phone" type="tel" value={data.emergencyPhone} onChange={(event) => onChange("emergencyPhone", event.target.value)} required /></div>
          </div>

          <div className="reserve-field"><label htmlFor="reg-notes">{labels.notes}</label><textarea className="reserve-field-control" id="reg-notes" value={data.notes} onChange={(event) => onChange("notes", event.target.value)} rows="2" /></div>

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
