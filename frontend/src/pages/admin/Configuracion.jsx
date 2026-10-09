import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./AdminViews.css";
import AdminNav from "../../components/nav/admin_nav.jsx";
import DashboardTopbar from "../../components/dashboard_topbar/DashboardTopbar.jsx";
import PageHeader from "../../components/page_header/PageHeader.jsx";
import HotelInfoForm from "../../components/settings_panels/HotelInfoForm.jsx";
import UsersTable from "../../components/settings_panels/UsersTable.jsx";
import NotificationSettings from "../../components/settings_panels/NotificationSettings.jsx";
import RegionalSettings from "../../components/settings_panels/RegionalSettings.jsx";

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
    active: true,
    icon: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </>
    ),
  },
];

const HOTEL_FIELDS = [
  { id: "hotel-name", label: "Nombre del hotel", defaultValue: "Hotel Moderno" },
  { id: "hotel-phone", label: "Teléfono", defaultValue: "+57 601 234 5678" },
  { id: "hotel-email", label: "Correo de contacto", type: "email", defaultValue: "contacto@hotelmoderno.com" },
  {
    id: "hotel-currency",
    label: "Moneda",
    defaultValue: "COP",
    options: [
      { value: "COP", label: "Peso colombiano (COP)" },
      { value: "USD", label: "Dólar estadounidense (USD)" },
      { value: "EUR", label: "Euro (EUR)" },
    ],
  },
  { id: "hotel-address", label: "Dirección", colClass: "col-12", defaultValue: "Calle 45 #12-34, Bucaramanga, Colombia" },
];

const USERS = [
  { name: "Admin Principal", email: "admin@hotelmoderno.com", role: "Administrador", status: "Activo", statusClass: "badge-pill-emerald" },
  { name: "Recepción Turno 1", email: "recepcion1@hotelmoderno.com", role: "Recepción", status: "Activo", statusClass: "badge-pill-emerald" },
  { name: "Recepción Turno 2", email: "recepcion2@hotelmoderno.com", role: "Recepción", status: "Inactivo", statusClass: "badge-pill-slate" },
  { name: "Chef Ejecutivo", email: "restaurante@hotelmoderno.com", role: "Restaurante", status: "Activo", statusClass: "badge-pill-emerald" },
];

const NOTIFICATION_OPTIONS = [
  { id: "email", label: "Correo electrónico", description: "Recibe un resumen diario por email", defaultChecked: true },
  { id: "sms", label: "SMS", description: "Alertas urgentes por mensaje de texto", defaultChecked: false },
  { id: "push", label: "Notificaciones push", description: "Avisos en tiempo real dentro del panel", defaultChecked: true },
];

const REGIONAL_FIELDS = [
  {
    id: "timezone",
    label: "Zona horaria",
    defaultValue: "bogota",
    options: [
      { value: "bogota", label: "América/Bogotá (GMT-5)" },
      { value: "mexico", label: "América/Ciudad de México (GMT-6)" },
      { value: "madrid", label: "Europa/Madrid (GMT+1)" },
    ],
  },
  {
    id: "date-format",
    label: "Formato de fecha",
    defaultValue: "dmy",
    options: [
      { value: "dmy", label: "DD/MM/AAAA" },
      { value: "mdy", label: "MM/DD/AAAA" },
    ],
  },
];

const SETTINGS_COPY = {
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
    searchPlaceholder: "Buscar en configuración...",
    searchLabel: "Buscar en configuración",
    notificationsLabel: "Notificaciones",
    adminName: "Admin",
    adminRole: "Administrador",
  },
  header: {
    title: "Configuración",
    subtitle: "Administra los datos del hotel, las notificaciones y los usuarios del sistema.",
  },
  hotelForm: {
    title: "Datos del hotel",
    save: "Guardar cambios",
  },
  users: {
    title: "Usuarios del sistema",
    invite: "+ Invitar usuario",
    columns: {
      user: "Usuario",
      role: "Rol",
      status: "Estado",
      actions: "Acciones",
    },
  },
  notifications: {
    title: "Notificaciones",
    description: "Elige cómo quieres recibir alertas de nuevas reservas, pedidos y solicitudes.",
  },
  regional: {
    title: "Zona horaria y formato",
  },
};

export default function Configuracion() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="admin-dashboard d-flex min-vh-100">
      <AdminNav
        items={NAV_ITEMS}
        sidebarOpen={sidebarOpen}
        onClose={closeSidebar}
        brand={SETTINGS_COPY.sidebar.brand}
        logoutLabel={SETTINGS_COPY.sidebar.logoutLabel}
      />

      {/* Contenido principal */}
      <div className="flex-grow-1 min-w-0 d-flex flex-column">
        <DashboardTopbar
          onOpenSidebar={openSidebar}
          labels={SETTINGS_COPY.topbar}
        />

        {/* Body */}
        <main className="flex-grow-1 dashboard-main">
          <PageHeader
            title={SETTINGS_COPY.header.title}
            subtitle={SETTINGS_COPY.header.subtitle}
          />

          <div className="row g-3">
            <div className="col-12 col-xl-7">
              <div className="mb-3">
                <HotelInfoForm fields={HOTEL_FIELDS} labels={SETTINGS_COPY.hotelForm} />
              </div>
              <UsersTable users={USERS} labels={SETTINGS_COPY.users} />
            </div>

            <div className="col-12 col-xl-5">
              <div className="mb-3">
                <NotificationSettings
                  options={NOTIFICATION_OPTIONS}
                  labels={SETTINGS_COPY.notifications}
                />
              </div>
              <RegionalSettings fields={REGIONAL_FIELDS} labels={SETTINGS_COPY.regional} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}