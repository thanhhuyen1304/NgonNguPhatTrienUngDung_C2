import api, { getResponseData } from './api';

const normalizeStatusParam = (status) => {
  if (status === 'active') {
    return 'shipped';
  }

  return status;
};

export const getAdminOrders = async ({
  page,
  status,
  searchTerm,
  paymentStatus,
  dateRange,
}) => {
  const params = new URLSearchParams({
    page,
    limit: 15,
    ...(normalizeStatusParam(status) && { status: normalizeStatusParam(status) }),
    ...(searchTerm && { search: searchTerm }),
    ...(paymentStatus && { paymentStatus }),
    ...(dateRange.start && { startDate: dateRange.start }),
    ...(dateRange.end && { endDate: dateRange.end }),
  });

  const response = await api.get(`/orders/admin/all?${params.toString()}`);
  const data = getResponseData(response) || {};
  return {
    orders: data.orders || [],
    totalPages: data.pagination?.pages || 1,
  };
};

export const getAdminOrderStats = async () => {
  const response = await api.get('/orders/admin/stats');
  return getResponseData(response);
};

export const updateAdminOrderStatus = async ({ orderId, status }) => {
  await api.put(`/orders/${orderId}/status`, { status });
};
