import api, { getResponseData } from './api';

export const getAdminCoupons = async () => {
  const response = await api.get('/coupons');
  return getResponseData(response)?.coupons || [];
};

export const createAdminCoupon = async (payload) => {
  await api.post('/coupons', payload);
};

export const updateAdminCoupon = async (couponId, payload) => {
  await api.put(`/coupons/${couponId}`, payload);
};

export const deleteAdminCoupon = async (couponId) => {
  await api.delete(`/coupons/${couponId}`);
};
