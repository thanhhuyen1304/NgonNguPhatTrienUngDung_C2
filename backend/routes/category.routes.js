const express = require('express');
const router = express.Router();

const {
  getCategories,
  getCategoryTree,
  getCategoryBySlug,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
  getAllCategoriesAdmin,
} = require('../controllers/category.controller');

const { protect, admin } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const { categoryValidation, mongoIdValidation } = require('../middleware/validate');

// Public routes
router.get('/', getCategories);
router.get('/tree', getCategoryTree);
router.get('/slug/:slug', getCategoryBySlug);
router.get('/:id', mongoIdValidation('id'), getCategoryById);

// Admin routes
router.get('/admin/all', protect, admin, getAllCategoriesAdmin);
router.post('/', protect, admin, categoryValidation, createCategory);
router.put('/:id', protect, admin, mongoIdValidation('id'), updateCategory);
router.delete('/:id', protect, admin, mongoIdValidation('id'), deleteCategory);
router.post(
  '/:id/image',
  protect,
  admin,
  mongoIdValidation('id'),
  upload.single('image'),
  uploadCategoryImage
);

module.exports = router;
