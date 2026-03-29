const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Category = require('../models/Category');
const Product = require('../models/Product');

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

function slugifyCategory(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function slugifyProduct(name) {
  return slugifyCategory(name);
}

if (!mongoUri) {
  console.error('Missing MONGO_URI or MONGODB_URI in backend/.env');
  process.exit(1);
}

const categorySeeds = [
  {
    name: 'Smartphones',
    description: 'Android and iPhone models for study, work, and daily use.',
  },
  {
    name: 'Laptops',
    description: 'Portable computers for students, office work, and creators.',
  },
  {
    name: 'Audio',
    description: 'Headphones, speakers, and sound accessories.',
  },
  {
    name: 'Fashion',
    description: 'Everyday outfits, casual wear, and seasonal clothing.',
  },
  {
    name: 'Footwear',
    description: 'Sneakers, sandals, and shoes for work and travel.',
  },
  {
    name: 'Home Office',
    description: 'Work-from-home furniture and desk accessories.',
  },
  {
    name: 'Kitchen',
    description: 'Kitchen appliances and tools for modern homes.',
  },
  {
    name: 'Books & Learning',
    description: 'Books and learning materials for personal growth.',
  },
  {
    name: 'Fitness',
    description: 'Workout gear and recovery essentials.',
  },
  {
    name: 'Travel Gear',
    description: 'Bags and accessories for commuting and trips.',
  },
];

const productSeeds = [
  {
    name: 'Nova X5 Smartphone',
    description: 'A 5G smartphone with AMOLED display, 256GB storage, and all-day battery life.',
    price: 8990000,
    comparePrice: 9990000,
    stock: 35,
    brand: 'NovaTech',
    isFeatured: true,
    categoryName: 'Smartphones',
    tags: ['5g', 'amoled', '256gb'],
    specifications: [
      { key: 'Screen', value: '6.67-inch AMOLED' },
      { key: 'Storage', value: '256GB' },
      { key: 'Battery', value: '5000mAh' },
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',
        publicId: 'catalog-nova-x5',
        isMain: true,
      },
    ],
  },
  {
    name: 'AeroBook 14',
    description: 'A lightweight 14-inch laptop for office work, online classes, and travel.',
    price: 16490000,
    comparePrice: 17990000,
    stock: 18,
    brand: 'Aero',
    isFeatured: true,
    categoryName: 'Laptops',
    tags: ['laptop', '14-inch', 'student'],
    specifications: [
      { key: 'Processor', value: 'Intel Core i5' },
      { key: 'RAM', value: '16GB' },
      { key: 'Storage', value: '512GB SSD' },
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',
        publicId: 'catalog-aerobook-14',
        isMain: true,
      },
    ],
  },
  {
    name: 'Pulse ANC Headphones',
    description: 'Wireless over-ear headphones with active noise cancellation and fast charging.',
    price: 2390000,
    comparePrice: 2790000,
    stock: 42,
    brand: 'Pulse',
    isFeatured: true,
    categoryName: 'Audio',
    tags: ['anc', 'wireless', 'bluetooth'],
    specifications: [
      { key: 'Battery', value: '30 hours' },
      { key: 'Connectivity', value: 'Bluetooth 5.3' },
      { key: 'Charging', value: 'USB-C' },
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
        publicId: 'catalog-pulse-anc',
        isMain: true,
      },
    ],
  },
  {
    name: 'Urban Cotton Hoodie',
    description: 'A soft everyday hoodie with relaxed fit and breathable cotton blend fabric.',
    price: 690000,
    comparePrice: 790000,
    stock: 70,
    brand: 'UrbanEase',
    isFeatured: false,
    categoryName: 'Fashion',
    tags: ['hoodie', 'cotton', 'casual'],
    specifications: [
      { key: 'Material', value: '80% cotton, 20% polyester' },
      { key: 'Fit', value: 'Relaxed' },
      { key: 'Sizes', value: 'S-XL' },
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800',
        publicId: 'catalog-urban-hoodie',
        isMain: true,
      },
    ],
  },
  {
    name: 'Stride Runner Pro',
    description: 'Lightweight running shoes with cushioned sole and breathable upper.',
    price: 1490000,
    comparePrice: 1690000,
    stock: 54,
    brand: 'Stride',
    isFeatured: true,
    categoryName: 'Footwear',
    tags: ['running', 'sneakers', 'sport'],
    specifications: [
      { key: 'Upper', value: 'Engineered mesh' },
      { key: 'Sole', value: 'Foam cushioning' },
      { key: 'Weight', value: '245g' },
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
        publicId: 'catalog-stride-runner',
        isMain: true,
      },
    ],
  },
  {
    name: 'ErgoLift Desk Chair',
    description: 'An ergonomic desk chair with lumbar support for long work sessions.',
    price: 3290000,
    comparePrice: 3790000,
    stock: 16,
    brand: 'ErgoLift',
    isFeatured: false,
    categoryName: 'Home Office',
    tags: ['chair', 'ergonomic', 'office'],
    specifications: [
      { key: 'Material', value: 'Mesh backrest' },
      { key: 'Adjustment', value: 'Height and tilt' },
      { key: 'Support', value: 'Lumbar support' },
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1505843513577-22bb7d21e455?w=800',
        publicId: 'catalog-ergolift-chair',
        isMain: true,
      },
    ],
  },
  {
    name: 'ChefMate Air Fryer 6L',
    description: 'A family-sized air fryer with preset cooking modes and low-oil frying.',
    price: 2190000,
    comparePrice: 2490000,
    stock: 24,
    brand: 'ChefMate',
    isFeatured: true,
    categoryName: 'Kitchen',
    tags: ['air fryer', 'kitchen', '6l'],
    specifications: [
      { key: 'Capacity', value: '6 liters' },
      { key: 'Power', value: '1700W' },
      { key: 'Modes', value: '8 presets' },
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1585515656476-bbdfc1f44c79?w=800',
        publicId: 'catalog-chefmate-airfryer',
        isMain: true,
      },
    ],
  },
  {
    name: 'Clean Code Handbook',
    description: 'A practical programming book about writing maintainable and readable code.',
    price: 320000,
    comparePrice: 390000,
    stock: 60,
    brand: 'DevBooks',
    isFeatured: false,
    categoryName: 'Books & Learning',
    tags: ['programming', 'book', 'clean code'],
    specifications: [
      { key: 'Format', value: 'Paperback' },
      { key: 'Pages', value: '420' },
      { key: 'Language', value: 'English' },
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800',
        publicId: 'catalog-clean-code-handbook',
        isMain: true,
      },
    ],
  },
  {
    name: 'CoreFlex Yoga Mat',
    description: 'A non-slip yoga mat with balanced cushioning for home workouts and studio sessions.',
    price: 450000,
    comparePrice: 520000,
    stock: 85,
    brand: 'CoreFlex',
    isFeatured: false,
    categoryName: 'Fitness',
    tags: ['yoga', 'mat', 'fitness'],
    specifications: [
      { key: 'Thickness', value: '6mm' },
      { key: 'Material', value: 'TPE' },
      { key: 'Length', value: '183cm' },
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
        publicId: 'catalog-coreflex-mat',
        isMain: true,
      },
    ],
  },
  {
    name: 'Voyager Carry Backpack',
    description: 'A water-resistant backpack with laptop sleeve for city commuting and short trips.',
    price: 890000,
    comparePrice: 990000,
    stock: 33,
    brand: 'Voyager',
    isFeatured: false,
    categoryName: 'Travel Gear',
    tags: ['backpack', 'travel', 'laptop'],
    specifications: [
      { key: 'Capacity', value: '22L' },
      { key: 'Material', value: 'Water-resistant fabric' },
      { key: 'Laptop Sleeve', value: '15.6-inch' },
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
        publicId: 'catalog-voyager-backpack',
        isMain: true,
      },
    ],
  },
];

async function seedCatalog() {
  await mongoose.connect(mongoUri);

  const categoryMap = new Map();

  for (const categorySeed of categorySeeds) {
    const category = await Category.findOneAndUpdate(
      { name: categorySeed.name },
      {
        $set: {
          ...categorySeed,
          slug: slugifyCategory(categorySeed.name),
          isActive: true,
          parent: null,
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    categoryMap.set(categorySeed.name, category);
  }

  for (const productSeed of productSeeds) {
    const category = categoryMap.get(productSeed.categoryName);

    await Product.findOneAndUpdate(
      { name: productSeed.name },
      {
        $set: {
          name: productSeed.name,
          slug: slugifyProduct(productSeed.name),
          description: productSeed.description,
          price: productSeed.price,
          comparePrice: productSeed.comparePrice,
          stock: productSeed.stock,
          brand: productSeed.brand,
          isFeatured: productSeed.isFeatured,
          category: category._id,
          tags: productSeed.tags,
          specifications: productSeed.specifications,
          images: productSeed.images,
          isActive: true,
        },
      },
      { new: true, upsert: true, runValidators: true }
    );
  }

  const insertedCategories = await Category.find({ name: { $in: categorySeeds.map((item) => item.name) } })
    .select('name slug description isActive')
    .sort({ name: 1 });

  const insertedProducts = await Product.find({ name: { $in: productSeeds.map((item) => item.name) } })
    .populate('category', 'name slug')
    .select('name slug price stock brand isFeatured category')
    .sort({ name: 1 });

  console.log(`Seeded ${insertedCategories.length} categories and ${insertedProducts.length} products.`);
  console.log('Categories:', insertedCategories.map((item) => item.name).join(', '));
  console.log('Products:', insertedProducts.map((item) => item.name).join(', '));
}

seedCatalog()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Catalog seed failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  });
