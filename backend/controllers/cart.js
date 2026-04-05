const asyncHandler = require('express-async-handler');
const cartService = require('../services/cartService');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
  const data = await cartService.getCart(req.user._id);
  res.json({ success: true, data });
});

// @desc    Add item to cart
// @route   POST /api/cart/items
// @access  Private
const addToCart = asyncHandler(async (req, res) => {
  const data = await cartService.addToCart({
    userId: req.user._id,
    productId: req.body.productId,
    quantity: req.body.quantity || 1,
  });

  res.status(201).json({
    success: true,
    message: 'Item added to cart',
    data,
  });
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/items/:productId
// @access  Private
const updateCartItem = asyncHandler(async (req, res) => {
  const data = await cartService.updateCartItem({
    userId: req.user._id,
    productId: req.params.productId,
    quantity: req.body.quantity,
  });

  res.json({
    success: true,
    message: 'Cart updated',
    data,
  });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:productId
// @access  Private
const removeFromCart = asyncHandler(async (req, res) => {
  const data = await cartService.removeFromCart({
    userId: req.user._id,
    productId: req.params.productId,
  });

  res.json({
    success: true,
    message: 'Item removed from cart',
    data,
  });
});

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
  const data = await cartService.clearCart(req.user._id);

  res.json({
    success: true,
    message: 'Cart cleared',
    data,
  });
});

// @desc    Get cart count
// @route   GET /api/cart/count
// @access  Private
const getCartCount = asyncHandler(async (req, res) => {
  const data = await cartService.getCartCount(req.user._id);
  res.json({ success: true, data });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartCount,
};
