const Wishlist = require('../schemas/Wishlist');
const Product = require('../schemas/Product');
const { AppError } = require('../middleware/error');

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

const getWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId }).populate(WISHLIST_POPULATE);

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, products: [] });
    await wishlist.populate(WISHLIST_POPULATE);
  }

  return formatWishlistItems(wishlist);
};

const addToWishlist = async ({ userId, productId }) => {
  await getProductOrThrow(productId);

  let wishlist = await Wishlist.findOne({ user: userId });

  if (!wishlist) {
    wishlist = await Wishlist.create({
      user: userId,
      products: [productId],
    });
  } else if (!wishlist.products.some((id) => id.toString() === productId)) {
    wishlist.products.push(productId);
    await wishlist.save();
  }
};

const removeFromWishlist = async ({ userId, productId }) => {
  const wishlist = await getWishlistOrThrow(userId);
  wishlist.products = wishlist.products.filter((id) => id.toString() !== productId);
  await wishlist.save();
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
