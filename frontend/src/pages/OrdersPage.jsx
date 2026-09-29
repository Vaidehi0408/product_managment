import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import Badge from '../components/common/Badge';
import { getOrders, updateOrderStatus } from '../api/orderService';
import { useToast } from '../context/ToastContext';

const OrdersPage = ({ onOpenCreateModal, onViewOrder }) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });

  // Filter state
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { addToast } = useToast();

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const params = {
        page,
        limit: 8,
        search,
        status: activeTab !== 'All' ? activeTab : undefined,
      };
      const res = await getOrders(params);
      setOrders(res.data || []);
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchOrders();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const handleQuickStatusChange = async (orderId, newStatus) => {
    try {
      const res = await updateOrderStatus(orderId, newStatus);
      addToast(res.message, 'success');
      fetchOrders();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

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

  return (
    <div>
      {/* Header & Primary Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Order Processing & Management</h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            Track order fulfillment status, customer purchases, and inventory stock transitions
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenCreateModal}>
          <Plus size={16} /> Create Order
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="filter-bar">
        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-input)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          {['All', 'Confirmed', 'Pending', 'Cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setPage(1);
              }}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeTab === tab ? 'var(--primary)' : 'transparent',
                color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
                fontWeight: activeTab === tab ? 600 : 500,
                fontSize: '0.825rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="search-input-wrap">
            <Search size={16} />
            <input
              type="text"
              className="search-input"
              placeholder="Search by order number or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button className="btn btn-secondary" onClick={fetchOrders} title="Reload orders">
            <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Items Count</th>
              <th>Total Amount</th>
              <th>Order Status</th>
              <th>Date Placed</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && orders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  Loading order records...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((ord) => (
                <tr key={ord._id}>
                  <td>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: '#818cf8', fontWeight: 600 }}>
                      {ord.orderNumber}
                    </strong>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{ord.customer?.name || 'Unknown'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {ord.customer?.email}
                    </div>
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {ord.items?.length || 0} item{ord.items?.length !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: '#10b981', fontSize: '0.95rem' }}>
                      ${ord.totalAmount?.toFixed(2)}
                    </strong>
                  </td>
                  <td>{getStatusBadge(ord.status)}</td>
                  <td style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                    {new Date(ord.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.775rem' }}
                        onClick={() => onViewOrder(ord._id)}
                      >
                        <Eye size={13} /> View Details
                      </button>

                      {ord.status === 'Pending' && (
                        <button
                          className="btn btn-success"
                          style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                          title="Confirm order & deduct stock"
                          onClick={() => handleQuickStatusChange(ord._id, 'Confirmed')}
                        >
                          <CheckCircle2 size={13} /> Confirm
                        </button>
                      )}

                      {ord.status === 'Confirmed' && (
                        <button
                          className="btn btn-danger"
                          style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                          title="Cancel order & restore stock"
                          onClick={() => handleQuickStatusChange(ord._id, 'Cancelled')}
                        >
                          <XCircle size={13} /> Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {meta.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px' }}>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            Showing page {meta.page} of {meta.totalPages} ({meta.total} orders)
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              disabled={!meta.hasPrevPage}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              disabled={!meta.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
