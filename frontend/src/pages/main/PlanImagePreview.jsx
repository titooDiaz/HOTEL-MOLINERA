import { Link, useSearchParams } from "react-router-dom";

export default function PlanImagePreview() {
  const [searchParams] = useSearchParams();
  const image = searchParams.get("src") || "/images/places/piscina-dia.jpeg";
  const title = searchParams.get("title") || "Imagen del plan";

  return (
    <main className="container py-5">
      <div className="d-flex justify-content-between align-items-center gap-3 mb-4">
        <h1 className="h3 mb-0">{title}</h1>
        <Link className="btn btn-outline-secondary" to="/planes">Volver a planes</Link>
      </div>
      <div className="rounded-4 overflow-hidden shadow-sm bg-dark">
        <img src={image} alt={title} className="d-block w-100" style={{ maxHeight: "75vh", objectFit: "contain" }} />
      </div>
    </main>
  );
}
