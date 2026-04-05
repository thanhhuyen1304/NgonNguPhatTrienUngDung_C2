import api, { getResponseData } from './api';

export const verifyMomoPayment = async (momoOrderId) => {
  const response = await api.get(
    `/payment/momo/verify?momoOrderId=${encodeURIComponent(momoOrderId)}`
  );

  const data = getResponseData(response) || {};

  return {
    paymentStatus: data.paymentStatus,
    order: data.order || null,
    momoMessage: data.momoMessage || '',
  };
};

export const buildPaymentResultState = ({ paymentStatus, order, momoMessage, fallbackMessage }) => {
  if (paymentStatus === 'paid') {
    return {
      status: 'success',
      order,
      message: 'Thanh toán thành công! Cảm ơn bạn đã đặt hàng.',
    };
  }

  return {
    status: 'failed',
    order,
    message: fallbackMessage || momoMessage || 'Thanh toán thất bại hoặc bị hủy.',
  };
};
