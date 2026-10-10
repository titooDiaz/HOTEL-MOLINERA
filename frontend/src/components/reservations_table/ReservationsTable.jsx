import { useMemo, useState } from "react";

export default function ReservationsTable({ reservations, labels }) {
  const [status, setStatus] = useState(labels.allValue);
  const filteredReservations = useMemo(
    () => status === labels.allValue ? reservations : reservations.filter((reservation) => reservation.statusKey === status),
    [reservations, status, labels.allValue],
  );
  const columns = labels.columns;

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
              <tr key={reservation.id}>
                <td className="fw-semibold">{reservation.id}</td><td>{reservation.client}</td><td>{reservation.room}</td>
                <td>{reservation.checkin}</td><td>{reservation.checkout}</td>
                <td><span className={`admin-status-badge ${reservation.statusClass}`}>{reservation.status}</span></td>
                <td><button className="admin-table-action" type="button" aria-label={`Acciones para ${reservation.id}`}>•••</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!filteredReservations.length && <p className="admin-empty-state">{labels.emptyText}</p>}
    </section>
  );
}
