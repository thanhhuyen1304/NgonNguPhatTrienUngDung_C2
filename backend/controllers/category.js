const asyncHandler = require('express-async-handler');
const categoryService = require('../services/categoryService');

const getCategories = asyncHandler(async (req, res) => {
  const data = await categoryService.getCategories(req.query);
  res.json({ success: true, data });
});

const getCategoryTree = asyncHandler(async (req, res) => {
  const data = await categoryService.getCategoryTree();
  res.json({ success: true, data });
});

const getCategoryBySlug = asyncHandler(async (req, res) => {
  const data = await categoryService.getCategoryBySlug(req.params.slug);
  res.json({ success: true, data });
});

const getCategoryById = asyncHandler(async (req, res) => {
  const data = await categoryService.getCategoryById(req.params.id);
  res.json({ success: true, data });
});

const createCategory = asyncHandler(async (req, res) => {
  const data = await categoryService.createCategory(req.body);
  res.status(201).json({ success: true, message: 'Category created successfully', data });
});

const updateCategory = asyncHandler(async (req, res) => {
  const data = await categoryService.updateCategory(req.params.id, req.body);
  res.json({ success: true, message: 'Category updated successfully', data });
});

const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
  res.json({ success: true, message: 'Category deleted successfully' });
});

const uploadCategoryImage = asyncHandler(async (req, res) => {
  const data = await categoryService.uploadCategoryImage({
    categoryId: req.params.id,
    file: req.file,
  });

  res.json({ success: true, message: 'Image uploaded successfully', data });
});

const getAllCategoriesAdmin = asyncHandler(async (req, res) => {
  const data = await categoryService.getAllCategoriesAdmin();
  res.json({ success: true, data });
});

module.exports = {
  getCategories,
  getCategoryTree,
  getCategoryBySlug,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
  getAllCategoriesAdmin,
};
