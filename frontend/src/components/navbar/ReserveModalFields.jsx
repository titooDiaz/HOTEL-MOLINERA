// Define el encabezado de los formularios de reserva y el campo reutilizable de contraseña.
export function FormHeader({ hotelName, labels }) {
  return (
    <div
      className="reserve-form-banner"
      style={{
        backgroundImage: "url(/images/places/entrada-interior.jpeg)",
      }}
    >
      <div className="reserve-form-banner-overlay">
        <span className="reserve-stars" aria-hidden="true">★★★★★</span>
        <span className="reserve-form-banner-name">
          {hotelName || labels.hotelFallback}
        </span>
      </div>
    </div>
  );
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  showPass,
  onTogglePass,
  labels,
}) {
  return (
    <div className="reserve-field">
      <label htmlFor={id}>
        {label} <span className="reserve-required-mark" aria-hidden="true">*</span>
      </label>
      <div className="reserve-input-wrap">
        <input
          id={id}
          type={showPass ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={labels.passwordPlaceholder}
          required
          minLength={8}
        />
        <button
          type="button"
          className="reserve-toggle-pass"
          onClick={onTogglePass}
        >
          {showPass ? labels.hide : labels.show}
        </button>
      </div>
    </div>
  );
}
