import SettingsCard from "./SettingsCard.jsx";
import "./ActivityHistoryCard.css";

export default function ActivityHistoryCard({ title, items }) {
  return (
    <SettingsCard title={title}>
      <ul className="settings-activity">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </SettingsCard>
  );
}
