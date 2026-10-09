import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./AdminViews.css";
import AdminNav from "../../components/nav/admin_nav.jsx";
import DashboardTopbar from "../../components/dashboard_topbar/DashboardTopbar.jsx";
import PageHeader from "../../components/page_header/PageHeader.jsx";
import SummaryCards from "../../components/summary_cards/SummaryCards.jsx";
import ReportsAnalytics from "../../components/reports_analytics/ReportsAnalytics.jsx";

const NAV_ITEMS = [
  {
    label: "Inicio",
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
    active: true,
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

const KPI_CARDS = [
  { label: "Ingresos totales", value: "$18.240.000", sub: "últimos 30 días", trend: "+12%" },
  { label: "Ocupación promedio", value: "78%", sub: "últimos 30 días", trend: "+5%" },
  { label: "Ticket promedio", value: "$123.243", sub: "por reserva", trend: "+3%" },
  { label: "Reservas totales", value: "148", sub: "últimos 30 días", trend: "-2%" },
];

const REVENUE = {
  labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4"],
  values: [3900000, 4300000, 4500000, 5540000],
};

const ROOM_TYPE_STATS = [
  { type: "Suite", reservations: 38, revenue: "$6.840.000" },
  { type: "Doble", reservations: 52, revenue: "$5.980.000" },
  { type: "Semi doble", reservations: 34, revenue: "$3.260.000" },
  { type: "Individual", reservations: 24, revenue: "$2.160.000" },
];

const REPORTS_COPY = {
  sidebar: {
    brand: {
      logoLabel: "logo",
      name: "Hotel Moderno",
      subtitle: "Panel de Administración",
    },
    logoutLabel: "Cerrar sesión",
  },
  topbar: {
    menuLabel: "Abrir menú",
    searchPlaceholder: "Buscar en reportes...",
    searchLabel: "Buscar en reportes",
    notificationsLabel: "Notificaciones",
    adminName: "Admin",
    adminRole: "Administrador",
  },
  header: {
    title: "Reportes",
    subtitle: "Indicadores clave de desempeño del hotel.",
    export: "Exportar",
    rangeLabel: "Rango de fechas",
    defaultRange: "30",
    rangeOptions: [
      { value: "7", label: "Últimos 7 días" },
      { value: "30", label: "Últimos 30 días" },
      { value: "90", label: "Últimos 90 días" },
    ],
  },
  analytics: {
    revenueTitle: "Ingresos en el tiempo",
    roomTypesTitle: "Ingresos por tipo de habitación",
    detailTitle: "Detalle por tipo de habitación",
    reservationsShort: "res.",
    columns: {
      type: "Tipo de habitación",
      reservations: "Reservas",
      revenue: "Ingresos generados",
    },
  },
};

export default function Reportes() {
  const [range, setRange] = useState(REPORTS_COPY.header.defaultRange);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="admin-dashboard d-flex min-vh-100">
      <AdminNav
        items={NAV_ITEMS}
        sidebarOpen={sidebarOpen}
        onClose={closeSidebar}
        brand={REPORTS_COPY.sidebar.brand}
        logoutLabel={REPORTS_COPY.sidebar.logoutLabel}
      />

      {/* Contenido principal */}
      <div className="flex-grow-1 min-w-0 d-flex flex-column">
        <DashboardTopbar
          onOpenSidebar={openSidebar}
          labels={REPORTS_COPY.topbar}
        />

        {/* Body */}
        <main className="flex-grow-1 dashboard-main">
          <PageHeader
            title={REPORTS_COPY.header.title}
            subtitle={REPORTS_COPY.header.subtitle}
            actionLabel={REPORTS_COPY.header.export}
            actionVariant="outline"
          >
            <select
              className="filter-select"
              aria-label={REPORTS_COPY.header.rangeLabel}
              value={range}
              onChange={(event) => setRange(event.target.value)}
            >
              {REPORTS_COPY.header.rangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </PageHeader>

          <SummaryCards cards={KPI_CARDS} />

          <ReportsAnalytics
            revenue={REVENUE}
            roomTypeStats={ROOM_TYPE_STATS}
            labels={REPORTS_COPY.analytics}
          />
        </main>
      </div>
    </div>
  );
}