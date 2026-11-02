// Muestra los clientes del hotel y sus datos en una tabla administrativa.
import { Link } from "react-router-dom";
import Tooltip from "../tooltip/Tooltip.jsx";

export default function ClientsTable({ clients, labels, onDelete, deletingClientId }) {
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
                <td>
                  <details className="client-actions">
                    <summary className="admin-table-action" aria-label={`Acciones para ${client.name}`}>
                      <Tooltip label={`Acciones para ${client.name}`}>•••</Tooltip>
                    </summary>
                    <div className="client-actions-menu">
                      <Link to={`/admin/clientes/${client.id}`}>Ver perfil e historial</Link>
                      <Link to={`/admin/reservas/nueva?clientId=${client.id}`}>Crear reserva</Link>
                      <button
                        type="button"
                        className="client-actions-delete"
                        disabled={deletingClientId === client.id}
                        onClick={() => onDelete(client)}
                      >
                        {deletingClientId === client.id ? "Eliminando..." : "Eliminar cliente"}
                      </button>
                    </div>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
