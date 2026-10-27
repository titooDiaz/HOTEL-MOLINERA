// Página de contacto que presenta la información del hotel y envía mensajes al backend.
import ContactSection from "../../components/contact_section/ContactSection.jsx";
import { postJson } from "../../api.js";

const TEXTOS_CONTACTO = {
  information: {
    title: "Información de contacto",
    description:
      "Comunícate con nosotros para resolver tus dudas, consultar disponibilidad o recibir información sobre nuestros servicios.",

    phone: {
      label: "Teléfono",
      value: "+58 414-7015219",
    },

    email: {
      label: "Correo electrónico",
      value: "lamolineraposada@gmail.com",
    },

    address: {
      label: "Dirección",
      value: "RMFP+X4X, Capacho 5009, Táchira, Venezuela",
    },

    instagram: {
      label: "Instagram",
      value: "@lanuevamolinera_capacho",
      href: "https://www.instagram.com/lanuevamolinera_capacho/",
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
};

function Contacto() {
  const enviarMensaje = (datos) => postJson("/api/contact", datos);

  return (
    // La sección presenta los datos de contacto y gestiona el envío del formulario.
    <ContactSection
      information={TEXTOS_CONTACTO.information}
      form={TEXTOS_CONTACTO.form}
      onSubmit={enviarMensaje}
    />
  );
}

export default Contacto;