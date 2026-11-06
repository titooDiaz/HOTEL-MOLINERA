// Panel para editar planes y administrar las solicitudes de experiencias.
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HotelDashboard.css";
import PageHeader from "../../components/page_header/PageHeader.jsx";
import { apiRequest } from "../../api.js";
import { formatCOP } from "../../components/admin_form/formUtils.js";

const BOOKING_STATUS = {
  pendiente: ["Pendiente", "badge-pill-amber"],
  confirmada: ["Confirmada", "badge-pill-emerald"],
  cancelada: ["Cancelada", "badge-pill-rose"],
  completada: ["Completada", "badge-pill-blue"],
};

export default function PlanesAdmin() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingBookingId, setUpdatingBookingId] = useState(null);

  const loadData = useCallback(async () => {
    setError("");
    try {
      const [planRecords, bookingRecords] = await Promise.all([
        apiRequest("/api/plans"),
        apiRequest("/api/plan-bookings"),
      ]);
      setPlans(planRecords);
      setBookings(bookingRecords);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const deletePlan = async (plan) => {
    if (!window.confirm(`¿Retirar el plan "${plan.name}"? Sus reservas anteriores se conservarán.`)) return;
    setError("");
    try {
      await apiRequest(`/api/plans/${plan.id}`, { method: "DELETE" });
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const updateBookingStatus = async (booking, status) => {
    setUpdatingBookingId(booking.id);
    setError("");
    try {
      await apiRequest(`/api/plan-bookings/${booking.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdatingBookingId(null);
    }
  };

  return (
    <>
      <PageHeader title="Planes y actividades" subtitle="Administra las experiencias y sus solicitudes de reserva." actionLabel="+ Nuevo plan" onAction={() => navigate("/admin/planes/nuevo")} />
      {error && <p className="alert alert-danger" role="alert">{error}</p>}
      {loading && <p role="status">Cargando planes y solicitudes...</p>}
      {!loading && !error && <>
        <section className="card-panel admin-data-panel">
          <div className="admin-panel-heading">
            <h2 className="admin-panel-title">Planes y experiencias</h2>
          </div>
          <div className="admin-table-wrap">
            <table className="table admin-table align-middle mb-0">
              <thead><tr><th>Plan</th><th>Descripción</th><th>Precio</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id}>
                    <td className="fw-semibold">{plan.name}</td>
                    <td>{plan.summary || plan.description || "—"}</td>
                    <td>{plan.price == null ? "Consultar" : `${formatCOP(Number(plan.price))} ${plan.currency}`}</td>
                    <td>
                      <span className={`admin-status-badge ${plan.isVisible && plan.isBookable ? "badge-pill-emerald" : "badge-pill-slate"}`}>
                        {!plan.isVisible ? "Oculto" : plan.isBookable ? "Publicado" : "No reservable"}
                      </span>
                    </td>
                    <td>
                      <div className="plan-admin-actions">
                        <button className="admin-action-button admin-action-button--outline" type="button" onClick={() => navigate(`/admin/planes/${plan.id}/editar`)}>Editar</button>
                        <button className="admin-action-button admin-action-button--danger" type="button" onClick={() => deletePlan(plan)}>Retirar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!plans.length && <p className="admin-empty-state">Todavía no hay planes publicados.</p>}
        </section>

        <section className="card-panel admin-data-panel">
          <div className="admin-panel-heading">
            <h2 className="admin-panel-title">Solicitudes de experiencias</h2>
          </div>
          <div className="admin-table-wrap">
            <table className="table admin-table align-middle mb-0">
              <thead><tr><th>Plan</th><th>Huésped</th><th>Fecha</th><th>Personas</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {bookings.map((booking) => {
                  const [status, statusClass] = BOOKING_STATUS[booking.status] || ["—", "badge-pill-slate"];
                  const guest = booking.usuario?.huesped;
                  const guestName = guest ? `${guest.firstName} ${guest.lastName}` : booking.usuario?.email || "—";
                  return (
                    <tr key={booking.id}>
                      <td className="fw-semibold">{booking.plan?.name || "Plan retirado"}</td>
                      <td>{guestName}</td>
                      <td>{booking.scheduledFor}</td>
                      <td>{booking.guests}</td>
                      <td>{formatCOP(Number(booking.total))} {booking.currency}</td>
                      <td><span className={`admin-status-badge ${statusClass}`}>{status}</span></td>
                      <td>
                        {booking.status === "pendiente" && (
                          <div className="plan-admin-actions">
                            <button className="admin-action-button admin-action-button--primary" type="button" disabled={updatingBookingId !== null} onClick={() => updateBookingStatus(booking, "confirmada")}>{updatingBookingId === booking.id ? "Guardando..." : "Confirmar"}</button>
                            <button className="admin-action-button admin-action-button--danger" type="button" disabled={updatingBookingId !== null} onClick={() => updateBookingStatus(booking, "cancelada")}>Cancelar</button>
                          </div>
                        )}
                        {booking.status === "confirmada" && (
                          <button className="admin-action-button admin-action-button--outline" type="button" disabled={updatingBookingId !== null} onClick={() => updateBookingStatus(booking, "completada")}>Marcar completada</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!bookings.length && <p className="admin-empty-state">Aún no hay solicitudes de experiencias.</p>}
        </section>
      </>}
    </>
  );
}
