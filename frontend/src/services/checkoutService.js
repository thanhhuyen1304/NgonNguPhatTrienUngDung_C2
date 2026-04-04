import api, { getResponseData } from './api';

const GEOCODING_DELAY_MS = 600;
const DEFAULT_COORDINATES = {
  latitude: 10.7769,
  longitude: 106.7009,
};

const mockCoordinates = {
  '13/30': { latitude: 10.8486, longitude: 106.7121 },
  'hiệp bình phước': { latitude: 10.8486, longitude: 106.7121 },
  'hiệp phú': { latitude: 10.8435, longitude: 106.7135 },
  'lê văn việt': { latitude: 10.8435, longitude: 106.7135 },
  'quận 1': { latitude: 10.7769, longitude: 106.7009 },
  'quận 3': { latitude: 10.7829, longitude: 106.6934 },
  'quận 4': { latitude: 10.7588, longitude: 106.7018 },
  'quận 5': { latitude: 10.7538, longitude: 106.668 },
  'quận 6': { latitude: 10.7481, longitude: 106.6354 },
  'quận 7': { latitude: 10.7378, longitude: 106.6621 },
  'quận 8': { latitude: 10.7248, longitude: 106.6329 },
  'quận 10': { latitude: 10.7686, longitude: 106.6661 },
  'quận 11': { latitude: 10.7645, longitude: 106.6433 },
  'quận 12': { latitude: 10.8671, longitude: 106.6413 },
  'tân bình': { latitude: 10.8008, longitude: 106.6527 },
  'bình thạnh': { latitude: 10.8014, longitude: 106.7109 },
  'phú nhuận': { latitude: 10.7997, longitude: 106.6803 },
  'gò vấp': { latitude: 10.8291, longitude: 106.6622 },
  'tân phú': { latitude: 10.7942, longitude: 106.6277 },
  'bình tân': { latitude: 10.7595, longitude: 106.6026 },
  'thủ đức': { latitude: 10.8435, longitude: 106.7135 },
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const createCheckoutRequestKey = () => {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `checkout-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const buildSearchQueries = (formData) => {
  const addressParts = [formData.street, formData.city, formData.country]
    .filter(Boolean)
    .flatMap((part) => part.split(','))
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  const searchQueries = [];
  if (addressParts.length > 0) {
    searchQueries.push(addressParts.join(', '));
  }

  if (addressParts.length > 1) {
    searchQueries.push(addressParts.slice(1).join(', '));
  }

  if (addressParts.length > 2) {
    searchQueries.push(addressParts.slice(2).join(', '));
  }

  const streetParts = formData.street
    ? formData.street.split(',').map((part) => part.trim()).filter(Boolean)
    : [];

  if (streetParts.length >= 2) {
    searchQueries.push(`${streetParts.slice(-2).join(', ')}, ${formData.country || 'Vietnam'}`);
  } else if (streetParts.length === 1) {
    searchQueries.push(`${streetParts[0]}, ${formData.country || 'Vietnam'}`);
  }

  if (formData.city) {
    searchQueries.push(`${formData.city}, ${formData.country || 'Vietnam'}`);
  }

  return searchQueries;
};

const findMockCoordinates = (addressString) => {
  const addressLower = addressString.toLowerCase();

  for (const [key, coords] of Object.entries(mockCoordinates)) {
    const regexSuffix = /[0-9]$/.test(key) ? '(?![0-9])' : '';
    const regex = new RegExp(key + regexSuffix, 'i');

    if (regex.test(addressLower)) {
      return coords;
    }
  }

  return null;
};

export const resolveShippingCoordinates = async (formData) => {
  const addressString = `${formData.street}, ${formData.city}, ${formData.country}`;
  const searchQueries = buildSearchQueries(formData);

  for (const query of searchQueries) {
    if (!query || query.trim() === '' || query === 'Vietnam') {
      continue;
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=vn`;
      const response = await fetch(url);

      if (response.ok) {
        const geoData = await response.json();
        if (geoData && geoData.length > 0) {
          return {
            latitude: parseFloat(geoData[0].lat),
            longitude: parseFloat(geoData[0].lon),
          };
        }
      }
    } catch (error) {
      console.error(`Geocoding failed for query "${query}":`, error);
    }

    await sleep(GEOCODING_DELAY_MS);
  }

  return findMockCoordinates(addressString) || DEFAULT_COORDINATES;
};

export const applyCouponCode = async ({ code, orderAmount }) => {
  const response = await api.post('/coupons/apply', {
    code: code.trim(),
    orderAmount,
  });

  return getResponseData(response);
};

export const createMomoPayment = async (orderData) => {
  const response = await api.post('/payment/momo/create', orderData);
  const data = response.data;

  if (!data.success) {
    throw new Error(data.message || 'Không thể tạo link thanh toán MoMo');
  }

  return data.data.payUrl;
};

export const buildOrderPayload = ({ formData, coordinates, couponInfo }) => ({
  shippingAddress: {
    fullName: formData.fullName,
    phone: formData.phone,
    street: formData.street,
    city: formData.city,
    country: formData.country,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
  },
  paymentMethod: formData.paymentMethod,
  note: formData.note,
  checkoutRequestKey: createCheckoutRequestKey(),
  couponCode: couponInfo?.coupon?.code || null,
});
