const express = require('express');
const router = express.Router();

const {
  getProducts,
  getFeaturedProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImages,
  deleteProductImage,
  setMainImage,
  addProductReview,
  getAllProductsAdmin,
  getProductStats,
} = require('../controllers/product.controller');

const { protect, admin, optionalAuth } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const {
  productValidation,
  mongoIdValidation,
  paginationValidation,
} = require('../middleware/validate');

// Public routes
router.get('/', paginationValidation, getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/slug/:slug', getProductBySlug);

// Admin routes (must come before /:id route)
router.get('/admin/all', protect, admin, paginationValidation, getAllProductsAdmin);
router.get('/admin/stats', protect, admin, getProductStats);
router.post('/', protect, admin, productValidation, createProduct);
router.put('/:id', protect, admin, mongoIdValidation('id'), updateProduct);
router.delete('/:id', protect, admin, mongoIdValidation('id'), deleteProduct);

// Product images (Admin)
router.post(
  '/:id/images',
  protect,
  admin,
  mongoIdValidation('id'),
  upload.array('images', 10),
  addProductImages
);
router.delete(
  '/:id/images/:imageId',
  protect,
  admin,
  deleteProductImage
);
router.put(
  '/:id/images/:imageId/main',
  protect,
  admin,
  setMainImage
);

// Public routes with ID parameter (must come after admin routes)
router.get('/:id', mongoIdValidation('id'), getProductById);

// Protected routes (user)
router.post('/:id/reviews', protect, mongoIdValidation('id'), addProductReview);

module.exports = router;
