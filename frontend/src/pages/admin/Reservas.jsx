import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./AdminViews.css";
import AdminNav from "../../components/nav/admin_nav.jsx";
import DashboardTopbar from "../../components/dashboard_topbar/DashboardTopbar.jsx";
import PageHeader from "../../components/page_header/PageHeader.jsx";
import SummaryCards from "../../components/summary_cards/SummaryCards.jsx";
import ReservationsTable from "../../components/reservations_table/ReservationsTable.jsx";

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
    active: true,
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

const SUMMARY_CARDS = [
  { label: "Total reservas", value: "48", sub: "este mes" },
  { label: "Confirmadas", value: "32", sub: "listas para check-in" },
  { label: "En proceso", value: "9", sub: "pendientes de confirmar" },
  { label: "Check-ins hoy", value: "5", sub: "programados para hoy" },
];

const RESERVATIONS = [
  { id: "#1042", client: "Laura Gómez", room: "Doble (201)", checkin: "09/06/2025", checkout: "12/06/2025", status: "Confirmada", statusKey: "confirmada", statusClass: "badge-pill-emerald" },
  { id: "#1041", client: "Andrés Ruiz", room: "Suite (401)", checkin: "08/06/2025", checkout: "11/06/2025", status: "Confirmada", statusKey: "confirmada", statusClass: "badge-pill-emerald" },
  { id: "#1040", client: "María Torres", room: "Semi doble (305)", checkin: "07/06/2025", checkout: "10/06/2025", status: "En proceso", statusKey: "proceso", statusClass: "badge-pill-amber" },
  { id: "#1039", client: "Camilo Vargas", room: "Doble (102)", checkin: "07/06/2025", checkout: "09/06/2025", status: "Confirmada", statusKey: "confirmada", statusClass: "badge-pill-emerald" },
  { id: "#1038", client: "Valentina Díaz", room: "Individual (210)", checkin: "06/06/2025", checkout: "08/06/2025", status: "Check-in", statusKey: "checkin", statusClass: "badge-pill-orange" },
  { id: "#1037", client: "Sofía Ramírez", room: "Suite (302)", checkin: "05/06/2025", checkout: "07/06/2025", status: "Cancelada", statusKey: "cancelada", statusClass: "badge-pill-rose" },
];

const RESERVATIONS_COPY = {
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
    searchPlaceholder: "Buscar reserva por cliente o número...",
    searchLabel: "Buscar reservas",
    notificationsLabel: "Notificaciones",
    adminName: "Admin",
    adminRole: "Administrador",
  },
  header: {
    title: "Reservas",
    subtitle: "Consulta, confirma y gestiona las reservas del hotel.",
    action: "+ Nueva reserva",
  },
  table: {
    title: "Todas las reservas",
    filterLabel: "Filtrar por estado",
    allValue: "todas",
    filterOptions: [
      { value: "todas", label: "Todos los estados" },
      { value: "confirmada", label: "Confirmadas" },
      { value: "proceso", label: "En proceso" },
      { value: "checkin", label: "Check-in" },
      { value: "cancelada", label: "Canceladas" },
    ],
    columns: {
      reservation: "# Reserva",
      client: "Cliente",
      room: "Habitación",
      checkIn: "Check-in",
      checkOut: "Check-out",
      status: "Estado",
      actions: "Acciones",
    },
    emptyText: "No hay reservas con este estado.",
  },
};

export default function Reservas() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="admin-dashboard d-flex min-vh-100">
      <AdminNav
        items={NAV_ITEMS}
        sidebarOpen={sidebarOpen}
        onClose={closeSidebar}
        brand={RESERVATIONS_COPY.sidebar.brand}
        logoutLabel={RESERVATIONS_COPY.sidebar.logoutLabel}
      />

      {/* Contenido principal */}
      <div className="flex-grow-1 min-w-0 d-flex flex-column">
        <DashboardTopbar
          onOpenSidebar={openSidebar}
          labels={RESERVATIONS_COPY.topbar}
        />

        {/* Body */}
        <main className="flex-grow-1 dashboard-main">
          <PageHeader
            title={RESERVATIONS_COPY.header.title}
            subtitle={RESERVATIONS_COPY.header.subtitle}
            actionLabel={RESERVATIONS_COPY.header.action}
          />

          <SummaryCards cards={SUMMARY_CARDS} />

          <ReservationsTable
            reservations={RESERVATIONS}
            labels={RESERVATIONS_COPY.table}
          />
        </main>
      </div>
    </div>
  );
}