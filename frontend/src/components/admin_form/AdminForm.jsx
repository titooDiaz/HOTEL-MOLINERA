import { useState } from "react";
import { formatCOP } from "./formUtils.js";
import "./AdminForm.css";

/**
 * Formulario genérico para las vistas de administración.
 *
 * Props:
 *  - sections: [{ id, title, description?, fields? | amenities? | items? }]
 *      fields:    { id, label, type?, options?, placeholder?, hint?, prefix?, required?,
 *                   min?, max?, step?, rows?, colClass?, defaultValue? }
 *                 (min y max pueden ser funciones: (valores) => valor)
 *      amenities: { id, label, description?, defaultChecked? }   -> payload[section.id] = { id: boolean }
 *      items:     { id, label, description?, price?, max?, disabled? } -> payload[section.id] = [{ id, quantity }]
 *  - labels: { submit, cancel, sending, successMessage, errorMessage,
 *              included?, notIncluded?, decrease?, increase? }
 *  - onSubmit: async (payload) => void. Si lanza un error se muestra labels.errorMessage.
 *  - onCancel: () => void
 *  - validate?: (payload) => string | null. Si devuelve texto, se muestra y no se envía.
 *  - summary?: (payload) => ReactNode. Se muestra como tarjeta antes de los botones.
 */

function buildInitialState(sections) {
  const values = {};
  const checks = {};
  const quantities = {};

  sections.forEach((section) => {
    section.fields?.forEach((field) => {
      values[field.id] = field.defaultValue ?? "";
    });
    section.amenities?.forEach((amenity) => {
      checks[amenity.id] = Boolean(amenity.defaultChecked);
    });
    section.items?.forEach((item) => {
      quantities[item.id] = 0;
    });
  });

  return { values, checks, quantities };
}

function buildPayload(sections, state) {
  const payload = {};

  sections.forEach((section) => {
    section.fields?.forEach((field) => {
      const raw = state.values[field.id];

      if (field.type === "number") {
        payload[field.id] = raw === "" ? null : Number(raw);
      } else {
        payload[field.id] = typeof raw === "string" ? raw.trim() : raw;
      }
    });

    if (section.amenities) {
      payload[section.id] = Object.fromEntries(
        section.amenities.map((amenity) => [amenity.id, state.checks[amenity.id]]),
      );
    }

    if (section.items) {
      payload[section.id] = section.items
        .filter((item) => state.quantities[item.id] > 0)
        .map((item) => ({ id: item.id, quantity: state.quantities[item.id] }));
    }
  });

  return payload;
}

function Field({ field, value, onChange }) {
  const inputId = `aform-${field.id}`;
  const common = {
    id: inputId,
    name: field.id,
    value,
    onChange,
    required: field.required,
  };

  let control;

  if (field.options) {
    control = (
      <select className="form-select admin-form-control" {...common}>
        {field.placeholder && (
          <option value="" disabled>
            {field.placeholder}
          </option>
        )}
        {field.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  } else if (field.type === "textarea") {
    control = (
      <textarea
        className="form-control admin-form-control aform-textarea"
        rows={field.rows ?? 4}
        placeholder={field.placeholder}
        {...common}
      />
    );
  } else {
    control = (
      <input
        className="form-control admin-form-control"
        type={field.type ?? "text"}
        placeholder={field.placeholder}
        min={field.min}
        max={field.max}
        step={field.step}
        {...common}
      />
    );
  }

  return (
    <div className={field.colClass ?? "col-12 col-md-6"}>
      <label className="admin-form-label" htmlFor={inputId}>
        {field.label}
        {field.required && <span className="aform-required" aria-hidden="true"> *</span>}
      </label>

      {field.prefix ? (
        <div className="aform-prefix-wrap">
          <span className="aform-prefix" aria-hidden="true">{field.prefix}</span>
          {control}
        </div>
      ) : (
        control
      )}

      {field.hint && <p className="aform-hint">{field.hint}</p>}
    </div>
  );
}

function QuantityRow({ item, quantity, onChange, labels }) {
  const max = item.max ?? 99;

  return (
    <div className={`aform-item${quantity > 0 ? " is-selected" : ""}${item.disabled ? " is-disabled" : ""}`}>
      <div className="aform-item-text">
        <strong>{item.label}</strong>
        {item.description && <small>{item.description}</small>}
      </div>

      {item.price != null && <span className="aform-item-price">{formatCOP(item.price)}</span>}

      <div className="aform-stepper">
        <button
          type="button"
          className="aform-stepper-btn"
          aria-label={`${labels.decrease ?? "Quitar uno de"} ${item.label}`}
          disabled={item.disabled || quantity <= 0}
          onClick={() => onChange(Math.max(0, quantity - 1))}
        >
          −
        </button>
        <span className="aform-stepper-value" aria-live="polite">{quantity}</span>
        <button
          type="button"
          className="aform-stepper-btn"
          aria-label={`${labels.increase ?? "Agregar uno de"} ${item.label}`}
          disabled={item.disabled || quantity >= max}
          onClick={() => onChange(Math.min(max, quantity + 1))}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function AdminForm({ sections, labels, onSubmit, onCancel, validate, summary }) {
  const [state, setState] = useState(() => buildInitialState(sections));
  const [status, setStatus] = useState("idle"); // idle | sending | success | error | invalid
  const [problem, setProblem] = useState("");

  const isSending = status === "sending";
  const payload = buildPayload(sections, state);

  const clearFeedback = () => {
    if (status === "success" || status === "error" || status === "invalid") {
      setStatus("idle");
    }
  };

  const resolve = (valueOrFn) => (typeof valueOrFn === "function" ? valueOrFn(state.values) : valueOrFn);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setState((current) => ({ ...current, values: { ...current.values, [name]: value } }));
    clearFeedback();
  };

  const handleAmenityChange = (event) => {
    const { name, checked } = event.target;
    setState((current) => ({ ...current, checks: { ...current.checks, [name]: checked } }));
    clearFeedback();
  };

  const handleQuantityChange = (id, quantity) => {
    setState((current) => ({ ...current, quantities: { ...current.quantities, [id]: quantity } }));
    clearFeedback();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const message = validate?.(payload);
    if (message) {
      setProblem(message);
      setStatus("invalid");
      return;
    }

    setStatus("sending");

    try {
      await onSubmit(payload);
      setState(buildInitialState(sections));
      setStatus("success");
    } catch (error) {
      console.error("Error al enviar el formulario:", error);
      setStatus("error");
    }
  };

  const summaryContent = summary?.(payload);

  return (
    <form className="aform" onSubmit={handleSubmit}>
      {sections.map((section) => (
        <section className="card-panel admin-settings-panel aform-section" key={section.id}>
          <h2 className="admin-panel-title">{section.title}</h2>
          {section.description && (
            <p className="admin-settings-description">{section.description}</p>
          )}

          {section.fields && (
            <div className="row g-3">
              {section.fields.map((field) => (
                <Field
                  key={field.id}
                  field={{ ...field, min: resolve(field.min), max: resolve(field.max) }}
                  value={state.values[field.id]}
                  onChange={handleFieldChange}
                />
              ))}
            </div>
          )}

          {section.amenities && (
            <div className="aform-amenities">
              {section.amenities.map((amenity) => {
                const checked = state.checks[amenity.id];
                const inputId = `aform-amenity-${amenity.id}`;

                return (
                  <label
                    className={`aform-amenity${checked ? " is-checked" : ""}`}
                    htmlFor={inputId}
                    key={amenity.id}
                  >
                    <input
                      id={inputId}
                      name={amenity.id}
                      type="checkbox"
                      checked={checked}
                      onChange={handleAmenityChange}
                    />
                    <span className="aform-amenity-text">
                      <strong>{amenity.label}</strong>
                      {amenity.description && <small>{amenity.description}</small>}
                    </span>
                    <span className="aform-amenity-state">
                      {checked ? labels.included ?? "Sí" : labels.notIncluded ?? "No"}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          {section.items && (
            <div className="aform-items">
              {section.items.map((item) => (
                <QuantityRow
                  key={item.id}
                  item={item}
                  quantity={state.quantities[item.id]}
                  labels={labels}
                  onChange={(quantity) => handleQuantityChange(item.id, quantity)}
                />
              ))}
            </div>
          )}
        </section>
      ))}

      {summaryContent && (
        <aside className="card-panel aform-summary" aria-label={labels.summaryLabel ?? "Resumen"}>
          {summaryContent}
        </aside>
      )}

      <div className="aform-footer">
        <div className="aform-feedback" role="status" aria-live="polite">
          {status === "success" && <span className="admin-save-message">{labels.successMessage}</span>}
          {status === "error" && <span className="aform-error">{labels.errorMessage}</span>}
          {status === "invalid" && <span className="aform-error" role="alert">{problem}</span>}
        </div>

        <div className="aform-actions">
          <button
            className="admin-action-button admin-action-button--outline"
            type="button"
            onClick={onCancel}
            disabled={isSending}
          >
            {labels.cancel}
          </button>
          <button
            className="admin-action-button admin-action-button--primary"
            type="submit"
            disabled={isSending}
          >
            {isSending ? labels.sending : labels.submit}
          </button>
        </div>
      </div>
    </form>
  );
}