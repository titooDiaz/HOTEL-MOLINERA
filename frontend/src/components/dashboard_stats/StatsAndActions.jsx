import DashboardIcon from "../../components/icon/DashboardIcon.jsx";
import "./StatsAndActions.css";

export default function StatsAndActions({ statCards, quickActions }) {
  return (
    <div className="row g-3 mb-4">
      <div className="col-12 col-xl-9">
        <div className="row g-3">
          {statCards.map((card) => (
            <div className="col-12 col-sm-6 col-xl-3" key={card.label}>
              <div className="card-panel h-100">
                <div className={`icon-badge ${card.badgeClass}`}>
                  <DashboardIcon>{card.icon}</DashboardIcon>
                </div>
                <p className="text-slate-500 mb-0 dashboard-stat-label">
                  {card.label}
                </p>
                <p className="fw-semibold text-slate-800 mb-0 mt-1 dashboard-stat-value">
                  {card.value}
                </p>
                {card.footer === "progress" ? (
                  <>
                    <div className="progress-track mt-3">
                      <div
                        className={`progress-fill ${card.progressColor}`}
                        style={{ width: `${card.progressPct}%` }}
                      />
                    </div>
                    <p
                      className="mt-2 mb-0 dashboard-stat-footer"
                      style={{ color: card.footerTextColor }}
                    >
                      {card.footerText}
                    </p>
                  </>
                ) : (
                  <p className="stat-trend text-emerald-500 mb-0">
                    <DashboardIcon width={12} height={12} strokeWidth={3}>
                      <line x1="12" y1="19" x2="12" y2="5" />
                      <polyline points="5 12 12 5 19 12" />
                    </DashboardIcon>
                    {card.trendText}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="col-12 col-xl-3">
        <div className="card-panel h-100 d-flex flex-column">
          <h2 className="fw-semibold text-slate-700 mb-3 dashboard-section-title">
            Acciones rápidas
          </h2>
          <div className="d-flex flex-column gap-2">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                className={`quick-action-btn ${action.variant}`}
              >
                <DashboardIcon width={16} height={16}>
                  {action.icon}
                </DashboardIcon>
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}