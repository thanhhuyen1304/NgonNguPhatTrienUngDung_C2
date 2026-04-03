const asyncHandler = require('express-async-handler');
const Category = require('../schemas/Category');
const Product = require('../schemas/Product');
const { deleteImage } = require('../config/cloudinary');

const getCategories = asyncHandler(async (req, res) => {
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
});

const getCategoryTree = asyncHandler(async (req, res) => {
  const categories = await Category.getCategoryTree();
  res.json({ success: true, data: { categories } });
});

const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true })
    .populate({
      path: 'subcategories',
      match: { isActive: true },
      select: 'name slug description image',
    })
    .populate('productsCount');

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  res.json({ success: true, data: { category } });
});

const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
    .populate({ path: 'subcategories', select: 'name slug description image isActive' })
    .populate('productsCount');

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  res.json({ success: true, data: { category } });
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, description, parent } = req.body;
  const existingCategory = await Category.findOne({ name });

  if (existingCategory) {
    res.status(400);
    throw new Error('Category with this name already exists');
  }

  const categoryData = { name, description };

  if (parent) {
    const parentCategory = await Category.findById(parent);
    if (!parentCategory) {
      res.status(404);
      throw new Error('Parent category not found');
    }
    categoryData.parent = parent;
  }

  const category = await Category.create(categoryData);
  res.status(201).json({ success: true, message: 'Category created successfully', data: { category } });
});

const updateCategory = asyncHandler(async (req, res) => {
  const { name, description, parent, isActive } = req.body;
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  if (name && name !== category.name) {
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      res.status(400);
      throw new Error('Category with this name already exists');
    }
  }

  if (parent && parent === req.params.id) {
    res.status(400);
    throw new Error('Category cannot be its own parent');
  }

  category.name = name || category.name;
  category.description = description !== undefined ? description : category.description;
  if (parent !== undefined) category.parent = parent || null;
  if (isActive !== undefined) category.isActive = isActive;

  const updatedCategory = await category.save();
  res.json({ success: true, message: 'Category updated successfully', data: { category: updatedCategory } });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  const productCount = await Product.countDocuments({ category: req.params.id });
  if (productCount > 0) {
    res.status(400);
    throw new Error(`Cannot delete category with ${productCount} products. Please reassign or delete products first.`);
  }

  const subcategoryCount = await Category.countDocuments({ parent: req.params.id });
  if (subcategoryCount > 0) {
    res.status(400);
    throw new Error(`Cannot delete category with ${subcategoryCount} subcategories. Please delete subcategories first.`);
  }

  if (category.image && category.image.publicId) {
    await deleteImage(category.image.publicId);
  }

  await Category.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Category deleted successfully' });
});

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

  if (category.image && category.image.publicId) {
    await deleteImage(category.image.publicId);
  }

  category.image = { url: req.file.path, publicId: req.file.filename };
  await category.save();

  res.json({ success: true, message: 'Image uploaded successfully', data: { image: category.image } });
});

const getAllCategoriesAdmin = asyncHandler(async (req, res) => {
  const categories = await Category.find()
    .populate('parent', 'name')
    .populate('productsCount')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: { categories } });
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
