const asyncHandler = require('express-async-handler');
const Cart = require('../schemas/Cart');
const Product = require('../schemas/Product');
const { AppError } = require('../middleware/error');

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
  if (!cart) throw new AppError('Cart not found', 404);
  return cart;
};

const getProductOrThrow = async (productId) => {
  const product = await Product.findById(productId);
  if (!product) throw new AppError('Product not found', 404);
  return product;
};

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.getOrCreateCart(req.user._id);
  await populateCart(cart);

  const validItems = cart.items.filter((item) => item.product && item.product.isActive);
  if (validItems.length !== cart.items.length) {
    cart.items = validItems;
    await cart.save();
  }

  res.json({ success: true, data: { cart } });
});

// @desc    Add item to cart
// @route   POST /api/cart/items
// @access  Private
const addToCart = asyncHandler(async (req, res) => {
  const product = await getProductOrThrow(req.body.productId);
  const quantity = req.body.quantity || 1;

  if (!product.isActive) throw new AppError('Product is not available', 400);
  if (product.stock < quantity) throw new AppError(`Only ${product.stock} items available in stock`, 400);

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

  const existingItemIndex = cart.items.findIndex((item) => item.product.toString() === req.body.productId);
  if (existingItemIndex > -1) {
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;
    if (newQuantity > product.stock) {
      throw new AppError(`Cannot add more items. Only ${product.stock} available in stock`, 400);
    }
    cart.items[existingItemIndex].quantity = newQuantity;
    cart.items[existingItemIndex].price = product.price;
  } else {
    cart.items.push({ product: req.body.productId, quantity, price: product.price });
  }

  await cart.save();
  await populateCart(cart);

  res.status(201).json({
    success: true,
    message: 'Item added to cart',
    data: { cart },
  });
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/items/:productId
// @access  Private
const updateCartItem = asyncHandler(async (req, res) => {
  const cart = await getCartOrThrow(req.user._id);
  const itemIndex = cart.items.findIndex((item) => item.product.toString() === req.params.productId);
  if (itemIndex === -1) throw new AppError('Item not found in cart', 404);

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
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:productId
// @access  Private
const removeFromCart = asyncHandler(async (req, res) => {
  const cart = await getCartOrThrow(req.user._id);
  const itemIndex = cart.items.findIndex((item) => item.product.toString() === req.params.productId);
  if (itemIndex === -1) throw new AppError('Item not found in cart', 404);

  cart.items.splice(itemIndex, 1);
  await cart.save();
  await populateCart(cart);

  res.json({
    success: true,
    message: 'Item removed from cart',
    data: { cart },
  });
});

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
  const cart = await getCartOrThrow(req.user._id);
  cart.items = [];
  await cart.save();

  res.json({
    success: true,
    message: 'Cart cleared',
    data: { cart },
  });
});

// @desc    Get cart count
// @route   GET /api/cart/count
// @access  Private
const getCartCount = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  res.json({ success: true, data: { count: cart ? cart.totalItems : 0 } });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartCount,
};
