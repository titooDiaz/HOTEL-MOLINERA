// Formulario administrativo para publicar un plan del hotel.
import { Link, useNavigate } from "react-router-dom";
import "./HotelDashboard.css";
import PageHeader from "../../components/page_header/PageHeader.jsx";
import AdminForm from "../../components/admin_form/AdminForm.jsx";
import { apiRequest } from "../../api.js";

const SECTIONS = [{
  id: "plan",
  title: "Información del plan",
  fields: [
    { id: "name", label: "Nombre del plan", required: true },
    { id: "summary", label: "Resumen", colClass: "col-12" },
    { id: "price", label: "Precio (opcional)", type: "number", min: 0, step: 0.01 },
    { id: "currency", label: "Moneda", defaultValue: "VES" },
    {
      id: "imageFile",
      label: "Imagen del plan",
      type: "file",
      accept: "image/jpeg,image/png,image/webp,image/gif",
      hint: "Formatos JPG, PNG, WEBP o GIF; máximo 5 MB.",
    },
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

function crearPlan(values) {
  const body = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    if (key === "imageFile") {
      if (value) body.append("image", value);
    } else {
      body.append(key, value == null ? "" : String(value));
    }
  });

  return apiRequest("/api/plans", { method: "POST", body });
}

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
        onSubmit={crearPlan}
        onCancel={() => navigate("/admin/planes")}
      />
    </>
  );
}
