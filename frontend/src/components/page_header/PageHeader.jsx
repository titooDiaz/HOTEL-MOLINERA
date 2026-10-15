import Tooltip from "../tooltip/Tooltip.jsx";

export default function PageHeader({
  title,
  subtitle,
  actionLabel,
  actionVariant = "primary",
  onAction,
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
          <Tooltip label={actionLabel}>
            <button className={`admin-action-button admin-action-button--${actionVariant}`} type="button" onClick={onAction}>
              {actionLabel}
            </button>
          </Tooltip>
        )}
      </div>
    </section>
  );
}