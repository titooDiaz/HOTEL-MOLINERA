import { useState } from "react";
import Tooltip from "../tooltip/Tooltip.jsx";
import "./RoomForm.css";

/**
 * Formulario para crear una habitación.
 *
 * Props:
 *  - sections: [{ id, title, description?, fields?: [...], amenities?: [...] }]
 *      field:   { id, label, type?, options?, placeholder?, hint?, prefix?, required?,
 *                 min?, max?, step?, rows?, colClass?, defaultValue? }
 *      amenity: { id, label, description?, defaultChecked? }
 *  - labels: { submit, cancel, sending, successMessage, errorMessage, included, notIncluded }
 *  - onSubmit: async (payload) => void. Si lanza un error se muestra labels.errorMessage.
 *  - onCancel: () => void
 */

function buildInitialState(sections) {
  const values = {};
  const amenities = {};

  sections.forEach((section) => {
    section.fields?.forEach((field) => {
      values[field.id] = field.defaultValue ?? "";
    });
    section.amenities?.forEach((amenity) => {
      amenities[amenity.id] = Boolean(amenity.defaultChecked);
    });
  });

  return { values, amenities };
}

function buildPayload(sections, values, amenities) {
  const payload = {};

  sections.forEach((section) => {
    section.fields?.forEach((field) => {
      const raw = values[field.id];

      if (field.type === "number") {
        payload[field.id] = raw === "" ? null : Number(raw);
      } else {
        payload[field.id] = typeof raw === "string" ? raw.trim() : raw;
      }
    });
  });

  payload.amenities = { ...amenities };
  return payload;
}

function Field({ field, value, onChange }) {
  const inputId = `room-${field.id}`;
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
        className="form-control admin-form-control room-form-textarea"
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
        {field.required && <span className="room-form-required" aria-hidden="true"> *</span>}
      </label>

      {field.prefix ? (
        <div className="room-form-prefix-wrap">
          <span className="room-form-prefix" aria-hidden="true">{field.prefix}</span>
          {control}
        </div>
      ) : (
        control
      )}

      {field.hint && <p className="room-form-hint">{field.hint}</p>}
    </div>
  );
}

export default function RoomForm({ sections, labels, onSubmit, onCancel }) {
  const [state, setState] = useState(() => buildInitialState(sections));
  const [status, setStatus] = useState("idle"); // idle | sending | success | error

  const isSending = status === "sending";

  const clearFeedback = () => {
    if (status === "success" || status === "error") setStatus("idle");
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setState((current) => ({
      ...current,
      values: { ...current.values, [name]: value },
    }));
    clearFeedback();
  };

  const handleAmenityChange = (event) => {
    const { name, checked } = event.target;
    setState((current) => ({
      ...current,
      amenities: { ...current.amenities, [name]: checked },
    }));
    clearFeedback();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("sending");

    try {
      await onSubmit(buildPayload(sections, state.values, state.amenities));
      setState(buildInitialState(sections));
      setStatus("success");
    } catch (error) {
      console.error("Error al guardar la habitación:", error);
      setStatus("error");
    }
  };

  return (
    <form className="room-form" onSubmit={handleSubmit}>
      {sections.map((section) => (
        <section className="card-panel admin-settings-panel room-form-section" key={section.id}>
          <h2 className="admin-panel-title">{section.title}</h2>
          {section.description && (
            <p className="admin-settings-description">{section.description}</p>
          )}

          {section.fields && (
            <div className="row g-3">
              {section.fields.map((field) => (
                <Field
                  key={field.id}
                  field={field}
                  value={state.values[field.id]}
                  onChange={handleFieldChange}
                />
              ))}
            </div>
          )}

          {section.amenities && (
            <div className="room-form-amenities">
              {section.amenities.map((amenity) => {
                const checked = state.amenities[amenity.id];
                const inputId = `room-amenity-${amenity.id}`;

                return (
                  <label
                    className={`room-form-amenity${checked ? " is-checked" : ""}`}
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
                    <span className="room-form-amenity-text">
                      <strong>{amenity.label}</strong>
                      {amenity.description && <small>{amenity.description}</small>}
                    </span>
                    <span className="room-form-amenity-state">
                      {checked ? labels.included : labels.notIncluded}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </section>
      ))}

      <div className="room-form-footer">
        <div className="room-form-feedback" role="status" aria-live="polite">
          {status === "success" && (
            <span className="admin-save-message">{labels.successMessage}</span>
          )}
          {status === "error" && (
            <span className="room-form-error">{labels.errorMessage}</span>
          )}
        </div>

        <div className="room-form-actions">
          <Tooltip label={labels.cancel}>
            <button
              className="admin-action-button admin-action-button--outline"
              type="button"
              onClick={onCancel}
              disabled={isSending}
            >
              {labels.cancel}
            </button>
          </Tooltip>
          <Tooltip label={isSending ? labels.sending : labels.submit}>
            <button
              className="admin-action-button admin-action-button--primary"
              type="submit"
              disabled={isSending}
            >
              {isSending ? labels.sending : labels.submit}
            </button>
          </Tooltip>
        </div>
      </div>
    </form>
  );
}