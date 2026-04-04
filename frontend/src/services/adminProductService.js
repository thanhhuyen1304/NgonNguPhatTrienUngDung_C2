import api, { getResponseData } from './api';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export const createEmptyProductFormData = () => ({
  name: '',
  description: '',
  price: '',
  comparePrice: '',
  category: '',
  stock: '',
  brand: '',
  tags: '',
  isFeatured: false,
});

export const mapProductToFormData = (product) => ({
  name: product.name,
  description: product.description,
  price: product.price,
  comparePrice: product.comparePrice || '',
  category: product.category?._id || '',
  stock: product.stock,
  brand: product.brand || '',
  tags: product.tags?.join(', ') || '',
  isFeatured: product.isFeatured || false,
});

export const buildAdminProductPayload = (formData) => ({
  ...formData,
  price: parseFloat(formData.price),
  comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : undefined,
  stock: parseInt(formData.stock, 10),
  tags: formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
});

export const validateProductImageFiles = (files = []) => {
  const validFiles = [];
  const rejectedFiles = [];

  files.forEach((file) => {
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      rejectedFiles.push(file.name);
      return;
    }

    validFiles.push(file);
  });

  return { validFiles, rejectedFiles };
};

export const getAdminProduct = async (productId) => {
  const response = await api.get(`/products/${productId}`);
  return getResponseData(response)?.product;
};

export const getAdminProductFormSeed = async (productId) => {
  const [categories, product] = await Promise.all([
    getAdminProductCategories(),
    productId ? getAdminProduct(productId) : Promise.resolve(null),
  ]);

  return {
    categories,
    product,
  };
};

export const getAdminProductCategories = async () => {
  const response = await api.get('/categories');
  return getResponseData(response)?.categories || [];
};

export const getAdminProducts = async ({ page, search, category }) => {
  const params = new URLSearchParams({
    page,
    limit: 15,
    ...(search && { search }),
    ...(category && { category }),
  });

  const response = await api.get(`/products/admin/all?${params.toString()}`);
  const data = getResponseData(response) || {};
  return {
    products: data.products || [],
    totalPages: data.pagination?.pages || 1,
  };
};

export const saveAdminProduct = async ({ productId, formData }) => {
  const payload = buildAdminProductPayload(formData);

  if (productId) {
    await api.put(`/products/${productId}`, payload);
    return productId;
  }

  const response = await api.post('/products', payload);
  return getResponseData(response)?.product?._id;
};

export const uploadAdminProductImages = async ({ productId, files }) => {
  if (!files || files.length === 0) {
    return;
  }

  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images', file);
  });

  await api.post(`/products/${productId}/images`, formData);
};

export const deleteAdminProductImage = async ({ productId, imageId }) => {
  await api.delete(`/products/${productId}/images/${imageId}`);
};

export const deleteAdminProduct = async (productId) => {
  await api.delete(`/products/${productId}`);
};
