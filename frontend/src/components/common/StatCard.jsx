import React from 'react';

const StatCard = ({ title, value, hint, icon, color = 'primary' }) => {
  const colorMap = {
    primary: { bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8' },
    success: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399' },
    warning: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24' },
    info: { bg: 'rgba(14, 165, 233, 0.15)', text: '#38bdf8' },
    danger: { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171' },
  };

  const scheme = colorMap[color] || colorMap.primary;

  return (
    <div className="glass-card metric-card">
      <div className="metric-icon-box" style={{ background: scheme.bg, color: scheme.text }}>
        {icon}
      </div>
      <div className="metric-info">
        <div className="metric-label">{title}</div>
        <div className="metric-value">{value}</div>
        {hint && <div className="metric-hint">{hint}</div>}
      </div>
    </div>
  );
};

export default StatCard;
