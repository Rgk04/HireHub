const buildPages = (current, total) => {
  const pages = [];
  const push = (value) => pages.push(value);
  if (total <= 7) {
    for (let i = 1; i <= total; i += 1) push(i);
    return pages;
  }
  push(1);
  if (current > 3) push("start-ellipsis");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i += 1) push(i);
  if (current < total - 2) push("end-ellipsis");
  push(total);
  return pages;
};

const Pagination = ({ page = 1, totalPages = 1, onChange, className = "" }) => {
  if (totalPages <= 1) return null;
  const pages = buildPages(page, totalPages);

  return (
    <nav className={`pagination ${className}`.trim()} aria-label="Pagination">
      <button
        type="button"
        className="pagination-btn"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        Previous
      </button>
      <div className="pagination-pages">
        {pages.map((item) =>
          typeof item === "number" ? (
            <button
              key={item}
              type="button"
              className={`pagination-page ${item === page ? "is-active" : ""}`}
              onClick={() => onChange(item)}
              aria-current={item === page ? "page" : undefined}
            >
              {item}
            </button>
          ) : (
            <span key={item} className="pagination-ellipsis">
              …
            </span>
          )
        )}
      </div>
      <button
        type="button"
        className="pagination-btn"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        Next
      </button>
    </nav>
  );
};

export default Pagination;
