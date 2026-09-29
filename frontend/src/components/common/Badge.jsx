import React from 'react';

const Badge = ({ variant = 'info', children }) => {
  return (
    <span className={`badge badge-${variant}`}>
      <span className="badge-dot" />
      {children}
    </span>
  );
};

export default Badge;
