import "./SettingsToggle.css";

export default function SettingsToggle({ checked, onChange, label, icon: Icon }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`settings-toggle ${checked ? "is-on" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span className="settings-toggle-thumb">
        {Icon && <Icon size={12} />}
      </span>
    </button>
  );
}
