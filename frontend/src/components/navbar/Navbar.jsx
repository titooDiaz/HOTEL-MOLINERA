import { useCallback, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Icon from "../icon/Icon.jsx";
import ReserveModal from "./ReserveModal.jsx";
import { useAuth } from "../../context/authContext.js";
import { useTheme } from "../../context/themeContext.js";
import appIcon from "../../../public/favicon.svg";
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

export default function Navbar({
  hotelName,
  labels,
  onOpenReserve,
  whatsappNumber = "584147015219",
}) {
  const [internalReserveOpen, setInternalReserveOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const isControlled = typeof onOpenReserve === "function";
  const isReserveOpen = isControlled ? false : internalReserveOpen;

  const handleOpenReserve = () => {
    setIsMenuOpen(false);
    if (isControlled) {
      onOpenReserve();
    } else {
      setInternalReserveOpen(true);
    }
  };

  const closeReserveModal = useCallback(() => {
    setInternalReserveOpen(false);
  }, []);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, []);

  const handleLogin = ({ email, password, remember }) => {
    const loggedUser = login(email, password, remember);
    closeReserveModal();
    setIsMenuOpen(false);
    navigate(loggedUser.role === "admin" ? "/admin" : "/mi-habitacion");
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
          <Tooltip label={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}>
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleDarkMode}
              aria-label={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            >
              <Icon size={18}>
                {isDarkMode ? (
                  <path
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                ) : (
                  <path
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                )}
              </Icon>
            </button>
          </Tooltip>

          {user ? (
            <button
              type="button"
              className="btn-reserve"
              onClick={() => {
                setIsMenuOpen(false);
                navigate(user.role === "admin" ? "/admin" : "/mi-habitacion");
              }}
            >
              {user.role === "admin" ? "Panel Admin" : "Mi Habitación"}
            </button>
          ) : (
            <button
              type="button"
              className="btn-reserve"
              onClick={handleOpenReserve}
            >
              {labels.reserve}
            </button>
          )}

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
          <button
            type="button"
            tabIndex={isMenuOpen ? 0 : -1}
            className="mobile-nav-link text-start w-100 bg-transparent border-0"
            onClick={toggleDarkMode}
          >
            <Icon size={18}>
              {isDarkMode ? (
                <path
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              ) : (
                <path
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              )}
            </Icon>
            {isDarkMode ? "Modo Claro" : "Modo Oscuro"}
          </button>
          {user && (
            <button
              type="button"
              tabIndex={isMenuOpen ? 0 : -1}
              className="mobile-nav-link text-start w-100 bg-transparent border-0 text-danger fw-semibold"
              onClick={() => {
                setIsMenuOpen(false);
                navigate(user.role === "admin" ? "/admin" : "/mi-habitacion");
              }}
            >
              <Icon size={18}>
                <circle cx="12" cy="7" r="4" />
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              </Icon>
              {user.role === "admin" ? "Panel Admin" : "Mi Habitación"}
            </button>
          )}
        </nav>
      </div>

      {!isControlled && (
        <ReserveModal
          isOpen={isReserveOpen}
          onClose={closeReserveModal}
          hotelName={hotelName}
          labels={labels}
          whatsappNumber={whatsappNumber}
          onLogin={handleLogin}
        />
      )}
    </div>
  );
}