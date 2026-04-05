const Product = require('../schemas/Product');
const { deleteImage } = require('../config/cloudinary');
const { AppError } = require('../middleware/error');

const DEFAULT_PUBLIC_PAGE_SIZE = 12;
const DEFAULT_ADMIN_PAGE_SIZE = 20;
const DEFAULT_FEATURED_LIMIT = 8;
const LOW_STOCK_THRESHOLD = 10;

const parseNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseTags = (tags) => {
  if (!tags) {
    return [];
  }

  if (Array.isArray(tags)) {
    return tags;
  }

  return String(tags)
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
};

const getSortOption = (sort) => {
  switch (sort) {
    case 'price_asc':
      return { price: 1 };
    case 'price_desc':
      return { price: -1 };
    case 'rating':
      return { rating: -1 };
    case 'bestselling':
      return { sold: -1 };
    case 'name_asc':
      return { name: 1 };
    case 'name_desc':
      return { name: -1 };
    case 'newest':
    default:
      return { createdAt: -1 };
  }
};

const getPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
});

const getProductOrThrow = async (productId) => {
  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  return product;
};

const buildPublicProductQuery = (queryParams = {}) => {
  const query = { isActive: true };

  if (queryParams.search) {
    query.$text = { $search: queryParams.search };
  }

  if (queryParams.category) {
    query.category = queryParams.category;
  }

  const minPrice = parseNumber(queryParams.minPrice);
  const maxPrice = parseNumber(queryParams.maxPrice);

  if (minPrice !== null || maxPrice !== null) {
    query.price = {};

    if (minPrice !== null) {
      query.price.$gte = minPrice;
    }

    if (maxPrice !== null) {
      query.price.$lte = maxPrice;
    }
  }

  if (queryParams.brand) {
    query.brand = { $regex: queryParams.brand, $options: 'i' };
  }

  const minRating = parseNumber(queryParams.minRating);
  if (minRating !== null) {
    query.rating = { $gte: minRating };
  }

  if (queryParams.inStock === 'true') {
    query.stock = { $gt: 0 };
  }

  return query;
};

const buildAdminProductQuery = (queryParams = {}) => {
  const query = {};

  if (queryParams.search) {
    query.$or = [
      { name: { $regex: queryParams.search, $options: 'i' } },
      { brand: { $regex: queryParams.search, $options: 'i' } },
    ];
  }

  if (queryParams.category) {
    query.category = queryParams.category;
  }

  if (queryParams.isActive !== undefined) {
    query.isActive = queryParams.isActive === 'true';
  }

  if (queryParams.isFeatured !== undefined) {
    query.isFeatured = queryParams.isFeatured === 'true';
  }

  if (queryParams.lowStock === 'true') {
    query.stock = { $lte: LOW_STOCK_THRESHOLD };
  }

  return query;
};

const getProducts = async (queryParams = {}) => {
  const page = parseInt(queryParams.page, 10) || 1;
  const limit = parseInt(queryParams.limit, 10) || DEFAULT_PUBLIC_PAGE_SIZE;
  const skip = (page - 1) * limit;
  const query = buildPublicProductQuery(queryParams);
  const sortOption = getSortOption(queryParams.sort);

  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate('category', 'name slug')
    .select('name slug price comparePrice images rating numReviews brand stock')
    .sort(sortOption)
    .skip(skip)
    .limit(limit);

  return {
    products,
    pagination: getPagination(page, limit, total),
  };
};

const getFeaturedProducts = async (queryParams = {}) => {
  const limit = parseInt(queryParams.limit, 10) || DEFAULT_FEATURED_LIMIT;
  const products = await Product.getFeaturedProducts(limit);
  return { products };
};

const getProductBySlug = async (slug) => {
  const product = await Product.findOne({ slug, isActive: true })
    .populate('category', 'name slug')
    .populate('reviews.user', 'name avatar');

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  return { product };
};

const getProductById = async (productId) => {
  const product = await Product.findById(productId)
    .populate('category', 'name slug')
    .populate('reviews.user', 'name avatar');

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  return { product };
};

const addProductReview = async ({ productId, userId, rating, comment }) => {
  const product = await getProductOrThrow(productId);
  const alreadyReviewed = product.reviews.find(
    (review) => review.user.toString() === userId.toString()
  );

  if (alreadyReviewed) {
    throw new AppError('You have already reviewed this product', 400);
  }

  product.reviews.push({
    user: userId,
    rating: Number(rating),
    comment,
  });
  product.calculateAverageRating();
  await product.save();
};

const createProduct = async (payload = {}) => {
  const product = await Product.create({
    name: payload.name,
    description: payload.description,
    price: payload.price,
    comparePrice: payload.comparePrice,
    category: payload.category,
    stock: payload.stock || 0,
    brand: payload.brand,
    tags: parseTags(payload.tags),
    specifications: payload.specifications || [],
    isFeatured: payload.isFeatured || false,
    images: [],
  });

  return { product };
};

const updateProduct = async (productId, payload = {}) => {
  const product = await getProductOrThrow(productId);

  product.name = payload.name || product.name;
  product.description = payload.description || product.description;
  product.price = payload.price !== undefined ? payload.price : product.price;
  product.comparePrice = payload.comparePrice !== undefined ? payload.comparePrice : product.comparePrice;
  product.category = payload.category || product.category;
  product.stock = payload.stock !== undefined ? payload.stock : product.stock;
  product.brand = payload.brand || product.brand;

  if (payload.tags) {
    product.tags = parseTags(payload.tags);
  }

  if (payload.specifications) {
    product.specifications = payload.specifications;
  }

  if (payload.isFeatured !== undefined) {
    product.isFeatured = payload.isFeatured;
  }

  if (payload.isActive !== undefined) {
    product.isActive = payload.isActive;
  }

  const updatedProduct = await product.save();
  return { product: updatedProduct };
};

const deleteProduct = async (productId) => {
  const product = await getProductOrThrow(productId);

  for (const image of product.images) {
    if (image.publicId) {
      await deleteImage(image.publicId);
    }
  }

  await Product.findByIdAndDelete(productId);
};

const addProductImages = async ({ productId, files = [] }) => {
  const product = await getProductOrThrow(productId);

  if (files.length === 0) {
    throw new AppError('Please upload at least one image', 400);
  }

  const newImages = files.map((file, index) => {
    const url =
      file.path ||
      file.secure_url ||
      (file.buffer
        ? `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
        : null);

    if (!url) {
      throw new AppError(`File upload failed for file: ${file.originalname}`, 400);
    }

    return {
      url,
      publicId: file.filename || file.public_id || `temp_${Date.now()}_${index}`,
      isMain: product.images.length === 0 && index === 0,
    };
  });

  product.images.push(...newImages);
  await product.save();

  return { images: product.images };
};

const deleteProductImage = async ({ productId, imageId }) => {
  const product = await getProductOrThrow(productId);
  const imageIndex = product.images.findIndex(
    (image) => image._id.toString() === imageId
  );

  if (imageIndex === -1) {
    throw new AppError('Image not found', 404);
  }

  const image = product.images[imageIndex];
  if (image.publicId) {
    await deleteImage(image.publicId);
  }

  product.images.splice(imageIndex, 1);
  if (image.isMain && product.images.length > 0) {
    product.images[0].isMain = true;
  }

  await product.save();
  return { images: product.images };
};

const setMainImage = async ({ productId, imageId }) => {
  const product = await getProductOrThrow(productId);
  const imageIndex = product.images.findIndex(
    (image) => image._id.toString() === imageId
  );

  if (imageIndex === -1) {
    throw new AppError('Image not found', 404);
  }

  product.images.forEach((image) => {
    image.isMain = false;
  });
  product.images[imageIndex].isMain = true;

  await product.save();
  return { images: product.images };
};

const getAllProductsAdmin = async (queryParams = {}) => {
  const page = parseInt(queryParams.page, 10) || 1;
  const limit = parseInt(queryParams.limit, 10) || DEFAULT_ADMIN_PAGE_SIZE;
  const skip = (page - 1) * limit;
  const query = buildAdminProductQuery(queryParams);

  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate('category', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    products,
    pagination: getPagination(page, limit, total),
  };
};

const getProductStats = async () => {
  const totalProducts = await Product.countDocuments();
  const activeProducts = await Product.countDocuments({ isActive: true });
  const featuredProducts = await Product.countDocuments({ isFeatured: true });
  const outOfStock = await Product.countDocuments({ stock: 0 });
  const lowStock = await Product.countDocuments({
    stock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD },
  });

  const productsByCategory = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        category: { $ifNull: ['$category.name', 'Uncategorized'] },
        count: 1,
      },
    },
  ]);

  const topSelling = await Product.find({ isActive: true })
    .sort({ sold: -1 })
    .limit(10)
    .select('name sold price images');

  return {
    totalProducts,
    activeProducts,
    featuredProducts,
    outOfStock,
    lowStock,
    productsByCategory,
    topSelling,
  };
};

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
