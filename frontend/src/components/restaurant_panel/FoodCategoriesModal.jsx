import { useState } from "react";
import { apiRequest } from "../../api.js";

const EMPTY_CATEGORY = { name: "", description: "", icon: "", sortOrder: 0, isVisible: true };

export default function FoodCategoriesModal({ categories, onClose, onChanged }) {
  const [editingCategory, setEditingCategory] = useState(null);
  const [values, setValues] = useState(EMPTY_CATEGORY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const startEdit = (category) => {
    setEditingCategory(category);
    setValues({
      name: category.name || "",
      description: category.description || "",
      icon: category.icon || "",
      sortOrder: category.sortOrder ?? 0,
      isVisible: Boolean(category.isVisible),
    });
    setError("");
  };

  const resetForm = () => {
    setEditingCategory(null);
    setValues(EMPTY_CATEGORY);
    setError("");
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const category = await apiRequest(
        editingCategory ? `/api/food-categories/${editingCategory.id}` : "/api/food-categories",
        {
          method: editingCategory ? "PUT" : "POST",
          body: JSON.stringify({ ...values, sortOrder: Number(values.sortOrder) }),
        },
      );
      onChanged(editingCategory ? "updated" : "created", category);
      resetForm();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (category) => {
    if (!window.confirm(`¿Eliminar la categoría "${category.name}"? Sus productos quedarán sin categoría.`)) return;
    setSaving(true);
    setError("");
    try {
      await apiRequest(`/api/food-categories/${category.id}`, { method: "DELETE" });
      onChanged("deleted", category);
      if (editingCategory?.id === category.id) resetForm();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (event) => {
    const { name, value, checked, type } = event.target;
    setValues((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  return (
    <div className="restaurant-order-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) onClose();
    }}>
      <section className="restaurant-order-modal restaurant-menu-modal" role="dialog" aria-modal="true" aria-labelledby="food-categories-title">
        <header className="restaurant-order-modal-header">
          <div>
            <p className="restaurant-order-modal-eyebrow">Restaurante</p>
            <h2 id="food-categories-title">Gestionar categorías</h2>
          </div>
          <button type="button" className="restaurant-order-modal-close" onClick={onClose} disabled={saving} aria-label="Cerrar">×</button>
        </header>

        {error && <p className="alert alert-danger" role="alert">{error}</p>}
        <div className="restaurant-categories-admin-list">
          {categories.length ? categories.map((category) => (
            <div className="restaurant-category-admin-row" key={category.id}>
              <span>
                <strong>{category.name}</strong>
                <small>{category.isVisible ? "Visible" : "Oculta"} · orden {category.sortOrder}</small>
              </span>
              <div>
                <button type="button" className="admin-action-button admin-action-button--outline" onClick={() => startEdit(category)} disabled={saving}>Editar</button>
                <button type="button" className="admin-action-button admin-action-button--danger" onClick={() => deleteCategory(category)} disabled={saving}>Eliminar</button>
              </div>
            </div>
          )) : <p className="restaurant-menu-hint">Todavía no hay categorías.</p>}
        </div>

        <form className="restaurant-menu-form" onSubmit={save}>
          <h3 className="restaurant-menu-full-width">{editingCategory ? `Editar ${editingCategory.name}` : "Nueva categoría"}</h3>
          <label>Nombre
            <input className="admin-form-control" name="name" value={values.name} onChange={updateField} required />
          </label>
          <label>Icono
            <input className="admin-form-control" name="icon" value={values.icon} onChange={updateField} placeholder="Ej. coffee, utensils" />
          </label>
          <label>Orden
            <input className="admin-form-control" type="number" step="1" name="sortOrder" value={values.sortOrder} onChange={updateField} />
          </label>
          <label className="restaurant-menu-checkbox">
            <input type="checkbox" name="isVisible" checked={values.isVisible} onChange={updateField} />
            Mostrar categoría en el sitio público
          </label>
          <label className="restaurant-menu-full-width">Descripción
            <textarea className="admin-form-control" rows="2" name="description" value={values.description} onChange={updateField} />
          </label>
          <footer className="restaurant-payment-actions restaurant-menu-full-width">
            {editingCategory && <button type="button" className="admin-action-button admin-action-button--outline" onClick={resetForm} disabled={saving}>Dejar de editar</button>}
            <button type="button" className="admin-action-button admin-action-button--outline" onClick={onClose} disabled={saving}>Cerrar</button>
            <button type="submit" className="admin-action-button admin-action-button--primary" disabled={saving}>{saving ? "Guardando..." : editingCategory ? "Guardar categoría" : "Crear categoría"}</button>
          </footer>
        </form>
      </section>
    </div>
  );
}
