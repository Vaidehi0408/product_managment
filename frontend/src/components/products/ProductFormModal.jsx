import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';

const ProductFormModal = ({ isOpen, onClose, onSave, product = null, categories = [], isLoading = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    stock: '',
    category: '',
    status: 'Active',
    description: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        price: product.price !== undefined ? product.price : '',
        stock: product.stock !== undefined ? product.stock : '',
        category: product.category || '',
        status: product.status || 'Active',
        description: product.description || '',
      });
    } else {
      setFormData({
        name: '',
        sku: '',
        price: '',
        stock: '',
        category: categories.length > 0 ? categories[0] : 'Electronics',
        status: 'Active',
        description: '',
      });
    }
    setErrors({});
  }, [product, isOpen, categories]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'sku' ? value.toUpperCase().replace(/\s+/g, '') : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
    if (formData.price === '' || isNaN(formData.price) || Number(formData.price) < 0) {
      newErrors.price = 'Price must be a valid number >= 0';
    }
    if (formData.stock === '' || isNaN(formData.stock) || Number(formData.stock) < 0 || !Number.isInteger(Number(formData.stock))) {
      newErrors.stock = 'Stock must be an integer >= 0';
    }
    if (!formData.category.trim()) newErrors.category = 'Category is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      ...formData,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock, 10),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Edit Product' : 'Add New Product'}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Product Name *</label>
          <input
            type="text"
            name="name"
            className="form-input"
            placeholder="e.g. Logitech MX Master 3S"
            value={formData.name}
            onChange={handleChange}
          />
          {errors.name && <span style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{errors.name}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">SKU (Stock Keeping Unit) *</label>
            <input
              type="text"
              name="sku"
              className="form-input"
              placeholder="e.g. LOGI-MX3S"
              value={formData.sku}
              onChange={handleChange}
              style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}
            />
            {errors.sku && <span style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{errors.sku}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Category *</label>
            <input
              type="text"
              name="category"
              className="form-input"
              placeholder="e.g. Electronics"
              list="category-suggestions"
              value={formData.category}
              onChange={handleChange}
            />
            <datalist id="category-suggestions">
              {categories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
            {errors.category && <span style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{errors.category}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Unit Price ($) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="price"
              className="form-input"
              placeholder="0.00"
              value={formData.price}
              onChange={handleChange}
            />
            {errors.price && <span style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{errors.price}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Initial Stock Units *</label>
            <input
              type="number"
              step="1"
              min="0"
              name="stock"
              className="form-input"
              placeholder="0"
              value={formData.stock}
              onChange={handleChange}
            />
            {errors.stock && <span style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{errors.stock}</span>}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Status</label>
          <select name="status" className="form-select" value={formData.status} onChange={handleChange}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Archived">Archived</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Description (Optional)</label>
          <textarea
            name="description"
            rows="3"
            className="form-textarea"
            placeholder="Brief product notes or specs..."
            value={formData.description}
            onChange={handleChange}
          />
        </div>
      </form>
    </Modal>
  );
};

export default ProductFormModal;
