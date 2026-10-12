import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./HotelDashboard.css";
import AdminNav from "../../components/nav/admin_nav.jsx";
import { NAV_ITEMS, SIDEBAR_COPY, buildTopbarCopy } from "../../components/nav/adminNavItems.jsx";
import DashboardTopbar from "../../components/dashboard_topbar/DashboardTopbar.jsx";
import PageHeader from "../../components/page_header/PageHeader.jsx";
import AdminForm from "../../components/admin_form/AdminForm.jsx";
import { formatCOP, nightsBetween, postJson, todayISO } from "../../components/admin_form/formUtils.js";

// Datos de ejemplo: mientras no exista la API, estas listas salen de aquí.
// TODO: cargar clientes y habitaciones disponibles desde el backend.
const CLIENTS = [
  { id: "cli-1", name: "Juan Pérez", email: "juan.perez@mail.com" },
  { id: "cli-2", name: "Laura Gómez", email: "laura.gomez@mail.com" },
  { id: "cli-3", name: "Andrés Ruiz", email: "andres.ruiz@mail.com" },
  { id: "cli-4", name: "María Torres", email: "maria.torres@mail.com" },
  { id: "cli-5", name: "Valentina Díaz", email: "valentina.diaz@mail.com" },
];

const AVAILABLE_ROOMS = [
  { number: "102", type: "Doble", price: 120000, capacity: 4 },
  { number: "210", type: "Individual", price: 90000, capacity: 1 },
  { number: "302", type: "Suite", price: 220000, capacity: 5 },
  { number: "305", type: "Semi doble", price: 110000, capacity: 3 },
  { number: "306", type: "Doble", price: 120000, capacity: 4 },
];

const FORM_SECTIONS = [
  {
    id: "guestAndRoom",
    title: "Cliente y habitación",
    description: "¿El cliente no aparece en la lista? Regístralo primero en la sección Clientes.",
    fields: [
      {
        id: "clientId",
        label: "Cliente",
        placeholder: "Selecciona un cliente",
        required: true,
        defaultValue: "",
        options: CLIENTS.map((client) => ({ value: client.id, label: `${client.name} · ${client.email}` })),
      },
      {
        id: "roomId",
        label: "Habitación disponible",
        placeholder: "Selecciona una habitación",
        required: true,
        defaultValue: "",
        options: AVAILABLE_ROOMS.map((room) => ({
          value: room.number,
          label: `Hab. ${room.number} · ${room.type} · ${formatCOP(room.price)} / noche`,
        })),
      },
    ],
  },
  {
    id: "stay",
    title: "Fechas y huéspedes",
    fields: [
      { id: "checkIn", label: "Check-in", type: "date", required: true, min: todayISO() },
      {
        id: "checkOut",
        label: "Check-out",
        type: "date",
        required: true,
        min: (values) => values.checkIn || todayISO(),
      },
      { id: "adults", label: "Adultos", type: "number", min: 1, max: 12, step: 1, defaultValue: 2, required: true },
      { id: "children", label: "Niños", type: "number", min: 0, max: 12, step: 1, defaultValue: 0 },
    ],
  },
  {
    id: "details",
    title: "Detalles de la reserva",
    fields: [
      {
        id: "status",
        label: "Estado",
        defaultValue: "confirmada",
        options: [
          { value: "confirmada", label: "Confirmada" },
          { value: "proceso", label: "En proceso (pendiente de confirmar)" },
        ],
      },
      {
        id: "advance",
        label: "Anticipo recibido (COP)",
        type: "number",
        prefix: "$",
        min: 0,
        step: 1000,
        placeholder: "0",
        hint: "Opcional.",
      },
      {
        id: "specialRequests",
        label: "Solicitudes especiales",
        type: "textarea",
        rows: 3,
        colClass: "col-12",
        placeholder: "Hora estimada de llegada, cama extra, alergias...",
      },
    ],
  },
];

const NEW_RESERVATION_COPY = {
  topbar: buildTopbarCopy("Buscar reserva por cliente o número...", "Buscar reservas"),
  header: {
    title: "Nueva reserva",
    subtitle: "Registra una reserva para un cliente y bloquea la habitación en esas fechas.",
    back: "← Volver a reservas",
  },
  form: {
    submit: "Crear reserva",
    cancel: "Cancelar",
    sending: "Guardando...",
    successMessage: "Reserva creada correctamente. Puedes registrar otra o volver al listado.",
    errorMessage: "No pudimos crear la reserva. Inténtalo de nuevo.",
  },
  summary: {
    title: "Resumen de la reserva",
    nights: "Noches",
    pricePerNight: "Precio por noche",
    total: "Total estimado",
    advance: "Anticipo",
    balance: "Saldo pendiente",
  },
};

const findRoom = (roomId) => AVAILABLE_ROOMS.find((room) => room.number === roomId);

function validateReservation(payload) {
  const room = findRoom(payload.roomId);
  const nights = nightsBetween(payload.checkIn, payload.checkOut);

  if (nights < 1) {
    return "La fecha de check-out debe ser posterior a la de check-in.";
  }

  const guests = (payload.adults ?? 0) + (payload.children ?? 0);
  if (room && guests > room.capacity) {
    return `La habitación ${room.number} admite máximo ${room.capacity} ${room.capacity === 1 ? "persona" : "personas"}.`;
  }

  if (room && (payload.advance ?? 0) > nights * room.price) {
    return "El anticipo no puede superar el total estimado de la reserva.";
  }

  return null;
}

function renderSummary(payload) {
  const room = findRoom(payload.roomId);
  const nights = nightsBetween(payload.checkIn, payload.checkOut);

  if (!room || nights < 1) return null;

  const copy = NEW_RESERVATION_COPY.summary;
  const total = nights * room.price;
  const advance = payload.advance ?? 0;

  return (
    <>
      <h2 className="aform-summary-title">{copy.title}</h2>
      <dl className="aform-summary-list">
        <div className="aform-summary-row"><dt>{copy.nights}</dt><dd>{nights}</dd></div>
        <div className="aform-summary-row"><dt>{copy.pricePerNight}</dt><dd>{formatCOP(room.price)}</dd></div>
        {advance > 0 && (
          <div className="aform-summary-row"><dt>{copy.advance}</dt><dd>− {formatCOP(advance)}</dd></div>
        )}
        <div className="aform-summary-row aform-summary-row--total">
          <dt>{advance > 0 ? copy.balance : copy.total}</dt>
          <dd>{formatCOP(Math.max(0, total - advance))}</dd>
        </div>
      </dl>
    </>
  );
}

// TODO: el backend aún no tiene la ruta POST /api/reservations (ver backend/src/app.js)
const crearReserva = (datos) => postJson("/api/reservations", datos);

export default function NuevaReserva() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-dashboard admin-view d-flex min-vh-100">
      <AdminNav
        items={NAV_ITEMS}
        sidebarOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        brand={SIDEBAR_COPY.brand}
        logoutLabel={SIDEBAR_COPY.logoutLabel}
      />

      {/* Contenido principal */}
      <div className="flex-grow-1 min-w-0 d-flex flex-column">
        <DashboardTopbar
          onOpenSidebar={() => setSidebarOpen(true)}
          labels={NEW_RESERVATION_COPY.topbar}
        />

        {/* Body */}
        <main className="flex-grow-1 dashboard-main">
          <PageHeader
            title={NEW_RESERVATION_COPY.header.title}
            subtitle={NEW_RESERVATION_COPY.header.subtitle}
          >
            <Link to="/admin/reservas" className="admin-action-button admin-action-button--outline">
              {NEW_RESERVATION_COPY.header.back}
            </Link>
          </PageHeader>

          <AdminForm
            sections={FORM_SECTIONS}
            labels={NEW_RESERVATION_COPY.form}
            validate={validateReservation}
            summary={renderSummary}
            onSubmit={crearReserva}
            onCancel={() => navigate("/admin/reservas")}
          />
        </main>
      </div>
    </div>
  );
}