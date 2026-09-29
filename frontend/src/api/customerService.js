import apiClient from './apiClient';

export const getCustomers = (params = {}) => {
  return apiClient.get('/customers', { params });
};

export const getCustomerById = (id) => {
  return apiClient.get(`/customers/${id}`);
};

export const createCustomer = (payload) => {
  return apiClient.post('/customers', payload);
};
