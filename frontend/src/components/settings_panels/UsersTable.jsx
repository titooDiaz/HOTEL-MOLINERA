export default function UsersTable({ users, labels }) {
  return (
    <section className="card-panel admin-data-panel">
      <div className="admin-panel-heading">
        <h2 className="admin-panel-title">{labels.title}</h2>
        <button className="admin-action-button admin-action-button--outline" type="button">{labels.invite}</button>
      </div>
      <div className="admin-table-wrap">
        <table className="table admin-table align-middle mb-0">
          <thead><tr>{Object.values(labels.columns).map((column) => <th key={column}>{column}</th>)}</tr></thead>
          <tbody>{users.map((user) => (
            <tr key={user.email}>
              <td><strong>{user.name}</strong><small className="admin-table-secondary">{user.email}</small></td>
              <td>{user.role}</td><td><span className={`admin-status-badge ${user.statusClass}`}>{user.status}</span></td>
              <td><button className="admin-table-action" type="button" aria-label={`Acciones para ${user.name}`}>•••</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </section>
  );
}
