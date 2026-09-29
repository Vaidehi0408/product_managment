import React, { useState, useEffect } from 'react';
import Sidebar from './components/common/Sidebar';
import TopHeader from './components/common/TopHeader';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import OrdersPage from './pages/OrdersPage';
import CustomersPage from './pages/CustomersPage';
import ProductFormModal from './components/products/ProductFormModal';
import CreateOrderModal from './components/orders/CreateOrderModal';
import OrderDetailModal from './components/orders/OrderDetailModal';

import { getProducts, createProduct, updateProduct, getCategories } from './api/productService';
import { getCustomers } from './api/customerService';
import { getOrderById, createOrder, updateOrderStatus } from './api/orderService';
import { resetAndSeedDatabase } from './api/dashboardService';
import { useToast } from './context/ToastContext';

function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const [activeOrderDetail, setActiveOrderDetail] = useState(null);
  const [isUpdatingOrderStatus, setIsUpdatingOrderStatus] = useState(false);

  const [isResetting, setIsResetting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { addToast } = useToast();

  // Load auxiliary data for modals
  const loadSharedData = async () => {
    try {
      const [catRes, prodRes, custRes] = await Promise.all([
        getCategories(),
        getProducts({ limit: 100 }),
        getCustomers(),
      ]);
      setCategories(catRes.data || []);
      setAllProducts(prodRes.data || []);
      setCustomers(custRes.data || []);
    } catch (err) {
      console.error('Error loading auxiliary data:', err);
    }
  };

  useEffect(() => {
    loadSharedData();
  }, [refreshKey]);

  // Product modal handlers
  const handleOpenProductModal = (product = null) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (formData) => {
    try {
      setIsSavingProduct(true);
      if (editingProduct) {
        await updateProduct(editingProduct._id, formData);
        addToast(`Product "${formData.name}" updated successfully`, 'success');
      } else {
        await createProduct(formData);
        addToast(`Product "${formData.name}" created successfully`, 'success');
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Order modal handlers
  const handleOpenCreateOrder = () => {
    loadSharedData();
    setIsCreateOrderOpen(true);
  };

  const handleSaveOrder = async (orderPayload) => {
    try {
      setIsCreatingOrder(true);
      const res = await createOrder(orderPayload);
      addToast(`Order ${res.data?.orderNumber} created successfully!`, 'success');
      setIsCreateOrderOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleViewOrder = async (orderId) => {
    try {
      const res = await getOrderById(orderId);
      setActiveOrderDetail(res.data);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleUpdateOrderStatus = async (orderId, targetStatus) => {
    try {
      setIsUpdatingOrderStatus(true);
      const res = await updateOrderStatus(orderId, targetStatus);
      addToast(res.message, 'success');
      setActiveOrderDetail(res.data);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsUpdatingOrderStatus(false);
    }
  };

  const pageMeta = {
    dashboard: {
      title: 'Dashboard Overview',
      subtitle: 'Stock counts, sales performance, and recent transaction stream',
    },
    products: {
      title: 'Products & Inventory',
      subtitle: 'Catalog SKUs, prices, stock levels, and category groupings',
    },
    orders: {
      title: 'Orders Management',
      subtitle: 'Order fulfillment status, price snapshot history, and stock deductions',
    },
    customers: {
      title: 'Customer Directory',
      subtitle: 'Customer contact details and complete ordering history',
    },
  };

  return (
    <div className="app-container">
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />

      <div className="main-wrapper">
        <TopHeader
          title={pageMeta[currentTab]?.title || 'Inventory & Order Management'}
          subtitle={pageMeta[currentTab]?.subtitle}
        />

        <main className="content-body" key={refreshKey}>
          {currentTab === 'dashboard' && (
            <DashboardPage
              onNavigate={setCurrentTab}
              onOpenCreateOrder={handleOpenCreateOrder}
              onOpenAddProduct={() => handleOpenProductModal(null)}
              onViewOrder={handleViewOrder}
            />
          )}

          {currentTab === 'products' && (
            <ProductsPage
              onOpenModal={handleOpenProductModal}
              editProduct={editingProduct}
              isModalOpen={isProductModalOpen}
              onCloseModal={() => setIsProductModalOpen(false)}
            />
          )}

          {currentTab === 'orders' && (
            <OrdersPage
              onOpenCreateModal={handleOpenCreateOrder}
              onViewOrder={handleViewOrder}
            />
          )}

          {currentTab === 'customers' && (
            <CustomersPage onViewOrder={handleViewOrder} />
          )}
        </main>
      </div>

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        product={editingProduct}
        categories={categories}
        isLoading={isSavingProduct}
      />

      {/* Create Order Modal */}
      <CreateOrderModal
        isOpen={isCreateOrderOpen}
        onClose={() => setIsCreateOrderOpen(false)}
        onSave={handleSaveOrder}
        customers={customers}
        products={allProducts}
        isLoading={isCreatingOrder}
      />

      {/* Order Details Modal */}
      <OrderDetailModal
        isOpen={Boolean(activeOrderDetail)}
        onClose={() => setActiveOrderDetail(null)}
        order={activeOrderDetail}
        onStatusChange={handleUpdateOrderStatus}
        isUpdating={isUpdatingOrderStatus}
      />
    </div>
  );
}

export default App;
