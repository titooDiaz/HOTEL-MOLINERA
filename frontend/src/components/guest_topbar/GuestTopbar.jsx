// Barra superior del huésped con notificaciones, perfil, configuración y cierre de sesión.
import { Bell, ChevronDown, LogOut, Settings, User } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext.js";
import SidebarToggle from "../sidebar_toggle/SidebarToggle.jsx";
import Tooltip from "../tooltip/Tooltip.jsx";
import "./GuestTopbar.css";

export default function GuestTopbar({ guest, notificationLabel, onOpenSidebar, menuLabel = "Abrir menú" }) {
  const navigate = useNavigate();
  const {
    logout,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useAuth();
  const [openMenu, setOpenMenu] = useState(null);
  const [notificationError, setNotificationError] = useState("");
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  const toggleMenu = (menu) => {
    setOpenMenu((currentMenu) => (currentMenu === menu ? null : menu));
  };

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const openNotification = async (notification) => {
    setNotificationError("");
    try {
      if (!notification.readAt) await markNotificationRead(notification.id);
      setOpenMenu(null);
      const route = notification.data?.route;
      if (typeof route === "string" && route.startsWith("/")) navigate(route);
    } catch (error) {
      setNotificationError(error.message);
    }
  };

  const handleMarkAllRead = async () => {
    setNotificationError("");
    try {
      await markAllNotificationsRead();
    } catch (error) {
      setNotificationError(error.message);
    }
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
              {unreadCount > 0 && <span className="guest-notification-dot" />}
            </button>
          </Tooltip>
          {openMenu === "notifications" && (
            <div className="guest-dropdown guest-notifications-dropdown">
              <div className="guest-notification-heading">
                <strong className="guest-dropdown-title">Notificaciones</strong>
                {unreadCount > 0 && (
                  <button type="button" className="guest-mark-all-read" onClick={handleMarkAllRead}>
                    Marcar todas leídas
                  </button>
                )}
              </div>
              {notificationError && <p className="guest-notification-error" role="alert">{notificationError}</p>}
              {notifications.length ? notifications.slice(0, 8).map((notification) => (
                <button
                  type="button"
                  className={notification.readAt ? "guest-notification-read" : "guest-notification-unread"}
                  key={notification.id}
                  onClick={() => openNotification(notification)}
                >
                  <span className="guest-notification-mark" />
                  <span>{notification.title}</span>
                  <small>{notification.message}</small>
                  <small>{new Intl.DateTimeFormat("es-VE", { dateStyle: "short", timeStyle: "short" }).format(new Date(notification.createdAt))}</small>
                </button>
              )) : <p className="guest-notification-empty">No tienes notificaciones.</p>}
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