import { Link } from "react-router-dom";
import appIcon from "../../../public/favicon.svg";
import "./Footer.css";

export default function Footer({ hotelName = "Hotel Molinera" }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="public-footer">
      <div className="container py-5">
        <div className="row g-4">
          <div className="col-12 col-md-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <img
                src={appIcon}
                alt={hotelName}
                className="public-footer-logo rounded-circle"
              />
              <span className="public-footer-brand fw-bold fs-5">
                {hotelName}
              </span>
            </div>
            <p className="public-footer-text mb-3">
              Tu escapada perfecta en un entorno natural único. Confort, tranquilidad y la mejor atención en Capacho, Táchira.
            </p>
          </div>

          <div className="col-6 col-md-2 offset-md-1">
            <h6 className="fw-bold mb-3">Navegación</h6>
            <ul className="list-unstyled public-footer-links">
              <li><Link to="/">Habitaciones</Link></li>
              <li><Link to="/planes">Planes</Link></li>
              <li><Link to="/restaurante">Restaurante</Link></li>
              <li><Link to="/contacto">Contacto</Link></li>
            </ul>
          </div>

          <div className="col-6 col-md-2">
            <h6 className="fw-bold mb-3">Servicios</h6>
            <ul className="list-unstyled public-footer-links">
              <li><span>Piscina</span></li>
              <li><span>Senderismo</span></li>
              <li><span>Restaurante & Bar</span></li>
              <li><span>Eventos</span></li>
            </ul>
          </div>

          <div className="col-12 col-md-3">
            <h6 className="fw-bold mb-3">Contacto</h6>
            <ul className="list-unstyled public-footer-contact">
              <li className="mb-2">Capacho 5009, Táchira, Venezuela</li>
              <li className="mb-2">+58 276-7883117</li>
              <li className="mb-2">contacto@hotel.com</li>
              <li>
                <a
                  href="https://www.instagram.com/lanuevamolinera_capacho/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="public-footer-social"
                >
                  @lanuevamolinera_capacho
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-top pt-4 mt-4 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2 public-footer-bottom small">
          <p className="mb-0">
            © {currentYear} {hotelName}. Todos los derechos reservados.
          </p>
          <div className="d-flex gap-3">
            <span>Privacidad</span>
            <span>Términos y condiciones</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
