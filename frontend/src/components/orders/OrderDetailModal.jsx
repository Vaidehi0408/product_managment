import React from 'react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import { CheckCircle2, XCircle, Clock, PackageCheck, AlertTriangle } from 'lucide-react';

const OrderDetailModal = ({
  isOpen,
  onClose,
  order,
  onStatusChange,
  isUpdating = false,
}) => {
  if (!order) return null;

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Order Details: ${order.orderNumber}`}
      size="large"
      footer={
        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {order.status === 'Cancelled' && (
              <span style={{ fontSize: '0.8rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={14} /> This order is cancelled. No further status changes are permitted.
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>

            {order.status === 'Pending' && (
              <>
                <button
                  className="btn btn-danger"
                  onClick={() => onStatusChange(order._id, 'Cancelled')}
                  disabled={isUpdating}
                >
                  <XCircle size={15} /> Cancel Order
                </button>
                <button
                  className="btn btn-success"
                  onClick={() => onStatusChange(order._id, 'Confirmed')}
                  disabled={isUpdating}
                >
                  <CheckCircle2 size={15} /> Confirm Order
                </button>
              </>
            )}

            {order.status === 'Confirmed' && (
              <button
                className="btn btn-danger"
                onClick={() => onStatusChange(order._id, 'Cancelled')}
                disabled={isUpdating}
              >
                <XCircle size={15} /> Cancel Order (Restore Stock)
              </button>
            )}
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Top Summary Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '14px',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Status</div>
            <div style={{ marginTop: '6px' }}>{getStatusBadge(order.status)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Amount</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
              ${order.totalAmount?.toFixed(2)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Stock Deducted</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: order.stockDeducted ? '#34d399' : '#94a3b8', marginTop: '4px' }}>
              {order.stockDeducted ? 'Yes (Reserved)' : 'No'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Order Placed</div>
            <div style={{ fontSize: '0.85rem', color: '#fff', marginTop: '4px' }}>
              {new Date(order.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <h4 style={{ fontSize: '0.9rem', marginBottom: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Customer Details
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.875rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Name: </span>
              <strong>{order.customer?.name || 'Unknown'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Email: </span>
              <span>{order.customer?.email || 'N/A'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Phone: </span>
              <span>{order.customer?.phone || 'N/A'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Address: </span>
              <span>{order.customer?.address || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div>
          <h4 style={{ fontSize: '0.9rem', marginBottom: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Order Items (Immutable Price Snapshot)
          </h4>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Unit Price Snapshot</th>
                  <th>Quantity</th>
                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <strong>{item.name}</strong>
                      {item.product?.isDeleted && (
                        <span style={{ fontSize: '0.7rem', color: '#f87171', marginLeft: '6px' }}>
                          (Archived Product)
                        </span>
                      )}
                    </td>
                    <td>
                      <code style={{ fontFamily: 'var(--font-mono)', color: '#818cf8' }}>{item.sku}</code>
                    </td>
                    <td>${item.unitPrice?.toFixed(2)}</td>
                    <td>{item.quantity}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      ${item.subtotal?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700, padding: '16px 18px' }}>
                    Grand Total:
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '1.1rem', color: '#10b981', padding: '16px 18px' }}>
                    ${order.totalAmount?.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Notes & Timeline */}
        {order.notes && (
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Notes:
            </span>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{order.notes}</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default OrderDetailModal;
