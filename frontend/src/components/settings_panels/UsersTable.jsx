// Presenta usuarios y permite crear cuentas administrativas o de huésped.
import { useState } from "react";

export default function UsersTable({ users, labels, onInvite }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      await onInvite(Object.fromEntries(formData.entries()));
      form.reset();
      setIsFormOpen(false);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="card-panel admin-data-panel">
      <div className="admin-panel-heading">
        <h2 className="admin-panel-title">{labels.title}</h2>
        <button className="admin-action-button admin-action-button--outline" type="button" onClick={() => setIsFormOpen((open) => !open)}>
          {isFormOpen ? "Cancelar" : labels.invite}
        </button>
      </div>
      {isFormOpen && (
        <form className="row g-2 p-3" onSubmit={submit}>
          <label className="col-12 col-md-6">Nombre y apellido
            <input className="form-control" name="name" required />
          </label>
          <label className="col-12 col-md-6">Correo electrónico
            <input className="form-control" name="email" type="email" required />
          </label>
          <label className="col-12 col-md-4">Rol
            <select className="form-select" name="role" defaultValue="guest">
              <option value="guest">Huésped</option>
              <option value="admin">Administrador</option>
            </select>
          </label>
          <label className="col-12 col-md-4">Tipo de documento
            <select className="form-select" name="documentType" defaultValue="CC">
              <option value="CC">Cédula de ciudadanía</option>
              <option value="CE">Cédula de extranjería</option>
              <option value="PA">Pasaporte</option>
              <option value="NIT">NIT</option>
              <option value="OTRO">Otro</option>
            </select>
          </label>
          <label className="col-12 col-md-4">Número de documento
            <input className="form-control" name="documentNumber" placeholder="Requerido para huéspedes" />
          </label>
          <label className="col-12 col-md-4">Teléfono
            <input className="form-control" name="phone" type="tel" />
          </label>
          <label className="col-12 col-md-4">Contraseña inicial
            <input className="form-control" name="password" type="password" minLength="8" required />
          </label>
          {error && <p className="alert alert-danger mb-0" role="alert">{error}</p>}
          <div className="col-12">
            <button className="admin-action-button admin-action-button--primary" disabled={submitting} type="submit">
              {submitting ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </div>
        </form>
      )}
      <div className="admin-table-wrap">
        <table className="table admin-table align-middle mb-0">
          <thead><tr>{Object.values(labels.columns).map((column) => <th key={column}>{column}</th>)}</tr></thead>
          <tbody>{users.map((user) => (
            <tr key={user.email}>
              <td><strong>{user.name}</strong><small className="admin-table-secondary">{user.email}</small></td>
              <td>{user.role === "admin" ? "Administrador" : "Huésped"}</td>
              <td><span className={`admin-status-badge ${user.statusClass}`}>{user.status}</span></td>
              <td><button className="admin-table-action" type="button" aria-label={`Acciones para ${user.name}`}>•••</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </section>
  );
}
