// Edita la información general del hotel y confirma el guardado del formulario.
import { useState } from "react";

export default function HotelInfoForm({ fields, labels }) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [values] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("hotel-molinera-info") || "{}");
    } catch {
      return {};
    }
  });

  function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(formData.entries());
    try {
      localStorage.setItem("hotel-molinera-info", JSON.stringify(values));
      setError("");
      setSaved(true);
    } catch (saveError) {
      setError(saveError.message || "No se pudieron guardar los cambios.");
    }
  }

  return (
    <section className="card-panel admin-settings-panel">
      <h2 className="admin-panel-title">{labels.title}</h2>
      <form onSubmit={handleSubmit}>
        <div className="row g-3">
          {fields.map((field) => (
            <div className={field.colClass || "col-12 col-md-6"} key={field.id}>
              <label className="admin-form-label" htmlFor={field.id}>{field.label}</label>
              {field.options ? (
                <select className="form-select admin-form-control" id={field.id} name={field.id} defaultValue={values[field.id] ?? field.defaultValue}>
                  {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              ) : (
                <input className="form-control admin-form-control" id={field.id} name={field.id} type={field.type || "text"} defaultValue={values[field.id] ?? field.defaultValue} />
              )}
            </div>
          ))}
        </div>
        <div className="admin-form-footer">
          <button className="admin-action-button admin-action-button--primary" type="submit">{labels.save}</button>
          {saved && <span className="admin-save-message" role="status">Cambios guardados.</span>}
          {error && <span className="aform-error" role="alert">{error}</span>}
        </div>
      </form>
    </section>
  );
}
