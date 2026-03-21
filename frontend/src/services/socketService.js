import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = new Map();
  }

  // Initialize socket connection
  connect(token) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    const serverUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
    
    console.log('🔌 Connecting to Socket.IO server:', serverUrl);

    this.socket = io(serverUrl, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true,
    });

    this.setupEventListeners();
  }

  // Setup socket event listeners
  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Show connection success (only after reconnection)
      if (this.reconnectAttempts > 0) {
        toast.success('Kết nối real-time đã được khôi phục');
      }
    });

    this.socket.on('connected', (data) => {
      console.log('🎉 Socket authenticated:', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.socket.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔥 Socket connection error:', error.message);
      this.isConnected = false;
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        setTimeout(() => {
          if (!this.isConnected) {
            this.socket?.connect();
          }
        }, 2000 * this.reconnectAttempts);
      } else {
        toast.error('Không thể kết nối real-time updates');
      }
    });

    // Order status updates
    this.socket.on('order_status_updated', (data) => {
      console.log('📦 Order status updated:', data);
      
      // Show toast notification
      const statusLabels = {
        'pending': 'Chờ xác nhận',
        'confirmed': 'Đã xác nhận',
        'completed': 'Hoàn thành',
        'shipped': 'Đang giao',
        'delivered': 'Đã giao',
        'cancelled': 'Đã hủy'
      };
      
      const statusLabel = statusLabels[data.newStatus] || data.newStatus;
      toast.success(`Đơn hàng ${data.orderNumber} đã được cập nhật: ${statusLabel}`);
      
      // Emit to registered listeners
      this.emit('order_status_updated', data);
    });

    // New order notifications
    this.socket.on('new_order', (data) => {
      console.log('🆕 New order:', data);
      toast.success(`Đơn hàng mới: ${data.orderNumber}`);
      this.emit('new_order', data);
    });

    // Order assignment notifications
    this.socket.on('order_assigned', (data) => {
      console.log('👤 Order assigned:', data);
      toast.success(`Đơn hàng ${data.orderNumber} đã được giao cho shipper`);
      this.emit('order_assigned', data);
    });
  }

  // Join order room for specific order updates
  joinOrderRoom(orderId) {
    if (this.socket?.connected) {
      this.socket.emit('join_order', orderId);
      console.log(`📦 Joined order room: ${orderId}`);
    }
  }

  // Leave order room
  leaveOrderRoom(orderId) {
    if (this.socket?.connected) {
      this.socket.emit('leave_order', orderId);
      console.log(`📦 Left order room: ${orderId}`);
    }
  }

  // Register event listener
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  // Unregister event listener
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  // Emit event to registered listeners
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in socket listener for ${event}:`, error);
        }
      });
    }
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting socket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  // Get connection status
  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;