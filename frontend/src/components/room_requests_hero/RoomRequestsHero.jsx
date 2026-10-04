import "./RoomRequestsHero.css";

export default function RoomRequestsHero({ imageUrl, eyebrow, title, description }) {
  return (
    <section
      className="room-requests-hero mb-4"
      style={
        imageUrl
          ? {
              backgroundImage: `linear-gradient(90deg, rgba(20, 20, 20, 0.85) 25%, rgba(20, 20, 20, 0.15) 75%), url("${imageUrl}")`,
            }
          : undefined
      }
    >
      <div className="room-requests-hero-content text-white">
        <div className="room-requests-hero-label">{eyebrow}</div>
        <h2 className="fw-bold">{title}</h2>
        <p className="mb-0">{description}</p>
      </div>
    </section>
  );
}