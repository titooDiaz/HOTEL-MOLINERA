import { useState } from "react";
import { apiRequest } from "../../api.js";

const AMENITIES = [
  ["airConditioning", "Aire acondicionado"],
  ["cableTv", "TV por cable"],
  ["safe", "Caja de seguridad"],
  ["workstation", "Estación de trabajo"],
  ["wifi", "Wi-Fi"],
  ["minibar", "Mini bar"],
  ["privateBathroom", "Baño privado"],
  ["balcony", "Balcón o terraza"],
  ["smokeFree", "Libre de humo"],
];

const STATUSES = [
  ["disponible", "Disponible"],
  ["limpieza", "En limpieza"],
  ["mantenimiento", "Mantenimiento"],
  ["ocupada", "Ocupada"],
];

function parseGallery(room) {
  let gallery = room.gallery;
  if (typeof gallery === "string") {
    try {
      gallery = JSON.parse(gallery);
    } catch {
      gallery = [];
    }
  }
  if (Array.isArray(gallery) && gallery.length) {
    return gallery.map((image) => typeof image === "string"
      ? { src: image, alt: `Habitación ${room.number}` }
      : image);
  }
  return room.imageUrl ? [{ src: room.imageUrl, alt: `Habitación ${room.number}` }] : [];
}

function photoFilename(src) {
  const filename = src?.split("/").pop();
  return src?.startsWith("/uploads/") && /^[a-f0-9]{32}\.(jpg|png|webp|gif)$/.test(filename)
    ? filename
    : null;
}

function dateValue(value) {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

export default function RoomManagementModal({ room: initialRoom, onClose, onUpdated }) {
  const [room, setRoom] = useState(initialRoom);
  const [activeTab, setActiveTab] = useState("details");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [details, setDetails] = useState(() => ({
    number: initialRoom.number || "",
    type: initialRoom.type || "",
    floor: initialRoom.floor ?? "",
    capacity: initialRoom.capacity ?? "",
    area: initialRoom.area ?? "",
    beds: initialRoom.beds ?? 1,
    bedType: initialRoom.bedType || "",
    pricePerNight: initialRoom.pricePerNight ?? "",
    description: initialRoom.description || "",
    amenities: Object.fromEntries(AMENITIES.map(([key]) => [key, Boolean(initialRoom[key])])),
  }));
  const [maintenance, setMaintenance] = useState(() => ({
    status: initialRoom.status || "disponible",
    maintenanceNotes: initialRoom.maintenanceNotes || "",
    unavailableFrom: dateValue(initialRoom.unavailableFrom),
    unavailableUntil: dateValue(initialRoom.unavailableUntil),
  }));
  const gallery = parseGallery(room);

  const applyUpdatedRoom = (updatedRoom, message) => {
    setRoom(updatedRoom);
    onUpdated(updatedRoom);
    setError("");
    setNotice(message);
  };

  const saveDetails = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const updatedRoom = await apiRequest(`/api/rooms/${room.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...details,
          floor: Number(details.floor),
          capacity: Number(details.capacity),
          beds: Number(details.beds),
          area: details.area === "" ? null : Number(details.area),
          pricePerNight: Number(details.pricePerNight),
          amenities: details.amenities,
        }),
      });
      applyUpdatedRoom(updatedRoom, "Los datos de la habitación se guardaron.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const saveMaintenance = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const updatedRoom = await apiRequest(`/api/rooms/${room.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          ...maintenance,
          maintenanceNotes: maintenance.maintenanceNotes.trim() || null,
          unavailableFrom: maintenance.unavailableFrom || null,
          unavailableUntil: maintenance.unavailableUntil || null,
        }),
      });
      applyUpdatedRoom(updatedRoom, "El estado y el mantenimiento se guardaron.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const deletePhoto = async (image) => {
    const filename = photoFilename(image.src);
    if (!filename) return;
    if (!window.confirm("¿Eliminar esta foto de la galería?")) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const updatedRoom = await apiRequest(`/api/rooms/${room.id}/images/${filename}`, {
        method: "DELETE",
      });
      applyUpdatedRoom(updatedRoom, "La foto se eliminó de la galería.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const replacePhotos = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    if (files.length > 4) {
      setError("Selecciona como máximo 4 imágenes.");
      return;
    }
    const body = new FormData();
    files.forEach((file) => body.append("images", file));
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const updatedRoom = await apiRequest(`/api/rooms/${room.id}/images`, {
        method: "PUT",
        body,
      });
      applyUpdatedRoom(updatedRoom, "La galería se reemplazó correctamente.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const updateDetails = (event) => {
    const { name, value, checked, type } = event.target;
    if (type === "checkbox") {
      setDetails((current) => ({
        ...current,
        amenities: { ...current.amenities, [name]: checked },
      }));
    } else {
      setDetails((current) => ({ ...current, [name]: value }));
    }
  };

  return (
    <div className="room-management-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) onClose();
    }}>
      <section
        className="room-management-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-management-title"
      >
        <header className="room-management-header">
          <div>
            <h2 id="room-management-title">Habitación {room.number}</h2>
            <p>Actualiza sus datos, disponibilidad y fotos.</p>
          </div>
          <button
            className="room-management-close"
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>

        <nav className="room-management-tabs" aria-label="Gestión de habitación">
          {[
            ["details", "Datos"],
            ["maintenance", "Mantenimiento"],
            ["photos", `Fotos (${gallery.length})`],
          ].map(([tab, label]) => (
            <button
              className={`room-management-tab${activeTab === tab ? " is-active" : ""}`}
              type="button"
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setError("");
                setNotice("");
              }}
            >
              {label}
            </button>
          ))}
        </nav>

        {error && <p className="alert alert-danger room-management-feedback" role="alert">{error}</p>}
        {notice && <p className="alert alert-success room-management-feedback" role="status">{notice}</p>}

        {activeTab === "details" && (
          <form className="room-management-form" onSubmit={saveDetails}>
            <div className="room-management-fields">
              <label>Número de habitación
                <input className="admin-form-control" name="number" value={details.number} onChange={updateDetails} required />
              </label>
              <label>Tipo
                <select className="admin-form-control" name="type" value={details.type} onChange={updateDetails} required>
                  {!["Individual", "Semi doble", "Doble", "Suite"].includes(details.type) && <option>{details.type}</option>}
                  {["Individual", "Semi doble", "Doble", "Suite"].map((type) => <option key={type}>{type}</option>)}
                </select>
              </label>
              <label>Piso
                <input className="admin-form-control" name="floor" type="number" min="0" step="1" value={details.floor} onChange={updateDetails} required />
              </label>
              <label>Capacidad (personas)
                <input className="admin-form-control" name="capacity" type="number" min="1" step="1" value={details.capacity} onChange={updateDetails} required />
              </label>
              <label>Número de camas
                <input className="admin-form-control" name="beds" type="number" min="1" step="1" value={details.beds} onChange={updateDetails} required />
              </label>
              <label>Tipo de cama
                <select className="admin-form-control" name="bedType" value={details.bedType} onChange={updateDetails}>
                  <option value="">Sin especificar</option>
                  {["sencilla", "semidoble", "doble", "queen", "king"].map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>
              <label>Área (m²)
                <input className="admin-form-control" name="area" type="number" min="0" step="0.01" value={details.area} onChange={updateDetails} />
              </label>
              <label>Precio por noche (VES)
                <input className="admin-form-control" name="pricePerNight" type="number" min="0" step="0.01" value={details.pricePerNight} onChange={updateDetails} required />
              </label>
              <label className="room-management-full-width">Descripción
                <textarea className="admin-form-control" name="description" rows="3" value={details.description} onChange={updateDetails} />
              </label>
            </div>

            <fieldset className="room-management-amenities">
              <legend>Servicios y comodidades</legend>
              {AMENITIES.map(([key, label]) => (
                <label key={key}>
                  <input type="checkbox" name={key} checked={details.amenities[key]} onChange={updateDetails} />
                  {label}
                </label>
              ))}
            </fieldset>
            <footer className="room-management-actions">
              <button className="admin-action-button admin-action-button--outline" type="button" onClick={onClose} disabled={saving}>Cerrar</button>
              <button className="admin-action-button admin-action-button--primary" type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </footer>
          </form>
        )}

        {activeTab === "maintenance" && (
          <form className="room-management-form" onSubmit={saveMaintenance}>
            <div className="room-management-fields">
              <label>Estado
                <select
                  className="admin-form-control"
                  value={maintenance.status}
                  onChange={(event) => setMaintenance((current) => ({ ...current, status: event.target.value }))}
                >
                  {STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label>Inicio del bloqueo
                <input
                  className="admin-form-control"
                  type="date"
                  value={maintenance.unavailableFrom}
                  onChange={(event) => setMaintenance((current) => ({ ...current, unavailableFrom: event.target.value }))}
                />
              </label>
              <label>Fin del bloqueo (exclusivo)
                <input
                  className="admin-form-control"
                  type="date"
                  value={maintenance.unavailableUntil}
                  onChange={(event) => setMaintenance((current) => ({ ...current, unavailableUntil: event.target.value }))}
                />
              </label>
              <label className="room-management-full-width">Notas de mantenimiento
                <textarea
                  className="admin-form-control"
                  rows="4"
                  value={maintenance.maintenanceNotes}
                  onChange={(event) => setMaintenance((current) => ({ ...current, maintenanceNotes: event.target.value }))}
                  placeholder="Describe el trabajo o la reparación que se realizará."
                />
              </label>
            </div>
            <p className="room-management-hint">Para quitar un bloqueo, deja vacías ambas fechas. Las fechas deben formar un intervalo válido y no cruzarse con reservas activas.</p>
            <footer className="room-management-actions">
              <button className="admin-action-button admin-action-button--outline" type="button" onClick={onClose} disabled={saving}>Cerrar</button>
              <button className="admin-action-button admin-action-button--primary" type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar mantenimiento"}
              </button>
            </footer>
          </form>
        )}

        {activeTab === "photos" && (
          <div className="room-management-form">
            {gallery.length ? (
              <div className="room-management-gallery">
                {gallery.map((image, index) => {
                  const filename = photoFilename(image.src);
                  return (
                    <figure className="room-management-photo" key={`${image.src}-${index}`}>
                      <img src={image.src} alt={image.alt || `Foto ${index + 1} de la habitación ${room.number}`} />
                      {filename
                        ? <button className="admin-action-button admin-action-button--danger" type="button" onClick={() => deletePhoto(image)} disabled={saving}>Eliminar foto</button>
                        : <span className="room-management-hint">Foto externa</span>}
                    </figure>
                  );
                })}
              </div>
            ) : <p className="room-management-hint">Esta habitación aún no tiene fotos.</p>}
            <label className="room-management-upload">
              Reemplazar toda la galería
              <input
                className="admin-form-control"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                disabled={saving}
                onChange={replacePhotos}
              />
              <span className="room-management-hint">Selecciona de 1 a 4 imágenes; se eliminarán las fotos anteriores que ya no se usen.</span>
            </label>
            <footer className="room-management-actions">
              <button className="admin-action-button admin-action-button--outline" type="button" onClick={onClose} disabled={saving}>Cerrar</button>
            </footer>
          </div>
        )}
      </section>
    </div>
  );
}
