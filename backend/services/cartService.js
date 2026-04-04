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

const getCart = async (userId) => {
  const cart = await Cart.getOrCreateCart(userId);
  await populateCart(cart);

  const validItems = cart.items.filter((item) => item.product && item.product.isActive);

  if (validItems.length !== cart.items.length) {
    cart.items = validItems;
    await cart.save();
  }

  return { cart };
};

const addToCart = async ({ userId, productId, quantity = 1 }) => {
  const product = await getProductOrThrow(productId);

  if (!product.isActive) {
    throw new AppError('Product is not available', 400);
  }

  if (product.stock < quantity) {
    throw new AppError(`Only ${product.stock} items available in stock`, 400);
  }

  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  const existingItemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (existingItemIndex > -1) {
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;
    if (newQuantity > product.stock) {
      throw new AppError(
        `Cannot add more items. Only ${product.stock} available in stock`,
        400
      );
    }

    cart.items[existingItemIndex].quantity = newQuantity;
    cart.items[existingItemIndex].price = product.price;
  } else {
    cart.items.push({
      product: productId,
      quantity,
      price: product.price,
    });
  }

  await cart.save();
  await populateCart(cart);

  return { cart };
};

const updateCartItem = async ({ userId, productId, quantity }) => {
  const cart = await getCartOrThrow(userId);
  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (itemIndex === -1) {
    throw new AppError('Item not found in cart', 404);
  }

  if (quantity <= 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    const product = await getProductOrThrow(productId);
    if (quantity > product.stock) {
      throw new AppError(`Only ${product.stock} items available in stock`, 400);
    }

    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].price = product.price;
  }

  await cart.save();
  await populateCart(cart);

  return { cart };
};

const removeFromCart = async ({ userId, productId }) => {
  const cart = await getCartOrThrow(userId);
  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (itemIndex === -1) {
    throw new AppError('Item not found in cart', 404);
  }

  cart.items.splice(itemIndex, 1);
  await cart.save();
  await populateCart(cart);

  return { cart };
};

const clearCart = async (userId) => {
  const cart = await getCartOrThrow(userId);
  cart.items = [];
  await cart.save();

  return { cart };
};

const getCartCount = async (userId) => {
  const cart = await Cart.findOne({ user: userId });
  return { count: cart ? cart.totalItems : 0 };
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartCount,
};
