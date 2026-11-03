const Spinner = ({ size = "md" }) => (
  <span className={`spinner spinner-${size}`} role="status" aria-label="Loading" />
);

export const PageLoader = ({ label = "Loading HireHub…" }) => (
  <div className="page-loader">
    <img src="/hirehub-logo.svg" alt="" className="page-loader-logo" />
    <Spinner size="lg" />
    <p>{label}</p>
  </div>
);

export const JobCardSkeleton = () => (
  <div className="job-card skeleton-card" aria-hidden="true">
    <div className="skeleton skeleton-logo" />
    <div className="skeleton-line skeleton w-70" />
    <div className="skeleton-line skeleton w-40" />
    <div className="skeleton-chip-row">
      <span className="skeleton skeleton-chip" />
      <span className="skeleton skeleton-chip" />
      <span className="skeleton skeleton-chip" />
    </div>
    <div className="skeleton-line skeleton w-55" />
  </div>
);

export const JobGridSkeleton = ({ count = 6 }) => (
  <div className="jobs-grid" aria-label="Loading jobs">
    {Array.from({ length: count }).map((_, index) => (
      <JobCardSkeleton key={index} />
    ))}
  </div>
);

export const TableSkeleton = ({ rows = 4 }) => (
  <div className="table-skeleton" aria-hidden="true">
    {Array.from({ length: rows }).map((_, index) => (
      <div className="skeleton skeleton-row" key={index} />
    ))}
  </div>
);

export default Spinner;
