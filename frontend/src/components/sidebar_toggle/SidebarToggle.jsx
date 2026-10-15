import DashboardIcon from "../icon/DashboardIcon.jsx";
import Tooltip from "../tooltip/Tooltip.jsx";

export default function SidebarToggle({ onClick, label }) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        className="sidebar-toggle icon-btn"
        onClick={onClick}
        aria-label={label}
      >
        <DashboardIcon width={22} height={22}>
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </DashboardIcon>
      </button>
    </Tooltip>
  );
}
