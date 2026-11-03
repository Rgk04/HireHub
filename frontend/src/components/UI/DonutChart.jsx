const DonutChart = ({
  data = [],
  total,
  size = 180,
  thickness = 20,
  centerLabel = "Total",
}) => {
  const safeTotal = total ?? data.reduce((sum, item) => sum + (item.value || 0), 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="donut-wrap">
      <div className="donut-chart" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Application status chart">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--surface-subtle)"
            strokeWidth={thickness}
          />
          {safeTotal > 0 &&
            data.map((item) => {
              if (!item.value) return null;
              const length = (item.value / safeTotal) * circumference;
              const dasharray = `${Math.max(0, length - 2)} ${circumference}`;
              const dashoffset = -offset;
              offset += length;
              return (
                <circle
                  key={item.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={thickness}
                  strokeDasharray={dasharray}
                  strokeDashoffset={dashoffset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
              );
            })}
        </svg>
        <div className="donut-center">
          <strong>{safeTotal}</strong>
          <span>{centerLabel}</span>
        </div>
      </div>
      <ul className="donut-legend">
        {data.map((item) => (
          <li key={item.label}>
            <span className="legend-dot" style={{ background: item.color }} />
            <span className="legend-label">{item.label}</span>
            <span className="legend-value">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DonutChart;
