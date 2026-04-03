const asyncHandler = require('express-async-handler');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { deleteImage } = require('../config/cloudinary');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const query = { isActive: true };

  // Only get parent categories if requested
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

  res.json({
    success: true,
    data: { categories },
  });
});

// @desc    Get category tree
// @route   GET /api/categories/tree
// @access  Public
const getCategoryTree = asyncHandler(async (req, res) => {
  const categories = await Category.getCategoryTree();

  res.json({
    success: true,
    data: { categories },
  });
});

// @desc    Get category by slug
// @route   GET /api/categories/slug/:slug
// @access  Public
const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true })
    .populate({
      path: 'subcategories',
      match: { isActive: true },
      select: 'name slug description image',
    })
    .populate('productsCount');

  if (category) {
    res.json({
      success: true,
      data: { category },
    });
  } else {
    res.status(404);
    throw new Error('Category not found');
  }
});

// @desc    Get category by ID
// @route   GET /api/categories/:id
// @access  Public
const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
    .populate({
      path: 'subcategories',
      select: 'name slug description image isActive',
    })
    .populate('productsCount');

  if (category) {
    res.json({
      success: true,
      data: { category },
    });
  } else {
    res.status(404);
    throw new Error('Category not found');
  }
});

// @desc    Create category (Admin)
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, parent } = req.body;

  // Check if category with same name exists
  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    res.status(400);
    throw new Error('Category with this name already exists');
  }

  const categoryData = {
    name,
    description,
  };

  if (parent) {
    const parentCategory = await Category.findById(parent);
    if (!parentCategory) {
      res.status(404);
      throw new Error('Parent category not found');
    }
    categoryData.parent = parent;
  }

  const category = await Category.create(categoryData);

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: { category },
  });
});

// @desc    Update category (Admin)
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = asyncHandler(async (req, res) => {
  const { name, description, parent, isActive } = req.body;

  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  // Check if new name conflicts with existing category
  if (name && name !== category.name) {
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      res.status(400);
      throw new Error('Category with this name already exists');
    }
  }

  // Prevent setting itself as parent
  if (parent && parent === req.params.id) {
    res.status(400);
    throw new Error('Category cannot be its own parent');
  }

  category.name = name || category.name;
  category.description = description !== undefined ? description : category.description;
  if (parent !== undefined) {
    category.parent = parent || null;
  }
  if (isActive !== undefined) category.isActive = isActive;

  const updatedCategory = await category.save();

  res.json({
    success: true,
    message: 'Category updated successfully',
    data: { category: updatedCategory },
  });
});

// @desc    Delete category (Admin)
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  // Check if category has products
  const productCount = await Product.countDocuments({ category: req.params.id });
  if (productCount > 0) {
    res.status(400);
    throw new Error(`Cannot delete category with ${productCount} products. Please reassign or delete products first.`);
  }

  // Check if category has subcategories
  const subcategoryCount = await Category.countDocuments({ parent: req.params.id });
  if (subcategoryCount > 0) {
    res.status(400);
    throw new Error(`Cannot delete category with ${subcategoryCount} subcategories. Please delete subcategories first.`);
  }

  // Delete image from Cloudinary if exists
  if (category.image && category.image.publicId) {
    await deleteImage(category.image.publicId);
  }

  await Category.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Category deleted successfully',
  });
});

// @desc    Upload category image (Admin)
// @route   POST /api/categories/:id/image
// @access  Private/Admin
const uploadCategoryImage = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image');
  }

  // Delete old image if exists
  if (category.image && category.image.publicId) {
    await deleteImage(category.image.publicId);
  }

  category.image = {
    url: req.file.path,
    publicId: req.file.filename,
  };

  await category.save();

  res.json({
    success: true,
    message: 'Image uploaded successfully',
    data: { image: category.image },
  });
});

// @desc    Get all categories for admin
// @route   GET /api/categories/admin/all
// @access  Private/Admin
const getAllCategoriesAdmin = asyncHandler(async (req, res) => {
  const categories = await Category.find()
    .populate('parent', 'name')
    .populate('productsCount')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: { categories },
  });
});

module.exports = {
  getCategories,
  getCategoryTree,
  getCategoryBySlug,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
  getAllCategoriesAdmin,
};
