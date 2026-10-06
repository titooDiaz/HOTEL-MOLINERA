import { LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import "./GuestSidebar.css";

export default function GuestSidebar({ brand, items, activeItem, logoutLabel }) {
  return (
    <aside className="guest-sidebar d-none d-lg-flex flex-column bg-white border-end">
      <div className="guest-brand d-flex align-items-center gap-2 px-4 py-4">
        <div className="guest-logo">{brand.initials}</div>
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
        >
          <LogOut size={18} />
          {logoutLabel}
        </button>
      </div>
    </aside>
  );
}