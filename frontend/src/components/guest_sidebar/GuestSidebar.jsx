import {
  BedDouble,
  FileText,
  Home,
  LogOut,
  Settings,
  User,
  Utensils,
} from "lucide-react";
import "./GuestSidebar.css";

const NAV_ITEMS = [
  { label: "Inicio", icon: Home },
  { label: "Mi habitación", icon: BedDouble },
  { label: "Alimentos y bebidas", icon: Utensils },
  { label: "Mis consumos", icon: FileText },
  { label: "Mi cuenta", icon: User },
  { label: "Configuración", icon: Settings },
];

export default function GuestSidebar() {
  return (
    <aside className="guest-sidebar d-none d-lg-flex flex-column bg-white border-end">
      <div className="guest-brand d-flex align-items-center gap-2 px-4 py-4">
        <div className="guest-logo">HM</div>
        <div>
          <div className="fw-semibold">Hotel Moderno</div>
          <div className="text-secondary small">Tu estadía, nuestra prioridad</div>
        </div>
      </div>

      <nav className="flex-grow-1 px-3">
        {NAV_ITEMS.map(({ label, icon: Icon }) => {
          const active = label === "Alimentos y bebidas";

          return (
            <button
              key={label}
              type="button"
              className={`guest-nav-item btn w-100 d-flex align-items-center gap-2 text-start mb-1 ${
                active ? "guest-nav-active" : ""
              }`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-3 pb-4">
        <button
          type="button"
          className="guest-nav-item btn w-100 d-flex align-items-center gap-2 text-secondary"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}