// Permite activar o desactivar las opciones de notificación disponibles.
import { useState } from "react";

export default function NotificationSettings({ options, labels }) {
  const [enabled, setEnabled] = useState(() => {
    try {
      return { ...Object.fromEntries(options.map((option) => [option.id, option.defaultChecked])), ...JSON.parse(localStorage.getItem("hotel-molinera-notifications") || "{}") };
    } catch {
      return Object.fromEntries(options.map((option) => [option.id, option.defaultChecked]));
    }
  });

  const update = (id, value) => {
    const next = { ...enabled, [id]: value };
    setEnabled(next);
    localStorage.setItem("hotel-molinera-notifications", JSON.stringify(next));
  };

  return (
    <section className="card-panel admin-settings-panel">
      <h2 className="admin-panel-title">{labels.title}</h2>
      <p className="admin-settings-description">{labels.description}</p>
      <div className="admin-notification-list">
        {options.map((option) => (
          <label className="admin-notification-option" key={option.id} htmlFor={`notification-${option.id}`}>
            <span><strong>{option.label}</strong><small>{option.description}</small></span>
            <input id={`notification-${option.id}`} type="checkbox" checked={Boolean(enabled[option.id])} onChange={(event) => update(option.id, event.target.checked)} />
          </label>
        ))}
      </div>
    </section>
  );
}
