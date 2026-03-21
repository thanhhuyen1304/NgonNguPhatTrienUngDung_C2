const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load env vars
dotenv.config();

// Import models
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');

// Sample data
const users = [
  {
    name: 'Administrator',
    email: 'admin@gmail.com',
    password: 'admin123',
    role: 'admin',
    isEmailVerified: true,
  },
  {
    name: 'User',
    email: 'user@gmail.com',
    password: 'user123',
    role: 'user',
    isEmailVerified: true,
  },
  {
    name: 'Shipper',
    email: 'shipper@gmail.com',
    password: 'shipper123',
    role: 'shipper',
    isEmailVerified: true,
  },
];

const categories = [
  { name: 'Electronics', description: 'Electronic devices and gadgets' },
  { name: 'Clothing', description: 'Fashion and apparel' },
  { name: 'Home & Garden', description: 'Home improvement and garden supplies' },
  { name: 'Books', description: 'Books and publications' },
  { name: 'Sports', description: 'Sports equipment and accessories' },
];

const products = [
  {
    name: 'Stylish Watch',
    description: 'A sleek and modern timepiece for every occasion. Perfect for both casual and formal wear.',
    price: 3200000, // 3.2 million VND (converted from $129.99)
    comparePrice: 3900000, // 3.9 million VND (converted from $159.99)
    stock: 50,
    brand: 'TimeMaster',
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
        publicId: 'sample-watch',
        isMain: true,
      },
    ],
  },
  {
    name: 'Wireless Headphones',
    description: 'Immersive sound quality with ultimate comfort. Active noise cancellation and 30-hour battery life.',
    price: 1950000, // 1.95 million VND (converted from $79.99)
    comparePrice: 2450000, // 2.45 million VND (converted from $99.99)
    stock: 100,
    brand: 'SoundMax',
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
        publicId: 'sample-headphones',
        isMain: true,
      },
    ],
  },
  {
    name: 'Smart Fitness Tracker',
    description: 'Track your health and fitness goals effortlessly. Heart rate monitor, sleep tracking, and more.',
    price: 1220000, // 1.22 million VND (converted from $49.99)
    comparePrice: 1710000, // 1.71 million VND (converted from $69.99)
    stock: 75,
    brand: 'FitTech',
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500',
        publicId: 'sample-fitness',
        isMain: true,
      },
    ],
  },
  {
    name: 'Portable Bluetooth Speaker',
    description: 'Powerful sound in a compact, travel-friendly design. Waterproof and dustproof.',
    price: 1460000, // 1.46 million VND (converted from $59.99)
    comparePrice: 1950000, // 1.95 million VND (converted from $79.99)
    stock: 60,
    brand: 'SoundMax',
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500',
        publicId: 'sample-speaker',
        isMain: true,
      },
    ],
  },
  {
    name: 'Ergonomic Office Chair',
    description: 'Comfort and support for long working hours. Adjustable height and lumbar support.',
    price: 4900000, // 4.9 million VND (converted from $199.99)
    comparePrice: 6100000, // 6.1 million VND (converted from $249.99)
    stock: 30,
    brand: 'ComfortPlus',
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=500',
        publicId: 'sample-chair',
        isMain: true,
      },
    ],
  },
  {
    name: 'High-Performance Laptop',
    description: 'Power and speed for all your computing needs. 16GB RAM, 512GB SSD, Intel Core i7.',
    price: 22000000, // 22 million VND (converted from $899.99)
    comparePrice: 26900000, // 26.9 million VND (converted from $1099.99)
    stock: 25,
    brand: 'TechPro',
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500',
        publicId: 'sample-laptop',
        isMain: true,
      },
    ],
  },
  {
    name: 'Digital Camera',
    description: 'Capture stunning photos and videos with ease. 24MP sensor and 4K video recording.',
    price: 8550000, // 8.55 million VND (converted from $349.99)
    comparePrice: 11000000, // 11 million VND (converted from $449.99)
    stock: 40,
    brand: 'PhotoMax',
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500',
        publicId: 'sample-camera',
        isMain: true,
      },
    ],
  },
  {
    name: 'Gaming Console',
    description: 'Unleash your gaming potential with next-gen graphics. Includes wireless controller.',
    price: 12200000, // 12.2 million VND (converted from $499.99)
    comparePrice: 13400000, // 13.4 million VND (converted from $549.99)
    stock: 35,
    brand: 'GameZone',
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=500',
        publicId: 'sample-console',
        isMain: true,
      },
    ],
  },
  // Clothing Products
  {
    name: 'Classic T-Shirt',
    description: 'Comfortable and stylish t-shirt perfect for everyday wear. 100% cotton.',
    price: 730000, // 730k VND (converted from $29.99)
    comparePrice: 980000, // 980k VND (converted from $39.99)
    stock: 200,
    brand: 'StyleWear',
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
        publicId: 'sample-tshirt',
        isMain: true,
      },
    ],
  },
  {
    name: 'Denim Jeans',
    description: 'Premium quality denim jeans with perfect fit. Available in multiple colors.',
    price: 1950000, // 1.95 million VND (converted from $79.99)
    comparePrice: 2450000, // 2.45 million VND (converted from $99.99)
    stock: 150,
    brand: 'DenimCo',
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500',
        publicId: 'sample-jeans',
        isMain: true,
      },
    ],
  },
  {
    name: 'Winter Jacket',
    description: 'Warm and waterproof winter jacket. Perfect for cold weather.',
    price: 3674755,
    comparePrice: 4899755,
    stock: 80,
    brand: 'WinterWear',
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=500',
        publicId: 'sample-jacket',
        isMain: true,
      },
    ],
  },
  // Home & Garden Products
  {
    name: 'Modern Table Lamp',
    description: 'Contemporary table lamp with adjustable brightness. Energy efficient LED.',
    price: 1224755,
    comparePrice: 1714755,
    stock: 120,
    brand: 'HomeDecor',
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1565636192335-14c46fa1120d?w=500',
        publicId: 'sample-lamp',
        isMain: true,
      },
    ],
  },
  {
    name: 'Decorative Pillow Set',
    description: 'Set of 4 decorative pillows with premium fabric. Machine washable.',
    price: 59.99,
    comparePrice: 79.99,
    stock: 100,
    brand: 'HomeComfort',
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500',
        publicId: 'sample-pillows',
        isMain: true,
      },
    ],
  },
  {
    name: 'Garden Tool Set',
    description: 'Complete garden tool set with 10 essential tools. Stainless steel construction.',
    price: 89.99,
    comparePrice: 119.99,
    stock: 60,
    brand: 'GardenPro',
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1585934348881-2f2e0a7fa6b3?w=500',
        publicId: 'sample-tools',
        isMain: true,
      },
    ],
  },
  // Books Products
  {
    name: 'The Art of Programming',
    description: 'A comprehensive guide to programming concepts and best practices.',
    price: 49.99,
    comparePrice: 59.99,
    stock: 100,
    brand: 'TechBooks',
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1507842217343-583f20270319?w=500',
        publicId: 'sample-book1',
        isMain: true,
      },
    ],
  },
  {
    name: 'Digital Marketing Mastery',
    description: 'Learn digital marketing strategies from industry experts. Practical examples included.',
    price: 39.99,
    comparePrice: 49.99,
    stock: 80,
    brand: 'BusinessBooks',
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500',
        publicId: 'sample-book2',
        isMain: true,
      },
    ],
  },
  {
    name: 'Web Development Guide',
    description: 'Complete guide to modern web development with HTML, CSS, and JavaScript.',
    price: 44.99,
    comparePrice: 54.99,
    stock: 90,
    brand: 'WebBooks',
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1538224527238-dd029dca8f96?w=500',
        publicId: 'sample-book3',
        isMain: true,
      },
    ],
  },
  // Sports Products
  {
    name: 'Professional Yoga Mat',
    description: 'Non-slip yoga mat with carrying strap. TPE material for durability.',
    price: 39.99,
    comparePrice: 49.99,
    stock: 150,
    brand: 'FitnessGear',
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500',
        publicId: 'sample-yogamat',
        isMain: true,
      },
    ],
  },
  {
    name: 'Running Shoes',
    description: 'Lightweight and comfortable running shoes with cushioning. For all terrains.',
    price: 119.99,
    comparePrice: 149.99,
    stock: 100,
    brand: 'RunFast',
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
        publicId: 'sample-shoes',
        isMain: true,
      },
    ],
  },
  {
    name: 'Adjustable Dumbbell Set',
    description: 'Set of adjustable dumbbells from 5lbs to 25lbs. Perfect for home gym.',
    price: 199.99,
    comparePrice: 249.99,
    stock: 50,
    brand: 'PowerFit',
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500',
        publicId: 'sample-dumbbells',
        isMain: true,
      },
    ],
  },
];

// Connect to MongoDB and seed data
const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany();
    await Category.deleteMany();
    await Product.deleteMany();
    console.log('Cleared existing data');

    // Create users
    const createdUsers = await User.create(users);
    console.log(`Created ${createdUsers.length} users`);
    console.log('Admin credentials: admin@gmail.com / admin123');
    console.log('User credentials: user@gmail.com / user123');
    console.log('Shipper credentials: shipper@gmail.com / shipper123');

    // Create categories
    const createdCategories = await Category.create(categories);
    console.log(`Created ${createdCategories.length} categories`);

    // Create products with category reference
    const electronicsCategory = createdCategories.find(c => c.name === 'Electronics');
    const clothingCategory = createdCategories.find(c => c.name === 'Clothing');
    const homeGardenCategory = createdCategories.find(c => c.name === 'Home & Garden');
    const booksCategory = createdCategories.find(c => c.name === 'Books');
    const sportsCategory = createdCategories.find(c => c.name === 'Sports');
    
    const productsWithCategory = products.map((product, index) => {
      let category;
      if (index < 8) {
        category = electronicsCategory._id;
      } else if (index < 11) {
        category = clothingCategory._id;
      } else if (index < 14) {
        category = homeGardenCategory._id;
      } else if (index < 17) {
        category = booksCategory._id;
      } else {
        category = sportsCategory._id;
      }
      return { ...product, category };
    });
    
    const createdProducts = await Product.create(productsWithCategory);
    console.log(`Created ${createdProducts.length} products`);

    console.log('\n✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeder
seedDatabase();
