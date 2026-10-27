// Renderiza selectores para ajustar las opciones regionales de la aplicación.
import { useState } from "react";

export default function RegionalSettings({ fields, labels }) {
  const [values, setValues] = useState(() => {
    try {
      return { ...Object.fromEntries(fields.map((field) => [field.id, field.defaultValue])), ...JSON.parse(localStorage.getItem("hotel-molinera-regional") || "{}") };
    } catch {
      return Object.fromEntries(fields.map((field) => [field.id, field.defaultValue]));
    }
  });

  const update = (id, value) => {
    const next = { ...values, [id]: value };
    setValues(next);
    localStorage.setItem("hotel-molinera-regional", JSON.stringify(next));
  };

  return (
    <section className="card-panel admin-settings-panel">
      <h2 className="admin-panel-title">{labels.title}</h2>
      <div className="admin-settings-fields">
        {fields.map((field) => (
          <div key={field.id}>
            <label className="admin-form-label" htmlFor={field.id}>{field.label}</label>
            <select className="form-select admin-form-control" id={field.id} value={values[field.id]} onChange={(event) => update(field.id, event.target.value)}>
              {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
        ))}
      </div>
    </section>
  );
}
