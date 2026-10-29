// Página del huésped para actualizar su perfil, contraseña y preferencias visuales.
import { useEffect, useState } from "react";
import RoomRequestsHero from "../../components/room_requests_hero/RoomRequestsHero.jsx";
import PersonalDataCard from "../../components/settings/PersonalDataCard.jsx";
import SecurityCard from "../../components/settings/SecurityCard.jsx";
import PreferencesCard from "../../components/settings/PreferencesCard.jsx";
import ActivityHistoryCard from "../../components/settings/ActivityHistoryCard.jsx";
import { apiRequest } from "../../api.js";
import { useAuth } from "../../context/authContext.js";
import { useTheme } from "../../context/themeContext.js";
import "./Alimentos.css";

const COPY = {
  hero: { eyebrow: "CONFIGURACIÓN", title: "Configuración", description: "Gestiona tus datos personales, seguridad y preferencias." },
  personal: { title: "Datos personales", editButton: "Editar datos", saveButton: "Guardar cambios", cancelButton: "Cancelar" },
  security: {
    title: "Seguridad y contraseña",
    currentPasswordLabel: "Contraseña actual",
    newPasswordLabel: "Nueva contraseña",
    confirmPasswordLabel: "Confirma la nueva contraseña",
    changeButton: "Cambiar contraseña",
  },
  preferences: { title: "Preferencias de interfaz", darkModeLabel: "Modo oscuro" },
  activity: { title: "Historial de actividad" },
};

const createFields = (profile, email) => [
  { key: "name", label: "Nombre", value: `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim(), type: "text" },
  { key: "documentType", label: "Tipo de documento", value: profile?.documentType || "CC", type: "text" },
  { key: "documentNumber", label: "Número de documento", value: profile?.documentNumber || "", type: "text" },
  { key: "phone", label: "Teléfono", value: profile?.phone || "", type: "tel" },
  { key: "email", label: "Correo electrónico", value: email || "", type: "email" },
  { key: "nationality", label: "Nacionalidad", value: profile?.nationality || "", type: "text" },
  { key: "birthDate", label: "Fecha de nacimiento", value: profile?.birthDate || "", type: "date" },
  { key: "city", label: "Ciudad", value: profile?.city || "", type: "text" },
  { key: "address", label: "Dirección", value: profile?.address || "", type: "text" },
  { key: "emergencyName", label: "Contacto de emergencia", value: profile?.emergencyName || "", type: "text" },
  { key: "emergencyPhone", label: "Teléfono de emergencia", value: profile?.emergencyPhone || "", type: "tel" },
  { key: "notes", label: "Notas y preferencias", value: profile?.notes || "", type: "text" },
];

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const [data, setData] = useState(() => createFields(user?.profile, user?.email));
  const [draft, setDraft] = useState(data);
  const [editing, setEditing] = useState(false);
  const [activity, setActivity] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const { isDarkMode, toggleDarkMode } = useTheme();

  useEffect(() => {
    Promise.all([apiRequest("/api/me/profile"), apiRequest("/api/me/activity")])
      .then(([profileResponse, activityRecords]) => {
        const fields = createFields(profileResponse.user.profile, profileResponse.user.email);
        setData(fields);
        setDraft(fields);
        setActivity(activityRecords.map((item) => `${item.action} · ${new Intl.DateTimeFormat("es-VE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}`));
      })
      .catch((requestError) => setError(requestError.message));
  }, []);

  const changeField = (key, value) => setDraft((current) => current.map((field) => field.key === key ? { ...field, value } : field));
  const cancelEdit = () => {
    setDraft(data);
    setEditing(false);
    setError("");
  };
  const save = async () => {
    setError("");
    setSaving(true);
    const values = Object.fromEntries(draft.map((field) => [field.key, field.value]));
    try {
      const updatedUser = await updateProfile(values);
      const next = createFields(updatedUser.profile, updatedUser.email);
      setData(next);
      setDraft(next);
      setEditing(false);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-fluid p-4">
      <RoomRequestsHero {...COPY.hero} imageUrl="/images/places/entrada-interior.jpeg" />
      {error && <p className="alert alert-danger" role="alert">{error}</p>}
      <div className="row g-4">
        <div className="col-12 col-lg-4">
          <PersonalDataCard
            fields={editing ? draft : data}
            editing={editing}
            onEditField={() => setEditing(true)}
            onChange={changeField}
            onStartEditing={() => { setDraft(data); setEditing(true); }}
            onSave={save}
            onCancel={cancelEdit}
            labels={COPY.personal}
          />
          {saving && <p role="status">Guardando perfil...</p>}
        </div>
        <div className="col-12 col-lg-4">
          <SecurityCard labels={COPY.security} />
        </div>
        <div className="col-12 col-lg-4 d-flex flex-column gap-4">
          <PreferencesCard enabled={isDarkMode} onToggle={toggleDarkMode} title={COPY.preferences.title} label={COPY.preferences.darkModeLabel} />
          <ActivityHistoryCard title={COPY.activity.title} items={activity} />
        </div>
      </div>
    </div>
  );
}
