import { Eye, Lock, Pencil } from "lucide-react";
import SettingsCard from "./SettingsCard.jsx";
import SettingsToggle from "./SettingsToggle.jsx";
import "./SecurityCard.css";

export default function SecurityCard({ enabled, onToggle, labels }) {
  return (
    <SettingsCard icon={Lock} title={labels.title}>
      <div className="settings-field-group">
        <div className="settings-field">
          <div className="settings-field-body">
            <label>{labels.passwordLabel}</label>
            <p className="settings-password">••••••••</p>
          </div>
          <button
            type="button"
            className="settings-icon-btn"
            aria-label="Editar contraseña"
          >
            <Pencil size={18} />
          </button>
        </div>
      </div>

      <p className="settings-muted">{labels.lastChange}</p>
      <button type="button" className="settings-btn settings-btn-outline">
        {labels.changeButton}
      </button>
      <hr className="settings-divider" />

      <div className="settings-row">
        <span className="settings-row-label">
          <Eye size={20} />
          {labels.twoFactorLabel}
        </span>
        <SettingsToggle
          checked={enabled}
          onChange={onToggle}
          label={labels.twoFactorLabel}
        />
      </div>
    </SettingsCard>
  );
}
