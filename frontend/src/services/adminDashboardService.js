import api, { getResponseData } from './api';

const DEFAULT_ORDER_STATS = {
  summary: { totalOrders: 0, totalRevenue: 0 },
  statusCounts: [],
};

const DEFAULT_PRODUCT_STATS = {
  totalProducts: 0,
  activeProducts: 0,
  featuredProducts: 0,
  outOfStock: 0,
  lowStock: 0,
  topSelling: [],
  productsByCategory: [],
};

export const getDefaultDashboardStats = () => ({
  orders: DEFAULT_ORDER_STATS,
  products: DEFAULT_PRODUCT_STATS,
});

export const getDashboardStats = async () => {
  const [orderStats, productStats] = await Promise.all([
    api
      .get('/orders/admin/stats')
      .then((response) => getResponseData(response))
      .catch((error) => {
        console.error('Orders stats error:', error);
        return DEFAULT_ORDER_STATS;
      }),
    api
      .get('/products/admin/stats')
      .then((response) => getResponseData(response))
      .catch((error) => {
        console.error('Products stats error:', error);
        return DEFAULT_PRODUCT_STATS;
      }),
  ]);

  return {
    orders: orderStats,
    products: productStats,
  };
};
