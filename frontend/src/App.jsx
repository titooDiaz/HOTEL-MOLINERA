import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function App() {
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

function App() {
  const [currentImage, setCurrentImage] = useState(0);

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const previousImage = () => {
    setCurrentImage(
      (prev) => (prev - 1 + images.length) % images.length
    );
  };

  return (
    <>
      {/* NAVBAR */}
      <header className="d-flex align-items-center justify-content-between px-3 px-md-5 py-3 bg-slate-50-70">
        <div className="d-flex align-items-center gap-4">

          {/* Logo */}
          <div
            className="logo-circle rounded-circle bg-slate-800 text-white d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ fontSize: "10px", fontWeight: 600 }}
          >
            logo
          </div>

          {/* Navegación */}
          <nav className="d-none d-lg-flex align-items-center gap-4 fs-sm fw-medium text-slate-500">

            <a
              href="#"
              className="d-flex align-items-center gap-2 text-red-500 text-decoration-none pb-1"
              style={{ borderBottom: "2px solid var(--red-500)" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 3l9 8h-3v9h-5v-6H11v6H6v-9H3l9-8z" />
              </svg>

              Habitaciones
            </a>

            <a
              href="#"
              className="d-flex align-items-center gap-2 text-slate-500 text-decoration-none transition hover-text-slate-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M4 4h16v2H4zM4 11h16v2H4zM4 18h16v2H4z" />
              </svg>

              Planes
            </a>

            <a
              href="#"
              className="d-flex align-items-center gap-2 text-slate-500 text-decoration-none transition hover-text-slate-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8 2v6a2 2 0 01-2 2H5v12H3V2h2v6h1V2h2zM17 2c-2.5 0-4 3-4 6.5S15 15 15 15v9h2v-9s2-2 2-5.5S19.5 2 17 2z" />
              </svg>

              Restaurante
            </a>

            <a
              href="#"
              className="d-flex align-items-center gap-2 text-slate-500 text-decoration-none transition hover-text-slate-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M2 4h20v16H2V4zm2 2v.01L12 12l8-5.99V6H4zm16 2.24l-7.42 5.56a1 1 0 01-1.16 0L4 8.24V18h16V8.24z" />
              </svg>

              Contacto
            </a>

          </nav>
        </div>

        {/* Botón reservar */}
        <button className="bg-red-500 transition text-white fw-semibold fs-sm px-4 py-2 rounded-pill-btn border-0 text-nowrap">
          RESERVAR
        </button>
      </header>

      {/* HERO */}
      <section className="position-relative hero-section">

        <img
          src="https://dynamic-media-cdn.tripadvisor.com/media/photo-o/22/ac/fd/b1/el-pozzo-hotel-campestre.jpg?w=900&h=500&s=1"
          alt="Fachada del hotel"
          className="position-absolute top-0 start-0 w-100 h-100 hero-img"
        />

        <div className="position-absolute top-0 start-0 w-100 h-100 hero-gradient"></div>

        <div
          className="position-relative h-100 d-flex flex-column justify-content-center px-4 px-md-5"
          style={{ maxWidth: "36rem", zIndex: 2 }}
        >
          <p
            className="text-white letter-spacing-wide fw-semibold fs-xs mb-2"
            style={{ opacity: 0.9 }}
          >
            TU ESCAPADA PERFECTA
          </p>

          <h1
            className="text-white fw-bold lh-tight-custom mb-3"
            style={{ fontSize: "2rem" }}
          >
            Hotel Moderno
            <br />
            y Confortable
          </h1>

          <p
            className="text-white mb-0"
            style={{ opacity: 0.85, maxWidth: "28rem" }}
          >
            Disfruta de una experiencia única en un entorno natural,
            con todas las comodidades que necesitas.
          </p>
        </div>

        {/* Indicadores */}
        <div
          className="position-absolute bottom-0 start-0 mb-4 ms-4 ms-md-5 d-flex gap-2"
          style={{ zIndex: 2 }}
        >
          <span
            className="rounded-circle bg-red-500"
            style={{ width: "8px", height: "8px" }}
          ></span>

          <span
            className="rounded-circle bg-white"
            style={{ width: "8px", height: "8px", opacity: 0.6 }}
          ></span>

          <span
            className="rounded-circle bg-white"
            style={{ width: "8px", height: "8px", opacity: 0.6 }}
          ></span>
        </div>
      </section>

      {/* ROOM DETAIL */}
      <section className="px-3 px-md-5 py-4">
        <div className="room-grid">

          {/* GALERÍA */}
          <div>

            {/* Imagen principal */}
            <div className="position-relative rounded-4 overflow-hidden bg-slate-200 main-image-wrap">

              <img
                src={images[currentImage].src}
                alt={images[currentImage].alt}
                className="w-100 h-100 object-fit-cover"
              />

              {/* Contador */}
              <span
                className="position-absolute top-0 start-0 mt-3 ms-3 text-white fs-xs fw-medium px-2 py-1 rounded-2"
                style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
              >
                {currentImage + 1} / {images.length}
              </span>

              {/* Anterior */}
              <button
                onClick={previousImage}
                className="position-absolute top-50 start-0 translate-middle-y ms-2 btn-nav-circle rounded-circle d-flex align-items-center justify-content-center border-0 shadow-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  className="text-slate-700"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              {/* Siguiente */}
              <button
                onClick={nextImage}
                className="position-absolute top-50 end-0 translate-middle-y me-2 btn-nav-circle rounded-circle d-flex align-items-center justify-content-center border-0 shadow-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  className="text-slate-700"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>

            {/* Miniaturas */}
            <div className="thumbs-grid mt-2">
              {images.map((image, index) => (
                <img
                  key={index}
                  src={image.src}
                  alt={`Miniatura ${image.alt}`}
                  onClick={() => setCurrentImage(index)}
                  className={`thumb-img w-100 rounded-3 ${
                    currentImage === index ? "" : "opacity-90 transition"
                  }`}
                  style={{
                    cursor: "pointer",
                    border:
                      currentImage === index
                        ? "2px solid var(--red-500)"
                        : "none",
                  }}
                />
              ))}
            </div>
          </div>

          {/* INFORMACIÓN */}
          <div>

            <span className="d-inline-block bg-red-50 text-red-500 fs-xs fw-semibold px-3 py-2 rounded-pill-btn mb-3">
              Habitación 1
            </span>

            <h2
              className="fw-bold text-slate-800 mb-1"
              style={{ fontSize: "1.75rem" }}
            >
              Habitación 1
            </h2>

            <p className="text-slate-500 fs-sm mb-4">
              Ideal para parejas o viajeros de negocios
            </p>

            {/* Características */}
            <div className="features-grid mb-4">

              <Feature
                icon="M3 18v-6a2 2 0 012-2h14a2 2 0 012 2v6M3 18h18M3 18v2M21 18v2M5 10V7a2 2 0 012-2h3a2 2 0 012 2v3M12 10V8a2 2 0 012-2h3a2 2 0 012 2v2"
                text={
                  <>
                    2 camas Dobles (1.40 Mts)
                    <br />
                    ó 2 Camas Semidobles (1.20 Mts)
                  </>
                }
              />

              <Feature
                icon="M3 5h18v12H3zM8 21h8M12 17v4"
                text="TV por cable"
              />

              <Feature
                icon="M12 3a4 4 0 100 8 4 4 0 000-8zM6 21v-2a6 6 0 016-6h0a6 6 0 016 6v2"
                text="Aire acondicionado"
              />

              <Feature
                icon="M4 4h16v16H4zM8 12h.01M12 12h.01M16 12h.01"
                text="Caja de seguridad"
              />

              <Feature
                icon="M5 12a7 7 0 0114 0M2 12h2M20 12h2M12 2v2M12 19v3"
                text="Wi-Fi"
              />

              <Feature
                icon="M3 4h16v12H3zM7 21h8M11 16v5"
                text="Estación de trabajo"
              />

              <Feature
                icon="M4 4h16l-7 8v6l-2 2v-8L4 4z"
                text="Mini bar"
              />

            </div>

            {/* Descripción */}
            <h3 className="fs-sm fw-semibold text-slate-800 mb-2">
              Descripción
            </h3>

            <p className="fs-sm text-slate-500 lh-relaxed-custom mb-4">
              Amplia y cómoda habitación con un diseño moderno,
              ideal para descansar y disfrutar de tu estancia.
              Cuenta con todas las comodidades para que te sientas
              como en casa, con una vista increíble y un ambiente relajante.
            </p>

            {/* Etiquetas */}
            <div className="d-flex flex-wrap gap-2">
              <Tag text="Hasta 4 personas" />
              <Tag text="30 m²" />
              <Tag text="No fumadores" />
            </div>

          </div>

          {/* TARJETA DE RESERVA */}
          <div
            className="bg-slate-50 rounded-4 p-4 p-md-4 border border-slate-100"
            style={{ height: "fit-content" }}
          >
            <p className="fs-sm text-slate-500 mb-1">
              Desde
            </p>

            <p
              className="fw-bold text-slate-800 mb-0"
              style={{ fontSize: "1.75rem" }}
            >
              $120.000
            </p>

            <p className="fs-sm text-slate-500 mb-4">
              por noche
            </p>

            <button className="w-100 bg-red-500 transition text-white fw-semibold fs-sm py-3 rounded-pill-btn border-0 d-flex align-items-center justify-content-center gap-2 mb-4">
              Reservar ahora

              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>

            {/* Cancelación */}
            <div className="d-flex align-items-start gap-3 pb-4 mb-4 border-bottom border-slate-200">

              <div
                className="rounded-circle bg-emerald-100 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: "2rem", height: "2rem" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  className="text-emerald-600"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 1L4 4v6c0 5.5 3.4 10.7 8 12 4.6-1.3 8-6.5 8-12V4l-8-3zm-1.2 14.3L7 11.5l1.4-1.4 2.4 2.4 5.2-5.2L17.4 8l-6.6 7.3z" />
                </svg>
              </div>

              <div>
                <p className="fs-sm fw-semibold text-slate-800 mb-0">
                  Cancelación gratuita
                </p>

                <p className="fs-xs text-slate-500 mb-0">
                  Hasta 24h antes de la llegada
                </p>
              </div>
            </div>

            {/* Información */}
            <div className="d-flex flex-column gap-3 fs-sm">

              <Info text="Check-in: 3:00 p.m." />

              <Info text="Check-out: 12:00 m." />

              <Info text="Máx. 4 personas" />

            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp */}
      <a
        href="#"
        className="position-fixed bottom-0 end-0 mb-4 me-4 whatsapp-fab bg-emerald-500 transition rounded-circle d-flex align-items-center justify-content-center shadow-lg text-decoration-none"
        style={{ zIndex: 1050 }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          className="text-white"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.85.51 3.58 1.4 5.06L2 22l5.19-1.5a9.9 9.9 0 004.85 1.24h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.79 14.18c-.24.68-1.4 1.32-1.93 1.4-.5.08-1.13.11-1.82-.12-.42-.14-.95-.31-1.64-.61-2.88-1.24-4.76-4.15-4.9-4.34-.14-.19-1.17-1.56-1.17-2.98s.73-2.11 1-2.4c.26-.29.57-.36.76-.36.19 0 .38 0 .55.01.18.01.41-.07.64.49.24.57.81 1.98.88 2.12.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.16.28.71 1.17 1.52 1.9 1.05.94 1.93 1.23 2.21 1.37.28.14.44.12.6-.07.17-.19.71-.83.9-1.11.19-.28.38-.24.64-.14.26.09 1.66.78 1.94.93.28.14.47.21.54.33.07.12.07.68-.17 1.36z" />
        </svg>
      </a>
    </>
  );
}

/* =========================
   COMPONENTES AUXILIARES
   ========================= */

function Feature({ icon, text }) {
  return (
    <div className="d-flex align-items-start gap-3">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="icon-feature mt-1"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d={icon} />
      </svg>

      <span className="fs-sm text-slate-600">
        {text}
      </span>
    </div>
  );
}

function Tag({ text }) {
  return (
    <span className="d-flex align-items-center gap-2 bg-red-50 text-red-500 fs-xs fw-medium px-3 py-2 rounded-pill-btn">
      {text}
    </span>
  );
}

function Info({ text }) {
  return (
    <div className="d-flex align-items-center gap-3 text-slate-600">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        className="text-slate-400 flex-shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>

      {text}
    </div>
  );
}
}

export default App
