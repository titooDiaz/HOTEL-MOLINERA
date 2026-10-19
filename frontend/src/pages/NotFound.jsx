// Página de error 404 con un enlace para regresar al inicio.
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="container min-vh-100 d-flex flex-column justify-content-center align-items-center text-center">
      {/* Informa que la ruta solicitada no existe y ofrece volver al inicio. */}
      <p className="text-danger fw-semibold mb-2">Error 404</p>
      <h1 className="display-5 fw-bold">Página no encontrada</h1>
      <p className="text-secondary mb-4">
        La página que buscas no existe o fue movida.
      </p>
      <Link to="/" className="btn btn-danger">
        Volver al inicio
      </Link>
    </main>
  );
}
