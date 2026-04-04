import api, { getResponseData } from './api';

export const getAdminUsers = async ({ page, search, role }) => {
  const params = new URLSearchParams({
    page,
    limit: 15,
    ...(search && { search }),
    ...(role && { role }),
  });

  const response = await api.get(`/users?${params.toString()}`);
  const data = getResponseData(response) || {};
  return {
    users: data.users || [],
    totalPages: data.pagination?.pages || 1,
  };
};

export const updateAdminUser = async (userId, payload) => {
  await api.put(`/users/${userId}`, payload);
};

export const deleteAdminUser = async (userId) => {
  await api.delete(`/users/${userId}`);
};
