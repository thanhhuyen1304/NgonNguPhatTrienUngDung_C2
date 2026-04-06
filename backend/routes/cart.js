const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Cart = require('../schemas/Cart');
const Product = require('../schemas/Product');
const { AppError } = require('../middleware/error');

const { protect, customerOnly } = require('../middleware/auth');
const { addToCartValidation, updateCartValidation, mongoIdValidation } = require('../middleware/validate');

const CART_POPULATE = {
  path: 'items.product',
  select: 'name slug price comparePrice images stock isActive',
};

const populateCart = async (cart) => {
  await cart.populate(CART_POPULATE);
  return cart;
};

const getCartOrThrow = async (userId) => {
  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  return cart;
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
  const cart = await Cart.getOrCreateCart(req.user._id);
  await populateCart(cart);

  const validItems = cart.items.filter((item) => item.product && item.product.isActive);

  if (validItems.length !== cart.items.length) {
    cart.items = validItems;
    await cart.save();
  }

  res.json({ success: true, data: { cart } });
}));

router.get('/count', asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  res.json({ success: true, data: { count: cart ? cart.totalItems : 0 } });
}));

router.post('/items', addToCartValidation, asyncHandler(async (req, res) => {
  const product = await getProductOrThrow(req.body.productId);

  if (!product.isActive) {
    throw new AppError('Product is not available', 400);
  }

  if (product.stock < (req.body.quantity || 1)) {
    throw new AppError(`Only ${product.stock} items available in stock`, 400);
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  const existingItemIndex = cart.items.findIndex(
    (item) => item.product.toString() === req.body.productId
  );

  if (existingItemIndex > -1) {
    const newQuantity = cart.items[existingItemIndex].quantity + (req.body.quantity || 1);
    if (newQuantity > product.stock) {
      throw new AppError(`Cannot add more items. Only ${product.stock} available in stock`, 400);
    }

    cart.items[existingItemIndex].quantity = newQuantity;
    cart.items[existingItemIndex].price = product.price;
  } else {
    cart.items.push({
      product: req.body.productId,
      quantity: req.body.quantity || 1,
      price: product.price,
    });
  }

  await cart.save();
  await populateCart(cart);

  res.status(201).json({
    success: true,
    message: 'Item added to cart',
    data: { cart },
  });
}));

router.put('/items/:productId', mongoIdValidation('productId'), updateCartValidation, asyncHandler(async (req, res) => {
  const cart = await getCartOrThrow(req.user._id);
  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === req.params.productId
  );

  if (itemIndex === -1) {
    throw new AppError('Item not found in cart', 404);
  }

  if (req.body.quantity <= 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    const product = await getProductOrThrow(req.params.productId);
    if (req.body.quantity > product.stock) {
      throw new AppError(`Only ${product.stock} items available in stock`, 400);
    }

    cart.items[itemIndex].quantity = req.body.quantity;
    cart.items[itemIndex].price = product.price;
  }

  await cart.save();
  await populateCart(cart);

  res.json({
    success: true,
    message: 'Cart updated',
    data: { cart },
  });
}));

router.delete('/items/:productId', mongoIdValidation('productId'), asyncHandler(async (req, res) => {
  const cart = await getCartOrThrow(req.user._id);
  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === req.params.productId
  );

  if (itemIndex === -1) {
    throw new AppError('Item not found in cart', 404);
  }

  cart.items.splice(itemIndex, 1);
  await cart.save();
  await populateCart(cart);

  res.json({
    success: true,
    message: 'Item removed from cart',
    data: { cart },
  });
}));

router.delete('/', asyncHandler(async (req, res) => {
  const cart = await getCartOrThrow(req.user._id);
  cart.items = [];
  await cart.save();

  res.json({
    success: true,
    message: 'Cart cleared',
    data: { cart },
  });
}));

module.exports = router;
