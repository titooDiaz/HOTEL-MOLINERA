// Muestra una ayuda contextual y ajusta su posición si no cabe sobre el elemento.
import { useState } from "react";
import "./Tooltip.css";

export default function Tooltip({ label, children }) {
  const [placement, setPlacement] = useState("above");

  const updatePlacement = (element) => {
    const wrapper = element.currentTarget;
    const tooltip = wrapper.querySelector(".tooltip-content");
    const gap = parseFloat(getComputedStyle(document.documentElement).fontSize) * 0.55;

    setPlacement(
      wrapper.getBoundingClientRect().top < tooltip.getBoundingClientRect().height + gap
        ? "below"
        : "above",
    );
  };

  return (
    <span className="tooltip-wrapper" onMouseEnter={updatePlacement} onFocus={updatePlacement}>
      {children}
      <span
        className={`tooltip-content${placement === "below" ? " tooltip-content--below" : ""}`}
        role="tooltip"
      >
        {label}
      </span>
    </span>
  );
}
