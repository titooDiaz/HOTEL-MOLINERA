import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./HotelDashboard.css";
import AdminNav from "../../components/nav/admin_nav.jsx";
import DashboardIcon from "../../components/icon/DashboardIcon.jsx";
import DashboardTopbar from "../../components/dashboard_topbar/DashboardTopbar.jsx";
import StatsAndActions from "../../components/dashboard_stats/StatsAndActions.jsx";
import DashboardAnalytics from "../../components/dashboard_analytics/DashboardAnalytics.jsx";
import ReservationsOverview from "../../components/reservations_overview/ReservationsOverview.jsx";

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

const Icon = DashboardIcon;

export default function HotelDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="admin-dashboard d-flex min-vh-100">
      <AdminNav
        items={NAV_ITEMS}
        sidebarOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      {/* Contenido principal */}
      <div className="flex-grow-1 min-w-0 d-flex flex-column">
        <DashboardTopbar onOpenSidebar={openSidebar} />

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

          <StatsAndActions statCards={STAT_CARDS} quickActions={QUICK_ACTIONS} />

          <DashboardAnalytics roomTypes={ROOM_TYPES} recentActivity={RECENT_ACTIVITY} />
          <ReservationsOverview reservations={RESERVATIONS} />
        </main>
      </div>
    </div>
  );
}