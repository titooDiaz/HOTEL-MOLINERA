// Presenta gráficos de ocupación y tipos de habitación junto con la actividad reciente.
import { useId } from "react";
import DashboardIcon from "../../components/icon/DashboardIcon.jsx";
import "./DashboardAnalytics.css";

const formatPeakHour = (peak) => peak
  ? new Intl.DateTimeFormat("es-VE", { weekday: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(peak.hour))
  : "—";

export default function DashboardAnalytics({
  roomTypes,
  occupancySeries = [],
  occupancyPeriod,
  onOccupancyPeriodChange,
  recentActivity,
  labels,
  views,
  viewsPeriod,
  onViewsPeriodChange,
}) {
  const gradientId = `area-fill-${useId().replaceAll(":", "")}`;
  const totalRoomCount = roomTypes.reduce((total, room) => total + room.count, 0);
  const series = views?.series || [];
  const maxViews = Math.max(...series.map((point) => point.views), 1);
  const chartPoints = series.map((point, index) => {
    const x = 42 + (index * 508) / Math.max(series.length - 1, 1);
    const y = 194 - (point.views / maxViews) * 170;
    return { ...point, x, y };
  });
  const linePath = chartPoints.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
  const areaPath = chartPoints.length ? `${linePath} L530,194 L42,194 Z` : "";
  const chartLabels = chartPoints.length
    ? [chartPoints[0], chartPoints[Math.floor(chartPoints.length / 2)], chartPoints[chartPoints.length - 1]]
    : [];
  const occupancyPoints = occupancySeries.map((point, index) => ({
    ...point,
    x: 50 + (index * 480) / Math.max(occupancySeries.length - 1, 1),
    y: 200 - (point.value / 100) * 190,
  }));
  const occupancyLine = occupancyPoints
    .map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(" ");
  const occupancyArea = occupancyPoints.length
    ? `${occupancyLine} L530,200 L50,200 Z`
    : "";

  return (
    <div className="row g-3 mb-4">
      <div className="col-12">
        <div className="card-panel views-analytics-card">
          <div className="d-flex flex-column flex-md-row align-items-md-start justify-content-between gap-3 mb-3">
            <div>
              <h2 className="fw-semibold text-slate-700 mb-1 dashboard-section-title">{labels.viewsTitle}</h2>
              <p className="text-slate-400 mb-0 views-analytics-caption">Evolución horaria y horas pico de navegación pública</p>
            </div>
            <select
              className="filter-select"
              value={viewsPeriod}
              onChange={(event) => onViewsPeriodChange(event.target.value)}
              aria-label={labels.viewsPeriodLabel}
            >
              {labels.periodOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="row g-3 align-items-center">
            <div className="col-12 col-xl-9">
              {chartPoints.length ? (
                <svg viewBox="0 0 560 220" className="w-100 h-auto views-chart" role="img" aria-label={labels.viewsTitle}>
                  <defs>
                    <linearGradient id={`${gradientId}-views`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <g stroke="currentColor" strokeOpacity="0.08" strokeWidth="1">
                    <line x1="42" y1="24" x2="530" y2="24" />
                    <line x1="42" y1="109" x2="530" y2="109" />
                    <line x1="42" y1="194" x2="530" y2="194" />
                  </g>
                  <path d={areaPath} fill={`url(#${gradientId}-views)`} />
                  <path d={linePath} fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {chartPoints.filter((_, index) => index === 0 || index === chartPoints.length - 1).map((point) => (
                    <circle key={point.hour} cx={point.x} cy={point.y} r="3.5" fill="#f43f5e" />
                  ))}
                  <g fontSize="10" fill="#94a3b8">
                    {chartLabels.map((point) => (
                      <text key={point.hour} x={point.x} y="213" textAnchor="middle">
                        {new Intl.DateTimeFormat("es-VE", { day: "2-digit", month: "short", hour: "2-digit" }).format(new Date(point.hour))}
                      </text>
                    ))}
                  </g>
                </svg>
              ) : <p className="text-slate-400 mb-0 py-5 text-center">{labels.viewsEmpty}</p>}
            </div>
            <div className="col-12 col-xl-3">
              <div className="views-summary-grid">
                <div><span>{labels.viewsTotalLabel}</span><strong>{views.totalViews.toLocaleString("es-VE")}</strong></div>
                <div><span>{labels.viewsUniqueLabel}</span><strong>{views.uniqueVisitors.toLocaleString("es-VE")}</strong></div>
                <div><span>{labels.viewsPeakLabel}</span><strong>{formatPeakHour(views.peak)}</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="col-12 col-xl-6">
        <div className="card-panel h-100">
          <div className="d-flex align-items-center justify-content-between mb-4">
                  <h2 className="fw-semibold text-slate-700 mb-0 dashboard-section-title">
                    {labels.occupancyTitle}
            </h2>
                  <select
                    className="filter-select"
                    value={occupancyPeriod}
                    onChange={(event) => onOccupancyPeriodChange(event.target.value)}
                    aria-label={labels.periodLabel}
                  >
                    {labels.periodOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
            </select>
          </div>
          <svg viewBox="0 0 560 220" className="w-100 h-auto" preserveAspectRatio="none" role="img" aria-label={labels.occupancyTitle}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
              </linearGradient>
            </defs>
            <g stroke="currentColor" strokeOpacity="0.08" strokeWidth="1">
              <line x1="40" y1="10" x2="550" y2="10" />
              <line x1="40" y1="60" x2="550" y2="60" />
              <line x1="40" y1="110" x2="550" y2="110" />
              <line x1="40" y1="160" x2="550" y2="160" />
              <line x1="40" y1="200" x2="550" y2="200" />
            </g>
            <g fontSize="11" fill="#94a3b8" fontFamily="inherit">
                    <text x="0" y="14">{labels.occupancyAxisLabels[0]}</text>
                    <text x="8" y="64">{labels.occupancyAxisLabels[1]}</text>
                    <text x="8" y="114">{labels.occupancyAxisLabels[2]}</text>
                    <text x="8" y="164">{labels.occupancyAxisLabels[3]}</text>
                    <text x="18" y="204">{labels.occupancyAxisLabels[4]}</text>
            </g>
            <path d={occupancyArea} fill={`url(#${gradientId})`} />
            <path d={occupancyLine} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <g fill="#3b82f6">
              {occupancyPoints.map((point) => <circle key={point.date} cx={point.x} cy={point.y} r="3.5" />)}
            </g>
            <g fontSize="11" fill="#94a3b8">
                    {occupancyPoints.filter((_, index) =>
                      index === 0 || index === Math.floor(occupancyPoints.length / 2) || index === occupancyPoints.length - 1
                    ).map((point) => (
                      <text key={point.date} x={point.x} y="216" textAnchor="middle">
                        {point.label}
                      </text>
                    ))}
            </g>
          </svg>
        </div>
      </div>

      <div className="col-12 col-xl-3">
        <div className="card-panel h-100">
          <h2 className="fw-semibold text-slate-700 mb-4 dashboard-section-title">
                  {labels.roomTypesTitle}
          </h2>
          <div className="d-flex align-items-center justify-content-center">
            <svg viewBox="0 0 120 120" width="150" height="150">
              <circle cx="60" cy="60" r="45" fill="none" stroke="#e2e8f0" strokeWidth="16" />
              {roomTypes.reduce((segments, room) => {
                const circumference = 2 * Math.PI * 45;
                const offset = segments.offset;
                const length = circumference * (totalRoomCount ? room.count / totalRoomCount : 0);
                segments.circles.push(
                  <circle
                    key={room.label}
                    cx="60"
                    cy="60"
                    r="45"
                    fill="none"
                    stroke={room.color}
                    strokeWidth="16"
                    strokeDasharray={`${length} ${circumference - length}`}
                    strokeDashoffset={-offset}
                    transform="rotate(-90 60 60)"
                  />,
                );
                segments.offset += length;
                return segments;
              }, { offset: 0, circles: [] }).circles}
                    <text x="60" y="57" textAnchor="middle" fontSize="18" fontWeight="600" fill="currentColor">{labels.roomCount}</text>
                    <text x="60" y="72" textAnchor="middle" fontSize="9" fill="#94a3b8">{labels.roomCountCaption}</text>
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
                  {labels.recentActivityTitle}
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