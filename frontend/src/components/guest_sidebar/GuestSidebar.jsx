import { LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext.js";
import appIcon from "../../../public/favicon.svg";
import "./GuestSidebar.css";

export default function GuestSidebar({ brand, items, activeItem, logoutLabel, sidebarOpen, onClose }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    if (!window.confirm("¿Seguro que quieres cerrar sesión?")) {
      return;
    }

    logout();
    navigate("/", { replace: true });
  };

  return (
    <>
      <div
        className={`guest-sidebar-overlay${sidebarOpen ? " show" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`guest-sidebar d-flex flex-column bg-white border-end${sidebarOpen ? " guest-sidebar-open" : ""}`}>
      <div className="guest-brand d-flex align-items-center gap-2 px-4 py-4">
        <img className="guest-logo" src={appIcon} alt="Logo de Hotel Molinera" />
        <div>
          <div className="fw-semibold">{brand.name}</div>
          <div className="text-secondary small">{brand.tagline}</div>
        </div>
      </div>

      <nav className="flex-grow-1 px-3">
        {items.map(({ label, icon: Icon, path }) => {
          return (
            <NavLink
              key={label}
              to={path}
              className={({ isActive }) =>
                `guest-nav-item btn w-100 d-flex align-items-center gap-2 text-start mb-1 ${
                  isActive || label === activeItem ? "guest-nav-active" : ""
                }`
              }
              onClick={onClose}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="px-3 pb-4">
        <button
          type="button"
          className="guest-nav-item btn w-100 d-flex align-items-center gap-2 text-secondary"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          {logoutLabel}
        </button>
      </div>
      </aside>
    </>
  );
}