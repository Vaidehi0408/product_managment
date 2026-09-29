import React from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  RotateCcw,
  Boxes,
} from 'lucide-react';

const Sidebar = ({ currentTab, setCurrentTab, onResetData, isResetting }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'products', label: 'Products', icon: <Package size={20} /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingCart size={20} /> },
    { id: 'customers', label: 'Customers', icon: <Users size={20} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <Boxes size={22} color="#fff" />
        </div>
        <div>
          <div className="sidebar-title" style={{ fontSize: '1rem' }}>Mini Inventory</div>
          <span style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: 600, letterSpacing: '0.04em' }}>
            & Order Management
          </span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${currentTab === item.id ? 'active' : ''}`}
            onClick={() => setCurrentTab(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
