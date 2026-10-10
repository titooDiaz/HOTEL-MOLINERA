export default function ClientsTable({ clients, labels }) {
  return (
    <section className="card-panel admin-data-panel">
      <div className="admin-panel-heading"><h2 className="admin-panel-title">{labels.title}</h2></div>
      <div className="admin-table-wrap">
        <table className="table admin-table align-middle mb-0">
          <thead><tr>{Object.values(labels.columns).map((column) => <th key={column}>{column}</th>)}</tr></thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.email}>
                <td className="fw-semibold">{client.name}</td><td><span>{client.email}</span><small className="admin-table-secondary">{client.phone}</small></td>
                <td>{client.room}</td><td>{client.spent}</td>
                <td><span className={`admin-status-badge ${client.statusClass}`}>{client.status}</span></td>
                <td><button className="admin-table-action" type="button" aria-label={`Acciones para ${client.name}`}>•••</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
