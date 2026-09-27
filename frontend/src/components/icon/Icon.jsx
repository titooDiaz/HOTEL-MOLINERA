export default function Icon({
  children,
  className = "",
  size = 24,
  width = size,
  height = size,
  stroke = "currentColor",
  strokeWidth = 1.8,
  strokeLinecap,
  strokeLinejoin,
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap={strokeLinecap}
      strokeLinejoin={strokeLinejoin}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}