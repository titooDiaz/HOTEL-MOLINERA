import React, { useState } from "react";
import "./dashboard.module.css";

const NAV_ITEMS = [
  {
    label: "Inicio",
    active: true,
    icon: (
      <>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M9 22V12h6v10" />
      </>
    ),
  },
  {
    label: "Habitaciones",
    icon: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </>
    ),
  },
  {
    label: "Reservas",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>
    ),
  },
  {
    label: "Clientes",
    icon: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  {
    label: "Restaurante",
    icon: (
      <>
        <path d="M3 2v7c0 1.1.9 2 2 2h1v11M7 2v20M11 2v7a2 2 0 0 0 2 2h0M14 2v20" />
        <path d="M17 2c-2 3-2 6 0 9v11" />
      </>
    ),
  },
  {
    label: "Reportes",
    icon: (
      <>
        <path d="M3 3v18h18" />
        <rect x="7" y="12" width="3" height="6" />
        <rect x="12" y="8" width="3" height="10" />
        <rect x="17" y="5" width="3" height="13" />
      </>
    ),
  },
  {
    label: "Configuración",
    icon: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </>
    ),
  },
];

const STAT_CARDS = [
  {
    label: "Habitaciones ocupadas",
    value: "18 / 24",
    badgeClass: "icon-badge-blue",
    icon: (
      <>
        <path d="M2 4v16" />
        <path d="M2 8h18a2 2 0 0 1 2 2v10" />
        <path d="M2 17h20" />
        <path d="M6 8v9" />
      </>
    ),
    footer: "progress",
    progressPct: 75,
    progressColor: "bg-blue-400",
    footerText: "75% de ocupación",
    footerTextColor: "var(--blue-500)",
  },
  {
    label: "Reservas hoy",
    value: "7",
    badgeClass: "icon-badge-emerald",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>
    ),
    footer: "trend",
    trendText: "40% vs ayer",
  },
  {
    label: "Ingresos de hoy",
    value: "$2.340.000",
    badgeClass: "icon-badge-violet",
    icon: (
      <>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </>
    ),
    footer: "trend",
    trendText: "32% vs ayer",
  },
  {
    label: "Clientes activos",
    value: "32",
    badgeClass: "icon-badge-rose",
    icon: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    footer: "trend",
    trendText: "12% vs ayer",
  },
];

const QUICK_ACTIONS = [
  {
    label: "Nueva reserva",
    variant: "quick-action-btn--rose",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
        <line x1="12" y1="14" x2="12" y2="18" />
        <line x1="10" y1="16" x2="14" y2="16" />
      </>
    ),
  },
  {
    label: "Gestionar habitaciones",
    variant: "quick-action-btn--blue",
    icon: (
      <>
        <path d="M2 4v16" />
        <path d="M2 8h18a2 2 0 0 1 2 2v10" />
        <path d="M2 17h20" />
        <path d="M6 8v9" />
      </>
    ),
  },
  {
    label: "Registrar cliente",
    variant: "quick-action-btn--emerald",
    icon: (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
  },
  {
    label: "Gestionar restaurante",
    variant: "quick-action-btn--violet",
    icon: (
      <>
        <path d="M3 2v7c0 1.1.9 2 2 2h1v11M7 2v20M11 2v7a2 2 0 0 0 2 2h0M14 2v20" />
        <path d="M17 2c-2 3-2 6 0 9v11" />
      </>
    ),
  },
];

const ROOM_TYPES = [
  { label: "Doble", count: 12, pct: 50, color: "var(--blue-500)" },
  { label: "Semi doble", count: 6, pct: 25, color: "var(--emerald-500)" },
  { label: "Suite", count: 4, pct: 17, color: "var(--orange-500)" },
  { label: "Individual", count: 2, pct: 8, color: "var(--violet-500)" },
];

const RECENT_ACTIVITY = [
  {
    time: "10:12",
    title: "Reserva #1042 confirmada",
    subtitle: "Habitación Doble · 2 huéspedes",
    colorClass: "activity-icon-emerald",
    icon: <polyline points="20 6 9 17 4 12" strokeWidth="2.5" />,
  },
  {
    time: "09:48",
    title: "Nuevo cliente registrado",
    subtitle: "Juan Pérez",
    colorClass: "activity-icon-blue",
    icon: (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
  },
  {
    time: "08:32",
    title: "Check-in realizado",
    subtitle: "Habitación 302 · María López",
    colorClass: "activity-icon-orange",
    icon: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  },
  {
    time: "07:15",
    title: "Check-out realizado",
    subtitle: "Habitación 101 · Carlos Rojas",
    colorClass: "activity-icon-rose",
    icon: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  },
  {
    time: "06:58",
    title: "Pedido en restaurante",
    subtitle: "Mesa 5 · 2 personas",
    colorClass: "activity-icon-violet",
    icon: <path d="M3 2v7c0 1.1.9 2 2 2h1v11M7 2v20M11 2v7a2 2 0 0 0 2 2h0M14 2v20" />,
  },
];

const RESERVATIONS = [
  { id: "#1042", client: "Laura Gómez", room: "Doble (201)", checkin: "09/06/2025", checkout: "12/06/2025", status: "Confirmada", statusClass: "badge-pill-emerald" },
  { id: "#1041", client: "Andrés Ruiz", room: "Suite (401)", checkin: "08/06/2025", checkout: "11/06/2025", status: "Confirmada", statusClass: "badge-pill-emerald" },
  { id: "#1040", client: "María Torres", room: "Semi doble (305)", checkin: "07/06/2025", checkout: "10/06/2025", status: "En proceso", statusClass: "badge-pill-amber" },
  { id: "#1039", client: "Camilo Vargas", room: "Doble (102)", checkin: "07/06/2025", checkout: "09/06/2025", status: "Confirmada", statusClass: "badge-pill-emerald" },
  { id: "#1038", client: "Valentina Díaz", room: "Individual (210)", checkin: "06/06/2025", checkout: "08/06/2025", status: "Check-in", statusClass: "badge-pill-orange" },
];

function Icon({ children, width = 18, height = 18, stroke = "currentColor", strokeWidth = "2" }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export default function HotelDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="d-flex min-vh-100">
      {/* Overlay para móvil */}
      <div
        className={`sidebar-overlay z-30${sidebarOpen ? " show" : ""}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`d-flex flex-column justify-content-between${sidebarOpen ? " sidebar-open" : ""}`} id="sidebar">
        <div>
          {/* Logo */}
          <div className="d-flex align-items-center gap-3 brand-block">
            <div className="logo-box">logo</div>
            <div>
              <p className="brand-title">Hotel Moderno</p>
              <p className="brand-subtitle">Panel de Administración</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="d-flex flex-column">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href="#"
                className={`nav-link-item${item.active ? " active" : ""}`}
              >
                <Icon>{item.icon}</Icon>
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="logout-wrap">
          <a href="#" className="nav-link-item logout-link">
            <Icon>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </Icon>
            Cerrar sesión
          </a>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex-grow-1 min-w-0 d-flex flex-column">
        {/* Topbar */}
        <header className="topbar position-sticky top-0 z-20">
          <div className="d-flex align-items-center topbar-inner">
            <button className="d-lg-none icon-btn" onClick={openSidebar}>
              <Icon width={22} height={22}>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </Icon>
            </button>

            <div className="flex-grow-1 search-wrap position-relative d-none d-sm-block">
              <Icon width={16} height={16}>
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </Icon>
              <input
                type="text"
                placeholder="Buscar reservas, clientes, habitaciones..."
                className="search-input"
              />
            </div>

            <div className="flex-grow-1 d-sm-none" />

            <div className="d-flex align-items-center gap-3 ms-auto">
              <button className="notif-btn">
                <Icon width={20} height={20}>
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </Icon>
                <span className="notif-dot" />
              </button>
              <div className="d-flex align-items-center gap-2">
                <div className="avatar-circle">
                  <Icon width={16} height={16} stroke="#64748b">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </Icon>
                </div>
                <div className="d-none d-md-block">
                  <p className="mb-0 fw-medium text-slate-700" style={{ fontSize: ".875rem", lineHeight: 1.25 }}>
                    Admin
                  </p>
                  <p className="mb-0 text-slate-400" style={{ fontSize: ".75rem", lineHeight: 1.25 }}>
                    Administrador
                  </p>
                </div>
                <span className="d-none d-md-block">
                  <Icon width={14} height={14} stroke="#94a3b8">
                    <polyline points="6 9 12 15 18 9" />
                  </Icon>
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Body */}
        <main className="flex-grow-1 dashboard-main">
          {/* Bienvenida */}
          <div className="d-flex flex-column flex-sm-row justify-content-sm-between align-items-sm-start gap-2 mb-4">
            <div>
              <h1 className="fw-semibold text-slate-800 mb-0" style={{ fontSize: "1.375rem" }}>
                ¡Bienvenido, Admin!
              </h1>
              <p className="text-slate-500 mt-1 mb-0" style={{ fontSize: ".875rem" }}>
                Aquí tienes un resumen del estado del hotel hoy.
              </p>
            </div>
            <div className="d-flex align-items-center gap-3 text-slate-500 flex-shrink-0" style={{ fontSize: ".875rem" }}>
              <div className="d-flex align-items-center gap-2">
                <Icon width={15} height={15}>
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </Icon>
                Lun, 9 de Jun de 2025
              </div>
              <div className="d-flex align-items-center gap-2">
                <Icon width={15} height={15}>
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </Icon>
                10:24 a. m.
              </div>
            </div>
          </div>

          {/* Stat cards + Acciones rápidas */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-xl-9">
              <div className="row g-3">
                {STAT_CARDS.map((card) => (
                  <div className="col-12 col-sm-6 col-xl-3" key={card.label}>
                    <div className="card-panel h-100">
                      <div className={`icon-badge ${card.badgeClass}`}>
                        <Icon>{card.icon}</Icon>
                      </div>
                      <p className="text-slate-500 mb-0" style={{ fontSize: ".875rem" }}>
                        {card.label}
                      </p>
                      <p className="fw-semibold text-slate-800 mb-0 mt-1" style={{ fontSize: "1.5rem" }}>
                        {card.value}
                      </p>
                      {card.footer === "progress" ? (
                        <>
                          <div className="progress-track mt-3">
                            <div className={`progress-fill ${card.progressColor}`} style={{ width: `${card.progressPct}%` }} />
                          </div>
                          <p className="mt-2 mb-0" style={{ fontSize: ".75rem", color: card.footerTextColor }}>
                            {card.footerText}
                          </p>
                        </>
                      ) : (
                        <p className="stat-trend text-emerald-500 mb-0">
                          <Icon width={12} height={12} strokeWidth="3">
                            <line x1="12" y1="19" x2="12" y2="5" />
                            <polyline points="5 12 12 5 19 12" />
                          </Icon>
                          {card.trendText}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Acciones rápidas */}
            <div className="col-12 col-xl-3">
              <div className="card-panel h-100 d-flex flex-column">
                <h2 className="fw-semibold text-slate-700 mb-3" style={{ fontSize: ".875rem" }}>
                  Acciones rápidas
                </h2>
                <div className="d-flex flex-column gap-2">
                  {QUICK_ACTIONS.map((action) => (
                    <button key={action.label} className={`quick-action-btn ${action.variant}`}>
                      <Icon width={16} height={16}>
                        {action.icon}
                      </Icon>
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Charts + Actividad */}
          <div className="row g-3 mb-4">
            {/* Ocupación de habitaciones (line chart) */}
            <div className="col-12 col-xl-6">
              <div className="card-panel h-100">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <h2 className="fw-semibold text-slate-700 mb-0" style={{ fontSize: ".875rem" }}>
                    Ocupación de habitaciones
                  </h2>
                  <select className="filter-select" defaultValue="7">
                    <option value="7">Últimos 7 días</option>
                    <option value="30">Últimos 30 días</option>
                  </select>
                </div>
                <svg viewBox="0 0 560 220" className="w-100 h-auto" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#areaFill)"
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

            {/* Tipo de habitaciones (donut) */}
            <div className="col-12 col-xl-3">
              <div className="card-panel h-100">
                <h2 className="fw-semibold text-slate-700 mb-4" style={{ fontSize: ".875rem" }}>
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
                <ul className="list-unstyled mt-4 mb-0" style={{ fontSize: ".875rem" }}>
                  {ROOM_TYPES.map((room, i) => (
                    <li
                      key={room.label}
                      className={`d-flex align-items-center justify-content-between${i === ROOM_TYPES.length - 1 ? " mb-0" : " mb-2"}`}
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

            {/* Actividad reciente */}
            <div className="col-12 col-xl-3">
              <div className="card-panel h-100">
                <h2 className="fw-semibold text-slate-700 mb-4" style={{ fontSize: ".875rem" }}>
                  Actividad reciente
                </h2>
                <ul className="list-unstyled mb-0">
                  {RECENT_ACTIVITY.map((activity, i) => (
                    <li
                      key={activity.title}
                      className={`d-flex${i === RECENT_ACTIVITY.length - 1 ? " mb-0" : " mb-4"}`}
                      style={{ gap: ".75rem" }}
                    >
                      <div className={`activity-icon ${activity.colorClass}`}>
                        <Icon width={15} height={15} strokeWidth={activity.colorClass === "activity-icon-emerald" ? "2.5" : "2"}>
                          {activity.icon}
                        </Icon>
                      </div>
                      <div className="min-w-0 flex-grow-1">
                        <div className="d-flex align-items-start justify-content-between gap-2">
                          <p className="text-slate-700 fw-medium mb-0" style={{ fontSize: ".875rem", lineHeight: 1.25 }}>
                            {activity.title}
                          </p>
                          <span className="text-slate-400 flex-shrink-0" style={{ fontSize: ".75rem" }}>
                            {activity.time}
                          </span>
                        </div>
                        <p className="text-slate-400 mb-0 mt-1" style={{ fontSize: ".75rem" }}>
                          {activity.subtitle}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Reservas recientes + Ocupación general */}
          <div className="row g-3">
            {/* Tabla */}
            <div className="col-12 col-xl-9">
              <div className="card-panel h-100" style={{ overflow: "hidden" }}>
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <h2 className="fw-semibold text-slate-700 mb-0" style={{ fontSize: ".875rem" }}>
                    Reservas recientes
                  </h2>
                  <a href="#" className="text-rose-500 fw-medium text-decoration-none" style={{ fontSize: ".75rem" }}>
                    Ver todas
                  </a>
                </div>
                <div className="table-scroll">
                  <table className="tw-table">
                    <thead>
                      <tr>
                        <th># Reserva</th>
                        <th>Cliente</th>
                        <th>Habitación</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {RESERVATIONS.map((r) => (
                        <tr key={r.id}>
                          <td className="fw-medium text-slate-700">{r.id}</td>
                          <td className="text-slate-600">{r.client}</td>
                          <td className="text-slate-600">{r.room}</td>
                          <td className="text-slate-500">{r.checkin}</td>
                          <td className="text-slate-500">{r.checkout}</td>
                          <td>
                            <span className={`badge-pill ${r.statusClass}`}>{r.status}</span>
                          </td>
                          <td className="text-slate-400">⋮</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Ocupación general */}
            <div className="col-12 col-xl-3">
              <div className="card-panel h-100">
                <h2 className="fw-semibold text-slate-700 mb-4" style={{ fontSize: ".875rem" }}>
                  Ocupación general
                </h2>
                <p className="fw-semibold text-slate-800 mb-0" style={{ fontSize: "1.875rem" }}>
                  75%
                </p>
                <div className="progress-track-lg mt-3">
                  <div className="progress-fill bg-emerald-500" style={{ width: "75%" }} />
                </div>
                <p className="text-slate-400 mt-2 mb-0" style={{ fontSize: ".75rem" }}>
                  18 de 24 habitaciones ocupadas
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}