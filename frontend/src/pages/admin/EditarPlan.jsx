import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./HotelDashboard.css";
import PageHeader from "../../components/page_header/PageHeader.jsx";
import AdminForm from "../../components/admin_form/AdminForm.jsx";
import { apiRequest } from "../../api.js";

const LABELS = {
  submit: "Guardar cambios",
  cancel: "Volver a planes",
  sending: "Guardando...",
  successMessage: "Plan actualizado correctamente.",
  errorMessage: "No pudimos actualizar el plan.",
};

const SECTIONS = [{
  id: "plan",
  title: "Información del plan",
  fields: [
    { id: "name", label: "Nombre del plan", required: true },
    { id: "summary", label: "Resumen", colClass: "col-12" },
    { id: "price", label: "Precio (opcional)", type: "number", min: 0, step: 0.01 },
    { id: "currency", label: "Moneda", required: true },
    {
      id: "imageFile",
      label: "Cambiar imagen",
      type: "file",
      accept: "image/jpeg,image/png,image/webp,image/gif",
      hint: "Déjalo vacío para conservar la imagen actual.",
    },
    { id: "validFrom", label: "Válido desde", type: "date" },
    { id: "validUntil", label: "Válido hasta", type: "date" },
    { id: "sortOrder", label: "Orden de presentación", type: "number", step: 1 },
    {
      id: "isVisible",
      label: "Visibilidad",
      options: [{ value: "true", label: "Visible" }, { value: "false", label: "Oculto" }],
    },
    {
      id: "isBookable",
      label: "Reservas",
      options: [{ value: "true", label: "Se puede reservar" }, { value: "false", label: "No disponible para reservar" }],
    },
    { id: "description", label: "Descripción", type: "textarea", rows: 4, colClass: "col-12" },
    { id: "services", label: "Servicios incluidos (separados por coma)", type: "textarea", rows: 2, colClass: "col-12" },
    { id: "terms", label: "Condiciones", type: "textarea", rows: 3, colClass: "col-12" },
  ],
}];

export default function EditarPlan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/api/plans")
      .then((plans) => {
        const foundPlan = plans.find((item) => String(item.id) === id);
        if (!foundPlan) throw new Error("No se encontró el plan.");
        setPlan(foundPlan);
      })
      .catch((requestError) => setError(requestError.message));
  }, [id]);

  const initialValues = useMemo(() => plan ? ({
    name: plan.name,
    summary: plan.summary || "",
    price: plan.price ?? "",
    currency: plan.currency || "VES",
    validFrom: plan.validFrom || "",
    validUntil: plan.validUntil || "",
    sortOrder: plan.sortOrder ?? 0,
    isVisible: String(Boolean(plan.isVisible)),
    isBookable: String(Boolean(plan.isBookable)),
    description: plan.description || "",
    services: Array.isArray(plan.services) ? plan.services.join(", ") : plan.services || "",
    terms: plan.terms || "",
  }) : {}, [plan]);

  const savePlan = async (values) => {
    const body = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (key === "imageFile") {
        if (value) body.append("image", value);
      } else {
        body.append(key, value == null ? "" : String(value));
      }
    });
    await apiRequest(`/api/plans/${id}`, { method: "PUT", body });
    navigate("/admin/planes");
  };

  return (
    <>
      <PageHeader title={plan ? `Editar ${plan.name}` : "Editar plan"} subtitle="Actualiza la información y disponibilidad de la experiencia.">
        <Link to="/admin/planes" className="admin-action-button admin-action-button--outline">← Volver a planes</Link>
      </PageHeader>
      {error && <p className="alert alert-danger" role="alert">{error}</p>}
      {!plan && !error && <p role="status">Cargando plan...</p>}
      {plan && (
        <AdminForm
          key={plan.id}
          sections={SECTIONS}
          labels={LABELS}
          initialValues={initialValues}
          onSubmit={savePlan}
          onCancel={() => navigate("/admin/planes")}
        />
      )}
    </>
  );
}
