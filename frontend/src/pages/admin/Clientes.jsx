import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./HotelDashboard.css";
import AdminNav from "../../components/nav/admin_nav.jsx";
import DashboardTopbar from "../../components/dashboard_topbar/DashboardTopbar.jsx";
import PageHeader from "../../components/page_header/PageHeader.jsx";
import SummaryCards from "../../components/summary_cards/SummaryCards.jsx";
import ClientsTable from "../../components/clients_table/ClientsTable.jsx";

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
    active: true,
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
  { label: "Total clientes", value: "286", sub: "registrados en total" },
  { label: "Huéspedes activos", value: "32", sub: "actualmente en el hotel" },
  { label: "Nuevos este mes", value: "41", sub: "desde el 1 de junio" },
];

const CLIENTS = [
  { name: "Juan Pérez", email: "juan.perez@mail.com", phone: "+57 300 123 4567", room: "101", spent: "$132.000", status: "Activo", statusClass: "badge-pill-emerald" },
  { name: "Laura Gómez", email: "laura.gomez@mail.com", phone: "+57 310 234 5678", room: "201", spent: "$210.000", status: "Activo", statusClass: "badge-pill-emerald" },
  { name: "Andrés Ruiz", email: "andres.ruiz@mail.com", phone: "+57 311 345 6789", room: "401", spent: "$98.500", status: "Activo", statusClass: "badge-pill-emerald" },
  { name: "María Torres", email: "maria.torres@mail.com", phone: "+57 312 456 7890", room: "305", spent: "$0", status: "Check-in pendiente", statusClass: "badge-pill-amber" },
  { name: "Carlos Rojas", email: "carlos.rojas@mail.com", phone: "+57 313 567 8901", room: "—", spent: "$340.000", status: "Anterior", statusClass: "badge-pill-slate" },
  { name: "Valentina Díaz", email: "valentina.diaz@mail.com", phone: "+57 314 678 9012", room: "210", spent: "$76.000", status: "Activo", statusClass: "badge-pill-emerald" },
];

const CLIENTS_COPY = {
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
    searchPlaceholder: "Buscar cliente por nombre o email...",
    searchLabel: "Buscar clientes",
    notificationsLabel: "Notificaciones",
    adminName: "Admin",
    adminRole: "Administrador",
  },
  header: {
    title: "Clientes",
    subtitle: "Consulta el historial y los datos de contacto de tus huéspedes.",
    action: "+ Registrar cliente",
  },
  table: {
    title: "Listado de clientes",
    columns: {
      client: "Cliente",
      contact: "Contacto",
      room: "Habitación",
      spent: "Total gastado",
      status: "Estado",
      actions: "Acciones",
    },
  },
};

export default function Clientes() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="admin-dashboard admin-view d-flex min-vh-100">
      <AdminNav
        items={NAV_ITEMS}
        sidebarOpen={sidebarOpen}
        onClose={closeSidebar}
        brand={CLIENTS_COPY.sidebar.brand}
        logoutLabel={CLIENTS_COPY.sidebar.logoutLabel}
      />

      {/* Contenido principal */}
      <div className="flex-grow-1 min-w-0 d-flex flex-column">
        <DashboardTopbar
          onOpenSidebar={openSidebar}
          labels={CLIENTS_COPY.topbar}
        />

        {/* Body */}
        <main className="flex-grow-1 dashboard-main">
          <PageHeader
            title={CLIENTS_COPY.header.title}
            subtitle={CLIENTS_COPY.header.subtitle}
            actionLabel={CLIENTS_COPY.header.action}
          />

          <SummaryCards cards={SUMMARY_CARDS} columnClass="col-12 col-sm-4" />

          <ClientsTable clients={CLIENTS} labels={CLIENTS_COPY.table} />
        </main>
      </div>
    </div>
  );
}