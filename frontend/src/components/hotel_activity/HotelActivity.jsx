import Icon from "../icon/Icon.jsx";
import "./HotelActivity.css";

export default function HotelActivity({
  image,
  title,
  description,
  schedule,
}) {
  return (
    <section className="px-3 px-md-5 py-4">
      <div className="activity-card">
        <div className="activity-image-wrap">
          <img
            src={image}
            alt={title}
            className="activity-image"
          />
        </div>

        <div className="activity-content">
          <span className="activity-badge">EXPERIENCIA</span>

          <h2 className="activity-title">
            {title}
          </h2>

          <p className="activity-description">
            {description}
          </p>

          <div className="activity-info">
            <div className="activity-info-icon">
              <Icon size={18}>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </Icon>
            </div>

            <div>
              <p className="activity-info-title">
                Horarios
              </p>

              <p className="activity-info-text">
                {schedule}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}