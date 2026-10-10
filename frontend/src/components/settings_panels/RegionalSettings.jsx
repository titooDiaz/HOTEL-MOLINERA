export default function RegionalSettings({ fields, labels }) {
  return (
    <section className="card-panel admin-settings-panel">
      <h2 className="admin-panel-title">{labels.title}</h2>
      <div className="admin-settings-fields">
        {fields.map((field) => (
          <div key={field.id}>
            <label className="admin-form-label" htmlFor={field.id}>{field.label}</label>
            <select className="form-select admin-form-control" id={field.id} defaultValue={field.defaultValue}>
              {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
        ))}
      </div>
    </section>
  );
}
