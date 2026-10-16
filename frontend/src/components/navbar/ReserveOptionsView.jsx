import Icon from "../icon/Icon.jsx";

export default function ReserveOptionsView({
  labels,
  view,
  onChangeView,
  onClose,
  whatsappUrl,
}) {
  return (
    <section className="reserve-content">
      <span className="reserve-eyebrow">{labels.reserveEyebrow}</span>
      <h2 id="reserve-title" className="reserve-title">{labels.reserveTitle}</h2>
      <p className="reserve-subtitle">{labels.reserveSubtitle}</p>

      <div className="reserve-actions">
        <button
          type="button"
          className={`reserve-option reserve-option--primary ${
            view === "login" ? "is-active" : ""
          }`}
          onClick={() => onChangeView("login")}
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
            <strong>{labels.login}</strong>
            <small>{labels.loginDesc}</small>
          </span>
          <span className="reserve-option-arrow" aria-hidden="true">→</span>
        </button>

        <button
          type="button"
          className={`reserve-option ${view === "register" ? "is-active" : ""}`}
          onClick={() => onChangeView("register")}
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
            <strong>{labels.register}</strong>
            <small>{labels.registerDesc}</small>
          </span>
          <span className="reserve-option-arrow" aria-hidden="true">→</span>
        </button>

        <div className="reserve-divider"><span>{labels.or}</span></div>

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
            <strong>{labels.whatsapp}</strong>
            <small>{labels.whatsappDesc}</small>
          </span>
          <span className="reserve-option-arrow" aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  );
}
