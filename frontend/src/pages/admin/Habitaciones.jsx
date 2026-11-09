// Panel para consultar y filtrar habitaciones guardadas en la base de datos.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HotelDashboard.css";
import PageHeader from "../../components/page_header/PageHeader.jsx";
import SummaryCards from "../../components/summary_cards/SummaryCards.jsx";
import RoomsGrid from "../../components/rooms_grid/RoomsGrid.jsx";
import RoomManagementModal from "../../components/rooms_grid/RoomManagementModal.jsx";
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
      { value: "eliminada", label: "Eliminadas" },
    ],
    guestPrefix: "Huésped:",
    noGuest: "Sin huésped asignado",
    emptyText: "No hay habitaciones con este estado.",
    deleteLabel: "Eliminar habitación",
  },
};

const STATUS_COPY = {
  disponible: ["Disponible", "badge-pill-emerald"],
  ocupada: ["Ocupada", "badge-pill-rose"],
  limpieza: ["Limpieza", "badge-pill-amber"],
  mantenimiento: ["Mantenimiento", "badge-pill-slate"],
};

function summarizeRooms(roomCards) {
  const activeRooms = roomCards.filter((room) => !room.isDeleted);
  return [
    { label: "Total habitaciones", value: String(activeRooms.length), sub: "registradas en el hotel" },
    { label: "Disponibles", value: String(activeRooms.filter((room) => room.statusKey === "disponible").length), sub: "listas para reservar", dotClass: "summary-dot--emerald" },
    { label: "Ocupadas", value: String(activeRooms.filter((room) => room.statusKey === "ocupada").length), sub: "con huésped alojado", dotClass: "summary-dot--rose" },
    { label: "En mantenimiento", value: String(activeRooms.filter((room) => room.statusKey === "mantenimiento").length), sub: "fuera de servicio", dotClass: "summary-dot--slate" },
  ];
}

export default function Habitaciones() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionNotice, setActionNotice] = useState("");
  const [deletingRoomId, setDeletingRoomId] = useState(null);
  const [updatingImagesRoomId, setUpdatingImagesRoomId] = useState(null);
  const [managingRoom, setManagingRoom] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState({});
  const [updatingPaymentId, setUpdatingPaymentId] = useState(null);

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
          const isDeleted = Boolean(record.deletedAt);
          const statusKey = isDeleted ? "eliminada" : current ? "ocupada" : record.status;
          const [status, statusClass] = isDeleted
            ? ["Eliminada", "badge-pill-slate"]
            : STATUS_COPY[statusKey] || STATUS_COPY.mantenimiento;
          const guest = current?.usuario?.huesped;
          return {
            ...record,
            id: record.id,
            isDeleted,
            number: record.number,
            type: record.type,
            floorLabel: `${record.floor}° piso`,
            status,
            statusKey,
            statusClass,
            guest: guest ? `${guest.firstName} ${guest.lastName}` : null,
            currentReservation: current || null,
          };
        });
        setRooms(roomCards);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) setStats(summarizeRooms(rooms));
  }, [loading, rooms]);

  const handleDeleteRoom = async (room) => {
    const action = room.isDeleted ? "eliminar definitivamente" : "eliminar";
    if (!window.confirm(`¿Seguro que deseas ${action} la habitación ${room.number}?`)) return;

    setDeletingRoomId(room.id);
    setActionError("");
    setActionNotice("");
    try {
      await apiRequest(`/api/rooms/${room.id}`, { method: "DELETE" });
      const remainingRooms = rooms.filter((currentRoom) => currentRoom.id !== room.id);
      setRooms(remainingRooms);
    } catch (requestError) {
      setActionError(requestError.message);
    } finally {
      setDeletingRoomId(null);
    }
  };

  const handleUpdateRoomImages = async (room, files) => {
    if (!files.length) return;
    if (files.length > 4) {
      setActionError("Selecciona como máximo 4 imágenes.");
      setActionNotice("");
      return;
    }

    const body = new FormData();
    Array.from(files).forEach((file) => body.append("images", file));
    setUpdatingImagesRoomId(room.id);
    setActionError("");
    setActionNotice("");
    try {
      const updatedRoom = await apiRequest(`/api/rooms/${room.id}/images`, { method: "PUT", body });
      updateRoomCard(updatedRoom);
      setActionNotice(`Imágenes de la habitación ${room.number} actualizadas.`);
    } catch (requestError) {
      setActionError(requestError.message);
    } finally {
      setUpdatingImagesRoomId(null);
    }
  };

  const updateRoomCard = (updatedRoom) => {
    setRooms((currentRooms) => {
      const nextRooms = currentRooms.map((currentRoom) => {
        if (String(currentRoom.id) !== String(updatedRoom.id)) return currentRoom;
        const statusKey = currentRoom.guest ? "ocupada" : updatedRoom.status;
        const [status, statusClass] = STATUS_COPY[statusKey] || STATUS_COPY.mantenimiento;
        return {
          ...currentRoom,
          ...updatedRoom,
          floorLabel: `${updatedRoom.floor}° piso`,
          statusKey,
          status,
          statusClass,
        };
      });
      return nextRooms;
    });
  };

  const updatePaymentDetail = (reservationId, field, value) => {
    setPaymentDetails((current) => ({
      ...current,
      [reservationId]: { ...current[reservationId], [field]: value },
    }));
  };

  const handleRegisterPayment = async (reservation) => {
    const details = paymentDetails[reservation.id] || {};
    const amount = Number(details.amount || reservation.balance || reservation.total);
    if (!Number.isFinite(amount) || amount <= 0) {
      setActionError("Indica un monto de abono válido.");
      return;
    }
    if (["transferencia", "pago_movil"].includes(details.method) && !details.transactionReference?.trim()) {
      setActionError("Indica la referencia de la transferencia o Pago Móvil.");
      return;
    }
    setUpdatingPaymentId(reservation.id);
    setActionError("");
    setActionNotice("");
    try {
      const updatedReservation = await apiRequest(`/api/reservations/${reservation.id}/payment`, {
        method: "PATCH",
        body: JSON.stringify({
          amount,
          paymentMethod: details.method || "efectivo",
          transactionReference: details.transactionReference || "",
          notes: details.notes || "",
        }),
      });
      setRooms((currentRooms) => currentRooms.map((room) => room.currentReservation?.id === updatedReservation.id
        ? { ...room, currentReservation: updatedReservation }
        : room));
      setActionNotice(amount >= Number(reservation.balance || reservation.total) ? "Pago total registrado." : "Abono registrado correctamente.");
    } catch (requestError) {
      setActionError(requestError.message);
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  return (
    <>
      <PageHeader title="Habitaciones" subtitle="Gestiona el estado y la disponibilidad de todas las habitaciones." actionLabel="+ Nueva habitación" onAction={() => navigate("/admin/habitaciones/nueva")} />
      {loading && <p role="status">Cargando habitaciones...</p>}
      {error && <p className="alert alert-danger" role="alert">{error}</p>}
      {!loading && !error && <>
        {actionError && <p className="alert alert-danger" role="alert">{actionError}</p>}
        {actionNotice && <p className="alert alert-success" role="status">{actionNotice}</p>}
        <SummaryCards cards={stats} />
        <RoomsGrid
          rooms={rooms}
          labels={COPY.grid}
          deletingRoomId={deletingRoomId}
          updatingImagesRoomId={updatingImagesRoomId}
          onManageRoom={setManagingRoom}
          onDeleteRoom={handleDeleteRoom}
          onUpdateRoomImages={handleUpdateRoomImages}
          paymentDetails={paymentDetails}
          updatingPaymentId={updatingPaymentId}
          onPaymentDetailChange={updatePaymentDetail}
          onRegisterPayment={handleRegisterPayment}
        />
      </>}
      {managingRoom && (
        <RoomManagementModal
          key={managingRoom.id}
          room={managingRoom}
          onClose={() => setManagingRoom(null)}
          onUpdated={updateRoomCard}
        />
      )}
    </>
  );
}
