import { useState } from "react";
import { apiRequest } from "../../api.js";

export default function FoodManagementModal({ food, categories, mode, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [values, setValues] = useState(() => mode === "edit" ? {
    name: food.name || "",
    categoryId: food.categoryId == null ? "" : String(food.categoryId),
    price: food.price ?? "",
    description: food.description || "",
    ingredients: food.ingredients || "",
    allergens: food.allergens || "",
    preparationMinutes: food.preparationMinutes ?? "",
  } : {
    stockQuantity: food.stockQuantity ?? "",
    isSoldOut: Boolean(food.isSoldOut),
    isAvailable: Boolean(food.isAvailable),
  });

  const updateField = (event) => {
    const { name, value, checked, type } = event.target;
    setValues((current) => {
      if (type !== "checkbox") return { ...current, [name]: value };
      if (name === "isSoldOut") return { ...current, isSoldOut: checked, ...(checked ? { isAvailable: false } : {}) };
      if (name === "isAvailable") return { ...current, isAvailable: checked, ...(checked ? { isSoldOut: false } : {}) };
      return { ...current, [name]: checked };
    });
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = mode === "edit"
        ? {
          ...values,
          categoryId: values.categoryId || null,
          price: Number(values.price),
          preparationMinutes: values.preparationMinutes === "" ? null : Number(values.preparationMinutes),
        }
        : {
          ...values,
          stockQuantity: values.stockQuantity === "" ? null : Number(values.stockQuantity),
        };
      let body = JSON.stringify(payload);
      if (mode === "edit" && imageFile) {
        body = new FormData();
        Object.entries(payload).forEach(([key, value]) => body.append(key, value == null ? "" : String(value)));
        body.append("image", imageFile);
      }
      const updatedFood = await apiRequest(
        mode === "edit" ? `/api/foods/${food.id}` : `/api/foods/${food.id}/availability`,
        { method: mode === "edit" ? "PUT" : "PATCH", body },
      );
      onSaved(updatedFood);
      onClose();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="restaurant-order-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) onClose();
    }}>
      <section className="restaurant-order-modal restaurant-menu-modal" role="dialog" aria-modal="true" aria-labelledby="food-management-title">
        <header className="restaurant-order-modal-header">
          <div>
            <p className="restaurant-order-modal-eyebrow">Gestión de menú</p>
            <h2 id="food-management-title">{mode === "edit" ? `Editar ${food.name}` : `Disponibilidad · ${food.name}`}</h2>
          </div>
          <button type="button" className="restaurant-order-modal-close" onClick={onClose} disabled={saving} aria-label="Cerrar">×</button>
        </header>
        {error && <p className="alert alert-danger" role="alert">{error}</p>}
        <form className="restaurant-menu-form" onSubmit={save}>
          {mode === "edit" ? (
            <>
              <label>Nombre
                <input className="admin-form-control" name="name" value={values.name} onChange={updateField} required />
              </label>
              <label>Categoría
                <select className="admin-form-control" name="categoryId" value={values.categoryId} onChange={updateField}>
                  <option value="">Sin categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}{category.isVisible ? "" : " (oculta)"}</option>
                  ))}
                </select>
              </label>
              <label>Precio (VES)
                <input className="admin-form-control" type="number" min="0" step="0.01" name="price" value={values.price} onChange={updateField} required />
              </label>
              <label className="restaurant-menu-full-width">Nueva imagen (opcional)
                <input
                  className="admin-form-control"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                />
                <span className="restaurant-menu-hint">
                  {food.imageUrl ? "La imagen actual se conserva si no seleccionas otra. " : ""}
                  Formatos JPG, PNG, WEBP o GIF; máximo 5 MB.
                </span>
              </label>
              <label>Preparación (minutos)
                <input className="admin-form-control" type="number" min="0" step="1" name="preparationMinutes" value={values.preparationMinutes} onChange={updateField} />
              </label>
              <label className="restaurant-menu-full-width">Descripción
                <textarea className="admin-form-control" rows="2" name="description" value={values.description} onChange={updateField} />
              </label>
              <label className="restaurant-menu-full-width">Ingredientes
                <textarea className="admin-form-control" rows="3" name="ingredients" value={values.ingredients} onChange={updateField} />
              </label>
              <label className="restaurant-menu-full-width">Alérgenos
                <textarea className="admin-form-control" rows="2" name="allergens" value={values.allergens} onChange={updateField} />
              </label>
            </>
          ) : (
            <>
              <label className="restaurant-menu-full-width">Unidades en stock
                <input className="admin-form-control" type="number" min="0" step="1" name="stockQuantity" value={values.stockQuantity} onChange={updateField} placeholder="Vacío = stock no controlado" />
              </label>
              <label className="restaurant-menu-checkbox">
                <input type="checkbox" name="isAvailable" checked={values.isAvailable} onChange={updateField} />
                Producto disponible para pedir
              </label>
              <label className="restaurant-menu-checkbox">
                <input type="checkbox" name="isSoldOut" checked={values.isSoldOut} onChange={updateField} />
                Marcar como agotado
              </label>
              <p className="restaurant-menu-full-width restaurant-menu-hint">Un stock igual a cero marcará el producto como agotado y no disponible.</p>
            </>
          )}
          <footer className="restaurant-payment-actions restaurant-menu-full-width">
            <button type="button" className="admin-action-button admin-action-button--outline" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className="admin-action-button admin-action-button--primary" disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</button>
          </footer>
        </form>
      </section>
    </div>
  );
}
