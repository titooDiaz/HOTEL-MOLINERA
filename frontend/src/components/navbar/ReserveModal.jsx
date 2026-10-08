import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "../icon/Icon.jsx";
import "./ReserveModal.css";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80";

const FORM_BANNER =
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80";

const gallery = [
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=300&q=80",
];

function FormHeader({ hotelName }) {
  return (
    <div
      className="reserve-form-banner"
      style={{ backgroundImage: `url(${FORM_BANNER})` }}
    >
      <div className="reserve-form-banner-overlay">
        <span className="reserve-stars" aria-hidden="true">★★★★★</span>
        <span className="reserve-form-banner-name">
          {hotelName || "Nuestro Hotel"}
        </span>
      </div>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  showPass,
  onTogglePass,
  showLabel,
  hideLabel,
}) {
  return (
    <div className="reserve-field">
      <label htmlFor={id}>{label}</label>
      <div className="reserve-input-wrap">
        <input
          id={id}
          type={showPass ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder="••••••••"
          required
          minLength={6}
        />
        <button
          type="button"
          className="reserve-toggle-pass"
          onClick={onTogglePass}
        >
          {showPass ? hideLabel : showLabel}
        </button>
      </div>
    </div>
  );
}

export default function ReserveModal({
  isOpen,
  onClose,
  hotelName,
  labels = {},
  whatsappNumber,
  onLogin,
  onRegister,
}) {
  // "options" | "login" | "register"
  const [view, setView] = useState("options");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    terms: false,
  });

  // Reiniciar todo al cerrar
  useEffect(() => {
    if (!isOpen) {
      setView("options");
      setShowPass(false);
      setError("");
    }
  }, [isOpen]);

  // Cerrar con ESC y bloquear scroll del body
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const t = {
    eyebrow: labels.reserveEyebrow ?? "Reserva tu estadía",
    title: labels.reserveTitle ?? "Tu escapada perfecta comienza aquí",
    subtitle:
      labels.reserveSubtitle ??
      "Elige cómo prefieres continuar con tu reserva.",
    login: labels.login ?? "Iniciar sesión",
    loginDesc: labels.loginDesc ?? "Ya tengo una cuenta",
    register: labels.register ?? "Crear cuenta",
    registerDesc: labels.registerDesc ?? "Soy nuevo, quiero registrarme",
    whatsapp: labels.whatsapp ?? "Escribir por WhatsApp",
    whatsappDesc: labels.whatsappDesc ?? "Atención personalizada al instante",
    or: labels.or ?? "o",
    close: labels.close ?? "Cerrar",
    back: labels.back ?? "Volver",
    perk1: labels.perk1 ?? "Mejor tarifa garantizada",
    perk2: labels.perk2 ?? "Cancelación flexible",
    perk3: labels.perk3 ?? "Desayuno incluido",
    // Login form
    loginTitle: labels.loginTitle ?? "Bienvenido de nuevo",
    loginSubtitle:
      labels.loginSubtitle ?? "Ingresa para continuar con tu reserva.",
    email: labels.email ?? "Correo electrónico",
    password: labels.password ?? "Contraseña",
    remember: labels.remember ?? "Recordarme",
    forgot: labels.forgot ?? "¿Olvidaste tu contraseña?",
    show: labels.show ?? "Mostrar",
    hide: labels.hide ?? "Ocultar",
    loginSubmit: labels.loginSubmit ?? "Ingresar",
    noAccount: labels.noAccount ?? "¿No tienes cuenta?",
    // Register form
    registerTitle: labels.registerTitle ?? "Crea tu cuenta",
    registerSubtitle:
      labels.registerSubtitle ?? "Regístrate y reserva en pocos pasos.",
    fullName: labels.fullName ?? "Nombre completo",
    phone: labels.phone ?? "Teléfono",
    confirmPassword: labels.confirmPassword ?? "Confirmar contraseña",
    terms: labels.terms ?? "Acepto los términos y condiciones",
    registerSubmit: labels.registerSubmit ?? "Crear mi cuenta",
    haveAccount: labels.haveAccount ?? "¿Ya tienes cuenta?",
    passMismatch: labels.passMismatch ?? "Las contraseñas no coinciden.",
    passShort:
      labels.passShort ?? "La contraseña debe tener al menos 6 caracteres.",
  };

  const changeView = (next) => {
    setError("");
    setShowPass(false);
    setView(next);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (onLogin) await onLogin(loginData);
      else console.log("Login:", loginData);
    } catch (loginError) {
      setError(loginError.message || "No fue posible iniciar sesión.");
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError("");

    if (registerData.password.length < 6) return setError(t.passShort);
    if (registerData.password !== registerData.confirm)
      return setError(t.passMismatch);

    if (onRegister) onRegister(registerData);
    else console.log("Register:", registerData);
  };

  const whatsappMessage = encodeURIComponent(
    `Hola, me gustaría reservar una habitación en ${hotelName || "el hotel"}.`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  const isForm = view !== "options";

  return createPortal(
    <div className="reserve-overlay" onClick={onClose} role="presentation">
      <div
        className={`reserve-modal ${isForm ? "reserve-modal--form" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reserve-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="reserve-close"
          onClick={onClose}
          aria-label={t.close}
        >
          <Icon size={18}>
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </Icon>
        </button>

        {/* ============ PANEL IZQUIERDO (imagen / formularios) ============ */}
        {!isForm && (
          <aside
            key="visual"
            className="reserve-visual reserve-swap"
            style={{ backgroundImage: `url(${HERO_IMAGE})` }}
          >
            <div className="reserve-visual-overlay">
              <span className="reserve-stars" aria-hidden="true">★★★★★</span>
              <h3 className="reserve-visual-name">
                {hotelName || "Nuestro Hotel"}
              </h3>

              <ul className="reserve-perks">
                <li>✦ {t.perk1}</li>
                <li>✦ {t.perk2}</li>
                <li>✦ {t.perk3}</li>
              </ul>

              <div className="reserve-gallery">
                {gallery.map((src, i) => (
                  <img key={i} src={src} alt="" loading="lazy" />
                ))}
              </div>
            </div>
          </aside>
        )}

        {view === "login" && (
          <aside key="login" className="reserve-form-panel reserve-swap">
            <FormHeader hotelName={hotelName} />

            <div className="reserve-form-body">
              <button
                type="button"
                className="reserve-back"
                onClick={() => changeView("options")}
              >
                ← {t.back}
              </button>

              <h3 className="reserve-form-title">{t.loginTitle}</h3>
              <p className="reserve-form-subtitle">{t.loginSubtitle}</p>

              <form onSubmit={handleLogin} className="reserve-form">
                <div className="reserve-field">
                  <label htmlFor="login-email">{t.email}</label>
                  <div className="reserve-input-wrap">
                    <input
                      id="login-email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) =>
                        setLoginData({ ...loginData, email: e.target.value })
                      }
                      autoComplete="email"
                      placeholder="tucorreo@ejemplo.com"
                      required
                    />
                  </div>
                </div>

                <PasswordField
                  id="login-password"
                  label={t.password}
                  value={loginData.password}
                  autoComplete="current-password"
                  showPass={showPass}
                  onTogglePass={() => setShowPass((current) => !current)}
                  showLabel={t.show}
                  hideLabel={t.hide}
                  onChange={(e) =>
                    setLoginData({ ...loginData, password: e.target.value })
                  }
                />

                <div className="reserve-row">
                  <label className="reserve-check">
                    <input
                      type="checkbox"
                      checked={loginData.remember}
                      onChange={(e) =>
                        setLoginData({
                          ...loginData,
                          remember: e.target.checked,
                        })
                      }
                    />
                    <span>{t.remember}</span>
                  </label>
                  <button type="button" className="reserve-link">
                    {t.forgot}
                  </button>
                </div>

                {error && <p className="reserve-error">{error}</p>}

                <button type="submit" className="reserve-submit">
                  {t.loginSubmit}
                </button>

                <p className="reserve-switch">
                  {t.noAccount}{" "}
                  <button
                    type="button"
                    className="reserve-link"
                    onClick={() => changeView("register")}
                  >
                    {t.register}
                  </button>
                </p>
              </form>
            </div>
          </aside>
        )}

        {view === "register" && (
          <aside key="register" className="reserve-form-panel reserve-swap">
            <FormHeader hotelName={hotelName} />

            <div className="reserve-form-body">
              <button
                type="button"
                className="reserve-back"
                onClick={() => changeView("options")}
              >
                ← {t.back}
              </button>

              <h3 className="reserve-form-title">{t.registerTitle}</h3>
              <p className="reserve-form-subtitle">{t.registerSubtitle}</p>

              <form onSubmit={handleRegister} className="reserve-form">
                <div className="reserve-field">
                  <label htmlFor="reg-name">{t.fullName}</label>
                  <div className="reserve-input-wrap">
                    <input
                      id="reg-name"
                      type="text"
                      value={registerData.name}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          name: e.target.value,
                        })
                      }
                      autoComplete="name"
                      placeholder="Ej: María Gómez"
                      required
                    />
                  </div>
                </div>

                <div className="reserve-grid-2">
                  <div className="reserve-field">
                    <label htmlFor="reg-email">{t.email}</label>
                    <div className="reserve-input-wrap">
                      <input
                        id="reg-email"
                        type="email"
                        value={registerData.email}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            email: e.target.value,
                          })
                        }
                        autoComplete="email"
                        placeholder="tucorreo@ejemplo.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="reserve-field">
                    <label htmlFor="reg-phone">{t.phone}</label>
                    <div className="reserve-input-wrap">
                      <input
                        id="reg-phone"
                        type="tel"
                        value={registerData.phone}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            phone: e.target.value,
                          })
                        }
                        autoComplete="tel"
                        placeholder="300 123 4567"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="reserve-grid-2">
                  <PasswordField
                    id="reg-password"
                    label={t.password}
                    value={registerData.password}
                    autoComplete="new-password"
                    showPass={showPass}
                    onTogglePass={() => setShowPass((current) => !current)}
                    showLabel={t.show}
                    hideLabel={t.hide}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        password: e.target.value,
                      })
                    }
                  />
                  <PasswordField
                    id="reg-confirm"
                    label={t.confirmPassword}
                    value={registerData.confirm}
                    autoComplete="new-password"
                    showPass={showPass}
                    onTogglePass={() => setShowPass((current) => !current)}
                    showLabel={t.show}
                    hideLabel={t.hide}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        confirm: e.target.value,
                      })
                    }
                  />
                </div>

                <label className="reserve-check">
                  <input
                    type="checkbox"
                    checked={registerData.terms}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        terms: e.target.checked,
                      })
                    }
                    required
                  />
                  <span>{t.terms}</span>
                </label>

                {error && <p className="reserve-error">{error}</p>}

                <button type="submit" className="reserve-submit">
                  {t.registerSubmit}
                </button>

                <p className="reserve-switch">
                  {t.haveAccount}{" "}
                  <button
                    type="button"
                    className="reserve-link"
                    onClick={() => changeView("login")}
                  >
                    {t.login}
                  </button>
                </p>
              </form>
            </div>
          </aside>
        )}

        {/* ============ PANEL DERECHO (opciones) ============ */}
        <section className="reserve-content">
          <span className="reserve-eyebrow">{t.eyebrow}</span>
          <h2 id="reserve-title" className="reserve-title">{t.title}</h2>
          <p className="reserve-subtitle">{t.subtitle}</p>

          <div className="reserve-actions">
            <button
              type="button"
              className={`reserve-option reserve-option--primary ${
                view === "login" ? "is-active" : ""
              }`}
              onClick={() => changeView("login")}
            >
              <span className="reserve-option-icon">
                <Icon size={22}>
                  <path
                    d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.4 0-8 2.2-8 5v3h16v-3c0-2.8-3.6-5-8-5z"
                    fill="currentColor"
                    stroke="none"
                  />
                </Icon>
              </span>
              <span className="reserve-option-text">
                <strong>{t.login}</strong>
                <small>{t.loginDesc}</small>
              </span>
              <span className="reserve-option-arrow" aria-hidden="true">→</span>
            </button>

            <button
              type="button"
              className={`reserve-option ${
                view === "register" ? "is-active" : ""
              }`}
              onClick={() => changeView("register")}
            >
              <span className="reserve-option-icon">
                <Icon size={22}>
                  <path
                    d="M15 12a5 5 0 10-6-8 5 5 0 006 8zm-3 2c-4 0-7 2-7 4.5V21h9.3a6 6 0 01-.3-2c0-1.8.8-3.4 2-4.5-1.2-.7-2.6-1-4-1zm7 0v3h-3v2h3v3h2v-3h3v-2h-3v-3h-2z"
                    fill="currentColor"
                    stroke="none"
                  />
                </Icon>
              </span>
              <span className="reserve-option-text">
                <strong>{t.register}</strong>
                <small>{t.registerDesc}</small>
              </span>
              <span className="reserve-option-arrow" aria-hidden="true">→</span>
            </button>

            <div className="reserve-divider"><span>{t.or}</span></div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="reserve-option reserve-option--whatsapp"
              onClick={onClose}
            >
              <span className="reserve-option-icon">
                <Icon size={22}>
                  <path
                    d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm5.2 13.8c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.100-1.500-1.100-2.800 0-1.300.7-1.900.9-2.200.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.3.5-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.300 1.700 2.100 1.200 1 2.100 1.300 2.400 1.500.3.1.5.1.6-.1l.9-1.100c.2-.2.4-.2.6-.1l1.900.9c.3.1.5.2.5.3.1.2.1.8-.1 1.400z"
                    fill="currentColor"
                    stroke="none"
                  />
                </Icon>
              </span>
              <span className="reserve-option-text">
                <strong>{t.whatsapp}</strong>
                <small>{t.whatsappDesc}</small>
              </span>
              <span className="reserve-option-arrow" aria-hidden="true">→</span>
            </a>
          </div>
        </section>
      </div>
    </div>,
    document.body
  );
}