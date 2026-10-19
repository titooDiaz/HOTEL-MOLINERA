// Página del huésped para administrar datos personales, seguridad y preferencias de interfaz.
import { useState } from "react";
import RoomRequestsHero from "../../components/room_requests_hero/RoomRequestsHero.jsx";
import PersonalDataCard from "../../components/settings/PersonalDataCard.jsx";
import SecurityCard from "../../components/settings/SecurityCard.jsx";
import PreferencesCard from "../../components/settings/PreferencesCard.jsx";
import ActivityHistoryCard from "../../components/settings/ActivityHistoryCard.jsx";
import { useTheme } from "../../context/themeContext.js";

import "./Alimentos.css";


const IMAGEN_FONDO_PEDIDOS = "/images/places/entrada-interior.jpeg";

// Textos agrupados por sección para mantener consistentes los títulos y controles.
const TEXTO_PAGINA = {

    hero: {
        eyebrow: "CONFIGURACIÓN",
        title: "Configuración",
        description:
            "Gestiona tus datos personales, seguridad y preferencias.",
    },

    personal: {
        title: "Datos Personales",
        editButton: "Editar Datos",
        saveButton: "Guardar cambios",
        cancelButton: "Cancelar",
    },

    security: {
        title: "Seguridad y Contraseña",
        passwordLabel: "Contraseña",
        lastChange: "Último cambio: 12 Noviembre 2023",
        changeButton: "Cambiar Contraseña",
        twoFactorLabel: "Verificación en dos pasos (2FA)",
    },

    preferences: {
        title: "Preferencias de Interfaz",
        darkModeLabel: "Modo Oscuro",
    },

    activity: {
        title: "Historial de Actividad",
    },
};

// Datos de ejemplo que inicializan y alimentan el formulario personal del huésped.
const DATOS_INICIALES = [
    { key: "nombre", label: "Nombre", value: "Juan Pérez", type: "text" },
    { key: "telefono", label: "Teléfono", value: "+58 414-7015219", type: "tel" },
    { key: "correo", label: "Correo Electrónico", value: "juan.perez@email.com", type: "email" },
    { key: "nacionalidad", label: "Nacionalidad", value: "Venezolano", type: "text" },
];

// Actividad de ejemplo que se muestra en la tarjeta de historial.
const HISTORIAL = [
    "Fecha de login: 1:07, 2023",
    "Fecha de login: 1:08, 2023",
    "Fecha de login: 1:03, 2023",
    "Fecha de login: 1:07, 2023",
];


export default function Settings() {
    // Separa los datos guardados del borrador para poder cancelar una edición.
    const [datos, setDatos] = useState(DATOS_INICIALES);
    const [borrador, setBorrador] = useState(DATOS_INICIALES);
    const [editando, setEditando] = useState(false);

    // Estado local de 2FA y preferencias de tema compartidas por el contexto.
    const [dosPasos, setDosPasos] = useState(false);
    const { isDarkMode, toggleDarkMode } = useTheme();


    // Copia los valores actuales al borrador antes de activar el modo de edición.
    const iniciarEdicion = () => {
        setBorrador(datos);
        setEditando(true);
    };

    // Abre la edición desde un campo sin reiniciar un borrador ya activo.
    const editarCampo = () => {
        if (!editando) iniciarEdicion();
    };

    // Actualiza únicamente el campo modificado dentro del borrador.
    const cambiarCampo = (key, value) => {
        setBorrador((prev) =>
            prev.map((f) => (f.key === key ? { ...f, value } : f))
        );
    };

    // Confirma el borrador como datos guardados y cierra la edición.
    const guardar = () => {
        setDatos(borrador);
        setEditando(false);
    };

    // Descarta los cambios pendientes y restaura los datos guardados.
    const cancelar = () => {
        setBorrador(datos);
        setEditando(false);
    };

    // El formulario recibe el borrador durante la edición y los datos guardados en lectura.
    const camposVisibles = editando ? borrador : datos;


    return (

        <div className="container-fluid p-4">
                    {/* Presentación de la página de configuración del huésped. */}
                    <RoomRequestsHero
                        {...TEXTO_PAGINA.hero}
                        imageUrl={IMAGEN_FONDO_PEDIDOS}
                    />

                    {/* Distribuye los paneles personales, de seguridad y preferencias. */}
                    <div className="row g-4">

                        <div className="col-12 col-lg-4">
                            {/* Datos personales con acciones para editar, guardar o cancelar. */}
                            <PersonalDataCard
                                fields={camposVisibles}
                                editing={editando}
                                onEditField={editarCampo}
                                onChange={cambiarCampo}
                                onStartEditing={iniciarEdicion}
                                onSave={guardar}
                                onCancel={cancelar}
                                labels={TEXTO_PAGINA.personal}
                            />
                        </div>

                        <div className="col-12 col-lg-4">
                            {/* Controla el estado de verificación en dos pasos. */}
                            <SecurityCard
                                enabled={dosPasos}
                                onToggle={setDosPasos}
                                labels={TEXTO_PAGINA.security}
                            />
                        </div>

                        <div className="col-12 col-lg-4 d-flex flex-column gap-4">
                            {/* Preferencias de tema e historial reciente de actividad. */}
                            <PreferencesCard
                                enabled={isDarkMode}
                                onToggle={toggleDarkMode}
                                title={TEXTO_PAGINA.preferences.title}
                                label={TEXTO_PAGINA.preferences.darkModeLabel}
                            />
                            <ActivityHistoryCard
                                title={TEXTO_PAGINA.activity.title}
                                items={HISTORIAL}
                            />
                        </div>

                    </div>

        </div>
    );
}