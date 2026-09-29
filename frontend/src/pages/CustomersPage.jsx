import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Mail, Phone, MapPin, RefreshCw, ShoppingBag } from 'lucide-react';
import { getCustomers, createCustomer, getCustomerById } from '../api/customerService';
import CustomerFormModal from '../components/customers/CustomerFormModal';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { useToast } from '../context/ToastContext';

const CustomersPage = ({ onViewOrder }) => {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Add customer modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Selected customer history modal
  const [selectedCustomerData, setSelectedCustomerData] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const { addToast } = useToast();

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const res = await getCustomers({ search });
      setCustomers(res.data || []);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const handleCreateCustomer = async (formData) => {
    try {
      setIsCreating(true);
      const res = await createCustomer(formData);
      addToast('Customer created successfully', 'success');
      setIsAddModalOpen(false);
      fetchCustomers();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleViewCustomer = async (id) => {
    try {
      setIsLoadingHistory(true);
      const res = await getCustomerById(id);
      setSelectedCustomerData(res.data);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Customer Directory</h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            Manage client profiles, addresses, and individual purchasing histories
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={16} /> Add Customer
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by customer name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button className="btn btn-secondary" onClick={fetchCustomers} title="Reload customers">
          <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Delivery Address</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && customers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  Loading customer profiles...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No customer profiles found.
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c._id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{c.name}</div>
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={13} style={{ color: 'var(--text-muted)' }} /> {c.email}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={13} style={{ color: 'var(--text-muted)' }} /> {c.phone || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <MapPin size={13} /> {c.address || 'N/A'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.775rem' }}
                      onClick={() => handleViewCustomer(c._id)}
                    >
                      <ShoppingBag size={13} /> View Orders
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CustomerFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleCreateCustomer}
        isLoading={isCreating}
      />

      {/* Customer Order History Modal */}
      {selectedCustomerData && (
        <Modal
          isOpen={Boolean(selectedCustomerData)}
          onClose={() => setSelectedCustomerData(null)}
          title={`Order History: ${selectedCustomerData.customer.name}`}
          size="large"
          footer={
            <button className="btn btn-secondary" onClick={() => setSelectedCustomerData(null)}>
              Close
            </button>
          }
        >
          <div style={{ marginBottom: '16px', display: 'flex', gap: '20px', fontSize: '0.875rem' }}>
            <div>Email: <strong>{selectedCustomerData.customer.email}</strong></div>
            <div>Phone: <strong>{selectedCustomerData.customer.phone || 'N/A'}</strong></div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {selectedCustomerData.orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No orders placed by this customer yet.
                    </td>
                  </tr>
                ) : (
                  selectedCustomerData.orders.map((ord) => (
                    <tr key={ord._id}>
                      <td>
                        <strong style={{ fontFamily: 'var(--font-mono)', color: '#818cf8' }}>
                          {ord.orderNumber}
                        </strong>
                      </td>
                      <td>{new Date(ord.createdAt).toLocaleDateString()}</td>
                      <td>{ord.items?.length || 0} line items</td>
                      <td>
                        <strong>${ord.totalAmount?.toFixed(2)}</strong>
                      </td>
                      <td>
                        <Badge
                          variant={
                            ord.status === 'Confirmed' ? 'success' : ord.status === 'Pending' ? 'warning' : 'danger'
                          }
                        >
                          {ord.status}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          onClick={() => {
                            setSelectedCustomerData(null);
                            onViewOrder(ord._id);
                          }}
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
        </Modal>
      )}
    </div>
  );
};

export default CustomersPage;
