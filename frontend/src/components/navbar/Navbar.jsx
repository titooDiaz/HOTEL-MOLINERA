import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Icon from "../icon/Icon.jsx";
import ReserveModal from "./ReserveModal.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
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

export default function Navbar({ hotelName, labels, whatsappNumber = "573001234567" }) {
  const [isReserveOpen, setIsReserveOpen] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = ({ email, password, remember }) => {
    const user = login(email, password, remember);
    setIsReserveOpen(false);
    navigate(user.role === "admin" ? "/admin" : "/mi-habitacion");
  };

  return (
    <>
      <header className="d-flex align-items-center justify-content-between px-3 px-md-5 py-3 navbar-custom">
        <div className="d-flex align-items-center gap-4">
          <div className="logo-circle rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 text-center fw-bold text-white small">
            {hotelName ? labels.brandInitials : labels.logoFallback}
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

        <button
          type="button"
          className="btn-reserve"
          onClick={() => setIsReserveOpen(true)}
        >
          {labels.reserve}
        </button>
      </header>

      <ReserveModal
        isOpen={isReserveOpen}
        onClose={() => setIsReserveOpen(false)}
        hotelName={hotelName}
        labels={labels}
        whatsappNumber={whatsappNumber}
        onLogin={handleLogin}
      />
    </>
  );
}