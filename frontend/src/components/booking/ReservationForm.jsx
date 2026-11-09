// Recopila habitación, fechas, huéspedes y solicitudes para enviar una reserva.
import { useState } from "react";
import "../navbar/ReserveModal.css";
import { todayISO } from "../admin_form/formUtils.js";
import { apiRequest } from "../../api.js";
import { roomFromApi } from "../../roomData.js";

const initialForm = {
  checkIn: "",
  checkOut: "",
  guests: "1",
  requests: "",
};

const isBlockedRange = (checkIn, checkOut, blockedRanges) =>
  Boolean(checkIn && checkOut) &&
  blockedRanges.some(
    (range) => checkIn < range.checkOut && checkOut > range.checkIn,
  );

const addDays = (dateValue, days) => {
  const date = new Date(`${dateValue}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const firstFreeCheckIn = (blockedRanges) => {
  let candidate = todayISO();
  for (let attempt = 0; attempt < 3650; attempt += 1) {
    const candidateCheckout = addDays(candidate, 2);
    if (!isBlockedRange(candidate, candidateCheckout, blockedRanges)) return candidate;
    const blockingRange = blockedRanges.find(
      (range) => candidate < range.checkOut && candidateCheckout > range.checkIn,
    );
    candidate = blockingRange?.checkOut || addDays(candidate, 1);
  }
  return candidate;
};

export default function ReservationForm({ room, rooms = [], onSubmit, onCancel, compact = false }) {
  const [selectedRoomId, setSelectedRoomId] = useState(String(room?.id || ""));
  const [availableRooms, setAvailableRooms] = useState(rooms);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const selectedRoom = availableRooms.find(({ id }) => String(id) === selectedRoomId) ?? availableRooms[0] ?? room;
  const blockedRanges = selectedRoom?.blockedRanges || [];
  const minimumCheckIn = firstFreeCheckIn(blockedRanges);

  if (!selectedRoom) {
    return (
      <p className="reserve-error" role="status">
        Todas las habitaciones están ocupadas por el momento.
      </p>
    );
  }

  const updateAvailability = async (checkIn, checkOut) => {
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      setAvailableRooms(rooms);
      return;
    }
    try {
      const records = await apiRequest(`/api/rooms?catalog=true&checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}`, { cache: "no-store" });
      const nextRooms = records.map(roomFromApi).filter(({ isAvailable }) => isAvailable);
      setAvailableRooms(nextRooms);
      if (!nextRooms.some(({ id }) => String(id) === selectedRoomId)) {
        setSelectedRoomId(String(nextRooms[0]?.id || ""));
      }
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const update = (field, value) => {
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);
    setError("");

    if (field === "checkIn" && value < minimumCheckIn) {
      setForm((current) => ({ ...current, checkIn: "", checkOut: "" }));
      setError(`La primera fecha disponible para dos noches es ${minimumCheckIn}.`);
      return;
    }
    if (field === "checkIn" && isBlockedRange(value, addDays(value, 1), blockedRanges)) {
      setForm((current) => ({ ...current, checkIn: "", checkOut: "" }));
      setError("Ese día ya está reservado para esta habitación. Selecciona una fecha libre.");
      return;
    }
    if (field === "checkIn" && nextForm.checkOut && isBlockedRange(value, nextForm.checkOut, blockedRanges)) {
      setForm((current) => ({ ...current, checkIn: value, checkOut: "" }));
      setError("Las fechas seleccionadas incluyen días ya reservados para esta habitación.");
      return;
    }
    if (field === "checkOut" && isBlockedRange(nextForm.checkIn, value, blockedRanges)) {
      setForm((current) => ({ ...current, checkOut: "" }));
      setError("Las fechas seleccionadas incluyen días ya reservados para esta habitación.");
      return;
    }
    if (field === "checkOut" && nextForm.checkIn && value < addDays(nextForm.checkIn, 2)) {
      setForm((current) => ({ ...current, checkOut: "" }));
      setError("La reserva debe tener al menos dos noches.");
      return;
    }

    if (field === "checkIn" || field === "checkOut") {
      updateAvailability(nextForm.checkIn, nextForm.checkOut);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.checkOut <= form.checkIn) {
      setError("La fecha de salida debe ser posterior a la fecha de entrada.");
      return;
    }
    if (isBlockedRange(form.checkIn, form.checkOut, blockedRanges)) {
      setError("Las fechas seleccionadas incluyen días ya reservados para esta habitación.");
      return;
    }

    try {
      const reservation = await onSubmit({
        roomId: selectedRoom.roomId ?? selectedRoom.id,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        guests: Number(form.guests),
        adults: Number(form.guests),
        children: 0,
        roomName: selectedRoom.name,
        specialRequests: form.requests,
      });
      window.alert(reservation?.status === "confirmada"
        ? "La reserva se agregó exitosamente."
        : "La solicitud se envió exitosamente y está pendiente de aprobación del administrador.");
    } catch (submitError) {
      setError(submitError.message || "No se pudo crear la reserva.");
      window.alert(submitError.message || "No se pudo crear la reserva.");
    }
  };

  return (
    <form className={`reservation-form${compact ? " reservation-form--compact" : ""}`} onSubmit={handleSubmit}>
      <div className="reservation-room-summary">
        <img
          className="reservation-room-image"
          src={selectedRoom.image}
          alt={selectedRoom.name}
        />
        <div>
          <span className="reservation-form-label">Habitación seleccionada</span>
          <select
            className="reservation-room-select"
            value={selectedRoom.id}
            onChange={(event) => {
              setSelectedRoomId(event.target.value);
              setForm(initialForm);
              setError("");
            }}
            aria-label="Seleccionar habitación"
          >
            {availableRooms.map((availableRoom) => (
              <option key={availableRoom.id} value={availableRoom.id}>
                {availableRoom.name}
              </option>
            ))}
          </select>
          <span>{selectedRoom.summary}</span>
        </div>
        <strong>{selectedRoom.price} <small>/ noche</small></strong>
      </div>
      {!availableRooms.length && (
        <div className="reservation-availability-message" role="status">
          <strong>No hay habitaciones disponibles</strong>
          <span>para las fechas seleccionadas.</span>
          <small>Prueba con otras fechas para continuar.</small>
        </div>
      )}

      <div className="reservation-room-details">
        <span><strong>Capacidad:</strong> {selectedRoom.tags[0]}</span>
        <span><strong>Espacio:</strong> {selectedRoom.tags[1]}</span>
        <span><strong>Incluye:</strong> {selectedRoom.features.slice(0, 3).map((feature) => feature.text).join(", ")}</span>
      </div>

      <div className="reservation-fields">
        <label>
          Fecha de entrada
          <input type="date" min={minimumCheckIn} value={form.checkIn} onChange={(event) => update("checkIn", event.target.value)} required />
        </label>
        <label>
          Fecha de salida
          <input type="date" min={form.checkIn ? addDays(form.checkIn, 2) : addDays(minimumCheckIn, 2)} value={form.checkOut} onChange={(event) => update("checkOut", event.target.value)} required />
        </label>
        <label>
          Huéspedes
          <input type="number" min="1" max={selectedRoom.maxGuests} value={form.guests} onChange={(event) => update("guests", event.target.value)} required />
        </label>
      </div>
      {blockedRanges.length > 0 && (
        <p className="reservation-date-notice" role="status">
          Esta habitación no está disponible entre{" "}
          {blockedRanges.map(({ checkIn, checkOut }) => `${checkIn} y ${checkOut}`).join("; ")}.
          Elige fechas completamente libres.
        </p>
      )}

      <label className="reservation-request">
        Solicitudes especiales
        <textarea value={form.requests} onChange={(event) => update("requests", event.target.value)} placeholder="Cuéntanos si necesitas algo adicional (opcional)" rows="3" />
      </label>

      {error && <p className="reserve-error">{error}</p>}

      <div className="reservation-form-actions">
        {onCancel && <button type="button" className="reserve-back" onClick={onCancel}>Cancelar</button>}
        <button type="submit" className="reserve-submit" disabled={!availableRooms.length}>Confirmar reserva</button>
      </div>
    </form>
  );
}
