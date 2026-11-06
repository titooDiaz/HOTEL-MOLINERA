import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/page_header/PageHeader.jsx";
import { apiRequest, downloadProtectedFile } from "../../api.js";
import "./HotelDashboard.css";

const METHOD_LABELS = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  pago_movil: "Pago Móvil",
  cargo: "Cargo a habitación",
};

const formatAmount = (value) => `Bs. ${new Intl.NumberFormat("es-VE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(Number(value) || 0)}`;

const formatDate = (value) => value
  ? new Intl.DateTimeFormat("es-VE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
  : "—";

export default function Pagos() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    apiRequest("/api/payments")
      .then(setPayments)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const totals = useMemo(() => ({
    paid: payments.filter((payment) => payment.status === "pagado")
      .reduce((sum, payment) => sum + Number(payment.amount), 0),
    count: payments.filter((payment) => payment.status === "pagado").length,
  }), [payments]);

  const downloadStatement = async (reservationId) => {
    setDownloadingId(reservationId);
    setError("");
    try {
      await downloadProtectedFile(
        `/api/reservations/${reservationId}/receipt.pdf`,
        `estado-cuenta-${reservationId}.pdf`,
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <>
      <PageHeader title="Pagos y caja" subtitle="Consulta transacciones, abonos y estados de cuenta de las estadías." />
      {error && <p className="alert alert-danger" role="alert">{error}</p>}
      <section className="card-panel admin-data-panel mb-4">
        <div className="row g-3">
          <div className="col-sm-6">
            <span className="text-secondary small">Pagos recibidos</span>
            <div className="h4 mb-0">{totals.count}</div>
          </div>
          <div className="col-sm-6">
            <span className="text-secondary small">Total registrado como pagado</span>
            <div className="h4 mb-0">{formatAmount(totals.paid)}</div>
          </div>
        </div>
      </section>
      <section className="card-panel admin-data-panel">
        <h2 className="admin-panel-title mb-3">Historial de transacciones</h2>
        {loading && <p role="status">Cargando pagos...</p>}
        {!loading && payments.length === 0 && <p className="admin-empty-state">Todavía no hay transacciones registradas.</p>}
        {!loading && payments.length > 0 && (
          <div className="admin-table-wrap">
            <table className="table admin-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Huésped</th>
                  <th>Concepto</th>
                  <th>Método</th>
                  <th>Referencia</th>
                  <th>Estado</th>
                  <th className="text-end">Monto</th>
                  <th>Estado de cuenta</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => {
                  const guest = payment.usuario?.huesped;
                  const guestName = guest
                    ? `${guest.firstName} ${guest.lastName}`.trim()
                    : payment.usuario?.email || "—";
                  const concept = payment.reserva?.reservationCode || payment.pedido?.orderCode || "Consumo";
                  return (
                    <tr key={payment.id}>
                      <td>{formatDate(payment.paidAt || payment.createdAt)}</td>
                      <td>{guestName}</td>
                      <td>{concept}</td>
                      <td>{METHOD_LABELS[payment.method] || payment.method}</td>
                      <td>{payment.transactionReference || "—"}</td>
                      <td>
                        <span className={`badge rounded-pill ${payment.status === "pagado" ? "text-bg-success" : "text-bg-warning"}`}>
                          {payment.status === "pagado" ? "Pagado" : payment.status}
                        </span>
                      </td>
                      <td className="text-end text-nowrap">{formatAmount(payment.amount)}</td>
                      <td>
                        {payment.reserva?.id && (
                          <button
                            type="button"
                            className="admin-action-button admin-action-button--outline text-nowrap"
                            disabled={downloadingId !== null}
                            onClick={() => downloadStatement(payment.reserva.id)}
                          >
                            {downloadingId === payment.reserva.id ? "Preparando..." : "Descargar PDF"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
