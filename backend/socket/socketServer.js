const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io;

// Initialize Socket.IO server
const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        // Allow React Native mobile app requests
        'http://172.20.10.3:3000',
        'http://10.15.3.62:3000',
        'http://10.137.133.162:3000',
      ],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth.token || socket.handshake.headers.authorization;
      if (token && typeof token === 'string' && token.startsWith('Bearer ')) {
        token = token.replace('Bearer ', '');
      }
      
      if (!token) {
        console.error('Socket Auth Error: No token provided in handshake');
        return next(new Error('Authentication error: No token provided'));
      }

      console.log(`Socket Auth: Received token starting with: ${token.substring(0, 15)}...`);

      if (!process.env.JWT_SECRET) {
        console.error('Socket Auth Error: JWT_SECRET is not defined in environment variables!');
      }

      jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
          console.error('Socket Auth Error: jwt.verify failed:', err.message, err.name);
          return next(new Error('Authentication error: Invalid token'));
        }

        try {
          const user = await User.findById(decoded.id).select('-password');
          
          if (!user) {
            console.error(`Socket Auth Error: User with ID ${decoded.id} not found in DB`);
            return next(new Error('Authentication error: User not found'));
          }

          socket.userId = user._id.toString();
          socket.userRole = user.role;
          socket.userName = user.name;
          
          console.log(`🔌 User connected: ${user.name} (${user.role}) - Socket ID: ${socket.id}`);
          next();
        } catch (dbErr) {
          console.error('Socket Auth Error: Database lookup failed:', dbErr.message);
          return next(new Error('Authentication error: Server error'));
        }
      });
    } catch (error) {
      console.error('Socket Auth catching unexpected error:', error.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Handle socket connections
  io.on('connection', (socket) => {
    console.log(`✅ Socket connected: ${socket.userName} (${socket.userRole})`);

    // Join user to their personal room for targeted notifications
    socket.join(`user_${socket.userId}`);
    
    // Join role-based rooms
    socket.join(`role_${socket.userRole}`);
    
    // Join admin room if user is admin
    if (socket.userRole === 'admin') {
      socket.join('admins');
    }
    
    // Join shipper room if user is shipper
    if (socket.userRole === 'shipper') {
      socket.join('shippers');
    }

    // Handle order room joining (for order-specific updates)
    socket.on('join_order', (orderId) => {
      socket.join(`order_${orderId}`);
      console.log(`📦 ${socket.userName} joined order room: ${orderId}`);
    });

    // Handle order room leaving
    socket.on('leave_order', (orderId) => {
      socket.leave(`order_${orderId}`);
      console.log(`📦 ${socket.userName} left order room: ${orderId}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.userName} (${socket.userRole})`);
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to real-time updates',
      userId: socket.userId,
      role: socket.userRole,
    });
  });

  return io;
};

// Get Socket.IO instance
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Emit order status update to relevant users
const emitOrderStatusUpdate = (order, previousStatus, updatedBy, note) => {
  if (!io) {
    console.warn('Socket.IO not initialized, skipping real-time update');
    return;
  }

  const updateData = {
    orderId: order._id,
    orderNumber: order.orderNumber,
    previousStatus,
    newStatus: order.status,
    updatedBy: updatedBy,
    note: note,
    timestamp: new Date(),
    order: {
      _id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      user: order.user,
      shipper: order.shipper,
      totalPrice: order.totalPrice,
      createdAt: order.createdAt,
    },
  };

  console.log(`📡 Emitting order status update: ${order.orderNumber} (${previousStatus} → ${order.status})`);

  // Emit to order-specific room (anyone viewing this specific order)
  io.to(`order_${order._id}`).emit('order_status_updated', updateData);

  // Emit to order owner (user who placed the order)
  if (order.user) {
    io.to(`user_${order.user}`).emit('order_status_updated', updateData);
  }

  // Emit to assigned shipper
  if (order.shipper) {
    io.to(`user_${order.shipper}`).emit('order_status_updated', updateData);
  }

  // Emit to all admins
  io.to('admins').emit('order_status_updated', updateData);

  // Emit to all shippers for order availability updates
  io.to('shippers').emit('order_status_updated', updateData);
};

// Emit new order notification
const emitNewOrderNotification = (order) => {
  if (!io) {
    console.warn('Socket.IO not initialized, skipping new order notification');
    return;
  }

  const notificationData = {
    orderId: order._id,
    orderNumber: order.orderNumber,
    status: order.status,
    totalPrice: order.totalPrice,
    user: order.user,
    timestamp: new Date(),
  };

  console.log(`📡 Emitting new order notification: ${order.orderNumber}`);

  // Notify all admins about new order
  io.to('admins').emit('new_order', notificationData);

  // Notify all shippers about potential new delivery opportunity
  io.to('shippers').emit('new_order', notificationData);
};

// Emit order assignment notification
const emitOrderAssignmentNotification = (order, shipper) => {
  if (!io) {
    console.warn('Socket.IO not initialized, skipping assignment notification');
    return;
  }

  const assignmentData = {
    orderId: order._id,
    orderNumber: order.orderNumber,
    shipper: shipper,
    timestamp: new Date(),
  };

  console.log(`📡 Emitting order assignment: ${order.orderNumber} → ${shipper.name}`);

  // Notify the assigned shipper
  io.to(`user_${shipper._id}`).emit('order_assigned', assignmentData);

  // Notify admins about the assignment
  io.to('admins').emit('order_assigned', assignmentData);

  // Notify order owner
  if (order.user) {
    io.to(`user_${order.user}`).emit('order_assigned', assignmentData);
  }
};

module.exports = {
  initializeSocket,
  getIO,
  emitOrderStatusUpdate,
  emitNewOrderNotification,
  emitOrderAssignmentNotification,
};