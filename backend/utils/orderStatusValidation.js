const ORDER_STATUS_FLOW = {
  'pending': ['confirmed', 'cancelled'],
  'confirmed': ['shipped', 'cancelled'], // Admin confirms, then Shipper can mark as shipped
  'shipped': ['delivered', 'cancelled'], // Only shipper
  'delivered': [], // Terminal status - no transitions allowed
  'cancelled': []  // Terminal status - no transitions allowed
};

// Define which statuses each role can update TO
const ADMIN_ALLOWED_STATUSES = ['pending', 'confirmed', 'cancelled'];
const SHIPPER_ALLOWED_STATUSES = ['shipped', 'delivered', 'cancelled'];

// Define which statuses are managed by which role
const SHIPPER_EXCLUSIVE_STATUSES = ['shipped', 'delivered']; // Only shippers can set these
const ADMIN_MANAGED_STATUSES = ['pending', 'confirmed']; // Admin manages these

const TERMINAL_STATUSES = ['delivered', 'cancelled'];

const validateStatusTransition = (currentStatus, newStatus, userRole = 'admin') => {
  // Same status is always allowed (no-op)
  if (currentStatus === newStatus) {
    return true;
  }

  // Terminal statuses cannot be changed by anyone
  if (TERMINAL_STATUSES.includes(currentStatus)) {
    throw new Error(`Cannot change status from terminal state "${currentStatus}". Order has already been ${currentStatus}.`);
  }

  // Check role-based permissions for target status
  if (userRole === 'admin' && SHIPPER_EXCLUSIVE_STATUSES.includes(newStatus)) {
    throw new Error(`Admin cannot set status to "${newStatus}". Only shippers can update to shipping/delivery statuses.`);
  }

  if (userRole === 'shipper' && !SHIPPER_ALLOWED_STATUSES.includes(newStatus)) {
    throw new Error(`Shipper cannot set status to "${newStatus}".`);
  }

  // Prevent backward transitions (status regression)
  const statusOrder = {
    'pending': 0,
    'confirmed': 1,
    'shipped': 2,
    'delivered': 3,
    'cancelled': 4 // Special case - can be set from any non-terminal status
  };

  const currentOrder = statusOrder[currentStatus] || 0;
  const newOrder = statusOrder[newStatus] || 0;

  // Check if transition is allowed in the flow first
  const allowedTransitions = ORDER_STATUS_FLOW[currentStatus] || [];
  if (!allowedTransitions.includes(newStatus)) {
    throw new Error(`Invalid status transition from "${currentStatus}" to "${newStatus}". Allowed transitions: ${allowedTransitions.join(', ')}`);
  }

  // Prevent backward transitions (regression) - but allow cancellation if it's in the flow
  if (newOrder < currentOrder && newStatus !== 'cancelled') {
    throw new Error(`Cannot move backward from "${currentStatus}" to "${newStatus}". Status can only move forward.`);
  }

  return true;
};

const getStatusDisplayName = (status) => {
  const statusNames = {
    'pending': 'Chờ xác nhận',
    'confirmed': 'Đã xác nhận',
    'shipped': 'Đang giao',
    'delivered': 'Đã giao',
    'cancelled': 'Đã hủy'
  };
  return statusNames[status] || status;
};

const getAvailableStatusesForRole = (currentStatus, userRole) => {
  const allowedTransitions = ORDER_STATUS_FLOW[currentStatus] || [];
  
  if (userRole === 'admin') {
    // Admin can only transition to statuses they're allowed to manage
    return allowedTransitions.filter(status => ADMIN_ALLOWED_STATUSES.includes(status));
  } else if (userRole === 'shipper') {
    // Shipper can transition to statuses they're allowed to manage
    return allowedTransitions.filter(status => SHIPPER_ALLOWED_STATUSES.includes(status));
  }
  
  return [];
};

const logStatusChange = async (order, newStatus, updatedBy, note = '', userRole = 'admin', req = null) => {
  const auditLogger = require('./auditLogger');
  
  const auditData = {
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    previousStatus: order.status,
    newStatus: newStatus,
    updatedBy: updatedBy,
    userRole: userRole,
    userName: req?.user?.name || 'Unknown',
    note: note,
    ipAddress: req?.ip || req?.connection?.remoteAddress || 'Unknown',
    userAgent: req?.get('User-Agent') || 'Unknown',
    sessionId: req?.sessionID || 'Unknown'
  };

  // Log to audit system
  await auditLogger.logOrderStatusChange(auditData);

  // Add to order's status history
  if (!order.statusHistory) {
    order.statusHistory = [];
  }
  
  order.statusHistory.push({
    status: newStatus,
    note: note,
    updatedAt: new Date(),
    updatedBy: updatedBy,
    previousStatus: order.status
  });

  return auditData;
};

const logValidationFailure = async (orderId, orderNumber, currentStatus, attemptedStatus, userId, userRole, errorMessage, req = null) => {
  const auditLogger = require('./auditLogger');
  
  const validationData = {
    orderId: orderId,
    orderNumber: orderNumber,
    currentStatus: currentStatus,
    attemptedStatus: attemptedStatus,
    userId: userId,
    userRole: userRole,
    errorMessage: errorMessage,
    ipAddress: req?.ip || req?.connection?.remoteAddress || 'Unknown',
    userAgent: req?.get('User-Agent') || 'Unknown'
  };

  await auditLogger.logValidationFailure(validationData);
  return validationData;
};

module.exports = {
  ORDER_STATUS_FLOW,
  ADMIN_ALLOWED_STATUSES,
  SHIPPER_ALLOWED_STATUSES,
  SHIPPER_EXCLUSIVE_STATUSES,
  ADMIN_MANAGED_STATUSES,
  TERMINAL_STATUSES,
  validateStatusTransition,
  getStatusDisplayName,
  getAvailableStatusesForRole,
  logStatusChange,
  logValidationFailure
};