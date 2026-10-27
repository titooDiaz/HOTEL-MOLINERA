// Panel para consultar y filtrar habitaciones guardadas en la base de datos.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HotelDashboard.css";
import PageHeader from "../../components/page_header/PageHeader.jsx";
import SummaryCards from "../../components/summary_cards/SummaryCards.jsx";
import RoomsGrid from "../../components/rooms_grid/RoomsGrid.jsx";
import { apiRequest } from "../../api.js";

const COPY = {
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

const STATUS_COPY = {
  disponible: ["Disponible", "badge-pill-emerald"],
  ocupada: ["Ocupada", "badge-pill-rose"],
  limpieza: ["Limpieza", "badge-pill-amber"],
  mantenimiento: ["Mantenimiento", "badge-pill-slate"],
};

export default function Habitaciones() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([apiRequest("/api/rooms"), apiRequest("/api/reservations")])
      .then(([roomRecords, reservations]) => {
        const now = new Date().toISOString().slice(0, 10);
        const currentByRoom = new Map(
          reservations
            .filter((reservation) => reservation.checkIn <= now && reservation.checkOut > now && !["cancelada", "cancelado"].includes(reservation.status))
            .map((reservation) => [String(reservation.roomId), reservation]),
        );
        const roomCards = roomRecords.map((record) => {
          const current = currentByRoom.get(String(record.id));
          const statusKey = current ? "ocupada" : record.status;
          const [status, statusClass] = STATUS_COPY[statusKey] || STATUS_COPY.mantenimiento;
          const guest = current?.usuario?.huesped;
          return {
            number: record.number,
            type: record.type,
            floor: `${record.floor}° piso`,
            status,
            statusKey,
            statusClass,
            guest: guest ? `${guest.firstName} ${guest.lastName}` : null,
          };
        });
        setRooms(roomCards);
        setStats([
          { label: "Total habitaciones", value: String(roomCards.length), sub: "registradas en el hotel" },
          { label: "Disponibles", value: String(roomCards.filter((room) => room.statusKey === "disponible").length), sub: "listas para reservar", dotClass: "summary-dot--emerald" },
          { label: "Ocupadas", value: String(roomCards.filter((room) => room.statusKey === "ocupada").length), sub: "con huésped alojado", dotClass: "summary-dot--rose" },
          { label: "En mantenimiento", value: String(roomCards.filter((room) => room.statusKey === "mantenimiento").length), sub: "fuera de servicio", dotClass: "summary-dot--slate" },
        ]);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader title="Habitaciones" subtitle="Gestiona el estado y la disponibilidad de todas las habitaciones." actionLabel="+ Nueva habitación" onAction={() => navigate("/admin/habitaciones/nueva")} />
      {loading && <p role="status">Cargando habitaciones...</p>}
      {error && <p className="alert alert-danger" role="alert">{error}</p>}
      {!loading && !error && <>
        <SummaryCards cards={stats} />
        <RoomsGrid rooms={rooms} labels={COPY.grid} />
      </>}
    </>
  );
}
