import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./HotelDashboard.css";
import AdminNav from "../../components/nav/admin_nav.jsx";
import DashboardTopbar from "../../components/dashboard_topbar/DashboardTopbar.jsx";
import PageHeader from "../../components/page_header/PageHeader.jsx";
import RoomForm from "../../components/room_form/RoomForm.jsx";

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

const FORM_SECTIONS = [
  {
    id: "general",
    title: "Información general",
    description: "Datos básicos para identificar la habitación dentro del hotel.",
    fields: [
      { id: "number", label: "Número de habitación", placeholder: "Ej. 104", required: true },
      { id: "floor", label: "Piso", type: "number", min: 1, max: 50, step: 1, defaultValue: 1, required: true },
      {
        id: "type",
        label: "Tipo de habitación",
        defaultValue: "Doble",
        options: [
          { value: "Individual", label: "Individual" },
          { value: "Semi doble", label: "Semi doble" },
          { value: "Doble", label: "Doble" },
          { value: "Suite", label: "Suite" },
        ],
      },
      {
        id: "status",
        label: "Estado inicial",
        defaultValue: "disponible",
        options: [
          { value: "disponible", label: "Disponible" },
          { value: "limpieza", label: "En limpieza" },
          { value: "mantenimiento", label: "En mantenimiento" },
        ],
      },
      { id: "capacity", label: "Capacidad máxima (personas)", type: "number", min: 1, max: 12, step: 1, defaultValue: 2, required: true },
      { id: "area", label: "Área (m²)", type: "number", min: 0, step: 1, placeholder: "Ej. 30" },
    ],
  },
  {
    id: "beds",
    title: "Camas",
    description: "Cuántas camas tiene la habitación y de qué tipo.",
    fields: [
      { id: "beds", label: "Número de camas", type: "number", min: 1, max: 10, step: 1, defaultValue: 1, required: true },
      {
        id: "bedType",
        label: "Tipo de cama",
        defaultValue: "doble",
        options: [
          { value: "sencilla", label: "Sencilla (0.90 m)" },
          { value: "semidoble", label: "Semidoble (1.20 m)" },
          { value: "doble", label: "Doble (1.40 m)" },
          { value: "queen", label: "Queen (1.60 m)" },
          { value: "king", label: "King (2.00 m)" },
        ],
      },
    ],
  },
  {
    id: "amenities",
    title: "Servicios y comodidades",
    description: "Marca lo que incluye la habitación. Lo que no marques se guardará como no incluido.",
    amenities: [
      { id: "airConditioning", label: "Aire acondicionado", description: "Climatización dentro de la habitación" },
      { id: "cableTv", label: "TV por cable", description: "Canales por suscripción" },
      { id: "safe", label: "Caja de seguridad", description: "Para guardar objetos de valor" },
      { id: "workstation", label: "Estación de trabajo", description: "Escritorio y silla" },
      { id: "wifi", label: "Wi-Fi", description: "Internet inalámbrico", defaultChecked: true },
      { id: "minibar", label: "Mini bar", description: "Bebidas y snacks" },
      { id: "privateBathroom", label: "Baño privado", description: "Ducha y sanitario propios", defaultChecked: true },
      { id: "balcony", label: "Balcón o terraza" },
      { id: "smokeFree", label: "Libre de humo", description: "Habitación para no fumadores" },
    ],
  },
  {
    id: "pricing",
    title: "Tarifa y descripción",
    fields: [
      {
        id: "pricePerNight",
        label: "Precio por noche (VES)",
        type: "number",
        prefix: "Bs.",
        min: 0,
        step: 1000,
        placeholder: "120000",
        hint: "Se mostrará como precio base en el sitio público.",
        required: true,
      },
      {
        id: "imageUrl",
        label: "URL de la imagen principal",
        type: "url",
        placeholder: "https://...",
        hint: "Opcional.",
      },
      {
        id: "description",
        label: "Descripción",
        type: "textarea",
        rows: 4,
        colClass: "col-12",
        placeholder: "Describe la habitación: ambiente, vista, ideal para quién...",
      },
    ],
  },
];

const NEW_ROOM_COPY = {
  sidebar: {
    brand: {
      logoLabel: "logo",
      name: "Hotel Molinera",
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
    title: "Nueva habitación",
    subtitle: "Completa los datos para agregar una habitación al hotel.",
    back: "← Volver a habitaciones",
  },
  form: {
    submit: "Guardar habitación",
    cancel: "Cancelar",
    sending: "Guardando...",
    successMessage: "Habitación creada correctamente. Puedes agregar otra o volver al listado.",
    errorMessage: "No pudimos guardar la habitación. Inténtalo de nuevo.",
    included: "Incluido",
    notIncluded: "No incluido",
  },
};

// TODO: el backend aún no tiene la ruta POST /api/rooms (ver backend/src/app.js)
async function crearHabitacion(datos) {
  const response = await fetch("/api/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status} al crear la habitación`);
  }
}

export default function NuevaHabitacion() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);
  const volverAHabitaciones = () => navigate("/admin/habitaciones");

  return (
    <div className="admin-dashboard admin-view d-flex min-vh-100">
      <AdminNav
        items={NAV_ITEMS}
        sidebarOpen={sidebarOpen}
        onClose={closeSidebar}
        brand={NEW_ROOM_COPY.sidebar.brand}
        logoutLabel={NEW_ROOM_COPY.sidebar.logoutLabel}
      />

      {/* Contenido principal */}
      <div className="flex-grow-1 min-w-0 d-flex flex-column">
        <DashboardTopbar
          onOpenSidebar={openSidebar}
          labels={NEW_ROOM_COPY.topbar}
        />

        {/* Body */}
        <main className="flex-grow-1 dashboard-main">
          <PageHeader
            title={NEW_ROOM_COPY.header.title}
            subtitle={NEW_ROOM_COPY.header.subtitle}
          >
            <Link
              to="/admin/habitaciones"
              className="admin-action-button admin-action-button--outline"
            >
              {NEW_ROOM_COPY.header.back}
            </Link>
          </PageHeader>

          <RoomForm
            sections={FORM_SECTIONS}
            labels={NEW_ROOM_COPY.form}
            onSubmit={crearHabitacion}
            onCancel={volverAHabitaciones}
          />
        </main>
      </div>
    </div>
  );
}