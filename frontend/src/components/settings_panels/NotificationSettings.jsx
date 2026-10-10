import { useState } from "react";

export default function NotificationSettings({ options, labels }) {
  const [enabled, setEnabled] = useState(() => Object.fromEntries(options.map((option) => [option.id, option.defaultChecked])));

  return (
    <section className="card-panel admin-settings-panel">
      <h2 className="admin-panel-title">{labels.title}</h2>
      <p className="admin-settings-description">{labels.description}</p>
      <div className="admin-notification-list">
        {options.map((option) => (
          <label className="admin-notification-option" key={option.id} htmlFor={`notification-${option.id}`}>
            <span><strong>{option.label}</strong><small>{option.description}</small></span>
            <input id={`notification-${option.id}`} type="checkbox" checked={Boolean(enabled[option.id])} onChange={(event) => setEnabled((current) => ({ ...current, [option.id]: event.target.checked }))} />
          </label>
        ))}
      </div>
    </section>
  );
}
