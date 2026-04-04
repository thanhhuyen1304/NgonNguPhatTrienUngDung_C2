const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const passport = require('passport');
const dotenv = require('dotenv');
const http = require('http');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const auth = require('./routes/auth');
const user = require('./routes/user');
const product = require('./routes/product');
const category = require('./routes/category');
const cart = require('./routes/cart');
const order = require('./routes/order');
const upload = require('./routes/upload');
const wishlist = require('./routes/wishlist');
const shipper = require('./routes/shipper');
const support = require('./routes/support');
const payment = require('./routes/payment');
const coupon = require('./routes/coupon');

// Import middleware
const error = require('./middleware/error');

// Import passport config
require('./config/passport');

// Import Socket.IO
const { initializeSocket } = require('./socket/socketServer');

const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1);

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

/* =======================
   Middleware
======================= */
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  // Allow React Native mobile app requests
  'http://10.15.3.62:3000',        // Current WiFi IP (UPDATED)
  'http://10.137.133.162:3000',    // Previous WiFi IP
  'http://172.20.10.3:3000',       // Old WiFi IP
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        // For development, allow all origins for React Native
        if (process.env.NODE_ENV === 'development') {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true,
  })
);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* =======================
   MongoDB Atlas Connection
======================= */
if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI is missing in .env file');
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🔗 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.error('💡 Make sure MongoDB is running:');
    console.error('   - For local MongoDB: mongod --dbpath /path/to/data');
    console.error('   - For MongoDB service: sudo systemctl start mongod');
    console.error('   - For Docker: docker run -d -p 27017:27017 mongo');
    process.exit(1);
  });

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('🔄 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from MongoDB');
});

/* =======================
   API Routes
======================= */
app.use('/api/auth', auth);
app.use('/api/users', user);
app.use('/api/products', product);
app.use('/api/categories', category);
app.use('/api/cart', cart);
app.use('/api/orders', order);
app.use('/api/upload', upload);
app.use('/api/wishlist', wishlist);
app.use('/api/shipper', shipper);
app.use('/api/support', support);
app.use('/api/payment', payment);
app.use('/api/coupons', coupon);

/* =======================
   Health Check
======================= */
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  
  res.json({
    status: 'OK',
    message: 'Server is running',
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus,
      name: mongoose.connection.name || 'Not connected',
      host: mongoose.connection.host || 'Not connected',
    },
    timestamp: new Date().toISOString(),
  });
});

/* =======================
   Error Handling
======================= */
app.use(error);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

// Initialize Socket.IO
const io = initializeSocket(server);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`📡 API also available at http://0.0.0.0:${PORT}/api`);
  console.log(`🔌 Socket.IO server initialized`);
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please stop other processes or use a different port.`);
  }
  process.exit(1);
});

module.exports = app;
