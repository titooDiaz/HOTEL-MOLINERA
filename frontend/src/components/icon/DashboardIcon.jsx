// Aplica dimensiones y trazos predeterminados al icono SVG usado en los paneles.
import Icon from "./Icon.jsx";

export default function DashboardIcon({
  children,
  className = "",
  width = 18,
  height = 18,
  stroke = "currentColor",
  strokeWidth = 2,
}) {
  return (
    <Icon
      width={width}
      height={height}
      className={className}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Icon>
  );
}