// Formulario administrativo para registrar una reserva con datos reales de huésped y habitación.
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "./HotelDashboard.css";
import PageHeader from "../../components/page_header/PageHeader.jsx";
import AdminForm from "../../components/admin_form/AdminForm.jsx";
import { apiRequest } from "../../api.js";
import { formatCOP, nightsBetween, postJson, todayISO } from "../../components/admin_form/formUtils.js";

const COPY = {
  form: {
    submit: "Crear reserva",
    cancel: "Cancelar",
    sending: "Guardando...",
    successMessage: "Reserva creada correctamente.",
    errorMessage: "No pudimos crear la reserva.",
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

function createSections(clients, rooms, selectedClientId) {
  return [
    {
      id: "guestAndRoom",
      title: "Cliente y habitación",
      fields: [
        {
          id: "clientId",
          label: "Cliente",
          placeholder: "Selecciona un cliente",
          defaultValue: selectedClientId || "",
          required: true,
          options: clients.map(({ id, firstName, lastName, usuario }) => ({
            value: String(id),
            label: `${firstName} ${lastName} · ${usuario.email}`,
          })),
        },
        {
          id: "roomId",
          label: "Habitación disponible",
          placeholder: "Selecciona una habitación",
          required: true,
          options: rooms.map((room) => ({
            value: String(room.id),
            label: `Hab. ${room.number} · ${room.type} · ${formatCOP(Number(room.pricePerNight))} / noche`,
          })),
        },
      ],
    },
    {
      id: "stay",
      title: "Fechas y huéspedes",
      fields: [
        { id: "checkIn", label: "Check-in", type: "date", required: true, min: todayISO() },
        { id: "checkOut", label: "Check-out", type: "date", required: true, min: (values) => values.checkIn || todayISO() },
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
        { id: "advance", label: "Anticipo recibido (VES)", type: "number", prefix: "Bs.", min: 0, step: 1, defaultValue: 0 },
        {
          id: "paymentMethod",
          label: "Método del anticipo (si aplica)",
          defaultValue: "efectivo",
          options: [
            { value: "efectivo", label: "Efectivo" },
            { value: "tarjeta", label: "Tarjeta" },
            { value: "transferencia", label: "Transferencia" },
            { value: "pago_movil", label: "Pago Móvil" },
          ],
        },
        { id: "transactionReference", label: "Referencia de transferencia o Pago Móvil", maxLength: 150 },
        { id: "specialRequests", label: "Solicitudes especiales", type: "textarea", rows: 3, colClass: "col-12" },
      ],
    },
  ];
}

function findRoom(rooms, id) {
  return rooms.find((room) => String(room.id) === String(id));
}

export default function NuevaReserva() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedClientId = searchParams.get("clientId") || "";
  const [data, setData] = useState({ clients: [], rooms: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    Promise.all([apiRequest("/api/clients"), apiRequest("/api/rooms")])
      .then(([clients, rooms]) => {
        setData({
          clients,
          rooms: rooms.filter((room) => room.status === "disponible" && room.isBookable),
        });
      })
      .catch((error) => setLoadError(error.message))
      .finally(() => setLoading(false));
  }, []);

  const sections = useMemo(
    () => createSections(data.clients, data.rooms, selectedClientId),
    [data, selectedClientId],
  );

  const validate = (payload) => {
    const room = findRoom(data.rooms, payload.roomId);
    const nights = nightsBetween(payload.checkIn, payload.checkOut);
    if (nights < 1) return "La fecha de check-out debe ser posterior a la de check-in.";
    const guestCount = Number(payload.adults || 0) + Number(payload.children || 0);
    if (room && guestCount > room.capacity) return `La habitación ${room.number} admite máximo ${room.capacity} personas.`;
    if (room && Number(payload.advance || 0) > nights * Number(room.pricePerNight)) return "El anticipo no puede superar el total estimado.";
    if (Number(payload.advance || 0) > 0 && ["transferencia", "pago_movil"].includes(payload.paymentMethod) && !payload.transactionReference?.trim()) {
      return "Indica la referencia de la transferencia o Pago Móvil.";
    }
    return null;
  };

  const renderSummary = (payload) => {
    const room = findRoom(data.rooms, payload.roomId);
    const nights = nightsBetween(payload.checkIn, payload.checkOut);
    if (!room || nights < 1) return null;
    const total = nights * Number(room.pricePerNight);
    const advance = Number(payload.advance || 0);
    return (
      <>
        <h2 className="aform-summary-title">{COPY.summary.title}</h2>
        <dl className="aform-summary-list">
          <div className="aform-summary-row"><dt>{COPY.summary.nights}</dt><dd>{nights}</dd></div>
          <div className="aform-summary-row"><dt>{COPY.summary.pricePerNight}</dt><dd>{formatCOP(Number(room.pricePerNight))}</dd></div>
          {advance > 0 && <div className="aform-summary-row"><dt>{COPY.summary.advance}</dt><dd>− {formatCOP(advance)}</dd></div>}
          <div className="aform-summary-row aform-summary-row--total">
            <dt>{advance > 0 ? COPY.summary.balance : COPY.summary.total}</dt>
            <dd>{formatCOP(total - advance)}</dd>
          </div>
        </dl>
      </>
    );
  };

  return (
    <>
      <PageHeader title="Nueva reserva" subtitle="Registra una reserva para un huésped y bloquea la habitación en esas fechas.">
        <Link to="/admin/reservas" className="admin-action-button admin-action-button--outline">← Volver a reservas</Link>
      </PageHeader>
      {loading && <p role="status">Cargando huéspedes y habitaciones...</p>}
      {loadError && <p className="alert alert-danger" role="alert">{loadError}</p>}
      {!loading && !loadError && (
        data.clients.length && data.rooms.length ? (
          <AdminForm
            sections={sections}
            labels={COPY.form}
            validate={validate}
            summary={renderSummary}
            onSubmit={(values) => postJson("/api/reservations", values)}
            onCancel={() => navigate("/admin/reservas")}
          />
        ) : <p className="alert alert-warning">Se necesita al menos un huésped y una habitación disponible para crear una reserva.</p>
      )}
    </>
  );
}
