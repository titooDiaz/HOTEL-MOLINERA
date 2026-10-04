import { Bell, ChevronDown, User } from "lucide-react";
import "./GuestTopbar.css";

export default function GuestTopbar({ guest, notificationLabel }) {
  return (
    <header className="guest-topbar bg-white border-bottom d-flex align-items-center justify-content-end gap-3 px-4 py-3">
      <button
        type="button"
        className="guest-notification-btn btn btn-light rounded-circle position-relative"
        aria-label={notificationLabel}
      >
        <Bell size={18} />
        <span className="guest-notification-dot" />
      </button>

      <div className="d-flex align-items-center gap-2">
        <div className="guest-avatar">
          <User size={18} />
        </div>
        <div className="d-none d-sm-block">
          <div className="fw-semibold small">{guest.nombre}</div>
          <div className="text-secondary small">{guest.habitacion}</div>
        </div>
        <ChevronDown size={16} className="text-secondary" />
      </div>
    </header>
  );
}