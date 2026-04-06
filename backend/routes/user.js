const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const User = require('../schemas/User');
const { AppError } = require('../middleware/error');

const { protect, admin } = require('../middleware/auth');
const { mongoIdValidation, paginationValidation } = require('../middleware/validate');

const DEFAULT_PAGE_SIZE = 10;

const getPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
});

const getUserOrThrow = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

// All routes require admin access
router.use(protect, admin);

router.get('/stats', asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments({ role: 'user' });
  const totalAdmins = await User.countDocuments({ role: 'admin' });
  const totalShippers = await User.countDocuments({ role: 'shipper' });
  const activeUsers = await User.countDocuments({ isActive: true });
  const inactiveUsers = await User.countDocuments({ isActive: false });
  const pendingApplications = await User.countDocuments({ 'shipperInfo.status': 'pending' });
  const approvedApplications = await User.countDocuments({ 'shipperInfo.status': 'approved' });
  const rejectedApplications = await User.countDocuments({ 'shipperInfo.status': 'rejected' });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

  const usersByMonth = await User.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
        },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  res.json({
    success: true,
    data: {
      totalUsers,
      totalAdmins,
      totalShippers,
      activeUsers,
      inactiveUsers,
      newUsers,
      usersByMonth,
      shipperApplications: {
        pending: pendingApplications,
        approved: approvedApplications,
        rejected: rejectedApplications,
        total: pendingApplications + approvedApplications + rejectedApplications,
      },
    },
  });
}));

router.get('/check/:email', asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.params.email });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        shipperInfo: user.shipperInfo,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    },
  });
}));

router.get('/shipper-applications', asyncHandler(async (req, res) => {
  const status = req.query.status || 'pending';
  const query = {
    shipperInfo: { $exists: true },
    'shipperInfo.applicationDate': { $exists: true },
  };

  if (status !== 'all') {
    query['shipperInfo.status'] = status;
  }

  const applications = await User.find(query)
    .select('name email phone role shipperInfo createdAt')
    .sort({ 'shipperInfo.applicationDate': -1, createdAt: -1 });

  res.json({ success: true, data: { applications, total: applications.length } });
}));

router.put('/shipper-applications/:id/approve', mongoIdValidation('id'), asyncHandler(async (req, res) => {
  const user = await getUserOrThrow(req.params.id);

  if (!user.shipperInfo || user.shipperInfo.status !== 'pending') {
    throw new AppError('No pending shipper application for this user', 400);
  }

  user.shipperInfo.status = 'approved';
  user.shipperInfo.isVerified = true;
  user.role = 'shipper';

  const updatedUser = await user.save();

  res.json({
    success: true,
    message: 'Approved shipper application successfully',
    data: {
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        shipperInfo: updatedUser.shipperInfo,
      },
    },
  });
}));

router.put('/shipper-applications/:id/reject', mongoIdValidation('id'), asyncHandler(async (req, res) => {
  const user = await getUserOrThrow(req.params.id);

  if (!user.shipperInfo || user.shipperInfo.status !== 'pending') {
    throw new AppError('No pending shipper application for this user', 400);
  }

  user.shipperInfo.status = 'rejected';
  user.shipperInfo.isVerified = false;

  const updatedUser = await user.save();
  res.json({ success: true, message: 'Rejected shipper application', data: { user: updatedUser } });
}));

router.get('/', paginationValidation, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE;
  const skip = (page - 1) * limit;
  const query = {};

  if (req.query.search) {
    query.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  if (req.query.role) {
    query.role = req.query.role;
  }

  if (req.query.isActive !== undefined) {
    query.isActive = req.query.isActive === 'true';
  }

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .select('-refreshToken')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({ success: true, data: { users, pagination: getPagination(page, limit, total) } });
}));

router.get('/:id', mongoIdValidation('id'), asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-refreshToken');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({ success: true, data: { user } });
}));

router.put('/:id', mongoIdValidation('id'), asyncHandler(async (req, res) => {
  const user = await getUserOrThrow(req.params.id);

  if (user._id.toString() === req.user._id.toString() && req.body.role && req.body.role !== 'admin') {
    throw new AppError('Cannot change your own role', 400);
  }

  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  user.role = req.body.role || user.role;
  user.phone = req.body.phone || user.phone;

  if (req.body.isActive !== undefined) {
    user.isActive = req.body.isActive;
  }

  if (req.body.address) {
    user.address = { ...user.address, ...req.body.address };
  }

  const updatedUser = await user.save();
  res.json({ success: true, message: 'User updated successfully', data: { user: updatedUser } });
}));

router.delete('/:id', mongoIdValidation('id'), asyncHandler(async (req, res) => {
  const user = await getUserOrThrow(req.params.id);

  if (user._id.toString() === req.user._id.toString()) {
    throw new AppError('Cannot delete your own account', 400);
  }

  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'User deleted successfully' });
}));

module.exports = router;
