// Ofrece al huésped instrucciones y un botón para contactar con recepción.
import { Phone, Utensils } from "lucide-react";
import "./ReceptionHelp.css";

export default function ReceptionHelp({ labels }) {
  return (
    <section className="reception-help bg-white rounded-4 p-4">
      <h6 className="fw-semibold d-flex align-items-center gap-2">
        <Utensils size={16} />
        {labels.title}
      </h6>
      <p className="text-secondary small">
        {labels.description}
      </p>
      <a
        href={`https://wa.me/584147015219?text=${encodeURIComponent("Hola, tengo una duda sobre un consumo de mi habitación.")}`}
        className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Phone size={16} />
        {labels.buttonLabel}
      </a>
    </section>
  );
}