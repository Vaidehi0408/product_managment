import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

const CreateOrderModal = ({
  isOpen,
  onClose,
  onSave,
  customers = [],
  products = [],
  isLoading = false,
}) => {
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState([{ productId: '', quantity: 1 }]);
  const [status, setStatus] = useState('Confirmed');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Active products only (cannot order archived/deleted items)
  const availableProducts = products.filter((p) => !p.isDeleted && p.status === 'Active');

  useEffect(() => {
    if (isOpen) {
      setCustomerId(customers.length > 0 ? customers[0]._id : '');
      setItems([{ productId: availableProducts.length > 0 ? availableProducts[0]._id : '', quantity: 1 }]);
      setStatus('Confirmed');
      setNotes('');
      setErrorMsg('');
    }
  }, [isOpen, customers, products]);

  const handleAddItem = () => {
    const defaultProduct = availableProducts.length > 0 ? availableProducts[0]._id : '';
    setItems((prev) => [...prev, { productId: defaultProduct, quantity: 1 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) {
      setErrorMsg('An order must have at least one product line item.');
      return;
    }
    setItems((prev) => prev.filter((_, idx) => idx !== index));
    setErrorMsg('');
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setErrorMsg('');
  };

  // Find product by ID
  const getProduct = (pId) => availableProducts.find((p) => p._id === pId);

  // Calculate live grand total
  const calculatedGrandTotal = items.reduce((acc, itm) => {
    const prod = getProduct(itm.productId);
    if (!prod) return acc;
    const qty = parseInt(itm.quantity, 10) || 0;
    return acc + prod.price * qty;
  }, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customerId) {
      setErrorMsg('Please select a customer.');
      return;
    }

    if (items.length === 0) {
      setErrorMsg('Please add at least one product.');
      return;
    }

    // Validate quantities and stock
    for (let i = 0; i < items.length; i++) {
      const itm = items[i];
      const prod = getProduct(itm.productId);
      const qty = parseInt(itm.quantity, 10);

      if (!prod) {
        setErrorMsg(`Item #${i + 1} has an invalid product selection.`);
        return;
      }

      if (isNaN(qty) || qty <= 0) {
        setErrorMsg(`Item #${i + 1} ("${prod.name}") has an invalid quantity. Must be at least 1.`);
        return;
      }

      if (status === 'Confirmed' && qty > prod.stock) {
        setErrorMsg(
          `Insufficient stock for "${prod.name}". Available: ${prod.stock}, Requested: ${qty}.`
        );
        return;
      }
    }

    setErrorMsg('');
    onSave({
      customerId,
      items: items.map((i) => ({ productId: i.productId, quantity: parseInt(i.quantity, 10) })),
      status,
      notes,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Customer Order"
      size="large"
      footer={
        <>
          <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Estimated Total:</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>
              ${calculatedGrandTotal.toFixed(2)}
            </span>
          </div>
          <button className="btn btn-secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Creating Order...' : 'Place Order'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        {errorMsg && (
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#fca5a5',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '18px',
            }}
          >
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Customer *</label>
            <select
              className="form-select"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Initial Order Status</label>
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Confirmed">Confirmed (Immediately reserves & deducts stock)</option>
              <option value="Pending">Pending (Draft / Payment awaiting)</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: '14px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label className="form-label" style={{ marginBottom: 0 }}>
            Order Line Items *
          </label>
          <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={handleAddItem}>
            <Plus size={14} /> Add Item
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {items.map((item, index) => {
            const product = getProduct(item.productId);
            const stockRemaining = product ? product.stock : 0;
            const itemSubtotal = product ? (product.price * (parseInt(item.quantity, 10) || 0)).toFixed(2) : '0.00';
            const isStockExceeded = product && parseInt(item.quantity, 10) > stockRemaining;

            return (
              <div
                key={index}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '3fr 1fr 1fr auto',
                  gap: '12px',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: isStockExceeded ? '1px solid #ef4444' : '1px solid var(--border-color)',
                }}
              >
                <div>
                  <select
                    className="form-select"
                    value={item.productId}
                    onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                  >
                    {availableProducts.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} — ${p.price.toFixed(2)} ({p.stock} in stock)
                      </option>
                    ))}
                  </select>
                  {product && (
                    <div style={{ fontSize: '0.75rem', marginTop: '4px', color: isStockExceeded ? '#f87171' : 'var(--text-muted)' }}>
                      SKU: {product.sku} | In Stock: <strong>{product.stock}</strong>
                      {isStockExceeded && ' (Insufficient Stock!)'}
                    </div>
                  )}
                </div>

                <div>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className="form-input"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    placeholder="Qty"
                  />
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '2px' }}>
                    Units
                  </div>
                </div>

                <div style={{ textAlign: 'right', fontWeight: 600 }}>
                  <div style={{ color: '#fff' }}>${itemSubtotal}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    @ ${product ? product.price.toFixed(2) : '0.00'}
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => handleRemoveItem(index)}
                    title="Remove item line"
                    style={{ color: '#f87171' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="form-group">
          <label className="form-label">Order Notes / Instructions (Optional)</label>
          <textarea
            rows="2"
            className="form-textarea"
            placeholder="e.g. Priority shipping, special packaging request"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
};

export default CreateOrderModal;
