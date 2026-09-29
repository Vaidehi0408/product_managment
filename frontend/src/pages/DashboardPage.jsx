import React, { useEffect, useState } from 'react';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import {
  Package,
  ShoppingCart,
  Boxes,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { getDashboardStats } from '../api/dashboardService';
import { useToast } from '../context/ToastContext';

const DashboardPage = ({ onNavigate, onOpenCreateOrder, onOpenAddProduct, onViewOrder }) => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const res = await getDashboardStats();
      setStats(res.data);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed':
        return <Badge variant="success">Confirmed</Badge>;
      case 'Pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'Cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="info">{status}</Badge>;
    }
  };

  if (isLoading && !stats) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
        <RefreshCw className="spin" size={32} style={{ margin: '0 auto 12px' }} />
        <p>Loading real-time dashboard analytics...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Operational Overview</h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            Real-time synchronization of inventory counts, orders, and sales
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={fetchStats}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button className="btn btn-secondary" onClick={onOpenAddProduct}>
            <Plus size={15} /> Add Product
          </button>
          <button className="btn btn-primary" onClick={onOpenCreateOrder}>
            <ShoppingCart size={15} /> Create Order
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="metric-grid">
        <StatCard
          title="Total Products"
          value={stats?.totalProducts ?? 0}
          hint="Active in catalog"
          icon={<Package size={24} />}
          color="primary"
        />
        <StatCard
          title="Total Stock Units"
          value={stats?.totalStock ?? 0}
          hint="Available in warehouse"
          icon={<Boxes size={24} />}
          color="info"
        />
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders ?? 0}
          hint={`${stats?.orderStatusCounts?.Confirmed ?? 0} Confirmed`}
          icon={<ShoppingCart size={24} />}
          color="warning"
        />
        <StatCard
          title="Total Sales"
          value={`$${(stats?.totalSales ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          hint="From confirmed orders"
          icon={<DollarSign size={24} />}
          color="success"
        />
      </div>

      {/* Order Status Breakdown Bar */}
      <div
        className="glass-card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          padding: '16px 20px',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
            <Clock size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Pending Orders</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{stats?.orderStatusCounts?.Pending ?? 0}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
            <CheckCircle size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Confirmed Orders</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{stats?.orderStatusCounts?.Confirmed ?? 0}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
            <XCircle size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cancelled Orders</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{stats?.orderStatusCounts?.Cancelled ?? 0}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Recent Orders Section */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Recent Customer Orders</h3>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Latest incoming order activity</p>
            </div>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.775rem' }}
              onClick={() => onNavigate('orders')}
            >
              View All <ArrowRight size={13} />
            </button>
          </div>

          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentOrders?.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No orders placed yet.
                    </td>
                  </tr>
                ) : (
                  stats?.recentOrders?.map((ord) => (
                    <tr key={ord._id}>
                      <td>
                        <strong style={{ fontFamily: 'var(--font-mono)', color: '#818cf8' }}>
                          {ord.orderNumber}
                        </strong>
                      </td>
                      <td>{ord.customer?.name || 'Customer'}</td>
                      <td>
                        <strong>${ord.totalAmount?.toFixed(2)}</strong>
                      </td>
                      <td>{getStatusBadge(ord.status)}</td>
                      <td>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          onClick={() => onViewOrder(ord._id)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Warning Section */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '18px 20px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div style={{ color: '#f59e0b' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Low Stock Alert</h3>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Items with &le; 10 units</p>
            </div>
          </div>

          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {stats?.lowStockProducts?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                All stock levels are optimal (&gt; 10 units).
              </div>
            ) : (
              stats?.lowStockProducts?.map((item) => (
                <div
                  key={item._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1, marginRight: '10px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      SKU: {item.sku}
                    </div>
                  </div>
                  <div>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: '0.775rem',
                        fontWeight: 700,
                        background: item.stock <= 3 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: item.stock <= 3 ? '#f87171' : '#fbbf24',
                        border: item.stock <= 3 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                      }}
                    >
                      {item.stock} left
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
