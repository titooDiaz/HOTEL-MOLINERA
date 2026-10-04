import DashboardIcon from "../icon/DashboardIcon.jsx";
import "./admin_nav.css";

export default function AdminNav({ items, sidebarOpen, onClose, brand, logoutLabel }) {
	return (
		<>
			<div
				className={`sidebar-overlay z-30${sidebarOpen ? " show" : ""}`}
				onClick={onClose}
				aria-hidden="true"
			/>

			<aside
				className={`d-flex flex-column justify-content-between${sidebarOpen ? " sidebar-open" : ""}`}
				id="sidebar"
			>
				<div>
					<div className="d-flex align-items-center gap-3 brand-block">
						<div className="logo-box">{brand.logoLabel}</div>
						<div>
							<p className="brand-title">{brand.name}</p>
							<p className="brand-subtitle">{brand.subtitle}</p>
						</div>
					</div>

					<nav className="d-flex flex-column">
						{items.map((item) => (
							<a
								key={item.label}
								href="#"
								className={`nav-link-item${item.active ? " active" : ""}`}
							>
								<DashboardIcon>{item.icon}</DashboardIcon>
								{item.label}
							</a>
						))}
					</nav>
				</div>

				<div className="logout-wrap">
					<a href="#" className="nav-link-item logout-link">
						<DashboardIcon>
							<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
							<polyline points="16 17 21 12 16 7" />
							<line x1="21" y1="12" x2="9" y2="12" />
						</DashboardIcon>
						{logoutLabel}
					</a>
				</div>
			</aside>
		</>
	);
}
