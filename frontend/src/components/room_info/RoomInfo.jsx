import Feature from "../feature/Feature.jsx";
import Tag from "../tag/Tag.jsx";
import "./RoomInfo.css";

export default function RoomInfo({ room, descriptionLabel }) {
  return (
    <div>
      <span className="room-badge">{room.name}</span>
      <h2 className="fw-bold text-dark mb-1 room-title">{room.name}</h2>
      <p className="text-secondary small mb-4">{room.summary}</p>

      <div className="features-grid mb-4">
        {room.features.map((feature) => (
          <Feature key={feature.icon} icon={feature.icon} text={feature.text} />
        ))}
      </div>

      <h3 className="small fw-semibold text-dark mb-2">{descriptionLabel}</h3>
      <p className="small text-secondary lh-lg mb-4">{room.description}</p>

      <div className="d-flex flex-wrap gap-2">
        {room.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}
      </div>
    </div>
  );
}