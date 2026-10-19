// Alinea horizontalmente un icono y su información relacionada.
export default function InfoRow({ children }) {
  return <div className="d-flex align-items-center gap-3">{children}</div>;
}