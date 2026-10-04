import { CheckCircle2, Clock, Wallet } from "lucide-react";
import InfoRow from "../info_row/InfoRow.jsx";
import "./AccountSummary.css";

export default function AccountSummary({
    totalConsumos,
    totalPagado,
    totalPendiente,
    formatCurrency,
    labels,
    }) {
    return (
        <section className="account-summary bg-white rounded-4 p-4 mb-4">
        <h6 className="fw-semibold mb-3">{labels.title}</h6>
        <div className="text-secondary small">{labels.totalLabel}</div>
        <div className="account-total">{formatCurrency(totalConsumos)}</div>

        <div className="account-row border-top">
            <InfoRow>
            <CheckCircle2 size={16} className="text-success" />
            <span className="text-secondary small">{labels.paidLabel}</span>
            </InfoRow>
            <strong>{formatCurrency(totalPagado)}</strong>
        </div>

        <div className="account-row border-top">
            <InfoRow>
            <Clock size={16} className="text-warning" />
            <span className="text-secondary small">{labels.pendingLabel}</span>
            </InfoRow>
            <strong>{formatCurrency(totalPendiente)}</strong>
        </div>

        <div className="account-total-payment mt-3">
            <span>
            <Wallet size={18} />
            {labels.totalToPayLabel}
            </span>
            <strong>{formatCurrency(totalPendiente)}</strong>
        </div>

        <button type="button" className="btn account-button w-100 mt-3">
            {labels.detailsButtonLabel}
        </button>
        </section>
    );
}