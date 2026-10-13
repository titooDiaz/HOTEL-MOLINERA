import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/themeContext.js";
import SettingsToggle from "../settings/SettingsToggle.jsx";
import "./AppearanceSettings.css";

export default function AppearanceSettings({ labels }) {
    const { isDarkMode, toggleDarkMode } = useTheme();

    return (
        <section className="card-panel admin-settings-panel admin-appearance">
        <h2 className="admin-panel-title">{labels.title}</h2>
        <p className="admin-settings-description">{labels.description}</p>

        <div className="admin-appearance-row">
            <span className="admin-appearance-label">
            <Moon size={18} aria-hidden="true" />
            {labels.darkModeLabel}
            </span>
            <SettingsToggle
            checked={isDarkMode}
            onChange={toggleDarkMode}
            label={labels.darkModeLabel}
            icon={Sun}
            />
        </div>
        </section>
    );
}