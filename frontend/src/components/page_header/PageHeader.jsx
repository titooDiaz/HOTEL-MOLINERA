export default function PageHeader({
  title,
  subtitle,
  actionLabel,
  actionVariant = "primary",
  children,
}) {
  return (
    <section className="admin-page-header" aria-labelledby="admin-page-title">
      <div>
        <h1 id="admin-page-title" className="admin-page-title">{title}</h1>
        {subtitle && <p className="admin-page-subtitle">{subtitle}</p>}
      </div>
      <div className="admin-page-header-actions">
        {children}
        {actionLabel && (
          <button className={`admin-action-button admin-action-button--${actionVariant}`} type="button">
            {actionLabel}
          </button>
        )}
      </div>
    </section>
  );
}
