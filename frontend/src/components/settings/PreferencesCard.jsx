import { Moon, Settings as SettingsIcon, Sun } from "lucide-react";
import SettingsCard from "./SettingsCard.jsx";
import SettingsToggle from "./SettingsToggle.jsx";
import "./PreferencesCard.css";

export default function PreferencesCard({ enabled, onToggle, title, label }) {
  return (
    <SettingsCard icon={SettingsIcon} title={title}>
      <div className="settings-row settings-row-boxed">
        <span className="settings-row-label">
          <Moon size={22} />
          {label}
        </span>
        <SettingsToggle
          checked={enabled}
          onChange={onToggle}
          label={label}
          icon={Sun}
        />
      </div>
    </SettingsCard>
  );
}
