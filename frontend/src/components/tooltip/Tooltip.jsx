import "./Tooltip.css";

export default function Tooltip({ label, children }) {
  return (
    <span className="tooltip-wrapper">
      {children}
      <span className="tooltip-content" role="tooltip">
        {label}
      </span>
    </span>
  );
}
