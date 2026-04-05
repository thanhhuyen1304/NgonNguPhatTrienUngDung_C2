const Category = require('../schemas/Category');
const Product = require('../schemas/Product');
const { deleteImage } = require('../config/cloudinary');
const { AppError } = require('../middleware/error');

const getCategoryOrThrow = async (categoryId) => {
  const category = await Category.findById(categoryId);

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  return category;
};

const getCategories = async (queryParams = {}) => {
  const query = { isActive: true };

  if (queryParams.parentOnly === 'true') {
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

  return { categories };
};

const getCategoryTree = async () => {
  const categories = await Category.getCategoryTree();
  return { categories };
};

const getCategoryBySlug = async (slug) => {
  const category = await Category.findOne({ slug, isActive: true })
    .populate({
      path: 'subcategories',
      match: { isActive: true },
      select: 'name slug description image',
    })
    .populate('productsCount');

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  return { category };
};

const getCategoryById = async (categoryId) => {
  const category = await Category.findById(categoryId)
    .populate({ path: 'subcategories', select: 'name slug description image isActive' })
    .populate('productsCount');

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  return { category };
};

const createCategory = async (payload = {}) => {
  const existingCategory = await Category.findOne({ name: payload.name });
  if (existingCategory) {
    throw new AppError('Category with this name already exists', 400);
  }

  const categoryData = {
    name: payload.name,
    description: payload.description,
  };

  if (payload.parent) {
    const parentCategory = await Category.findById(payload.parent);
    if (!parentCategory) {
      throw new AppError('Parent category not found', 404);
    }

    categoryData.parent = payload.parent;
  }

  const category = await Category.create(categoryData);
  return { category };
};

const updateCategory = async (categoryId, payload = {}) => {
  const category = await getCategoryOrThrow(categoryId);

  if (payload.name && payload.name !== category.name) {
    const existingCategory = await Category.findOne({ name: payload.name });
    if (existingCategory) {
      throw new AppError('Category with this name already exists', 400);
    }
  }

  if (payload.parent && payload.parent === categoryId) {
    throw new AppError('Category cannot be its own parent', 400);
  }

  category.name = payload.name || category.name;
  category.description = payload.description !== undefined ? payload.description : category.description;

  if (payload.parent !== undefined) {
    category.parent = payload.parent || null;
  }

  if (payload.isActive !== undefined) {
    category.isActive = payload.isActive;
  }

  const updatedCategory = await category.save();
  return { category: updatedCategory };
};

const deleteCategory = async (categoryId) => {
  const category = await getCategoryOrThrow(categoryId);
  const productCount = await Product.countDocuments({ category: categoryId });
  if (productCount > 0) {
    throw new AppError(
      `Cannot delete category with ${productCount} products. Please reassign or delete products first.`,
      400
    );
  }

  const subcategoryCount = await Category.countDocuments({ parent: categoryId });
  if (subcategoryCount > 0) {
    throw new AppError(
      `Cannot delete category with ${subcategoryCount} subcategories. Please delete subcategories first.`,
      400
    );
  }

  if (category.image && category.image.publicId) {
    await deleteImage(category.image.publicId);
  }

  await Category.findByIdAndDelete(categoryId);
};

const uploadCategoryImage = async ({ categoryId, file }) => {
  const category = await getCategoryOrThrow(categoryId);

  if (!file) {
    throw new AppError('Please upload an image', 400);
  }

  if (category.image && category.image.publicId) {
    await deleteImage(category.image.publicId);
  }

  category.image = { url: file.path, publicId: file.filename };
  await category.save();

  return { image: category.image };
};

const getAllCategoriesAdmin = async () => {
  const categories = await Category.find()
    .populate('parent', 'name')
    .populate('productsCount')
    .sort({ createdAt: -1 });

  return { categories };
};

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
