// Formulario administrativo para publicar un plan del hotel.
import { Link, useNavigate } from "react-router-dom";
import "./HotelDashboard.css";
import PageHeader from "../../components/page_header/PageHeader.jsx";
import AdminForm from "../../components/admin_form/AdminForm.jsx";
import { postJson } from "../../components/admin_form/formUtils.js";

const SECTIONS = [{
  id: "plan",
  title: "Información del plan",
  fields: [
    { id: "name", label: "Nombre del plan", required: true },
    { id: "summary", label: "Resumen", colClass: "col-12" },
    { id: "price", label: "Precio (opcional)", type: "number", min: 0, step: 0.01 },
    { id: "currency", label: "Moneda", defaultValue: "VES" },
    { id: "imageUrl", label: "URL de imagen", type: "url" },
    { id: "validFrom", label: "Válido desde", type: "date" },
    { id: "validUntil", label: "Válido hasta", type: "date" },
    { id: "description", label: "Descripción", type: "textarea", rows: 4, colClass: "col-12" },
    { id: "services", label: "Servicios incluidos (separados por coma)", type: "textarea", rows: 2, colClass: "col-12" },
    { id: "terms", label: "Condiciones", type: "textarea", rows: 3, colClass: "col-12" },
  ],
}];

const LABELS = {
  submit: "Publicar plan",
  cancel: "Cancelar",
  sending: "Guardando...",
  successMessage: "Plan publicado correctamente.",
  errorMessage: "No pudimos guardar el plan.",
};

export default function NuevoPlan() {
  const navigate = useNavigate();
  return (
    <>
      <PageHeader title="Nuevo plan" subtitle="Publica una actividad o experiencia disponible en el hotel.">
        <Link to="/admin/planes" className="admin-action-button admin-action-button--outline">← Volver a planes</Link>
      </PageHeader>
      <AdminForm
        sections={SECTIONS}
        labels={LABELS}
        onSubmit={(values) => postJson("/api/plans", values)}
        onCancel={() => navigate("/admin/planes")}
      />
    </>
  );
}
