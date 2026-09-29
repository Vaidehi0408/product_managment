import apiClient from './apiClient';

export const getDashboardStats = () => {
  return apiClient.get('/dashboard/stats');
};

export const resetAndSeedDatabase = () => {
  return apiClient.post('/seed');
};
