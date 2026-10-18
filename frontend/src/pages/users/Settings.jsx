import { useState } from "react";
import RoomRequestsHero from "../../components/room_requests_hero/RoomRequestsHero.jsx";
import PersonalDataCard from "../../components/settings/PersonalDataCard.jsx";
import SecurityCard from "../../components/settings/SecurityCard.jsx";
import PreferencesCard from "../../components/settings/PreferencesCard.jsx";
import ActivityHistoryCard from "../../components/settings/ActivityHistoryCard.jsx";
import { useTheme } from "../../context/themeContext.js";

import "./RoomRequests.css";


const IMAGEN_FONDO_PEDIDOS = "/images/places/entrada-interior.jpeg";


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


const DATOS_INICIALES = [
    { key: "nombre", label: "Nombre", value: "Juan Pérez", type: "text" },
    { key: "telefono", label: "Teléfono", value: "+58 414-7015219", type: "tel" },
    { key: "correo", label: "Correo Electrónico", value: "juan.perez@email.com", type: "email" },
    { key: "nacionalidad", label: "Nacionalidad", value: "Venezolano", type: "text" },
];


const HISTORIAL = [
    "Fecha de login: 1:07, 2023",
    "Fecha de login: 1:08, 2023",
    "Fecha de login: 1:03, 2023",
    "Fecha de login: 1:07, 2023",
];


export default function Settings() {
    const [datos, setDatos] = useState(DATOS_INICIALES);
    const [borrador, setBorrador] = useState(DATOS_INICIALES);
    const [editando, setEditando] = useState(false);

    const [dosPasos, setDosPasos] = useState(false);
    const { isDarkMode, toggleDarkMode } = useTheme();


    const iniciarEdicion = () => {
        setBorrador(datos);
        setEditando(true);
    };

    const editarCampo = () => {
        if (!editando) iniciarEdicion();
    };

    const cambiarCampo = (key, value) => {
        setBorrador((prev) =>
            prev.map((f) => (f.key === key ? { ...f, value } : f))
        );
    };

    const guardar = () => {
        setDatos(borrador);
        setEditando(false);
    };

    const cancelar = () => {
        setBorrador(datos);
        setEditando(false);
    };

    const camposVisibles = editando ? borrador : datos;


    return (

        <div className="container-fluid p-4">

                    <RoomRequestsHero
                        {...TEXTO_PAGINA.hero}
                        imageUrl={IMAGEN_FONDO_PEDIDOS}
                    />


                    <div className="row g-4">

                        <div className="col-12 col-lg-4">
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
                            <SecurityCard
                                enabled={dosPasos}
                                onToggle={setDosPasos}
                                labels={TEXTO_PAGINA.security}
                            />
                        </div>

                        <div className="col-12 col-lg-4 d-flex flex-column gap-4">
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