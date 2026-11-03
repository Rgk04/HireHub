const BarChart = ({ data = [], emptyLabel = "No data yet." }) => {
  const max = Math.max(...data.map((item) => item.count || 0), 1);
  if (!data.length) {
    return <p className="chart-empty">{emptyLabel}</p>;
  }

  return (
    <div className="bar-chart">
      {data.map((item) => (
        <div className="bar-row" key={item.label}>
          <div className="bar-meta">
            <span className="bar-label" title={item.label}>
              {item.label}
            </span>
            <span className="bar-value">{item.count}</span>
          </div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${Math.max(4, (item.count / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default BarChart;
