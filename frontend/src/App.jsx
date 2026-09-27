import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

const images = [
  {
    src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ4VoP9LLtK1H6EIR1sxNbrFmnmcRYSZHC1JdgvG6fr6nTZJT0TDwd96T1Y&s=10",
    alt: "Habitación",
  },
  {
    src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS3KOS4X4Y4yzcD2Yz4kx8rtWYJfeuIuTq5kipD0SwMDzwhaLCov0JHT0Q&s=10",
    alt: "Baño",
  },
  {
    src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQj7AGHgisyuSPIwIUYk-ivllgUQlHVjs-JxJH4qA5wKBAu6idd_RGvHbw&s=10",
    alt: "Piscina",
  },
  {
    src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQjscLbHuJ6F99F1BSw41ahbDOL0zPyP87-FeHDiD6NgIBJJOOwTrLFgg&s=10",
    alt: "Vista",
  },
];

function Icon({ children, className = "", size = 24 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      {children}
    </svg>
  );
}

function App() {
  const [currentImage, setCurrentImage] = useState(0);

  const previousImage = () => {
    setCurrentImage((current) =>
      current === 0 ? images.length - 1 : current - 1,
    );
  };

  const nextImage = () => {
    setCurrentImage((current) => (current + 1) % images.length);
  };

  return (
    <div className="app">
      {/* NAVBAR */}
      <header className="d-flex align-items-center justify-content-between px-3 px-md-5 py-3 navbar-custom">
        <div className="d-flex align-items-center gap-4">
          <div className="logo-circle rounded-circle d-flex align-items-center justify-content-center flex-shrink-0">
            logo
          </div>

          <nav className="d-none d-lg-flex align-items-center gap-4 nav-links">
            <a href="#habitaciones" className="nav-link-custom active">
              <Icon size={16}>
                <path
                  d="M12 3l9 8h-3v9h-5v-6H11v6H6v-9H3l9-8z"
                  fill="currentColor"
                  stroke="none"
                />
              </Icon>
              Habitaciones
            </a>

            <a href="#planes" className="nav-link-custom">
              <Icon size={16}>
                <path
                  d="M4 4h16v2H4zM4 11h16v2H4zM4 18h16v2H4z"
                  fill="currentColor"
                  stroke="none"
                />
              </Icon>
              Planes
            </a>

            <a href="#restaurante" className="nav-link-custom">
              <Icon size={16}>
                <path
                  d="M8 2v6a2 2 0 01-2 2H5v12H3V2h2v6h1V2h2zM17 2c-2.5 0-4 3-4 6.5S15 15 15 15v9h2v-9s2-2 2-5.5S19.5 2 17 2z"
                  fill="currentColor"
                  stroke="none"
                />
              </Icon>
              Restaurante
            </a>

            <a href="#contacto" className="nav-link-custom">
              <Icon size={16}>
                <path
                  d="M2 4h20v16H2V4zm2 2v.01L12 12l8-5.99V6H4zm16 2.24l-7.42 5.56a1 1 0 01-1.16 0L4 8.24V18h16V8.24z"
                  fill="currentColor"
                  stroke="none"
                />
              </Icon>
              Contacto
            </a>
          </nav>
        </div>

        <button className="btn-reserve">RESERVAR</button>
      </header>

      {/* HERO */}
      <section className="position-relative hero-section">
        <img
          src="https://dynamic-media-cdn.tripadvisor.com/media/photo-o/22/ac/fd/b1/el-pozzo-hotel-campestre.jpg?w=900&h=500&s=1"
          alt="Fachada del hotel"
          className="position-absolute top-0 start-0 w-100 h-100 hero-img"
        />
        <div className="position-absolute top-0 start-0 w-100 h-100 hero-gradient" />

        <div className="position-relative h-100 d-flex flex-column justify-content-center px-4 px-md-5 hero-content">
          <p className="text-white letter-spacing-wide fw-semibold small mb-2">
            TU ESCAPADA PERFECTA
          </p>

          <h1 className="text-white fw-bold lh-1 mb-3 hero-title">
            Hotel Moderno
            <br />y Confortable
          </h1>

          <p className="text-white mb-0 hero-description">
            Disfruta de una experiencia única en un entorno natural, con todas
            las comodidades que necesitas.
          </p>
        </div>

        <div className="position-absolute bottom-0 start-0 mb-4 ms-4 ms-md-5 d-flex gap-2">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className={`hero-dot ${dot === 0 ? "active" : ""}`}
            />
          ))}
        </div>
      </section>

      {/* ROOM DETAIL */}
      <section className="px-3 px-md-5 py-4" id="habitaciones">
        <div className="room-grid">
          {/* GALERÍA */}
          <div>
            <div className="position-relative rounded-4 overflow-hidden bg-light main-image-wrap">
              <img
                src={images[currentImage].src}
                alt={images[currentImage].alt}
                className="w-100 h-100 object-fit-cover"
              />

              <span className="image-counter">
                {currentImage + 1} / {images.length}
              </span>

              <button
                onClick={previousImage}
                className="position-absolute top-50 start-0 translate-middle-y ms-2 btn-nav-circle"
                aria-label="Imagen anterior"
              >
                <Icon size={16}>
                  <path d="M15 18l-6-6 6-6" />
                </Icon>
              </button>

              <button
                onClick={nextImage}
                className="position-absolute top-50 end-0 translate-middle-y me-2 btn-nav-circle"
                aria-label="Imagen siguiente"
              >
                <Icon size={16}>
                  <path d="M9 18l6-6-6-6" />
                </Icon>
              </button>
            </div>

            <div className="thumbs-grid mt-2">
              {images.map((image, index) => (
                <img
                  key={image.src}
                  src={image.src}
                  alt={image.alt}
                  onClick={() => setCurrentImage(index)}
                  className={`thumb-img w-100 rounded-3 ${
                    currentImage === index ? "selected" : ""
                  }`}
                />
              ))}
            </div>
          </div>

          {/* INFORMACIÓN */}
          <div>
            <span className="room-badge">Habitación 1</span>

            <h2 className="fw-bold text-dark mb-1 room-title">Habitación 1</h2>

            <p className="text-secondary small mb-4">
              Ideal para parejas o viajeros de negocios
            </p>

            <div className="features-grid mb-4">
              <Feature
                icon={
                  <path d="M3 18v-6a2 2 0 012-2h14a2 2 0 012 2v6M3 18h18M3 18v2M21 18v2M5 10V7a2 2 0 012-2h3a2 2 0 012 2v3M12 10V8a2 2 0 012-2h3a2 2 0 012 2v2" />
                }
                text={
                  <>
                    2 camas Dobles (1.40 Mts)
                    <br />ó 2 Camas Semidobles (1.20 Mts)
                  </>
                }
              />
              <Feature
                icon={
                  <>
                    <rect x="3" y="5" width="18" height="12" rx="1" />
                    <path d="M8 21h8M12 17v4" />
                  </>
                }
                text="TV por cable"
              />
              <Feature
                icon={
                  <path d="M12 3a4 4 0 100 8 4 4 0 000-8zM6 21v-2a6 6 0 016-6h0a6 6 0 016 6v2" />
                }
                text="Aire acondicionado"
              />
              <Feature
                icon={
                  <>
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <path d="M8 12h.01M12 12h.01M16 12h.01" />
                  </>
                }
                text="Caja de seguridad"
              />
              <Feature
                icon={
                  <path d="M5 12a7 7 0 0114 0M2 12h2M20 12h2M12 2v2M12 19v3" />
                }
                text="Wi-Fi"
              />
              <Feature
                icon={
                  <>
                    <rect x="3" y="4" width="16" height="12" rx="2" />
                    <path d="M7 21h8M11 16v5" />
                  </>
                }
                text="Estación de trabajo"
              />
              <Feature
                icon={<path d="M4 4h16l-7 8v6l-2 2v-8L4 4z" />}
                text="Mini bar"
              />
            </div>

            <h3 className="small fw-semibold text-dark mb-2">Descripción</h3>

            <p className="small text-secondary lh-lg mb-4">
              Amplia y cómoda habitación con un diseño moderno, ideal para
              descansar y disfrutar de tu estancia. Cuenta con todas las
              comodidades para que te sientas como en casa, con una vista
              increíble y un ambiente relajante.
            </p>

            <div className="d-flex flex-wrap gap-2">
              <Tag>Hasta 4 personas</Tag>
              <Tag>30 m²</Tag>
              <Tag>No fumadores</Tag>
            </div>
          </div>

          {/* TARJETA DE RESERVA */}
          <div className="booking-card">
            <p className="small text-secondary mb-1">Desde</p>
            <p className="fw-bold text-dark mb-0 price">$120.000</p>
            <p className="small text-secondary mb-4">por noche</p>

            <button className="w-100 btn-reserve booking-button mb-4">
              Reservar ahora
              <Icon size={16}>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </Icon>
            </button>

            <div className="d-flex align-items-start gap-3 pb-4 mb-4 border-bottom">
              <div className="security-icon">✓</div>
              <div>
                <p className="small fw-semibold text-dark mb-0">
                  Cancelación gratuita
                </p>
                <p className="small text-secondary mb-0">
                  Hasta 24h antes de la llegada
                </p>
              </div>
            </div>

            <div className="d-flex flex-column gap-3 small text-secondary">
              <InfoRow>
                <Icon size={16}>
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </Icon>
                Check-in: 3:00 p.m.
              </InfoRow>

              <InfoRow>
                <Icon size={16}>
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </Icon>
                Check-out: 12:00 m.
              </InfoRow>

              <InfoRow>
                <Icon size={16}>
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
                </Icon>
                Máx. 4 personas
              </InfoRow>
            </div>
          </div>
        </div>
      </section>

      {/* WHATSAPP */}
      <a
        href="https://wa.me/"
        className="whatsapp-fab"
        aria-label="Contactar por WhatsApp"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.85.51 3.58 1.4 5.06L2 22l5.19-1.5a9.9 9.9 0 004.85 1.24h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.79 14.18c-.24.68-1.4 1.32-1.93 1.4-.5.08-1.13.11-1.82-.12-.42-.14-.95-.31-1.64-.61-2.88-1.24-4.76-4.15-4.9-4.34-.14-.19-1.17-1.56-1.17-2.98s.73-2.11 1-2.4c.26-.29.57-.36.76-.36.19 0 .38 0 .55.01.18.01.41-.07.64.49.24.57.81 1.98.88 2.12.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.16.28.71 1.17 1.52 1.9 1.05.94 1.93 1.23 2.21 1.37.28.14.44.12.6-.07.17-.19.71-.83.9-1.11.19-.28.38-.24.64-.14.26.09 1.66.78 1.94.93.28.14.47.21.54.33.07.12.07.68-.17 1.36z" />
        </svg>
      </a>
    </div>
  );
}

function Feature({ icon, text }) {
  return (
    <div className="d-flex align-items-start gap-3">
      <Icon className="feature-icon">{icon}</Icon>
      <span className="small text-secondary">{text}</span>
    </div>
  );
}

function Tag({ children }) {
  return <span className="room-tag">{children}</span>;
}

function InfoRow({ children }) {
  return <div className="d-flex align-items-center gap-3">{children}</div>;
}

export default App;
