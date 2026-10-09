import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./AdminViews.css";
import AdminNav from "../../components/nav/admin_nav.jsx";
import DashboardTopbar from "../../components/dashboard_topbar/DashboardTopbar.jsx";
import PageHeader from "../../components/page_header/PageHeader.jsx";
import SummaryCards from "../../components/summary_cards/SummaryCards.jsx";
import RoomsGrid from "../../components/rooms_grid/RoomsGrid.jsx";

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
    active: true,
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

const SUMMARY_CARDS = [
  { label: "Total habitaciones", value: "24", sub: "en el hotel" },
  { label: "Disponibles", value: "4", sub: "listas para check-in", dotClass: "summary-dot--emerald" },
  { label: "Ocupadas", value: "18", sub: "75% de ocupación", dotClass: "summary-dot--rose" },
  { label: "En mantenimiento", value: "2", sub: "fuera de servicio", dotClass: "summary-dot--slate" },
];

const ROOMS = [
  { number: "101", type: "Doble", floor: "1er piso", status: "Ocupada", statusKey: "ocupada", statusClass: "badge-pill-rose", guest: "Juan Pérez" },
  { number: "102", type: "Doble", floor: "1er piso", status: "Disponible", statusKey: "disponible", statusClass: "badge-pill-emerald", guest: null },
  { number: "103", type: "Individual", floor: "1er piso", status: "Limpieza", statusKey: "limpieza", statusClass: "badge-pill-amber", guest: null },
  { number: "201", type: "Suite", floor: "2do piso", status: "Ocupada", statusKey: "ocupada", statusClass: "badge-pill-rose", guest: "Laura Gómez" },
  { number: "202", type: "Semi doble", floor: "2do piso", status: "Ocupada", statusKey: "ocupada", statusClass: "badge-pill-rose", guest: "Andrés Ruiz" },
  { number: "203", type: "Doble", floor: "2do piso", status: "Mantenimiento", statusKey: "mantenimiento", statusClass: "badge-pill-slate", guest: null },
  { number: "301", type: "Doble", floor: "3er piso", status: "Ocupada", statusKey: "ocupada", statusClass: "badge-pill-rose", guest: "María Torres" },
  { number: "302", type: "Suite", floor: "3er piso", status: "Disponible", statusKey: "disponible", statusClass: "badge-pill-emerald", guest: null },
  { number: "401", type: "Suite", floor: "4to piso", status: "Ocupada", statusKey: "ocupada", statusClass: "badge-pill-rose", guest: "Camilo Vargas" },
];

const ROOMS_COPY = {
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
    searchPlaceholder: "Buscar habitación por número o tipo...",
    searchLabel: "Buscar habitaciones",
    notificationsLabel: "Notificaciones",
    adminName: "Admin",
    adminRole: "Administrador",
  },
  header: {
    title: "Habitaciones",
    subtitle: "Gestiona el estado y la disponibilidad de todas las habitaciones.",
    action: "+ Nueva habitación",
  },
  grid: {
    title: "Todas las habitaciones",
    filterLabel: "Filtrar por estado",
    allValue: "todas",
    filterOptions: [
      { value: "todas", label: "Todos los estados" },
      { value: "disponible", label: "Disponibles" },
      { value: "ocupada", label: "Ocupadas" },
      { value: "limpieza", label: "En limpieza" },
      { value: "mantenimiento", label: "Mantenimiento" },
    ],
    guestPrefix: "Huésped:",
    noGuest: "Sin huésped asignado",
    emptyText: "No hay habitaciones con este estado.",
  },
};

export default function Habitaciones() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="admin-dashboard d-flex min-vh-100">
      <AdminNav
        items={NAV_ITEMS}
        sidebarOpen={sidebarOpen}
        onClose={closeSidebar}
        brand={ROOMS_COPY.sidebar.brand}
        logoutLabel={ROOMS_COPY.sidebar.logoutLabel}
      />

      {/* Contenido principal */}
      <div className="flex-grow-1 min-w-0 d-flex flex-column">
        <DashboardTopbar
          onOpenSidebar={openSidebar}
          labels={ROOMS_COPY.topbar}
        />

        {/* Body */}
        <main className="flex-grow-1 dashboard-main">
          <PageHeader
            title={ROOMS_COPY.header.title}
            subtitle={ROOMS_COPY.header.subtitle}
            actionLabel={ROOMS_COPY.header.action}
          />

          <SummaryCards cards={SUMMARY_CARDS} />

          <RoomsGrid rooms={ROOMS} labels={ROOMS_COPY.grid} />
        </main>
      </div>
    </div>
  );
}