// Presenta una etiqueta breve para una característica de habitación.
import "./Tag.css";

export default function Tag({ children }) {
  return <span className="room-tag">{children}</span>;
}