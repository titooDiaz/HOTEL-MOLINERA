// Recopila habitación, fechas, huéspedes y solicitudes para enviar una reserva.
import { useState } from "react";
import "../navbar/ReserveModal.css";
import { todayISO } from "../admin_form/formUtils.js";

const initialForm = {
  checkIn: "",
  checkOut: "",
  guests: "1",
  requests: "",
};

export default function ReservationForm({ room, rooms = [room], onSubmit, onCancel, compact = false }) {
  const [selectedRoomId, setSelectedRoomId] = useState(String(room.id));
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const selectedRoom = rooms.find(({ id }) => String(id) === selectedRoomId) ?? room;

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.checkOut <= form.checkIn) {
      setError("La fecha de salida debe ser posterior a la fecha de entrada.");
      return;
    }

    try {
      await onSubmit({
        roomId: selectedRoom.roomId ?? selectedRoom.id,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        guests: Number(form.guests),
        adults: Number(form.guests),
        children: 0,
        roomName: selectedRoom.name,
        specialRequests: form.requests,
      });
    } catch (submitError) {
      setError(submitError.message || "No se pudo crear la reserva.");
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
            onChange={(event) => setSelectedRoomId(event.target.value)}
            aria-label="Seleccionar habitación"
          >
            {rooms.map((availableRoom) => (
              <option key={availableRoom.id} value={availableRoom.id}>
                {availableRoom.name}
              </option>
            ))}
          </select>
          <span>{selectedRoom.summary}</span>
        </div>
        <strong>{selectedRoom.price} <small>/ noche</small></strong>
      </div>

      <div className="reservation-room-details">
        <span><strong>Capacidad:</strong> {selectedRoom.tags[0]}</span>
        <span><strong>Espacio:</strong> {selectedRoom.tags[1]}</span>
        <span><strong>Incluye:</strong> {selectedRoom.features.slice(0, 3).map((feature) => feature.text).join(", ")}</span>
      </div>

      <div className="reservation-fields">
        <label>
          Fecha de entrada
          <input type="date" min={todayISO()} value={form.checkIn} onChange={(event) => update("checkIn", event.target.value)} required />
        </label>
        <label>
          Fecha de salida
          <input type="date" min={form.checkIn || todayISO()} value={form.checkOut} onChange={(event) => update("checkOut", event.target.value)} required />
        </label>
        <label>
          Huéspedes
          <input type="number" min="1" max={selectedRoom.maxGuests} value={form.guests} onChange={(event) => update("guests", event.target.value)} required />
        </label>
      </div>

      <label className="reservation-request">
        Solicitudes especiales
        <textarea value={form.requests} onChange={(event) => update("requests", event.target.value)} placeholder="Cuéntanos si necesitas algo adicional (opcional)" rows="3" />
      </label>

      {error && <p className="reserve-error">{error}</p>}

      <div className="reservation-form-actions">
        {onCancel && <button type="button" className="reserve-back" onClick={onCancel}>Cancelar</button>}
        <button type="submit" className="reserve-submit">Confirmar reserva</button>
      </div>
    </form>
  );
}
