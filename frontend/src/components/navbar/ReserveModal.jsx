// Gestiona el modal de reserva y sus vistas de acceso, registro y selección de fechas.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "../icon/Icon.jsx";
import Tooltip from "../tooltip/Tooltip.jsx";
import ReserveLoginForm from "./ReserveLoginForm.jsx";
import ReserveOptionsView from "./ReserveOptionsView.jsx";
import ReserveRegisterForm from "./ReserveRegisterForm.jsx";
import ReservationForm from "../booking/ReservationForm.jsx";
import reserveModalEs from "./es.js";
import "./ReserveModal.css";

const HERO_IMAGE = "/images/places/entrada-interior.jpeg";

const gallery = [
  "/images/places/piscina-dia.jpeg",
  "/images/restaurant/interior-restaurante.jpeg",
  "/images/rooms/cama-blanca.jpeg",
];

export default function ReserveModal({ isOpen, ...props }) {
  if (!isOpen) return null;

  return <ReserveModalContent {...props} />;
}

function ReserveModalContent({
  onClose,
  hotelName,
  labels = {},
  whatsappNumber,
  onLogin,
  onRegister,
  isAuthenticated,
  room,
  rooms = [room],
  onReserve,
}) {
  const modalRef = useRef(null);
  const [view, setView] = useState(isAuthenticated ? "booking" : "options");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loginData, setLoginData] = useState({
    identifier: "",
    password: "",
    remember: true,
  });
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    documentType: "CC",
    documentNumber: "",
    birthDate: "",
    nationality: "Venezuela",
    phone: "",
    city: "",
    address: "",
    emergencyName: "",
    emergencyPhone: "",
    notes: "",
    password: "",
    confirm: "",
    terms: false,
  });

  useEffect(() => {
    const dialog = modalRef.current;
    const previousFocus = document.activeElement;
    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const getFocusableElements = () =>
      [...dialog.querySelectorAll(focusableSelector)].filter(
        (element) => element.getClientRects().length > 0,
      );

    const focusableElements = getFocusableElements();
    (focusableElements[0] ?? dialog).focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const elements = getFocusableElements();
      if (elements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];
      const focusIsOutsideDialog = !dialog.contains(document.activeElement);

      if (event.shiftKey && (document.activeElement === first || focusIsOutsideDialog)) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || focusIsOutsideDialog)
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;

      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus();
      }
    };
  }, [onClose]);

  const t = Object.fromEntries(
    Object.entries(reserveModalEs).map(([key, fallback]) => [
      key,
      labels[key] ?? fallback,
    ]),
  );

  const changeView = (nextView) => {
    setError("");
    setShowPass(false);
    setView(nextView);
  };

  const updateLoginData = (field, value) => {
    setLoginData((current) => ({ ...current, [field]: value }));
  };

  const updateRegisterData = (field, value) => {
    setRegisterData((current) => ({ ...current, [field]: value }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    try {
      if (onLogin) await onLogin(loginData);
      else console.log("Login:", loginData);
    } catch (loginError) {
      setError(loginError.message || t.loginError);
    }
  };

  const handleRegister = (event) => {
    event.preventDefault();
    setError("");

    if (registerData.password.length < 8) return setError(t.passShort);
    if (registerData.password !== registerData.confirm) {
      return setError(t.passMismatch);
    }

    if (onRegister) {
      Promise.resolve(onRegister(registerData)).catch((registerError) => {
        setError(registerError.message || t.registerError || t.loginError);
      });
    }
    else console.log("Register:", registerData);
  };

  const whatsappMessage = encodeURIComponent(
    t.whatsappMessage.replace("{hotelName}", hotelName || t.hotelFallback),
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;
  const isForm = view !== "options";

  return createPortal(
    <div className="reserve-overlay" onClick={onClose} role="presentation">
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`reserve-modal ${isForm ? "reserve-modal--form" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reserve-title"
        onClick={(event) => event.stopPropagation()}
      >
        <Tooltip label={t.close}>
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
        </Tooltip>

        {view !== "booking" && (
          <aside
            key="visual"
            className="reserve-visual reserve-swap"
            style={{ backgroundImage: `url(${HERO_IMAGE})` }}
          >
            <div className="reserve-visual-overlay">
              <span className="reserve-stars" aria-hidden="true">★★★★★</span>
              <h3 className="reserve-visual-name">
                {hotelName || t.hotelFallback}
              </h3>
              <ul className="reserve-perks">
                <li>✦ {t.perk1}</li>
                <li>✦ {t.perk2}</li>
                <li>✦ {t.perk3}</li>
              </ul>
              <div className="reserve-gallery">
                {gallery.map((src) => (
                  <img key={src} src={src} alt="" loading="lazy" />
                ))}
              </div>
            </div>
          </aside>
        )}

        {view === "login" && (
          <ReserveLoginForm
            hotelName={hotelName}
            labels={t}
            data={loginData}
            onChange={updateLoginData}
            onSubmit={handleLogin}
            onChangeView={changeView}
            showPass={showPass}
            onTogglePass={() => setShowPass((current) => !current)}
            error={error}
          />
        )}

        {view === "register" && (
          <ReserveRegisterForm
            hotelName={hotelName}
            labels={t}
            data={registerData}
            onChange={updateRegisterData}
            onSubmit={handleRegister}
            onChangeView={changeView}
            showPass={showPass}
            onTogglePass={() => setShowPass((current) => !current)}
            error={error}
          />
        )}

        {view === "booking" && (
          <section className="reserve-content reserve-booking-content">
            <span className="reserve-eyebrow">Reserva tu estadía</span>
            <h2 id="reserve-title" className="reserve-title">Completa tu reserva</h2>
            <p className="reserve-subtitle">Elige tus fechas y revisa toda la información de la habitación.</p>
            <ReservationForm room={room} rooms={rooms} onSubmit={onReserve} onCancel={onClose} />
          </section>
        )}

        {view === "options" && (
          <ReserveOptionsView
            labels={t}
            view={view}
            onChangeView={changeView}
            onClose={onClose}
            whatsappUrl={whatsappUrl}
          />
        )}
      </div>
    </div>,
    document.body,
  );
}
