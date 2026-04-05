import api, { getResponseData } from './api';

export const getAdminCategories = async () => {
  const response = await api.get('/categories/admin/all');
  return getResponseData(response)?.categories || [];
};

export const createAdminCategory = async (payload) => {
  await api.post('/categories', payload);
};

export const updateAdminCategory = async (categoryId, payload) => {
  await api.put(`/categories/${categoryId}`, payload);
};

export const deleteAdminCategory = async (categoryId) => {
  await api.delete(`/categories/${categoryId}`);
};
