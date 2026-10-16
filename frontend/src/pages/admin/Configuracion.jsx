import "./HotelDashboard.css";
import PageHeader from "../../components/page_header/PageHeader.jsx";
import HotelInfoForm from "../../components/settings_panels/HotelInfoForm.jsx";
import UsersTable from "../../components/settings_panels/UsersTable.jsx";
import NotificationSettings from "../../components/settings_panels/NotificationSettings.jsx";
import RegionalSettings from "../../components/settings_panels/RegionalSettings.jsx";
import AppearanceSettings from "../../components/settings_panels/AppearanceSettings.jsx";

const HOTEL_FIELDS = [
  { id: "hotel-name", label: "Nombre del hotel", defaultValue: "Hotel Molinera" },
  { id: "hotel-phone", label: "Teléfono", defaultValue: "+58 276-7883117" },
  { id: "hotel-email", label: "Correo de contacto", type: "email", defaultValue: "contacto@hotelmoderno.com" },
  {
    id: "hotel-currency",
    label: "Moneda",
    defaultValue: "VES",
    options: [
      { value: "VES", label: "Bolívar venezolano (VES)" },
      { value: "USD", label: "Dólar estadounidense (USD)" },
      { value: "EUR", label: "Euro (EUR)" },
    ],
  },
  { id: "hotel-address", label: "Dirección", colClass: "col-12", defaultValue: "RMFP+X4X, Capacho 5009, Táchira, Venezuela" },
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
    defaultValue: "caracas",
    options: [
      { value: "caracas", label: "América/Caracas (GMT-4)" },
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
  appearance: {
    title: "Apariencia",
    description: "Personaliza cómo se ve el panel de administración.",
    darkModeLabel: "Modo oscuro",
  },
};

export default function Configuracion() {

  return (
    <>
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
                <AppearanceSettings labels={SETTINGS_COPY.appearance} />
              </div>
              <div className="mb-3">
                <NotificationSettings
                  options={NOTIFICATION_OPTIONS}
                  labels={SETTINGS_COPY.notifications}
                />
              </div>
              <RegionalSettings fields={REGIONAL_FIELDS} labels={SETTINGS_COPY.regional} />
            </div>
          </div>
    </>
  );
}