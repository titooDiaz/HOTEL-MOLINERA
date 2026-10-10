import { useState } from "react";

export default function HotelInfoForm({ fields, labels }) {
  const [saved, setSaved] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    setSaved(true);
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
                <select className="form-select admin-form-control" id={field.id} defaultValue={field.defaultValue}>
                  {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              ) : (
                <input className="form-control admin-form-control" id={field.id} type={field.type || "text"} defaultValue={field.defaultValue} />
              )}
            </div>
          ))}
        </div>
        <div className="admin-form-footer">
          <button className="admin-action-button admin-action-button--primary" type="submit">{labels.save}</button>
          {saved && <span className="admin-save-message" role="status">Cambios guardados.</span>}
        </div>
      </form>
    </section>
  );
}
