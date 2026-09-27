import Icon from "../icon/Icon.jsx";
import "./Feature.css";

const featureIcons = {
  beds: (
    <path d="M3 18v-6a2 2 0 012-2h14a2 2 0 012 2v6M3 18h18M3 18v2M21 18v2M5 10V7a2 2 0 012-2h3a2 2 0 012 2v3M12 10V8a2 2 0 012-2h3a2 2 0 012 2v2" />
  ),
  tv: (
    <>
      <rect x="3" y="5" width="18" height="12" rx="1" />
      <path d="M8 21h8M12 17v4" />
    </>
  ),
  person: (
    <path d="M12 3a4 4 0 100 8 4 4 0 000-8zM6 21v-2a6 6 0 016-6h0a6 6 0 016 6v2" />
  ),
  safe: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 12h.01M12 12h.01M16 12h.01" />
    </>
  ),
  wifi: (
    <path d="M5 12a7 7 0 0114 0M2 12h2M20 12h2M12 2v2M12 19v3" />
  ),
  work: (
    <>
      <rect x="3" y="4" width="16" height="12" rx="2" />
      <path d="M7 21h8M11 16v5" />
    </>
  ),
  minibar: <path d="M4 4h16l-7 8v6l-2 2v-8L4 4z" />,
};

export default function Feature({ icon, text }) {
  return (
    <div className="d-flex align-items-start gap-3">
      <Icon className="feature-icon">{featureIcons[icon]}</Icon>
      <span className="small text-secondary">{text}</span>
    </div>
  );
}