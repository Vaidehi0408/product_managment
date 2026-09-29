import apiClient from './apiClient';

export const getOrders = (params = {}) => {
  return apiClient.get('/orders', { params });
};

export const getOrderById = (id) => {
  return apiClient.get(`/orders/${id}`);
};

export const createOrder = (payload) => {
  return apiClient.post('/orders', payload);
};

export const updateOrderStatus = (id, status, notes = '') => {
  return apiClient.patch(`/orders/${id}/status`, { status, notes });
};

export const updateOrder = (id, payload) => {
  return apiClient.put(`/orders/${id}`, payload);
};
