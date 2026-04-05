const Notification = require('../schemas/Notification');
const { AppError } = require('../middleware/error');
const asyncHandler = require('express-async-handler');

// @desc    Get all notifications for logged in user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = asyncHandler(async (req, res, next) => {
  const notifications = await Notification.find({ recipient: req.user.id })
    .sort('-createdAt')
    .limit(50);

  const unreadCount = await Notification.countDocuments({
    recipient: req.user.id,
    read: false,
  });

  res.status(200).json({
    success: true,
    count: notifications.length,
    unreadCount,
    data: notifications,
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res, next) => {
  let notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new AppError(`Notification not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is notification recipient
  if (notification.recipient.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError(`Not authorized to update this notification`, 401));
  }

  notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { read: true },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: notification,
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = asyncHandler(async (req, res, next) => {
  await Notification.updateMany(
    { recipient: req.user.id, read: false },
    { read: true }
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
  });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new AppError(`Notification not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is notification recipient
  if (notification.recipient.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError(`Not authorized to delete this notification`, 401));
  }

  await notification.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Create notification (Internal utility used by other controllers/sockets)
exports.createInternalNotification = async (data) => {
  try {
    const notification = await Notification.create(data);
    return notification;
  } catch (err) {
    console.error('Error creating internal notification:', err.message);
    return null;
  }
};
