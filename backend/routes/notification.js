const express = require('express');
const asyncHandler = require('express-async-handler');
const Notification = require('../schemas/Notification');
const { AppError } = require('../middleware/error');
const router = express.Router();

const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(asyncHandler(async (req, res) => {
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
  }));

router.route('/read-all')
  .put(asyncHandler(async (req, res) => {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  }));

router.route('/:id/read')
  .put(asyncHandler(async (req, res, next) => {
    let notification = await Notification.findById(req.params.id);

    if (!notification) {
      return next(new AppError(`Notification not found with id of ${req.params.id}`, 404));
    }

    if (notification.recipient.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('Not authorized to update this notification', 401));
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
  }));

router.route('/:id')
  .delete(asyncHandler(async (req, res, next) => {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return next(new AppError(`Notification not found with id of ${req.params.id}`, 404));
    }

    if (notification.recipient.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('Not authorized to delete this notification', 401));
    }

    await notification.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  }));

module.exports = router;
