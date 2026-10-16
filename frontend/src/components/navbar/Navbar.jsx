import { useCallback, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Icon from "../icon/Icon.jsx";
import ReserveModal from "./ReserveModal.jsx";
import { useAuth } from "../../context/authContext.js";
import appIcon from "../../images/icon.jpg";
import Tooltip from "../tooltip/Tooltip.jsx";
import "./Navbar.css";

const navItems = [
  {
    to: "/",
    labelKey: "rooms",
    path: "M12 3l9 8h-3v9h-5v-6H11v6H6v-9H3l9-8z",
  },
  {
    to: "/planes",
    labelKey: "plans",
    path: "M4 4h16v2H4zM4 11h16v2H4zM4 18h16v2H4z",
  },
  {
    to: "/restaurante",
    labelKey: "restaurant",
    path: "M8 2v6a2 2 0 01-2 2H5v12H3V2h2v6h1V2h2zM17 2c-2.5 0-4 3-4 6.5S15 15 15 15v9h2v-9s2-2 2-5.5S19.5 2 17 2z",
  },
  {
    to: "/contacto",
    labelKey: "contact",
    path: "M2 4h20v16H2V4zm2 2v.01L12 12l8-5.99V6H4zm16 2.24l-7.42 5.56a1 1 0 01-1.16 0L4 8.24V18h16V8.24z",
  },
];

export default function Navbar({ hotelName, labels, whatsappNumber = "582767883117" }) {
  const [isReserveOpen, setIsReserveOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const closeReserveModal = useCallback(() => setIsReserveOpen(false), []);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, []);

  const handleLogin = ({ email, password, remember }) => {
    const user = login(email, password, remember);
    closeReserveModal();
    setIsMenuOpen(false);
    navigate(user.role === "admin" ? "/admin" : "/mi-habitacion");
  };

  return (
    <div className="navbar-wrapper">
      <header className="d-flex align-items-center justify-content-between px-3 px-md-5 py-3 navbar-custom">
        <div className="d-flex align-items-center gap-4">
          <div className="logo-circle rounded-circle flex-shrink-0">
            <img src={appIcon} alt={hotelName || "Hotel Molinera"} />
          </div>

          <nav className="d-none d-lg-flex align-items-center gap-4 nav-links">
            {navItems.map(({ to, labelKey, path }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `nav-link-custom ${isActive ? "active" : ""}`
                }
              >
                <Icon size={16}>
                  <path d={path} fill="currentColor" stroke="none" />
                </Icon>
                {labels[labelKey]}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="navbar-actions">
          <button
            type="button"
            className="btn-reserve"
            onClick={() => {
              setIsMenuOpen(false);
              setIsReserveOpen(true);
            }}
          >
            {labels.reserve}
          </button>

          <Tooltip label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}>
            <button
              type="button"
              className={`mobile-menu-toggle d-lg-none ${isMenuOpen ? "is-open" : ""}`}
              aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              <span />
              <span />
              <span />
            </button>
          </Tooltip>
        </div>
      </header>

      <div className={`mobile-menu ${isMenuOpen ? "is-open" : ""}`}>
        <nav id="mobile-navigation" aria-hidden={!isMenuOpen}>
          {navItems.map(({ to, labelKey, path }) => (
            <NavLink
              key={to}
              to={to}
              tabIndex={isMenuOpen ? 0 : -1}
              className={({ isActive }) =>
                `mobile-nav-link ${isActive ? "active" : ""}`
              }
              onClick={() => setIsMenuOpen(false)}
            >
              <Icon size={18}>
                <path d={path} fill="currentColor" stroke="none" />
              </Icon>
              {labels[labelKey]}
            </NavLink>
          ))}
        </nav>
      </div>

      <ReserveModal
        isOpen={isReserveOpen}
        onClose={closeReserveModal}
        hotelName={hotelName}
        labels={labels}
        whatsappNumber={whatsappNumber}
        onLogin={handleLogin}
      />
    </div>
  );
}