import { statusLabel } from "../../utils/format";

const TONES = {
  pending: "warning",
  shortlisted: "info",
  hired: "success",
  rejected: "danger",
  withdrawn: "neutral",
  active: "success",
  expired: "neutral",
  blocked: "danger",
};

const StatusBadge = ({ status, label, className = "" }) => {
  const tone = TONES[status] || "neutral";
  return (
    <span className={`badge badge-${tone} ${className}`.trim()}>
      <span className="badge-dot" aria-hidden="true" />
      {label || statusLabel(status)}
    </span>
  );
};

export default StatusBadge;
