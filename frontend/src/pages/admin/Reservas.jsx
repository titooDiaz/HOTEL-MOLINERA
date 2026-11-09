// Panel para consultar y filtrar reservas almacenadas en el sistema.
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HotelDashboard.css";
import PageHeader from "../../components/page_header/PageHeader.jsx";
import SummaryCards from "../../components/summary_cards/SummaryCards.jsx";
import ReservationsTable from "../../components/reservations_table/ReservationsTable.jsx";
import { apiRequest } from "../../api.js";
import { useAuth } from "../../context/authContext.js";
import { todayISO } from "../../components/admin_form/formUtils.js";

const LABELS = {
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

const STATUS = {
  confirmada: ["Confirmada", "badge-pill-emerald"],
  proceso: ["En proceso", "badge-pill-amber"],
  checkin: ["Check-in", "badge-pill-orange"],
  cancelada: ["Cancelada", "badge-pill-rose"],
  cancelado: ["Cancelada", "badge-pill-rose"],
  finalizada: ["Finalizada", "badge-pill-slate"],
};

const formatDate = (date) => date ? new Intl.DateTimeFormat("es-VE").format(new Date(`${date}T00:00:00`)) : "—";
const dateOnly = (date) => typeof date === "string" ? date.slice(0, 10) : "";

export default function Reservas() {
  const navigate = useNavigate();
  const { notificationRevision } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingReservationId, setUpdatingReservationId] = useState(null);

  const refreshReservations = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setError("");
    try {
      const records = await apiRequest("/api/reservations", { cache: "no-store" });
      const today = todayISO();
      const rows = records.map((reservation) => {
        const statusKey = reservation.status;
        const [status, statusClass] = STATUS[statusKey] || STATUS.proceso;
        const guest = reservation.usuario?.huesped;
        return {
          id: reservation.reservationCode,
          reservationId: reservation.id,
          client: guest ? `${guest.firstName} ${guest.lastName}` : reservation.usuario?.email || "—",
          room: `${reservation.habitacion?.type || "Habitación"} (${reservation.habitacion?.number || "—"})`,
          checkin: formatDate(reservation.checkIn),
          checkout: formatDate(reservation.checkOut),
          status,
          statusKey,
          statusClass,
        };
      });
      const inMonth = records.filter((record) => record.createdAt?.slice(0, 7) === today.slice(0, 7)).length;
      setReservations(rows);
      setStats([
        { label: "Total reservas", value: String(inMonth), sub: "este mes" },
        { label: "Confirmadas", value: String(records.filter((item) => item.status === "confirmada").length), sub: "listas para check-in" },
        { label: "En proceso", value: String(records.filter((item) => item.status === "proceso").length), sub: "pendientes de confirmar" },
        { label: "Check-ins hoy", value: String(records.filter((item) => dateOnly(item.checkIn) === today && ["confirmada", "checkin"].includes(item.status)).length), sub: "programados para hoy" },
      ]);
    } catch (requestError) {
      if (!quiet) throw requestError;
    }
  }, []);

  useEffect(() => {
    refreshReservations()
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [refreshReservations, notificationRevision]);

  const handleStatusChange = async (reservation, status) => {
    const isCheckingIn = status === "checkin";
    const isAccepting = status === "confirmada";
    const isCancellingExisting = reservation.statusKey === "confirmada";
    const actionLabel = isCheckingIn
      ? "registrar el check-in"
      : isAccepting
        ? "aceptar la solicitud"
        : isCancellingExisting
          ? "cancelar la reserva"
          : "rechazar la solicitud";
    if (!window.confirm(`¿Deseas ${actionLabel} ${reservation.id}?`)) return;
    const documentNumber = isCheckingIn ? window.prompt("Ingresa el documento de identidad del huésped para validar el check-in:") : null;
    if (isCheckingIn && !documentNumber?.trim()) return;
    setUpdatingReservationId(reservation.id);
    setError("");
    try {
      await apiRequest(`/api/reservations/${reservation.reservationId}/${isCheckingIn ? "check-in" : "status"}`, {
        method: isCheckingIn ? "POST" : "PATCH",
        body: JSON.stringify(isCheckingIn ? { documentNumber: documentNumber.trim() } : { status }),
      });
      await refreshReservations();
      const successMessage = isCheckingIn
        ? "El check-in fue registrado correctamente."
        : isAccepting
          ? "La reserva fue aceptada correctamente."
          : isCancellingExisting
            ? "La reserva fue cancelada correctamente."
            : "La solicitud fue rechazada.";
      window.alert(successMessage);
    } catch (requestError) {
      setError(requestError.message);
      window.alert(`No se pudo actualizar la reserva: ${requestError.message}`);
    } finally {
      setUpdatingReservationId(null);
    }
  };

  return (
    <>
      <PageHeader title="Reservas" subtitle="Consulta y gestiona las reservas del hotel." actionLabel="+ Nueva reserva" onAction={() => navigate("/admin/reservas/nueva")} />
      {loading && <p role="status">Cargando reservas...</p>}
      {error && <p className="alert alert-danger" role="alert">{error}</p>}
      {!loading && !error && <>
        <SummaryCards cards={stats} />
        <ReservationsTable
          reservations={reservations}
          labels={LABELS.table}
          onStatusChange={handleStatusChange}
          updatingReservationId={updatingReservationId}
        />
      </>}
    </>
  );
}
