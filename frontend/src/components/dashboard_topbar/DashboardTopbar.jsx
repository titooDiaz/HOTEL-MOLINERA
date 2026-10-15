import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext.js";
import DashboardIcon from "../../components/icon/DashboardIcon.jsx";
import SidebarToggle from "../sidebar_toggle/SidebarToggle.jsx";
import Tooltip from "../tooltip/Tooltip.jsx";
import "./DashboardTopbar.css";

export default function DashboardTopbar({ onOpenSidebar, labels }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const topbarActionsRef = useRef(null);
  const [openMenu, setOpenMenu] = useState(null);

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (!topbarActionsRef.current?.contains(event.target)) {
        setOpenMenu(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const toggleMenu = (menu) => {
    setOpenMenu((currentMenu) => (currentMenu === menu ? null : menu));
  };

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <header className="topbar position-sticky top-0 z-20">
      <div className="d-flex align-items-center topbar-inner">
        <div className="d-lg-none">
          <SidebarToggle onClick={onOpenSidebar} label={labels.menuLabel} />
        </div>

        <div className="flex-grow-1 search-wrap position-relative d-none d-sm-block">
          <DashboardIcon className="search-icon" width={16} height={16}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </DashboardIcon>
          <input
            type="text"
            placeholder={labels.searchPlaceholder}
            className="search-input"
            aria-label={labels.searchLabel}
          />
        </div>

        <div className="flex-grow-1 d-sm-none" />

        <div className="d-flex align-items-center gap-3 ms-auto topbar-actions" ref={topbarActionsRef}>
          <div className="topbar-menu">
            <Tooltip label={labels.notificationsLabel}>
              <button
                type="button"
                className="notif-btn"
                aria-label={labels.notificationsLabel}
                aria-expanded={openMenu === "notifications"}
                onClick={() => toggleMenu("notifications")}
              >
                <DashboardIcon width={20} height={20}>
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 0-3.46 0" />
                </DashboardIcon>
                <span className="notif-dot" />
              </button>
            </Tooltip>
            {openMenu === "notifications" && (
              <div className="topbar-dropdown notifications-dropdown">
                <div className="topbar-dropdown-heading">
                  <strong>Notificaciones</strong>
                  <span className="notification-count">2 nuevas</span>
                </div>
                <button type="button" className="notification-item" onClick={() => navigate("/admin/reservas")}>
                  <span className="notification-item-dot notification-item-dot--rose" />
                  <span>
                    <strong>Nueva reserva recibida</strong>
                    <small>Hace 10 minutos</small>
                  </span>
                </button>
                <button type="button" className="notification-item" onClick={() => navigate("/admin/habitaciones")}>
                  <span className="notification-item-dot notification-item-dot--blue" />
                  <span>
                    <strong>Habitación disponible</strong>
                    <small>Hace 25 minutos</small>
                  </span>
                </button>
              </div>
            )}
          </div>

          <div className="topbar-menu">
            <button
              type="button"
              className="profile-trigger"
              aria-label="Abrir menú de perfil"
              aria-expanded={openMenu === "profile"}
              onClick={() => toggleMenu("profile")}
            >
              <span className="avatar-circle">
                <DashboardIcon width={16} height={16} stroke="#64748b">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </DashboardIcon>
              </span>
              <span className="d-none d-md-block text-start">
                <span className="d-block fw-medium text-slate-700 dashboard-admin-name">
                  {labels.adminName}
                </span>
                <span className="d-block text-slate-400 dashboard-admin-role">
                  {labels.adminRole}
                </span>
              </span>
              <DashboardIcon className="profile-chevron" width={14} height={14} stroke="#94a3b8">
                <polyline points="6 9 12 15 18 9" />
              </DashboardIcon>
            </button>
            {openMenu === "profile" && (
              <div className="topbar-dropdown profile-dropdown">
                <button type="button" onClick={() => navigate("/admin/configuracion")}>
                  <DashboardIcon width={16} height={16}>
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </DashboardIcon>
                  Configuración
                </button>
                <button type="button" className="profile-logout" onClick={handleLogout}>
                  <DashboardIcon width={16} height={16}>
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </DashboardIcon>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}