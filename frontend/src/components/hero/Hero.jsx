import "./Hero.css";

export default function Hero({ hotelName, imageUrl, labels }) {
  return (
    <section className="position-relative hero-section">
      <img
        src={imageUrl}
        alt={labels.imageAlt}
        className="position-absolute top-0 start-0 w-100 h-100 hero-img"
      />
      <div className="position-absolute top-0 start-0 w-100 h-100 hero-gradient" />

      <div className="position-relative h-100 d-flex flex-column justify-content-center px-4 px-md-5 hero-content">
        <p className="text-white letter-spacing-wide fw-semibold small mb-2">
          {labels.eyebrow}
        </p>
        <h1 className="text-white fw-bold lh-1 mb-3 hero-title">
          {hotelName || labels.defaultHotelName}
          <br />{labels.titleSuffix}
        </h1>
        <p className="text-white mb-0 hero-description">
          Disfruta de una experiencia única en un entorno natural, con todas las
          comodidades que necesitas.
        </p>
      </div>

      <div className="position-absolute bottom-0 start-0 mb-4 ms-4 ms-md-5 d-flex gap-2">
        {[0, 1, 2].map((dot) => (
          <span key={dot} className={`hero-dot ${dot === 0 ? "active" : ""}`} />
        ))}
      </div>
    </section>
  );
}