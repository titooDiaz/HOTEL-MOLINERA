export default function ReportsAnalytics({ revenue, roomTypeStats, labels }) {
  const maxRevenue = Math.max(...revenue.values, 1);

  return (
    <div className="row g-3 admin-reports-grid">
      <div className="col-12 col-xl-6">
        <section className="card-panel admin-report-card h-100">
          <h2 className="admin-panel-title">{labels.revenueTitle}</h2>
          <div className="admin-chart" role="img" aria-label={labels.revenueTitle}>
            {revenue.values.map((value, index) => (
              <div className="admin-chart-column" key={revenue.labels[index]}>
                <span className="admin-chart-value">${(value / 1000000).toFixed(1)} M</span>
                <div className="admin-chart-track"><div className="admin-chart-bar" style={{ height: `${Math.max(value / maxRevenue * 100, 5)}%` }} /></div>
                <span className="admin-chart-label">{revenue.labels[index]}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="col-12 col-xl-6">
        <section className="card-panel admin-report-card h-100">
          <h2 className="admin-panel-title">{labels.roomTypesTitle}</h2>
          <div className="admin-report-breakdown">
            {roomTypeStats.map((room) => (
              <div className="admin-breakdown-row" key={room.type}>
                <div className="d-flex justify-content-between gap-3"><span>{room.type}</span><strong>{room.revenue}</strong></div>
                <div className="admin-breakdown-track"><span style={{ width: `${Math.min(room.reservations / Math.max(...roomTypeStats.map((item) => item.reservations), 1) * 100, 100)}%` }} /></div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="col-12">
        <section className="card-panel admin-data-panel">
          <h2 className="admin-panel-title mb-3">{labels.detailTitle}</h2>
          <div className="admin-table-wrap">
            <table className="table admin-table align-middle mb-0">
              <thead><tr><th>{labels.columns.type}</th><th>{labels.columns.reservations}</th><th>{labels.columns.revenue}</th></tr></thead>
              <tbody>{roomTypeStats.map((room) => <tr key={room.type}><td className="fw-semibold">{room.type}</td><td>{room.reservations} {labels.reservationsShort}</td><td>{room.revenue}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
