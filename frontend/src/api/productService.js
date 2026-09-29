import apiClient from './apiClient';

export const getProducts = (params = {}) => {
  return apiClient.get('/products', { params });
};

export const getProductById = (id) => {
  return apiClient.get(`/products/${id}`);
};

export const createProduct = (payload) => {
  return apiClient.post('/products', payload);
};

export const updateProduct = (id, payload) => {
  return apiClient.put(`/products/${id}`, payload);
};

export const deleteProduct = (id) => {
  return apiClient.delete(`/products/${id}`);
};

export const getCategories = () => {
  return apiClient.get('/products/meta/categories');
};
