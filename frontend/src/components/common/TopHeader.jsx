import React from 'react';
import { Activity } from 'lucide-react';

const TopHeader = ({ title, subtitle }) => {
  return (
    <header className="top-header">
      <div className="header-title-block">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(16, 185, 129, 0.1)',
            padding: '6px 12px',
            borderRadius: '999px',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            fontSize: '0.785rem',
            color: '#34d399',
            fontWeight: 500,
          }}
        >
          <Activity size={14} />
          <span>System Online</span>
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
