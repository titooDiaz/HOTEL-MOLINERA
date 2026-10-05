import "./SettingsCard.css";

export default function SettingsCard({ icon: Icon, title, children }) {
  return (
    <section className="settings-card">
      <div className="settings-card-title">
        {Icon && (
          <span className="settings-card-icon">
            <Icon size={20} />
          </span>
        )}
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}
