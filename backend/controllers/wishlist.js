const asyncHandler = require('express-async-handler');
const wishlistService = require('../services/wishlistService');

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
const getWishlist = asyncHandler(async (req, res) => {
  const data = await wishlistService.getWishlist(req.user._id);
  res.status(200).json({ success: true, data });
});

// @desc    Add product to wishlist
// @route   POST /api/wishlist/:productId
// @access  Private
const addToWishlist = asyncHandler(async (req, res) => {
  await wishlistService.addToWishlist({
    userId: req.user._id,
    productId: req.params.productId,
  });

  res.status(201).json({
    success: true,
    message: 'Product added to wishlist',
  });
});

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
const removeFromWishlist = asyncHandler(async (req, res) => {
  await wishlistService.removeFromWishlist({
    userId: req.user._id,
    productId: req.params.productId,
  });

  res.status(200).json({
    success: true,
    message: 'Product removed from wishlist',
  });
});

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
