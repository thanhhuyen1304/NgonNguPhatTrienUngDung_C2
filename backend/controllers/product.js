const asyncHandler = require('express-async-handler');
const Product = require('../schemas/Product');
const { deleteImage } = require('../config/cloudinary');

const getProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 12;
  const skip = (page - 1) * limit;
  const query = { isActive: true };

  if (req.query.search) query.$text = { $search: req.query.search };
  if (req.query.category) query.category = req.query.category;

  if (req.query.minPrice || req.query.maxPrice) {
    query.price = {};
    if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice);
    if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice);
  }

  if (req.query.brand) query.brand = { $regex: req.query.brand, $options: 'i' };
  if (req.query.minRating) query.rating = { $gte: parseFloat(req.query.minRating) };
  if (req.query.inStock === 'true') query.stock = { $gt: 0 };

  let sortOption = { createdAt: -1 };
  if (req.query.sort) {
    switch (req.query.sort) {
      case 'price_asc': sortOption = { price: 1 }; break;
      case 'price_desc': sortOption = { price: -1 }; break;
      case 'rating': sortOption = { rating: -1 }; break;
      case 'newest': sortOption = { createdAt: -1 }; break;
      case 'bestselling': sortOption = { sold: -1 }; break;
      case 'name_asc': sortOption = { name: 1 }; break;
      case 'name_desc': sortOption = { name: -1 }; break;
      default: sortOption = { createdAt: -1 };
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
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
});

const getFeaturedProducts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 8;
  const products = await Product.getFeaturedProducts(limit);
  res.json({ success: true, data: { products } });
});

const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .populate('category', 'name slug')
    .populate('reviews.user', 'name avatar');

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  res.json({ success: true, data: { product } });
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name slug')
    .populate('reviews.user', 'name avatar');

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  res.json({ success: true, data: { product } });
});

const addProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const alreadyReviewed = product.reviews.find((review) => review.user.toString() === req.user._id.toString());
  if (alreadyReviewed) {
    res.status(400);
    throw new Error('You have already reviewed this product');
  }

  product.reviews.push({ user: req.user._id, rating: Number(rating), comment });
  product.calculateAverageRating();
  await product.save();

  res.status(201).json({ success: true, message: 'Review added successfully' });
});

const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, comparePrice, category, stock, brand, tags, specifications, isFeatured } = req.body;

  const product = await Product.create({
    name,
    description,
    price,
    comparePrice,
    category,
    stock: stock || 0,
    brand,
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((tag) => tag.trim())) : [],
    specifications: specifications || [],
    isFeatured: isFeatured || false,
    images: [],
  });

  res.status(201).json({ success: true, message: 'Product created successfully', data: { product } });
});

const updateProduct = asyncHandler(async (req, res) => {
  const { name, description, price, comparePrice, category, stock, brand, tags, specifications, isFeatured, isActive } = req.body;
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
  if (tags) product.tags = Array.isArray(tags) ? tags : tags.split(',').map((tag) => tag.trim());
  if (specifications) product.specifications = specifications;
  if (isFeatured !== undefined) product.isFeatured = isFeatured;
  if (isActive !== undefined) product.isActive = isActive;

  const updatedProduct = await product.save();
  res.json({ success: true, message: 'Product updated successfully', data: { product: updatedProduct } });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  for (const image of product.images) {
    if (image.publicId) {
      await deleteImage(image.publicId);
    }
  }

  await Product.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Product deleted successfully' });
});

const addProductImages = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (!req.files || req.files.length === 0) {
    console.log('DEBUG: No files in request. Headers:', req.headers['content-type']);
    throw new AppError('Please upload at least one image', 400);
  }

  const newImages = req.files.map((file, index) => {
    // Standardize URLs and public IDs from Cloudinary
    // Fallback to local placeholders if Cloudinary is not configured
    const url = file.path || file.secure_url || (file.buffer ? `data:${file.mimetype};base64,${file.buffer.toString('base64')}` : null);
    const publicId = file.filename || file.public_id || `temp_${Date.now()}_${index}`;

    if (!url) {
      throw new Error(`File upload failed for file: ${file.originalname}`);
    }

    return {
      url: url,
      publicId: publicId,
      isMain: product.images.length === 0 && index === 0,
    };
  });

  try {
    product.images.push(...newImages);
    await product.save();
    res.json({ success: true, message: 'Images uploaded successfully', data: { images: product.images } });
  } catch (error) {
    console.error('❌ Error saving product images:', error);
    res.status(500);
    throw new Error('Failed to save product images: ' + error.message);
  }
});

const deleteProductImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const imageIndex = product.images.findIndex((image) => image._id.toString() === req.params.imageId);
  if (imageIndex === -1) {
    res.status(404);
    throw new Error('Image not found');
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
});

const setMainImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const imageIndex = product.images.findIndex((image) => image._id.toString() === req.params.imageId);
  if (imageIndex === -1) {
    res.status(404);
    throw new Error('Image not found');
  }

  product.images.forEach((image) => {
    image.isMain = false;
  });
  product.images[imageIndex].isMain = true;

  await product.save();
  res.json({ success: true, message: 'Main image updated successfully', data: { images: product.images } });
});

const getAllProductsAdmin = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  const query = {};

  if (req.query.search) {
    query.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { brand: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  if (req.query.category) query.category = req.query.category;
  if (req.query.isActive !== undefined) query.isActive = req.query.isActive === 'true';
  if (req.query.isFeatured !== undefined) query.isFeatured = req.query.isFeatured === 'true';
  if (req.query.lowStock === 'true') query.stock = { $lte: 10 };

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
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
});

const getProductStats = asyncHandler(async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const featuredProducts = await Product.countDocuments({ isFeatured: true });
    const outOfStock = await Product.countDocuments({ stock: 0 });
    const lowStock = await Product.countDocuments({ stock: { $gt: 0, $lte: 10 } });

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
      { $project: { _id: 0, category: { $ifNull: ['$category.name', 'Uncategorized'] }, count: 1 } },
    ]);

    const topSelling = await Product.find({ isActive: true }).sort({ sold: -1 }).limit(10).select('name sold price images');

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
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
});

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
