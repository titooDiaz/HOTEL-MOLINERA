import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

import Navbar from "../../components/navbar/Navbar.jsx";
import ContactSection from "../../components/contact_section/ContactSection.jsx";
import WhatsAppButton from "../../components/whatsApp_button/WhatsAppButton.jsx";


const TEXTOS_CONTACTO = {
  navbar: {
    brandInitials: "HM",
    logoFallback: "logo",
    rooms: "Habitaciones",
    plans: "Planes",
    restaurant: "Restaurante",
    contact: "Contacto",
    reserve: "RESERVAR",
  },


  information: {
    title: "Información de contacto",
    description:
      "Comunícate con nosotros para resolver tus dudas, consultar disponibilidad o recibir información sobre nuestros servicios.",

    phone: {
      label: "Teléfono",
      value: "000 000 0000",
    },

    email: {
      label: "Correo electrónico",
      value: "contacto@hotel.com",
    },

    address: {
      label: "Dirección",
      value: "Dirección del hotel",
    },
  },

  form: {
    title: "Envíanos un mensaje",

    name: "Nombre",
    namePlaceholder: "Tu nombre",

    email: "Correo electrónico",
    emailPlaceholder: "tu@email.com",

    subject: "Asunto",
    subjectPlaceholder: "¿En qué podemos ayudarte?",

    message: "Mensaje",
    messagePlaceholder: "Escribe tu mensaje aquí...",

    submit: "Enviar mensaje",
    sending: "Enviando...",
    successMessage: "¡Gracias! Tu mensaje fue enviado, te responderemos pronto.",
    errorMessage: "No pudimos enviar tu mensaje. Inténtalo de nuevo.",
  },

  whatsappLabel: "Contactar por WhatsApp",
};

function Contacto() {
  const [hotelData, setHotelData] = useState(null);

  useEffect(() => {
    fetch("/api/hotel")
      .then(response => response.json())
      .then(data => setHotelData(data))
      .catch(error =>
        console.error("Error al conectar con el backend:", error)
      );
  }, []);

  // TODO: el backend aún no tiene la ruta POST /api/contact (ver backend/src/app.js)
  const enviarMensaje = async (datos) => {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status} al enviar el mensaje`);
    }
  };

  return (
    <div className="app">
      <Navbar hotelName={hotelData?.name} labels={TEXTOS_CONTACTO.navbar} />
      <ContactSection
        information={TEXTOS_CONTACTO.information}
        form={TEXTOS_CONTACTO.form}
        onSubmit={enviarMensaje}
      />
      <WhatsAppButton ariaLabel={TEXTOS_CONTACTO.whatsappLabel} />
    </div>
  );
}

export default Contacto;