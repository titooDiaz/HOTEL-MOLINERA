import { useState } from "react";
import Icon from "../icon/Icon.jsx";
import "./ContactSection.css";

const EMPTY_FORM = { name: "", email: "", subject: "", message: "" };

/**
 * Sección de contacto: tarjetas de información + formulario.
 *
 * Props:
 *  - information: { title, description, phone, email, address }  (cada uno con { label, value })
 *  - form: textos del formulario (name, namePlaceholder, ..., submit)
 *          opcionales: sending, successMessage, errorMessage
 *  - onSubmit: async (datos) => void. Si lanza error se muestra errorMessage.
 */
export default function ContactSection({ information, form, onSubmit }) {
  const [values, setValues] = useState(EMPTY_FORM);
  const [status, setStatus] = useState("idle"); // idle | sending | success | error

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (status !== "idle" && status !== "sending") setStatus("idle");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("sending");

    try {
      await onSubmit?.(values);
      setValues(EMPTY_FORM);
      setStatus("success");
    } catch (error) {
      console.error("Error al enviar el mensaje:", error);
      setStatus("error");
    }
  };

  const infoItems = [
    {
      key: "phone",
      data: information.phone,
      href: `tel:${information.phone.value.replace(/\s/g, "")}`,
      icon: (
        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
      ),
    },
    {
      key: "email",
      data: information.email,
      href: `mailto:${information.email.value}`,
      icon: (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </>
      ),
    },
    {
      key: "address",
      data: information.address,
      href: null,
      icon: (
        <>
          <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </>
      ),
    },
  ];

  const isSending = status === "sending";

  return (
    <section className="px-3 px-md-5 py-5" id="contacto">
      <div className="contact-grid">
        {/* ---------- Información ---------- */}
        <div>
          <h2 className="fw-bold text-dark contact-title">{information.title}</h2>
          <p className="text-secondary mb-4">{information.description}</p>

          <div className="d-flex flex-column gap-3">
            {infoItems.map(({ key, data, href, icon }) => (
              <div className="contact-card" key={key}>
                <div className="contact-icon">
                  <Icon size={20}>{icon}</Icon>
                </div>
                <div className="contact-card-text">
                  <p className="small text-secondary mb-0">{data.label}</p>
                  {href ? (
                    <a href={href} className="contact-link">
                      {data.value}
                    </a>
                  ) : (
                    <p className="fw-semibold text-dark mb-0">{data.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ---------- Formulario ---------- */}
        <form className="contact-form" onSubmit={handleSubmit}>
          <h3 className="fw-bold text-dark mb-4 contact-form-title">{form.title}</h3>

          <div className="contact-fields">
            <div className="contact-field">
              <label htmlFor="contact-name">{form.name}</label>
              <input
                id="contact-name"
                name="name"
                type="text"
                value={values.name}
                onChange={handleChange}
                placeholder={form.namePlaceholder}
                autoComplete="name"
                required
              />
            </div>

            <div className="contact-field">
              <label htmlFor="contact-email">{form.email}</label>
              <input
                id="contact-email"
                name="email"
                type="email"
                value={values.email}
                onChange={handleChange}
                placeholder={form.emailPlaceholder}
                autoComplete="email"
                required
              />
            </div>

            <div className="contact-field contact-field-full">
              <label htmlFor="contact-subject">{form.subject}</label>
              <input
                id="contact-subject"
                name="subject"
                type="text"
                value={values.subject}
                onChange={handleChange}
                placeholder={form.subjectPlaceholder}
                required
              />
            </div>

            <div className="contact-field contact-field-full">
              <label htmlFor="contact-message">{form.message}</label>
              <textarea
                id="contact-message"
                name="message"
                rows={5}
                value={values.message}
                onChange={handleChange}
                placeholder={form.messagePlaceholder}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-reserve contact-submit" disabled={isSending}>
            {isSending ? form.sending ?? "Enviando..." : form.submit}
            {!isSending && (
              <Icon size={16}>
                <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </Icon>
            )}
          </button>

          <div aria-live="polite">
            {status === "success" && (
              <p className="contact-feedback contact-feedback-success">
                {form.successMessage ?? "¡Gracias! Tu mensaje fue enviado."}
              </p>
            )}
            {status === "error" && (
              <p className="contact-feedback contact-feedback-error">
                {form.errorMessage ?? "No pudimos enviar tu mensaje. Inténtalo de nuevo."}
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
