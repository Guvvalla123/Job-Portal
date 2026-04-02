/**
 * Consistent page title block: label (optional), title, description, actions.
 */
export function PageHeader({
  label,
  title,
  description,
  actions,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${className}`}
    >
      <div className="min-w-0">
        {label && <p className="type-section-label">{label}</p>}
        <h1 className={label ? 'type-page-title mt-1' : 'type-page-title'}>{title}</h1>
        {description && <p className="type-body mt-1 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  )
}
