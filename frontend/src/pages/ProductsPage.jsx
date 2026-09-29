import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Package,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Badge from '../components/common/Badge';
import ConfirmDialog from '../components/common/ConfirmDialog';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
} from '../api/productService';
import { useToast } from '../context/ToastContext';

const ProductsPage = ({ onOpenModal, editProduct, isModalOpen, onCloseModal }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [page, setPage] = useState(1);

  // Delete dialog
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { addToast } = useToast();

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      setCategories(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const params = {
        page,
        limit: 8,
        search,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
      };
      const res = await getProducts(params);
      setProducts(res.data || []);
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
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, selectedCategory, selectedStatus]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchProducts();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    try {
      setIsDeleting(true);
      const res = await deleteProduct(deleteCandidate._id);
      addToast(res.message, 'success');
      setDeleteCandidate(null);
      fetchProducts();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStockBadge = (stock) => {
    if (stock === 0) {
      return <Badge variant="danger">Out of Stock (0)</Badge>;
    }
    if (stock <= 10) {
      return <Badge variant="warning">Low Stock ({stock})</Badge>;
    }
    return <Badge variant="success">In Stock ({stock})</Badge>;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return <Badge variant="success">Active</Badge>;
      case 'Inactive':
        return <Badge variant="warning">Inactive</Badge>;
      case 'Archived':
        return <Badge variant="danger">Archived</Badge>;
      default:
        return <Badge variant="info">{status}</Badge>;
    }
  };

  return (
    <div>
      {/* Header & Primary Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Product Catalog & Inventory</h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            Manage inventory items, SKUs, category classifications, and real-time stock levels
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => onOpenModal(null)}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by product name, SKU, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <select
            className="filter-select"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Archived">Archived</option>
          </select>

          <button className="btn btn-secondary" onClick={fetchProducts} title="Reload catalog">
            <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product Details</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Unit Price</th>
              <th>Stock Status</th>
              <th>Catalog Status</th>
              <th>Last Updated</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && products.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  Loading catalog products...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No products found matching the criteria.
                </td>
              </tr>
            ) : (
              products.map((prod) => (
                <tr key={prod._id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{prod.name}</div>
                    {prod.description && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {prod.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <code style={{ fontFamily: 'var(--font-mono)', color: '#818cf8', fontWeight: 600 }}>
                      {prod.sku}
                    </code>
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-secondary)' }}>{prod.category}</span>
                  </td>
                  <td>
                    <strong style={{ color: '#10b981' }}>${prod.price.toFixed(2)}</strong>
                  </td>
                  <td>{getStockBadge(prod.stock)}</td>
                  <td>{getStatusBadge(prod.status)}</td>
                  <td style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                    {new Date(prod.updatedAt).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        className="btn-icon"
                        title="Edit Product"
                        onClick={() => onOpenModal(prod)}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        className="btn-icon"
                        title="Delete Product (Soft delete)"
                        style={{ color: '#f87171' }}
                        onClick={() => setDeleteCandidate(prod)}
                      >
                        <Trash2 size={15} />
                      </button>
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
            Showing page {meta.page} of {meta.totalPages} ({meta.total} total items)
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteCandidate)}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteCandidate?.name}" (SKU: ${deleteCandidate?.sku})? This product will be safely soft-deleted/archived to preserve historic customer invoices.`}
        confirmText="Archive Product"
        isDanger={true}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ProductsPage;
