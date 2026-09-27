import Icon from "./Icon.jsx";

export default function DashboardIcon({
  children,
  width = 18,
  height = 18,
  stroke = "currentColor",
  strokeWidth = 2,
}) {
  return (
    <Icon
      width={width}
      height={height}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Icon>
  );
}