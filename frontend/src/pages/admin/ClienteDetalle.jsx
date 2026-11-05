// Perfil administrativo de un cliente con su historial de reservas.
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest } from "../../api.js";
import PageHeader from "../../components/page_header/PageHeader.jsx";
import { formatCOP } from "../../components/admin_form/formUtils.js";
import "./HotelDashboard.css";

const formatDate = (date) => date
  ? new Intl.DateTimeFormat("es-VE").format(new Date(`${date}T00:00:00`))
  : "—";

export default function ClienteDetalle() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updatingReservationId, setUpdatingReservationId] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState({});

  useEffect(() => {
    apiRequest(`/api/clients/${id}`)
      .then(setClient)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleRegisterPayment = async (reservation) => {
    const room = reservation.habitacion
      ? `${reservation.habitacion.type} (${reservation.habitacion.number})`
      : "la habitación";
    if (!window.confirm(`¿Registrar como pagada ${room} de la reserva ${reservation.reservationCode}?`)) return;

    setUpdatingReservationId(reservation.id);
    setError("");
    setSuccess("");
    try {
      const updatedReservation = await apiRequest(`/api/reservations/${reservation.id}/payment`, {
        method: "PATCH",
        body: JSON.stringify({
          paymentStatus: "pagado",
          paymentMethod: paymentMethods[reservation.id] || "efectivo",
        }),
      });
      setClient((current) => ({
        ...current,
        reservas: current.reservas.map((item) => item.id === updatedReservation.id ? updatedReservation : item),
      }));
      setSuccess(`El pago de ${room} se registró correctamente.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdatingReservationId(null);
    }
  };

  return (
    <>
      <PageHeader
        title={client ? `${client.firstName} ${client.lastName}` : "Perfil del cliente"}
        subtitle="Datos del huésped e historial de reservas."
      >
        <Link to="/admin/clientes" className="admin-action-button admin-action-button--outline">
          ← Volver a clientes
        </Link>
        {client && (
          <Link
            to={`/admin/reservas/nueva?clientId=${client.id}`}
            className="admin-action-button admin-action-button--primary"
          >
            + Crear reserva
          </Link>
        )}
      </PageHeader>
      {loading && <p role="status">Cargando perfil...</p>}
      {error && <p className="alert alert-danger" role="alert">{error}</p>}
      {success && <p className="alert alert-success" role="status">{success}</p>}
      {!loading && client && (
        <>
          <section className="card-panel admin-data-panel">
            <h2 className="admin-panel-title mb-3">Datos del cliente</h2>
            <dl className="row mb-0">
              <dt className="col-sm-3">Correo</dt><dd className="col-sm-9">{client.usuario?.email || "—"}</dd>
              <dt className="col-sm-3">Teléfono</dt><dd className="col-sm-9">{client.phone || "—"}</dd>
              <dt className="col-sm-3">Documento</dt>
              <dd className="col-sm-9">{[client.documentType, client.documentNumber].filter(Boolean).join(" ") || "—"}</dd>
              <dt className="col-sm-3">Fecha de nacimiento</dt><dd className="col-sm-9">{formatDate(client.birthDate)}</dd>
              <dt className="col-sm-3">Nacionalidad</dt><dd className="col-sm-9">{client.nationality || "—"}</dd>
              <dt className="col-sm-3">Ciudad</dt><dd className="col-sm-9">{client.city || "—"}</dd>
              <dt className="col-sm-3">Dirección</dt><dd className="col-sm-9">{client.address || "—"}</dd>
              <dt className="col-sm-3">Contacto de emergencia</dt>
              <dd className="col-sm-9">{[client.emergencyName, client.emergencyPhone].filter(Boolean).join(" · ") || "—"}</dd>
              <dt className="col-sm-3">Notas</dt><dd className="col-sm-9">{client.notes || "—"}</dd>
            </dl>
          </section>

          <section className="card-panel admin-data-panel">
            <h2 className="admin-panel-title mb-3">Historial de reservas</h2>
            {client.reservas.length ? (
              <div className="admin-table-wrap">
                <table className="table admin-table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Reserva</th><th>Habitación</th><th>Check-in</th><th>Check-out</th><th>Estado</th><th>Pago</th><th>Total</th><th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {client.reservas.map((reservation) => (
                      <tr key={reservation.id}>
                        <td className="fw-semibold">{reservation.reservationCode}</td>
                        <td>{reservation.habitacion
                          ? `${reservation.habitacion.type} (${reservation.habitacion.number})`
                          : "—"}</td>
                        <td>{formatDate(reservation.checkIn)}</td>
                        <td>{formatDate(reservation.checkOut)}</td>
                        <td>{reservation.status}</td>
                        <td>
                          <span className={`badge rounded-pill ${reservation.paymentStatus === "pagado" ? "text-bg-success" : "text-bg-warning"}`}>
                            {reservation.paymentStatus === "pagado" ? "Pagado" : "Pendiente"}
                          </span>
                        </td>
                        <td>{formatCOP(Number(reservation.total || 0))}</td>
                        <td>
                          {reservation.paymentStatus !== "pagado" && !["cancelada", "cancelado"].includes(reservation.status) && (
                            <div className="d-flex flex-wrap align-items-center gap-2">
                              <select
                                aria-label={`Método de pago de la reserva ${reservation.reservationCode}`}
                                className="form-select form-select-sm"
                                value={paymentMethods[reservation.id] || "efectivo"}
                                onChange={(event) => setPaymentMethods((current) => ({
                                  ...current,
                                  [reservation.id]: event.target.value,
                                }))}
                                disabled={updatingReservationId !== null}
                              >
                                <option value="efectivo">Efectivo</option>
                                <option value="tarjeta">Tarjeta</option>
                                <option value="transferencia">Transferencia</option>
                              </select>
                              <button
                                type="button"
                                className="admin-action-button admin-action-button--primary"
                                onClick={() => handleRegisterPayment(reservation)}
                                disabled={updatingReservationId !== null}
                              >
                                {updatingReservationId === reservation.id ? "Guardando..." : "Registrar pago"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="admin-empty-state">Este cliente todavía no tiene reservas.</p>}
          </section>
        </>
      )}
    </>
  );
}
