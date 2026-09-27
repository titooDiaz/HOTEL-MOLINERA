import "./ReservationsOverview.css";

export default function ReservationsOverview({ reservations }) {
  return (
    <div className="row g-3">
      <div className="col-12 col-xl-9">
        <div className="card-panel h-100 reservations-panel">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <h2 className="fw-semibold text-slate-700 mb-0 dashboard-section-title">
              Reservas recientes
            </h2>
            <a href="#" className="text-rose-500 fw-medium text-decoration-none reservations-view-all">
              Ver todas
            </a>
          </div>
          <div className="table-scroll">
            <table className="tw-table">
              <thead>
                <tr>
                  <th># Reserva</th>
                  <th>Cliente</th>
                  <th>Habitación</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation) => (
                  <tr key={reservation.id}>
                    <td className="fw-medium text-slate-700">{reservation.id}</td>
                    <td className="text-slate-600">{reservation.client}</td>
                    <td className="text-slate-600">{reservation.room}</td>
                    <td className="text-slate-500">{reservation.checkin}</td>
                    <td className="text-slate-500">{reservation.checkout}</td>
                    <td>
                      <span className={`badge-pill ${reservation.statusClass}`}>
                        {reservation.status}
                      </span>
                    </td>
                    <td className="text-slate-400">⋮</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="col-12 col-xl-3">
        <div className="card-panel h-100">
          <h2 className="fw-semibold text-slate-700 mb-4 dashboard-section-title">
            Ocupación general
          </h2>
          <p className="fw-semibold text-slate-800 mb-0 reservations-occupancy-value">
            75%
          </p>
          <div className="progress-track-lg mt-3">
            <div className="progress-fill bg-emerald-500" style={{ width: "75%" }} />
          </div>
          <p className="text-slate-400 mt-2 mb-0 reservations-occupancy-caption">
            18 de 24 habitaciones ocupadas
          </p>
        </div>
      </div>
    </div>
  );
}