import { useState } from "react";
import { apiRequest } from "../../api.js";
import "./PlanBookingModal.css";

function localDate() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export default function PlanBookingModal({ plan, onClose, onBooked }) {
  const [scheduledFor, setScheduledFor] = useState(plan.validFrom && plan.validFrom > localDate() ? plan.validFrom : localDate());
  const [guests, setGuests] = useState(1);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const booking = await apiRequest("/api/plan-bookings", {
        method: "POST",
        body: JSON.stringify({
          planId: plan.id,
          scheduledFor,
          guests: Number(guests),
          notes,
        }),
      });
      onBooked(booking);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="plan-booking-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !submitting) onClose();
    }}>
      <section className="plan-booking-dialog" role="dialog" aria-modal="true" aria-labelledby="plan-booking-title">
        <header className="plan-booking-heading">
          <div>
            <p>Reserva directa · sin habitación</p>
            <h2 id="plan-booking-title">{plan.name}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={submitting} aria-label="Cerrar">×</button>
        </header>
        {error && <p className="alert alert-danger" role="alert">{error}</p>}
        <form className="plan-booking-form" onSubmit={submit}>
          <label>Fecha de la experiencia
            <input
              className="form-control"
              type="date"
              value={scheduledFor}
              min={plan.validFrom && plan.validFrom > localDate() ? plan.validFrom : localDate()}
              max={plan.validUntil || undefined}
              onChange={(event) => setScheduledFor(event.target.value)}
              required
            />
          </label>
          <label>Participantes
            <input
              className="form-control"
              type="number"
              min="1"
              max="30"
              value={guests}
              onChange={(event) => setGuests(event.target.value)}
              required
            />
          </label>
          <label className="plan-booking-full-width">Notas o solicitudes
            <textarea className="form-control" rows="3" value={notes} onChange={(event) => setNotes(event.target.value)} />
          </label>
          <p className="plan-booking-full-width plan-booking-summary">
            {Number(plan.price).toLocaleString("es-VE")} {plan.currency} por persona · total estimado{" "}
            {(Number(plan.price) * Number(guests || 0)).toLocaleString("es-VE")} {plan.currency}.
            La solicitud queda pendiente de confirmación por el hotel; el pago se coordina con recepción.
          </p>
          <footer className="plan-booking-actions plan-booking-full-width">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={submitting}>Volver</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Enviando..." : "Solicitar experiencia"}</button>
          </footer>
        </form>
      </section>
    </div>
  );
}
