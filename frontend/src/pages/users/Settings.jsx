import { useEffect, useState } from "react";
import {
    BedDouble,
    Settings as SettingsIcon,
    Utensils,
} from "lucide-react";

import GuestSidebar from "../../components/guest_sidebar/GuestSidebar.jsx";
import GuestTopbar from "../../components/guest_topbar/GuestTopbar.jsx";
import RoomRequestsHero from "../../components/room_requests_hero/RoomRequestsHero.jsx";
import PersonalDataCard from "../../components/settings/PersonalDataCard.jsx";
import SecurityCard from "../../components/settings/SecurityCard.jsx";
import PreferencesCard from "../../components/settings/PreferencesCard.jsx";
import ActivityHistoryCard from "../../components/settings/ActivityHistoryCard.jsx";

import "./RoomRequests.css";


const HUESPED = {
    nombre: "Juan Pérez",
    habitacion: "Habitación 101",
};


const IMAGEN_FONDO_PEDIDOS =
    "https://peopleenespanol.com/thmb/lFB2yQjHVJ2q-FJcY2BfxMd5t24=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/GettyImages-905083708-2000-59fc054b9e5b4fad8be53a055f3eab2c.jpg";


const TEXTO_PAGINA = {

    sidebar: {
        brand: {
            initials: "HM",
            name: "Hotel Moderno",
            tagline: "Tu estadía, nuestra prioridad",
        },

        items: [
            { label: "Mi habitación", icon: BedDouble, path: "/mi-habitacion" },
            { label: "Alimentos y bebidas", icon: Utensils, path: "/pedidos" },
            { label: "Configuración", icon: SettingsIcon, path: "/configuracion" },
        ],

        activeItem: "Configuración",
        logoutLabel: "Cerrar sesión",
    },

    notificationLabel: "Notificaciones",

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
    { key: "telefono", label: "Teléfono", value: "+57 312 345 6789", type: "tel" },
    { key: "correo", label: "Correo Electrónico", value: "juan.perez@email.com", type: "email" },
    { key: "nacionalidad", label: "Nacionalidad", value: "Colombiano", type: "text" },
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

    const [modoOscuro, setModoOscuro] = useState(false);
    const [dosPasos, setDosPasos] = useState(false);


    // dark mode effect
    useEffect(() => {
        document.body.classList.toggle("dark-mode", modoOscuro);
        return () => document.body.classList.remove("dark-mode");
    }, [modoOscuro]);


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

        <div className="hotel-layout d-flex min-vh-100">

            <GuestSidebar
                {...TEXTO_PAGINA.sidebar}
            />


            <main className="main-content flex-grow-1">

                <GuestTopbar
                    guest={HUESPED}
                    notificationLabel={TEXTO_PAGINA.notificationLabel}
                />


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
                                enabled={modoOscuro}
                                onToggle={setModoOscuro}
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

            </main>

        </div>
    );
}