const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Product = require('../schemas/Product');
const { deleteImage } = require('../config/cloudinary');
const { AppError } = require('../middleware/error');

const { protect, admin } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const {
  productValidation,
  mongoIdValidation,
  paginationValidation,
} = require('../middleware/validate');

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

// Public routes
router.get('/', paginationValidation, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || DEFAULT_PUBLIC_PAGE_SIZE;
  const skip = (page - 1) * limit;
  const query = buildPublicProductQuery(req.query);
  const sortOption = getSortOption(req.query.sort);

  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate('category', 'name slug')
    .select('name slug price comparePrice images rating numReviews brand stock')
    .sort(sortOption)
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    data: { products, pagination: getPagination(page, limit, total) },
  });
}));

router.get('/featured', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || DEFAULT_FEATURED_LIMIT;
  const products = await Product.getFeaturedProducts(limit);
  res.json({ success: true, data: { products } });
}));

router.get('/slug/:slug', asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .populate('category', 'name slug')
    .populate('reviews.user', 'name avatar');

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  res.json({ success: true, data: { product } });
}));

// Admin routes (must come before /:id route)
router.get('/admin/all', protect, admin, paginationValidation, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || DEFAULT_ADMIN_PAGE_SIZE;
  const skip = (page - 1) * limit;
  const query = buildAdminProductQuery(req.query);

  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate('category', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({ success: true, data: { products, pagination: getPagination(page, limit, total) } });
}));

router.get('/admin/stats', protect, admin, asyncHandler(async (req, res) => {
  const totalProducts = await Product.countDocuments();
  const activeProducts = await Product.countDocuments({ isActive: true });
  const featuredProducts = await Product.countDocuments({ isFeatured: true });
  const outOfStock = await Product.countDocuments({ stock: 0 });
  const lowStock = await Product.countDocuments({ stock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD } });

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

  res.json({
    success: true,
    data: {
      totalProducts,
      activeProducts,
      featuredProducts,
      outOfStock,
      lowStock,
      productsByCategory,
      topSelling,
    },
  });
}));

router.post('/', protect, admin, productValidation, asyncHandler(async (req, res) => {
  const product = await Product.create({
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    comparePrice: req.body.comparePrice,
    category: req.body.category,
    stock: req.body.stock || 0,
    brand: req.body.brand,
    tags: parseTags(req.body.tags),
    specifications: req.body.specifications || [],
    isFeatured: req.body.isFeatured || false,
    images: [],
  });

  res.status(201).json({ success: true, message: 'Product created successfully', data: { product } });
}));

router.put('/:id', protect, admin, mongoIdValidation('id'), asyncHandler(async (req, res) => {
  const product = await getProductOrThrow(req.params.id);

  product.name = req.body.name || product.name;
  product.description = req.body.description || product.description;
  product.price = req.body.price !== undefined ? req.body.price : product.price;
  product.comparePrice = req.body.comparePrice !== undefined ? req.body.comparePrice : product.comparePrice;
  product.category = req.body.category || product.category;
  product.stock = req.body.stock !== undefined ? req.body.stock : product.stock;
  product.brand = req.body.brand || product.brand;

  if (req.body.tags) {
    product.tags = parseTags(req.body.tags);
  }

  if (req.body.specifications) {
    product.specifications = req.body.specifications;
  }

  if (req.body.isFeatured !== undefined) {
    product.isFeatured = req.body.isFeatured;
  }

  if (req.body.isActive !== undefined) {
    product.isActive = req.body.isActive;
  }

  const updatedProduct = await product.save();
  res.json({ success: true, message: 'Product updated successfully', data: { product: updatedProduct } });
}));

router.delete('/:id', protect, admin, mongoIdValidation('id'), asyncHandler(async (req, res) => {
  const product = await getProductOrThrow(req.params.id);

  for (const image of product.images) {
    if (image.publicId) {
      await deleteImage(image.publicId);
    }
  }

  await Product.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Product deleted successfully' });
}));

// Product images (Admin)
router.post(
  '/:id/images',
  protect,
  admin,
  mongoIdValidation('id'),
  upload.array('images', 10),
  asyncHandler(async (req, res) => {
    const product = await getProductOrThrow(req.params.id);

    if ((req.files || []).length === 0) {
      throw new AppError('Please upload at least one image', 400);
    }

    const newImages = req.files.map((file, index) => {
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

    res.json({ success: true, message: 'Images uploaded successfully', data: { images: product.images } });
  })
);
router.delete(
  '/:id/images/:imageId',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const product = await getProductOrThrow(req.params.id);
    const imageIndex = product.images.findIndex(
      (image) => image._id.toString() === req.params.imageId
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
    res.json({ success: true, message: 'Image deleted successfully', data: { images: product.images } });
  })
);
router.put(
  '/:id/images/:imageId/main',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const product = await getProductOrThrow(req.params.id);
    const imageIndex = product.images.findIndex(
      (image) => image._id.toString() === req.params.imageId
    );

    if (imageIndex === -1) {
      throw new AppError('Image not found', 404);
    }

    product.images.forEach((image) => {
      image.isMain = false;
    });
    product.images[imageIndex].isMain = true;

    await product.save();
    res.json({ success: true, message: 'Main image updated successfully', data: { images: product.images } });
  })
);

// Public routes with ID parameter (must come after admin routes)
router.get('/:id', mongoIdValidation('id'), asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name slug')
    .populate('reviews.user', 'name avatar');

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  res.json({ success: true, data: { product } });
}));

// Protected routes (user)
router.post('/:id/reviews', protect, mongoIdValidation('id'), asyncHandler(async (req, res) => {
  const product = await getProductOrThrow(req.params.id);
  const alreadyReviewed = product.reviews.find(
    (review) => review.user.toString() === req.user._id.toString()
  );

  if (alreadyReviewed) {
    throw new AppError('You have already reviewed this product', 400);
  }

  product.reviews.push({
    user: req.user._id,
    rating: Number(req.body.rating),
    comment: req.body.comment,
  });
  product.calculateAverageRating();
  await product.save();

  res.status(201).json({ success: true, message: 'Review added successfully' });
}));

module.exports = router;
