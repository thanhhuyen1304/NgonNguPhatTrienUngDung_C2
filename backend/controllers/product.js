const asyncHandler = require('express-async-handler');
const productService = require('../services/productService');

const getProducts = asyncHandler(async (req, res) => {
  const data = await productService.getProducts(req.query);

  res.json({
    success: true,
    data,
  });
});

const getFeaturedProducts = asyncHandler(async (req, res) => {
  const data = await productService.getFeaturedProducts(req.query);
  res.json({ success: true, data });
});

const getProductBySlug = asyncHandler(async (req, res) => {
  const data = await productService.getProductBySlug(req.params.slug);
  res.json({ success: true, data });
});

const getProductById = asyncHandler(async (req, res) => {
  const data = await productService.getProductById(req.params.id);
  res.json({ success: true, data });
});

const addProductReview = asyncHandler(async (req, res) => {
  await productService.addProductReview({
    productId: req.params.id,
    userId: req.user._id,
    rating: req.body.rating,
    comment: req.body.comment,
  });

  res.status(201).json({ success: true, message: 'Review added successfully' });
});

const createProduct = asyncHandler(async (req, res) => {
  const data = await productService.createProduct(req.body);

  res.status(201).json({ success: true, message: 'Product created successfully', data });
});

const updateProduct = asyncHandler(async (req, res) => {
  const data = await productService.updateProduct(req.params.id, req.body);
  res.json({ success: true, message: 'Product updated successfully', data });
});

const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.id);
  res.json({ success: true, message: 'Product deleted successfully' });
});

const addProductImages = asyncHandler(async (req, res) => {
  const data = await productService.addProductImages({
    productId: req.params.id,
    files: req.files || [],
  });
  res.json({ success: true, message: 'Images uploaded successfully', data });
});

const deleteProductImage = asyncHandler(async (req, res) => {
  const data = await productService.deleteProductImage({
    productId: req.params.id,
    imageId: req.params.imageId,
  });
  res.json({ success: true, message: 'Image deleted successfully', data });
});

const setMainImage = asyncHandler(async (req, res) => {
  const data = await productService.setMainImage({
    productId: req.params.id,
    imageId: req.params.imageId,
  });
  res.json({ success: true, message: 'Main image updated successfully', data });
});

const getAllProductsAdmin = asyncHandler(async (req, res) => {
  const data = await productService.getAllProductsAdmin(req.query);

  res.json({
    success: true,
    data,
  });
});

const getProductStats = asyncHandler(async (req, res) => {
  const data = await productService.getProductStats();
  res.json({ success: true, data });
});

module.exports = {
  getProducts,
  getFeaturedProducts,
  getProductBySlug,
  getProductById,
  addProductReview,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImages,
  deleteProductImage,
  setMainImage,
  getAllProductsAdmin,
  getProductStats,
};
