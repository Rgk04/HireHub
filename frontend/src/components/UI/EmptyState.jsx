const EmptyState = ({
  icon,
  title,
  message,
  action,
  compact = false,
  className = "",
}) => (
  <div className={`empty-state ${compact ? "empty-state-compact" : ""} ${className}`.trim()}>
    {icon && <div className="empty-state-icon">{icon}</div>}
    <h3>{title}</h3>
    {message && <p>{message}</p>}
    {action && <div className="empty-state-action">{action}</div>}
  </div>
);

export default EmptyState;
