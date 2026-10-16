import { Bell, ChevronDown, LogOut, Settings, User } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext.js";
import SidebarToggle from "../sidebar_toggle/SidebarToggle.jsx";
import Tooltip from "../tooltip/Tooltip.jsx";
import "./GuestTopbar.css";

export default function GuestTopbar({ guest, notificationLabel, onOpenSidebar, menuLabel = "Abrir menú" }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (menu) => {
    setOpenMenu((currentMenu) => (currentMenu === menu ? null : menu));
  };

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <header className="guest-topbar bg-white border-bottom d-flex align-items-center gap-3 px-4 py-3">
      <div className="d-lg-none">
        <SidebarToggle onClick={onOpenSidebar} label={menuLabel} />
      </div>
      <div className="guest-topbar-actions d-flex align-items-center gap-3 ms-auto">
        <div className="guest-topbar-menu">
          <Tooltip label={notificationLabel}>
            <button
              type="button"
              className="guest-notification-btn btn btn-light rounded-circle position-relative"
              aria-label={notificationLabel}
              aria-expanded={openMenu === "notifications"}
              onClick={() => toggleMenu("notifications")}
            >
              <Bell size={18} />
              <span className="guest-notification-dot" />
            </button>
          </Tooltip>
          {openMenu === "notifications" && (
            <div className="guest-dropdown guest-notifications-dropdown">
              <strong className="guest-dropdown-title">Notificaciones</strong>
              <button type="button" onClick={() => navigate("/pedidos")}>
                <span className="guest-notification-mark" />
                Tu pedido está listo para entregar
                <small>Hace 10 minutos</small>
              </button>
              <button type="button" onClick={() => navigate("/mi-habitacion")}>
                <span className="guest-notification-mark guest-notification-mark--blue" />
                Tu habitación está disponible
                <small>Hace 25 minutos</small>
              </button>
            </div>
          )}
        </div>

        <div className="guest-topbar-menu">
          <button
            type="button"
            className="guest-profile-trigger"
            aria-label="Abrir menú de usuario"
            aria-expanded={openMenu === "profile"}
            onClick={() => toggleMenu("profile")}
          >
            <div className="guest-avatar">
              <User size={18} />
            </div>
            <div className="d-none d-sm-block text-start">
              <div className="fw-semibold small">{guest.nombre}</div>
              <div className="text-secondary small">{guest.habitacion}</div>
            </div>
            <ChevronDown size={16} className="text-secondary guest-profile-chevron" />
          </button>
          {openMenu === "profile" && (
            <div className="guest-dropdown guest-profile-dropdown">
              <button type="button" onClick={() => navigate("/configuracion")}>
                <Settings size={16} />
                Configuración
              </button>
              <button type="button" className="guest-logout-action" onClick={handleLogout}>
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}