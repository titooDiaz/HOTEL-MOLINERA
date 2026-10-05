import { NavLink } from "react-router-dom";
import Icon from "../icon/Icon.jsx";
import "./Navbar.css";

export default function Navbar({ hotelName, labels }) {
  return (
    <header className="d-flex align-items-center justify-content-between px-3 px-md-5 py-3 navbar-custom">
      <div className="d-flex align-items-center gap-4">
        <div className="logo-circle rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 text-center fw-bold text-white small">
          {hotelName ? labels.brandInitials : labels.logoFallback}
        </div>

        <nav className="d-none d-lg-flex align-items-center gap-4 nav-links">

          <NavLink
            to="/"
            className={({ isActive }) =>
              `nav-link-custom ${isActive ? "active" : ""}`
            }
          >
            <Icon size={16}>
              <path
                d="M12 3l9 8h-3v9h-5v-6H11v6H6v-9H3l9-8z"
                fill="currentColor"
                stroke="none"
              />
            </Icon>

            {labels.rooms}
          </NavLink>

          <NavLink
            to="/planes"
            className={({ isActive }) =>
              `nav-link-custom ${isActive ? "active" : ""}`
            }
          >
            <Icon size={16}>
              <path
                d="M4 4h16v2H4zM4 11h16v2H4zM4 18h16v2H4z"
                fill="currentColor"
                stroke="none"
              />
            </Icon>

            {labels.plans}
          </NavLink>

          <NavLink
            to="/restaurante"
            className={({ isActive }) =>
              `nav-link-custom ${isActive ? "active" : ""}`
            }
          >
            <Icon size={16}>
              <path
                d="M8 2v6a2 2 0 01-2 2H5v12H3V2h2v6h1V2h2zM17 2c-2.5 0-4 3-4 6.5S15 15 15 15v9h2v-9s2-2 2-5.5S19.5 2 17 2z"
                fill="currentColor"
                stroke="none"
              />
            </Icon>

            {labels.restaurant}
          </NavLink>

          <NavLink
            to="/contacto"
            className={({ isActive }) =>
              `nav-link-custom ${isActive ? "active" : ""}`
            }
          >
            <Icon size={16}>
              <path
                d="M2 4h20v16H2V4zm2 2v.01L12 12l8-5.99V6H4zm16 2.24l-7.42 5.56a1 1 0 01-1.16 0L4 8.24V18h16V8.24z"
                fill="currentColor"
                stroke="none"
              />
            </Icon>

            {labels.contact}
          </NavLink>

        </nav>
      </div>

      <button className="btn-reserve">
        {labels.reserve}
      </button>
    </header>
  );
}