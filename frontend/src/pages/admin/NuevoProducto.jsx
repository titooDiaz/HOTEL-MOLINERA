// Formulario administrativo para crear un producto del menú y su categoría.
import { Link, useNavigate } from "react-router-dom";
import "./HotelDashboard.css";
import PageHeader from "../../components/page_header/PageHeader.jsx";
import AdminForm from "../../components/admin_form/AdminForm.jsx";
import { postJson } from "../../components/admin_form/formUtils.js";

const SECTIONS = [
  {
    id: "product",
    title: "Información del producto",
    fields: [
      { id: "name", label: "Nombre del producto", required: true },
      { id: "categoryName", label: "Categoría", placeholder: "Ej. Desayunos, Bebidas", required: true },
      { id: "price", label: "Precio (VES)", type: "number", min: 0, step: 0.01, required: true },
      { id: "currency", label: "Moneda", defaultValue: "VES" },
      { id: "imageUrl", label: "URL de la imagen", type: "url" },
      { id: "preparationMinutes", label: "Preparación (minutos)", type: "number", min: 0, step: 1 },
      { id: "description", label: "Descripción", type: "textarea", rows: 3, colClass: "col-12" },
      { id: "ingredients", label: "Ingredientes", type: "textarea", rows: 2 },
      { id: "allergens", label: "Alérgenos", type: "textarea", rows: 2 },
    ],
  },
];

const LABELS = {
  submit: "Crear producto",
  cancel: "Cancelar",
  sending: "Guardando...",
  successMessage: "Producto agregado al menú.",
  errorMessage: "No pudimos guardar el producto.",
};

export default function NuevoProducto() {
  const navigate = useNavigate();
  return (
    <>
      <PageHeader title="Nuevo producto" subtitle="Agrega un alimento o bebida al menú del restaurante.">
        <Link to="/admin/restaurante" className="admin-action-button admin-action-button--outline">← Volver al restaurante</Link>
      </PageHeader>
      <AdminForm
        sections={SECTIONS}
        labels={LABELS}
        onSubmit={(values) => postJson("/api/foods", values)}
        onCancel={() => navigate("/admin/restaurante")}
      />
    </>
  );
}
