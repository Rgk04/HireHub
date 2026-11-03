import { Link } from "react-router-dom";

const StatCard = ({ icon, label, value, hint, tone = "blue", to }) => {
  const content = (
    <>
      <div className={`stat-icon stat-icon-${tone}`}>{icon}</div>
      <div className="stat-content">
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
        {hint && <p className="stat-hint">{hint}</p>}
      </div>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`stat-card stat-card-${tone} stat-card-link`}>
        {content}
      </Link>
    );
  }

  return <div className={`stat-card stat-card-${tone}`}>{content}</div>;
};

export default StatCard;
