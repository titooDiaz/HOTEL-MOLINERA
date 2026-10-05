import { Pencil, User } from "lucide-react";
import SettingsCard from "./SettingsCard.jsx";
import "./PersonalDataCard.css";

function EditableField({ field, editing, onEditField, onChange }) {
  return (
    <div className="settings-field">
      <div className="settings-field-body">
        <label htmlFor={`field-${field.key}`}>{field.label}</label>
        {editing ? (
          <input
            id={`field-${field.key}`}
            type={field.type}
            value={field.value}
            onChange={(event) => onChange(field.key, event.target.value)}
          />
        ) : (
          <p>{field.value}</p>
        )}
      </div>

      <button
        type="button"
        className="settings-icon-btn"
        aria-label={`Editar ${field.label}`}
        onClick={() => onEditField(field.key)}
      >
        <Pencil size={18} />
      </button>
    </div>
  );
}

export default function PersonalDataCard({
  fields,
  editing,
  onEditField,
  onChange,
  onStartEditing,
  onSave,
  onCancel,
  labels,
}) {
  return (
    <SettingsCard icon={User} title={labels.title}>
      <div className="settings-field-group">
        {fields.map((field) => (
          <EditableField
            key={field.key}
            field={field}
            editing={editing}
            onEditField={onEditField}
            onChange={onChange}
          />
        ))}
      </div>

      {editing ? (
        <div className="settings-actions">
          <button
            type="button"
            className="settings-btn settings-btn-filled"
            onClick={onSave}
          >
            {labels.saveButton}
          </button>
          <button
            type="button"
            className="settings-btn settings-btn-outline"
            onClick={onCancel}
          >
            {labels.cancelButton}
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="settings-btn settings-btn-outline"
          onClick={onStartEditing}
        >
          {labels.editButton}
        </button>
      )}
    </SettingsCard>
  );
}
