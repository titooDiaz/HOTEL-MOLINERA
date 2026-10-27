// Listado administrativo de planes con acceso al formulario de creación.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HotelDashboard.css";
import PageHeader from "../../components/page_header/PageHeader.jsx";
import { apiRequest } from "../../api.js";
import { formatCOP } from "../../components/admin_form/formUtils.js";

export default function PlanesAdmin() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/api/plans").then(setPlans).catch((requestError) => setError(requestError.message));
  }, []);

  return (
    <>
      <PageHeader title="Planes y actividades" subtitle="Administra las experiencias que se muestran en el sitio público." actionLabel="+ Nuevo plan" onAction={() => navigate("/admin/planes/nuevo")} />
      {error && <p className="alert alert-danger" role="alert">{error}</p>}
      {!error && (
        <section className="card-panel admin-data-panel">
          <div className="admin-table-wrap">
            <table className="table admin-table align-middle mb-0">
              <thead><tr><th>Plan</th><th>Descripción</th><th>Precio</th><th>Disponibilidad</th></tr></thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id}>
                    <td className="fw-semibold">{plan.name}</td>
                    <td>{plan.summary || plan.description || "—"}</td>
                    <td>{plan.price == null ? "Consultar" : `${formatCOP(Number(plan.price))} ${plan.currency}`}</td>
                    <td><span className="admin-status-badge badge-pill-emerald">Publicado</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!plans.length && <p className="admin-empty-state">Todavía no hay planes publicados.</p>}
        </section>
      )}
    </>
  );
}
