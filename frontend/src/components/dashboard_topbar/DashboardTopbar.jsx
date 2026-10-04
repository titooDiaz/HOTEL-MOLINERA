import DashboardIcon from "../../components/icon/DashboardIcon.jsx";
import "./DashboardTopbar.css";

export default function DashboardTopbar({ onOpenSidebar, labels }) {
  return (
    <header className="topbar position-sticky top-0 z-20">
      <div className="d-flex align-items-center topbar-inner">
        <button
          type="button"
          className="d-lg-none icon-btn"
          onClick={onOpenSidebar}
          aria-label={labels.menuLabel}
        >
          <DashboardIcon width={22} height={22}>
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </DashboardIcon>
        </button>

        <div className="flex-grow-1 search-wrap position-relative d-none d-sm-block">
          <DashboardIcon width={16} height={16}>
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

        <div className="d-flex align-items-center gap-3 ms-auto">
          <button type="button" className="notif-btn" aria-label={labels.notificationsLabel}>
            <DashboardIcon width={20} height={20}>
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </DashboardIcon>
            <span className="notif-dot" />
          </button>
          <div className="d-flex align-items-center gap-2">
            <div className="avatar-circle">
              <DashboardIcon width={16} height={16} stroke="#64748b">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </DashboardIcon>
            </div>
            <div className="d-none d-md-block">
              <p className="mb-0 fw-medium text-slate-700 dashboard-admin-name">
                {labels.adminName}
              </p>
              <p className="mb-0 text-slate-400 dashboard-admin-role">
                {labels.adminRole}
              </p>
            </div>
            <span className="d-none d-md-block">
              <DashboardIcon width={14} height={14} stroke="#94a3b8">
                <polyline points="6 9 12 15 18 9" />
              </DashboardIcon>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}