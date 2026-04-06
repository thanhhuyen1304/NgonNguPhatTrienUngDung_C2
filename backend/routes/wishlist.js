const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Wishlist = require('../schemas/Wishlist');
const Product = require('../schemas/Product');
const { AppError } = require('../middleware/error');
const { protect, customerOnly } = require('../middleware/auth');
const { mongoIdValidation } = require('../middleware/validate');

const WISHLIST_POPULATE = {
  path: 'products',
  select: 'name price comparePrice images stock category slug',
  populate: { path: 'category', select: 'name' },
};

const formatWishlistItems = (wishlist) => ({
  items: wishlist.products.map((product) => ({ product })),
});

const getWishlistOrThrow = async (userId) => {
  const wishlist = await Wishlist.findOne({ user: userId });

  if (!wishlist) {
    throw new AppError('Wishlist not found', 404);
  }

  return wishlist;
};

const getProductOrThrow = async (productId) => {
  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  return product;
};

// All routes require authentication
router.use(protect, customerOnly);

router.get('/', asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id }).populate(WISHLIST_POPULATE);

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    await wishlist.populate(WISHLIST_POPULATE);
  }

  res.status(200).json({ success: true, data: formatWishlistItems(wishlist) });
}));

router.post('/:productId', mongoIdValidation('productId'), asyncHandler(async (req, res) => {
  await getProductOrThrow(req.params.productId);

  let wishlist = await Wishlist.findOne({ user: req.user._id });

  if (!wishlist) {
    wishlist = await Wishlist.create({
      user: req.user._id,
      products: [req.params.productId],
    });
  } else if (!wishlist.products.some((id) => id.toString() === req.params.productId)) {
    wishlist.products.push(req.params.productId);
    await wishlist.save();
  }

  res.status(201).json({
    success: true,
    message: 'Product added to wishlist',
  });
}));

router.delete('/:productId', mongoIdValidation('productId'), asyncHandler(async (req, res) => {
  const wishlist = await getWishlistOrThrow(req.user._id);
  wishlist.products = wishlist.products.filter((id) => id.toString() !== req.params.productId);
  await wishlist.save();

  res.status(200).json({
    success: true,
    message: 'Product removed from wishlist',
  });
}));

module.exports = router;
