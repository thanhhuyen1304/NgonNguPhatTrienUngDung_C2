const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Category = require('../schemas/Category');
const Product = require('../schemas/Product');
const { deleteImage } = require('../config/cloudinary');
const { AppError } = require('../middleware/error');

const { protect, admin } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const { categoryValidation, mongoIdValidation } = require('../middleware/validate');

const getCategoryOrThrow = async (categoryId) => {
  const category = await Category.findById(categoryId);

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  return category;
};

// Public routes
router.get('/', asyncHandler(async (req, res) => {
  const query = { isActive: true };

  if (req.query.parentOnly === 'true') {
    query.parent = null;
  }

  const categories = await Category.find(query)
    .populate({
      path: 'subcategories',
      match: { isActive: true },
      select: 'name slug description image',
    })
    .populate('productsCount')
    .select('name slug description image')
    .sort({ name: 1 });

  res.json({ success: true, data: { categories } });
}));

router.get('/tree', asyncHandler(async (req, res) => {
  const categories = await Category.getCategoryTree();
  res.json({ success: true, data: { categories } });
}));

router.get('/slug/:slug', asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true })
    .populate({
      path: 'subcategories',
      match: { isActive: true },
      select: 'name slug description image',
    })
    .populate('productsCount');

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  res.json({ success: true, data: { category } });
}));

// Admin routes
router.get('/admin/all', protect, admin, asyncHandler(async (req, res) => {
  const categories = await Category.find()
    .populate('parent', 'name')
    .populate('productsCount')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: { categories } });
}));

router.post('/', protect, admin, categoryValidation, asyncHandler(async (req, res) => {
  const existingCategory = await Category.findOne({ name: req.body.name });
  if (existingCategory) {
    throw new AppError('Category with this name already exists', 400);
  }

  const categoryData = {
    name: req.body.name,
    description: req.body.description,
  };

  if (req.body.parent) {
    const parentCategory = await Category.findById(req.body.parent);
    if (!parentCategory) {
      throw new AppError('Parent category not found', 404);
    }

    categoryData.parent = req.body.parent;
  }

  const category = await Category.create(categoryData);
  res.status(201).json({ success: true, message: 'Category created successfully', data: { category } });
}));

router.put('/:id', protect, admin, mongoIdValidation('id'), asyncHandler(async (req, res) => {
  const category = await getCategoryOrThrow(req.params.id);

  if (req.body.name && req.body.name !== category.name) {
    const existingCategory = await Category.findOne({ name: req.body.name });
    if (existingCategory) {
      throw new AppError('Category with this name already exists', 400);
    }
  }

  if (req.body.parent && req.body.parent === req.params.id) {
    throw new AppError('Category cannot be its own parent', 400);
  }

  category.name = req.body.name || category.name;
  category.description = req.body.description !== undefined ? req.body.description : category.description;

  if (req.body.parent !== undefined) {
    category.parent = req.body.parent || null;
  }

  if (req.body.isActive !== undefined) {
    category.isActive = req.body.isActive;
  }

  const updatedCategory = await category.save();
  res.json({ success: true, message: 'Category updated successfully', data: { category: updatedCategory } });
}));

router.delete('/:id', protect, admin, mongoIdValidation('id'), asyncHandler(async (req, res) => {
  const category = await getCategoryOrThrow(req.params.id);
  const productCount = await Product.countDocuments({ category: req.params.id });
  if (productCount > 0) {
    throw new AppError(
      `Cannot delete category with ${productCount} products. Please reassign or delete products first.`,
      400
    );
  }

  const subcategoryCount = await Category.countDocuments({ parent: req.params.id });
  if (subcategoryCount > 0) {
    throw new AppError(
      `Cannot delete category with ${subcategoryCount} subcategories. Please delete subcategories first.`,
      400
    );
  }

  if (category.image && category.image.publicId) {
    await deleteImage(category.image.publicId);
  }

  await Category.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Category deleted successfully' });
}));

router.post(
  '/:id/image',
  protect,
  admin,
  mongoIdValidation('id'),
  upload.single('image'),
  asyncHandler(async (req, res) => {
    const category = await getCategoryOrThrow(req.params.id);

    if (!req.file) {
      throw new AppError('Please upload an image', 400);
    }

    if (category.image && category.image.publicId) {
      await deleteImage(category.image.publicId);
    }

    category.image = { url: req.file.path, publicId: req.file.filename };
    await category.save();

    res.json({ success: true, message: 'Image uploaded successfully', data: { image: category.image } });
  })
);

router.get('/:id', mongoIdValidation('id'), asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
    .populate({ path: 'subcategories', select: 'name slug description image isActive' })
    .populate('productsCount');

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  res.json({ success: true, data: { category } });
}));

module.exports = router;
