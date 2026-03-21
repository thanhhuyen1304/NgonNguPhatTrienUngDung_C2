const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const { deleteImage } = require('../config/cloudinary');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const query = { isActive: true };

  // Search
  if (req.query.search) {
    query.$text = { $search: req.query.search };
  }

  // Category filter
  if (req.query.category) {
    query.category = req.query.category;
  }

  // Price range filter
  if (req.query.minPrice || req.query.maxPrice) {
    query.price = {};
    if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice);
    if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice);
  }

  // Brand filter
  if (req.query.brand) {
    query.brand = { $regex: req.query.brand, $options: 'i' };
  }

  // Rating filter
  if (req.query.minRating) {
    query.rating = { $gte: parseFloat(req.query.minRating) };
  }

  // In stock filter
  if (req.query.inStock === 'true') {
    query.stock = { $gt: 0 };
  }

  // Sorting
  let sortOption = { createdAt: -1 };
  if (req.query.sort) {
    switch (req.query.sort) {
      case 'price_asc':
        sortOption = { price: 1 };
        break;
      case 'price_desc':
        sortOption = { price: -1 };
        break;
      case 'rating':
        sortOption = { rating: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'bestselling':
        sortOption = { sold: -1 };
        break;
      case 'name_asc':
        sortOption = { name: 1 };
        break;
      case 'name_desc':
        sortOption = { name: -1 };
        break;
    }
  }

  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate('category', 'name slug')
    .select('name slug price comparePrice images rating numReviews brand stock')
    .sort(sortOption)
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    data: {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 8;

  const products = await Product.getFeaturedProducts(limit);

  res.json({
    success: true,
    data: { products },
  });
});

// @desc    Get product by slug
// @route   GET /api/products/slug/:slug
// @access  Public
const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .populate('category', 'name slug')
    .populate('reviews.user', 'name avatar');

  if (product) {
    res.json({
      success: true,
      data: { product },
    });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name slug')
    .populate('reviews.user', 'name avatar');

  if (product) {
    res.json({
      success: true,
      data: { product },
    });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Create product (Admin)
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    price,
    comparePrice,
    category,
    stock,
    brand,
    tags,
    specifications,
    isFeatured,
  } = req.body;

  const product = await Product.create({
    name,
    description,
    price,
    comparePrice,
    category,
    stock: stock || 0,
    brand,
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
    specifications: specifications || [],
    isFeatured: isFeatured || false,
    images: [],
  });

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: { product },
  });
});

// @desc    Update product (Admin)
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    price,
    comparePrice,
    category,
    stock,
    brand,
    tags,
    specifications,
    isFeatured,
    isActive,
  } = req.body;

  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  product.name = name || product.name;
  product.description = description || product.description;
  product.price = price !== undefined ? price : product.price;
  product.comparePrice = comparePrice !== undefined ? comparePrice : product.comparePrice;
  product.category = category || product.category;
  product.stock = stock !== undefined ? stock : product.stock;
  product.brand = brand || product.brand;
  if (tags) {
    product.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
  }
  if (specifications) product.specifications = specifications;
  if (isFeatured !== undefined) product.isFeatured = isFeatured;
  if (isActive !== undefined) product.isActive = isActive;

  const updatedProduct = await product.save();

  res.json({
    success: true,
    message: 'Product updated successfully',
    data: { product: updatedProduct },
  });
});

// @desc    Delete product (Admin)
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Delete images from Cloudinary
  for (const image of product.images) {
    if (image.publicId) {
      await deleteImage(image.publicId);
    }
  }

  await Product.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Product deleted successfully',
  });
});

// @desc    Add product images (Admin)
// @route   POST /api/products/:id/images
// @access  Private/Admin
const addProductImages = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error('Please upload at least one image');
  }

  const newImages = req.files.map((file, index) => ({
    url: file.path,
    publicId: file.filename,
    isMain: product.images.length === 0 && index === 0, // Set first image as main if no images exist
  }));

  product.images.push(...newImages);
  await product.save();

  res.json({
    success: true,
    message: 'Images uploaded successfully',
    data: { images: product.images },
  });
});

// @desc    Delete product image (Admin)
// @route   DELETE /api/products/:id/images/:imageId
// @access  Private/Admin
const deleteProductImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const imageIndex = product.images.findIndex(
    (img) => img._id.toString() === req.params.imageId
  );

  if (imageIndex === -1) {
    res.status(404);
    throw new Error('Image not found');
  }

  const image = product.images[imageIndex];

  // Delete from Cloudinary
  if (image.publicId) {
    await deleteImage(image.publicId);
  }

  // Remove from product
  product.images.splice(imageIndex, 1);

  // If deleted image was main and there are other images, set first as main
  if (image.isMain && product.images.length > 0) {
    product.images[0].isMain = true;
  }

  await product.save();

  res.json({
    success: true,
    message: 'Image deleted successfully',
    data: { images: product.images },
  });
});

// @desc    Set main product image (Admin)
// @route   PUT /api/products/:id/images/:imageId/main
// @access  Private/Admin
const setMainImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const imageIndex = product.images.findIndex(
    (img) => img._id.toString() === req.params.imageId
  );

  if (imageIndex === -1) {
    res.status(404);
    throw new Error('Image not found');
  }

  // Set all images to not main
  product.images.forEach((img) => (img.isMain = false));
  // Set selected image as main
  product.images[imageIndex].isMain = true;

  await product.save();

  res.json({
    success: true,
    message: 'Main image updated successfully',
    data: { images: product.images },
  });
});

// @desc    Add product review
// @route   POST /api/products/:id/reviews
// @access  Private
const addProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Check if user already reviewed
  const alreadyReviewed = product.reviews.find(
    (review) => review.user.toString() === req.user._id.toString()
  );

  if (alreadyReviewed) {
    res.status(400);
    throw new Error('You have already reviewed this product');
  }

  const review = {
    user: req.user._id,
    rating: Number(rating),
    comment,
  };

  product.reviews.push(review);
  product.calculateAverageRating();
  await product.save();

  res.status(201).json({
    success: true,
    message: 'Review added successfully',
  });
});

// @desc    Get all products for admin
// @route   GET /api/products/admin/all
// @access  Private/Admin
const getAllProductsAdmin = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const query = {};

  // Search
  if (req.query.search) {
    query.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { brand: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  // Category filter
  if (req.query.category) {
    query.category = req.query.category;
  }

  // Active filter
  if (req.query.isActive !== undefined) {
    query.isActive = req.query.isActive === 'true';
  }

  // Featured filter
  if (req.query.isFeatured !== undefined) {
    query.isFeatured = req.query.isFeatured === 'true';
  }

  // Stock filter
  if (req.query.lowStock === 'true') {
    query.stock = { $lte: 10 };
  }

  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate('category', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    data: {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// @desc    Get product statistics (Admin)
// @desc    Get product statistics (Admin)
// @route   GET /api/products/admin/stats
// @access  Private/Admin
const getProductStats = asyncHandler(async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const featuredProducts = await Product.countDocuments({ isFeatured: true });
    const outOfStock = await Product.countDocuments({ stock: 0 });
    const lowStock = await Product.countDocuments({ stock: { $gt: 0, $lte: 10 } });

    // Products by category
    const productsByCategory = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
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

    // Top selling products
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
  } catch (error) {
    console.error('Product stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = {
  getProducts,
  getFeaturedProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImages,
  deleteProductImage,
  setMainImage,
  addProductReview,
  getAllProductsAdmin,
  getProductStats,
};
