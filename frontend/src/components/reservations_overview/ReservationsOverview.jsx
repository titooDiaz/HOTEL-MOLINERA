import "./ReservationsOverview.css";

export default function ReservationsOverview({ reservations, labels, occupancy }) {
  return (
    <div className="row g-3">
      <div className="col-12 col-xl-9">
        <div className="card-panel h-100 reservations-panel">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <h2 className="fw-semibold text-slate-700 mb-0 dashboard-section-title">
              {labels.title}
            </h2>
            <a href="#" className="text-rose-500 fw-medium text-decoration-none reservations-view-all">
              {labels.viewAll}
            </a>
          </div>
          <div className="table-scroll">
            <table className="tw-table">
              <thead>
                <tr>
                  <th>{labels.columns.reservation}</th>
                  <th>{labels.columns.client}</th>
                  <th>{labels.columns.room}</th>
                  <th>{labels.columns.checkIn}</th>
                  <th>{labels.columns.checkOut}</th>
                  <th>{labels.columns.status}</th>
                  <th>{labels.columns.actions}</th>
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
            {labels.occupancyTitle}
          </h2>
          <p className="fw-semibold text-slate-800 mb-0 reservations-occupancy-value">
            {occupancy.percent}%
          </p>
          <div className="progress-track-lg mt-3">
            <div className="progress-fill bg-emerald-500" style={{ width: `${occupancy.percent}%` }} />
          </div>
          <p className="text-slate-400 mt-2 mb-0 reservations-occupancy-caption">
            {occupancy.caption}
          </p>
        </div>
      </div>
    </div>
  );
}