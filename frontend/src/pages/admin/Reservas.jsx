// Panel para consultar y filtrar reservas almacenadas en el sistema.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HotelDashboard.css";
import PageHeader from "../../components/page_header/PageHeader.jsx";
import SummaryCards from "../../components/summary_cards/SummaryCards.jsx";
import ReservationsTable from "../../components/reservations_table/ReservationsTable.jsx";
import { apiRequest } from "../../api.js";

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

export default function Reservas() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/api/reservations")
      .then((records) => {
        const today = new Date().toISOString().slice(0, 10);
        const rows = records.map((reservation) => {
          const statusKey = reservation.status === "confirmada" && reservation.checkIn <= today && reservation.checkOut > today
            ? "checkin"
            : reservation.status;
          const [status, statusClass] = STATUS[statusKey] || STATUS.proceso;
          const guest = reservation.usuario?.huesped;
          return {
            id: reservation.reservationCode,
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
          { label: "Check-ins hoy", value: String(records.filter((item) => item.checkIn === today && item.status === "confirmada").length), sub: "programados para hoy" },
        ]);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader title="Reservas" subtitle="Consulta y gestiona las reservas del hotel." actionLabel="+ Nueva reserva" onAction={() => navigate("/admin/reservas/nueva")} />
      {loading && <p role="status">Cargando reservas...</p>}
      {error && <p className="alert alert-danger" role="alert">{error}</p>}
      {!loading && !error && <>
        <SummaryCards cards={stats} />
        <ReservationsTable reservations={reservations} labels={LABELS.table} />
      </>}
    </>
  );
}
