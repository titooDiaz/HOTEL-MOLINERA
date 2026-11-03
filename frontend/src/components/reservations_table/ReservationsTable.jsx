// Muestra las reservas en una tabla con filtro por estado y aviso si no hay resultados.
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

export default function ReservationsTable({ reservations, labels, onStatusChange, updatingReservationId }) {
  const [status, setStatus] = useState(labels.allValue);
  const [activeMenu, setActiveMenu] = useState(null);
  const filteredReservations = useMemo(
    () => status === labels.allValue ? reservations : reservations.filter((reservation) => reservation.statusKey === status),
    [reservations, status, labels.allValue],
  );
  const columns = labels.columns;

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!event.target.closest(".reservation-actions, .reservation-actions-menu")) setActiveMenu(null);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setActiveMenu(null);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const runStatusChange = (reservation, nextStatus) => {
    setActiveMenu(null);
    onStatusChange(reservation, nextStatus);
  };

  const activeReservation = activeMenu
    ? filteredReservations.find((reservation) => reservation.reservationId === activeMenu.reservationId)
    : null;

  return (
    <section className="card-panel admin-data-panel">
      <div className="admin-panel-heading">
        <h2 className="admin-panel-title">{labels.title}</h2>
        <label className="admin-filter-control">
          <span>{labels.filterLabel}</span>
          <select className="filter-select" value={status} onChange={(event) => setStatus(event.target.value)}>
            {labels.filterOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>
      <div className="admin-table-wrap">
        <table className="table admin-table align-middle mb-0">
          <thead><tr>{Object.values(columns).map((column) => <th key={column}>{column}</th>)}</tr></thead>
          <tbody>
            {filteredReservations.map((reservation) => (
              <tr className={activeMenu?.reservationId === reservation.reservationId ? "reservation-actions-open" : ""} key={reservation.id}>
                <td className="fw-semibold">{reservation.id}</td><td>{reservation.client}</td><td>{reservation.room}</td>
                <td>{reservation.checkin}</td><td>{reservation.checkout}</td>
                <td><span className={`admin-status-badge ${reservation.statusClass}`}>{reservation.status}</span></td>
                <td>
                  <div className="client-actions reservation-actions">
                    <button
                      className="admin-table-action"
                      type="button"
                      aria-label={`Acciones para ${reservation.id}`}
                      aria-expanded={activeMenu?.reservationId === reservation.reservationId}
                      onClick={(event) => {
                        if (activeMenu?.reservationId === reservation.reservationId) {
                          setActiveMenu(null);
                          return;
                        }
                        const rect = event.currentTarget.getBoundingClientRect();
                        const menuWidth = Math.min(288, window.innerWidth - 24);
                        const menuHeight = reservation.statusKey === "proceso" ? 128 : 72;
                        const top = rect.bottom + menuHeight + 8 > window.innerHeight
                          ? Math.max(12, rect.top - menuHeight - 8)
                          : rect.bottom + 8;
                        setActiveMenu({
                          reservationId: reservation.reservationId,
                          top,
                          left: Math.max(12, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 12)),
                        });
                      }}
                    >•••</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {activeReservation && createPortal(
        <div className="client-actions-menu restaurant-actions-menu reservation-actions-menu" style={{ top: activeMenu.top, left: activeMenu.left }}>
          {activeReservation.statusKey === "proceso" && <>
            <button
              type="button"
              disabled={updatingReservationId === activeReservation.id}
              onClick={() => runStatusChange(activeReservation, "confirmada")}
            >
              {updatingReservationId === activeReservation.id ? "Guardando..." : "Aceptar solicitud"}
            </button>
            <button
              type="button"
              disabled={updatingReservationId === activeReservation.id}
              onClick={() => runStatusChange(activeReservation, "cancelada")}
            >Rechazar solicitud</button>
          </>}
          {(activeReservation.statusKey === "confirmada" || activeReservation.statusKey === "checkin") && <button
            type="button"
            disabled={updatingReservationId === activeReservation.id}
            onClick={() => runStatusChange(activeReservation, "cancelada")}
          >
            {updatingReservationId === activeReservation.id ? "Guardando..." : "Cancelar reserva"}
          </button>}
        </div>,
        document.body,
      )}
      {!filteredReservations.length && <p className="admin-empty-state">{labels.emptyText}</p>}
    </section>
  );
}
