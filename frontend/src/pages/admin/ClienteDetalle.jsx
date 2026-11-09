// Perfil administrativo de un cliente con su historial de reservas.
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest, downloadProtectedFile } from "../../api.js";
import PageHeader from "../../components/page_header/PageHeader.jsx";
import { formatCOP } from "../../components/admin_form/formUtils.js";
import "./HotelDashboard.css";
import { formatConfiguredDate } from "../../utils/userSettings.js";

const formatDate = (date) => formatConfiguredDate(date);

const formatPaymentAmount = (value) => `Bs. ${new Intl.NumberFormat("es-VE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(Number(value) || 0)}`;

export default function ClienteDetalle() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updatingReservationId, setUpdatingReservationId] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState({});

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
    const details = paymentDetails[reservation.id] || {};
    const amount = Number(details.amount ?? reservation.balance ?? reservation.total);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Indica un monto de abono válido.");
      return;
    }
    if (["transferencia", "pago_movil"].includes(details.method) && !details.transactionReference?.trim()) {
      setError("Indica la referencia de la transferencia o Pago Móvil.");
      return;
    }
    if (!window.confirm(`¿Registrar un abono de ${formatPaymentAmount(amount)} para ${room} de la reserva ${reservation.reservationCode}?`)) return;

    setUpdatingReservationId(reservation.id);
    setError("");
    setSuccess("");
    try {
      const updatedReservation = await apiRequest(`/api/reservations/${reservation.id}/payment`, {
        method: "PATCH",
        body: JSON.stringify({
          amount,
          paymentMethod: details.method || "efectivo",
          transactionReference: details.transactionReference || "",
          notes: details.notes || "",
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

  const downloadStatement = async (reservation) => {
    setUpdatingReservationId(reservation.id);
    setError("");
    try {
      await downloadProtectedFile(
        `/api/reservations/${reservation.id}/receipt.pdf`,
        `estado-cuenta-${reservation.reservationCode}.pdf`,
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdatingReservationId(null);
    }
  };

  const updatePaymentDetail = (reservationId, field, value) => {
    setPaymentDetails((current) => ({
      ...current,
      [reservationId]: {
        ...current[reservationId],
        [field]: value,
      },
    }));
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
                      <th>Reserva</th><th>Habitación</th><th>Check-in</th><th>Check-out</th><th>Estado</th><th>Pago</th><th>Total / saldo</th><th>Acciones</th>
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
                          <span className={`badge rounded-pill ${reservation.paymentStatus === "pagado" ? "text-bg-success" : reservation.paymentStatus === "parcial" ? "text-bg-info" : "text-bg-warning"}`}>
                            {reservation.paymentStatus === "pagado" ? "Pagado" : reservation.paymentStatus === "parcial" ? "Abono parcial" : "Pendiente"}
                          </span>
                        </td>
                        <td>
                          <div>{formatCOP(Number(reservation.total || 0))}</div>
                          {Number(reservation.balance || 0) > 0 && (
                            <small className="text-secondary">Pendiente: {formatCOP(Number(reservation.balance))}</small>
                          )}
                        </td>
                        <td>
                          <div className="d-flex flex-column gap-2">
                          {reservation.paymentStatus !== "pagado" && !["cancelada", "cancelado"].includes(reservation.status) && (
                            <div className="d-flex flex-wrap align-items-center gap-2">
                              <input
                                aria-label={`Monto del abono de la reserva ${reservation.reservationCode}`}
                                className="form-control form-control-sm"
                                type="number"
                                min="0.01"
                                max={reservation.balance ?? reservation.total}
                                step="0.01"
                                placeholder={`Saldo ${reservation.balance ?? reservation.total}`}
                                value={paymentDetails[reservation.id]?.amount ?? ""}
                                onChange={(event) => updatePaymentDetail(reservation.id, "amount", event.target.value)}
                                disabled={updatingReservationId !== null}
                              />
                              <select
                                aria-label={`Método de pago de la reserva ${reservation.reservationCode}`}
                                className="form-select form-select-sm"
                                value={paymentDetails[reservation.id]?.method || "efectivo"}
                                onChange={(event) => updatePaymentDetail(reservation.id, "method", event.target.value)}
                                disabled={updatingReservationId !== null}
                              >
                                <option value="efectivo">Efectivo</option>
                                <option value="tarjeta">Tarjeta</option>
                                <option value="transferencia">Transferencia</option>
                                <option value="pago_movil">Pago Móvil</option>
                              </select>
                              {["transferencia", "pago_movil"].includes(paymentDetails[reservation.id]?.method) && (
                                <input
                                  aria-label={`Referencia del pago de la reserva ${reservation.reservationCode}`}
                                  className="form-control form-control-sm"
                                  maxLength={150}
                                  placeholder="Referencia de transacción"
                                  value={paymentDetails[reservation.id]?.transactionReference || ""}
                                  onChange={(event) => updatePaymentDetail(reservation.id, "transactionReference", event.target.value)}
                                  disabled={updatingReservationId !== null}
                                />
                              )}
                              <button
                                type="button"
                                className="admin-action-button admin-action-button--primary"
                                onClick={() => handleRegisterPayment(reservation)}
                                disabled={updatingReservationId !== null}
                              >
                                {updatingReservationId === reservation.id ? "Guardando..." : "Registrar abono"}
                              </button>
                            </div>
                          )}
                          <button
                            type="button"
                            className="admin-action-button admin-action-button--outline"
                            onClick={() => downloadStatement(reservation)}
                            disabled={updatingReservationId !== null}
                          >
                            Descargar estado de cuenta PDF
                          </button>
                          </div>
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
