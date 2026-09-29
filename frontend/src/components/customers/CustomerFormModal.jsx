import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';

const CustomerFormModal = ({ isOpen, onClose, onSave, isLoading = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({ name: '', email: '', phone: '', address: '' });
      setErrorMsg('');
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setErrorMsg('Name and Email are required.');
      return;
    }
    onSave(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Customer"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Customer'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        {errorMsg && (
          <div style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '14px' }}>
            {errorMsg}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <input
            type="text"
            name="name"
            className="form-input"
            placeholder="e.g. Sarah Connor"
            value={formData.name}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email Address *</label>
          <input
            type="email"
            name="email"
            className="form-input"
            placeholder="e.g. sarah@example.com"
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Phone Number</label>
          <input
            type="text"
            name="phone"
            className="form-input"
            placeholder="e.g. +1 (555) 234-5678"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Shipping / Billing Address</label>
          <textarea
            name="address"
            rows="2"
            className="form-textarea"
            placeholder="Full address line, city, state, zip"
            value={formData.address}
            onChange={handleChange}
          />
        </div>
      </form>
    </Modal>
  );
};

export default CustomerFormModal;
