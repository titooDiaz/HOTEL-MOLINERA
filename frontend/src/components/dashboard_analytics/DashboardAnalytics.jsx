import { useId } from "react";
import DashboardIcon from "../../components/icon/DashboardIcon.jsx";
import "./DashboardAnalytics.css";

export default function DashboardAnalytics({ roomTypes, recentActivity }) {
  const gradientId = `area-fill-${useId().replaceAll(":", "")}`;

  return (
    <div className="row g-3 mb-4">
      <div className="col-12 col-xl-6">
        <div className="card-panel h-100">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <h2 className="fw-semibold text-slate-700 mb-0 dashboard-section-title">
              Ocupación de habitaciones
            </h2>
            <select className="filter-select" defaultValue="7" aria-label="Período del gráfico">
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
            </select>
          </div>
          <svg viewBox="0 0 560 220" className="w-100 h-auto" preserveAspectRatio="none">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
              </linearGradient>
            </defs>
            <g stroke="#eef2f7" strokeWidth="1">
              <line x1="40" y1="10" x2="550" y2="10" />
              <line x1="40" y1="60" x2="550" y2="60" />
              <line x1="40" y1="110" x2="550" y2="110" />
              <line x1="40" y1="160" x2="550" y2="160" />
              <line x1="40" y1="200" x2="550" y2="200" />
            </g>
            <g fontSize="11" fill="#94a3b8" fontFamily="inherit">
              <text x="0" y="14">100%</text>
              <text x="8" y="64">75%</text>
              <text x="8" y="114">50%</text>
              <text x="8" y="164">25%</text>
              <text x="18" y="204">0%</text>
            </g>
            <path
              d="M50,120 L130,135 L210,145 L290,110 L370,105 L450,90 L530,75 L530,200 L50,200 Z"
              fill={`url(#${gradientId})`}
            />
            <polyline
              points="50,120 130,135 210,145 290,110 370,105 450,90 530,75"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <g fill="#3b82f6">
              <circle cx="50" cy="120" r="3.5" />
              <circle cx="130" cy="135" r="3.5" />
              <circle cx="210" cy="145" r="3.5" />
              <circle cx="290" cy="110" r="3.5" />
              <circle cx="370" cy="105" r="3.5" />
              <circle cx="450" cy="90" r="3.5" />
              <circle cx="530" cy="75" r="3.5" />
            </g>
            <g fontSize="11" fill="#94a3b8">
              <text x="38" y="216">3 Jun</text>
              <text x="115" y="216">4 Jun</text>
              <text x="195" y="216">5 Jun</text>
              <text x="275" y="216">6 Jun</text>
              <text x="355" y="216">7 Jun</text>
              <text x="435" y="216">8 Jun</text>
              <text x="515" y="216">9 Jun</text>
            </g>
          </svg>
        </div>
      </div>

      <div className="col-12 col-xl-3">
        <div className="card-panel h-100">
          <h2 className="fw-semibold text-slate-700 mb-4 dashboard-section-title">
            Tipo de habitaciones
          </h2>
          <div className="d-flex align-items-center justify-content-center">
            <svg viewBox="0 0 120 120" width="150" height="150">
              <circle cx="60" cy="60" r="45" fill="none" stroke="#e2e8f0" strokeWidth="16" />
              <circle cx="60" cy="60" r="45" fill="none" stroke="#3b82f6" strokeWidth="16" strokeDasharray="141.4 282.7" strokeDashoffset="0" transform="rotate(-90 60 60)" />
              <circle cx="60" cy="60" r="45" fill="none" stroke="#10b981" strokeWidth="16" strokeDasharray="70.7 282.7" strokeDashoffset="-141.4" transform="rotate(-90 60 60)" />
              <circle cx="60" cy="60" r="45" fill="none" stroke="#f97316" strokeWidth="16" strokeDasharray="48.1 282.7" strokeDashoffset="-212.1" transform="rotate(-90 60 60)" />
              <circle cx="60" cy="60" r="45" fill="none" stroke="#8b5cf6" strokeWidth="16" strokeDasharray="22.6 282.7" strokeDashoffset="-260.2" transform="rotate(-90 60 60)" />
              <text x="60" y="57" textAnchor="middle" fontSize="18" fontWeight="600" fill="#1e293b">24</text>
              <text x="60" y="72" textAnchor="middle" fontSize="9" fill="#94a3b8">total</text>
            </svg>
          </div>
          <ul className="list-unstyled mt-4 mb-0 analytics-room-list">
            {roomTypes.map((room, index) => (
              <li
                key={room.label}
                className={`d-flex align-items-center justify-content-between${index === roomTypes.length - 1 ? " mb-0" : " mb-2"}`}
              >
                <span className="d-flex align-items-center gap-2 text-slate-600">
                  <span className="legend-dot" style={{ background: room.color }} />
                  {room.label}
                </span>
                <span className="text-slate-400">
                  {room.count} <span className="text-slate-300">|</span> {room.pct}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="col-12 col-xl-3">
        <div className="card-panel h-100">
          <h2 className="fw-semibold text-slate-700 mb-4 dashboard-section-title">
            Actividad reciente
          </h2>
          <ul className="list-unstyled mb-0">
            {recentActivity.map((activity, index) => (
              <li
                key={activity.title}
                className={`d-flex${index === recentActivity.length - 1 ? " mb-0" : " mb-4"} analytics-activity-item`}
              >
                <div className={`activity-icon ${activity.colorClass}`}>
                  <DashboardIcon
                    width={15}
                    height={15}
                    strokeWidth={activity.colorClass === "activity-icon-emerald" ? 2.5 : 2}
                  >
                    {activity.icon}
                  </DashboardIcon>
                </div>
                <div className="min-w-0 flex-grow-1">
                  <div className="d-flex align-items-start justify-content-between gap-2">
                    <p className="text-slate-700 fw-medium mb-0 analytics-activity-title">
                      {activity.title}
                    </p>
                    <span className="text-slate-400 flex-shrink-0 analytics-activity-time">
                      {activity.time}
                    </span>
                  </div>
                  <p className="text-slate-400 mb-0 mt-1 analytics-activity-subtitle">
                    {activity.subtitle}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}