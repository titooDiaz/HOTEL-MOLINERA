import { useEffect, useState } from "react";
import { apiRequest, downloadProtectedFile } from "../../api.js";

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

export default function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    apiRequest("/api/me/payments")
      .then(setPayments)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const downloadStatement = async (reservationId) => {
    setDownloadingId(reservationId);
    setError("");
    try {
      await downloadProtectedFile(
        `/api/me/reservations/${reservationId}/receipt.pdf`,
        `estado-cuenta-${reservationId}.pdf`,
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <section className="card border-0 shadow-sm p-4 mt-4">
      <h2 className="h5 mb-3">Historial de pagos</h2>
      {loading && <p role="status" className="text-secondary mb-0">Cargando pagos...</p>}
      {error && <p className="alert alert-danger" role="alert">{error}</p>}
      {!loading && payments.length === 0 && !error && (
        <p className="text-secondary mb-0">Todavía no tienes pagos registrados.</p>
      )}
      {!loading && payments.length > 0 && (
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Concepto</th>
                <th>Método</th>
                <th>Referencia</th>
                <th>Estado</th>
                <th className="text-end">Monto</th>
                <th>Comprobante</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{formatDate(payment.paidAt || payment.createdAt)}</td>
                  <td>{payment.reserva?.reservationCode || payment.pedido?.orderCode || "Consumo"}</td>
                  <td>{METHOD_LABELS[payment.method] || payment.method}</td>
                  <td>{payment.transactionReference || "—"}</td>
                  <td>{payment.status === "pagado" ? "Pagado" : payment.status}</td>
                  <td className="text-end text-nowrap">{formatAmount(payment.amount)}</td>
                  <td>
                    {payment.reserva?.id && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary text-nowrap"
                        disabled={downloadingId !== null}
                        onClick={() => downloadStatement(payment.reserva.id)}
                      >
                        {downloadingId === payment.reserva.id ? "Preparando..." : "Estado de cuenta PDF"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
