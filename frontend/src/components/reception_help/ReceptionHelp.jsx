import { Phone, Utensils } from "lucide-react";
import "./ReceptionHelp.css";

export default function ReceptionHelp() {
  return (
    <section className="reception-help bg-white rounded-4 p-4">
      <h6 className="fw-semibold d-flex align-items-center gap-2">
        <Utensils size={16} />
        ¿Dudas con algún consumo?
      </h6>
      <p className="text-secondary small">
        Si crees que hay un error en tu pedido, por favor comunícate con recepción.
      </p>
      <button
        type="button"
        className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
      >
        <Phone size={16} />
        Contactar recepción
      </button>
    </section>
  );
}