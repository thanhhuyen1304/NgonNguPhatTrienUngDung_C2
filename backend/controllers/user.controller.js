const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Get shipper applications (Admin)
// @route   GET /api/users/shipper-applications
// @access  Private/Admin
const getShipperApplications = asyncHandler(async (req, res) => {
  const status = req.query.status || 'pending'; // pending | approved | rejected | all

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

  res.json({
    success: true,
    data: {
      applications,
      total: applications.length,
    },
  });
});

// @desc    Approve shipper application (Admin)
// @route   PUT /api/users/shipper-applications/:id/approve
// @access  Private/Admin
const approveShipperApplication = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (!user.shipperInfo || user.shipperInfo.status !== 'pending') {
    res.status(400);
    throw new Error('No pending shipper application for this user');
  }

  // Update shipper info and role
  user.shipperInfo.status = 'approved';
  user.shipperInfo.isVerified = true;
  user.role = 'shipper';

  // Save and verify the changes
  const updated = await user.save();
  
  // Log for debugging
  console.log(`✅ Approved shipper application for user: ${user.name} (${user.email})`);
  console.log(`   - Role updated to: ${updated.role}`);
  console.log(`   - Shipper status: ${updated.shipperInfo.status}`);
  console.log(`   - Is verified: ${updated.shipperInfo.isVerified}`);

  res.json({
    success: true,
    message: 'Approved shipper application successfully',
    data: { 
      user: {
        _id: updated._id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        shipperInfo: updated.shipperInfo
      }
    },
  });
});

// @desc    Reject shipper application (Admin)
// @route   PUT /api/users/shipper-applications/:id/reject
// @access  Private/Admin
const rejectShipperApplication = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (!user.shipperInfo || user.shipperInfo.status !== 'pending') {
    res.status(400);
    throw new Error('No pending shipper application for this user');
  }

  user.shipperInfo.status = 'rejected';
  user.shipperInfo.isVerified = false;
  // keep role as-is (typically 'user')

  const updated = await user.save();

  res.json({
    success: true,
    message: 'Rejected shipper application',
    data: { user: updated },
  });
});

// @desc    Get all users (Admin)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = {};

  // Search by name or email
  if (req.query.search) {
    query.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  // Filter by role
  if (req.query.role) {
    query.role = req.query.role;
  }

  // Filter by active status
  if (req.query.isActive !== undefined) {
    query.isActive = req.query.isActive === 'true';
  }

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .select('-refreshToken')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// @desc    Get user by ID (Admin)
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-refreshToken');

  if (user) {
    res.json({
      success: true,
      data: { user },
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user (Admin)
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const { name, email, role, isActive, phone, address } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Prevent admin from demoting themselves
  if (
    user._id.toString() === req.user._id.toString() &&
    role &&
    role !== 'admin'
  ) {
    res.status(400);
    throw new Error('Cannot change your own role');
  }

  user.name = name || user.name;
  user.email = email || user.email;
  user.role = role || user.role;
  user.phone = phone || user.phone;
  if (isActive !== undefined) user.isActive = isActive;
  if (address) {
    user.address = { ...user.address, ...address };
  }

  const updatedUser = await user.save();

  res.json({
    success: true,
    message: 'User updated successfully',
    data: { user: updatedUser },
  });
});

// @desc    Delete user (Admin)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Prevent admin from deleting themselves
  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('Cannot delete your own account');
  }

  await User.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'User deleted successfully',
  });
});

// @desc    Get user statistics (Admin)
// @route   GET /api/users/stats
// @access  Private/Admin
const getUserStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments({ role: 'user' });
  const totalAdmins = await User.countDocuments({ role: 'admin' });
  const totalShippers = await User.countDocuments({ role: 'shipper' });
  const activeUsers = await User.countDocuments({ isActive: true });
  const inactiveUsers = await User.countDocuments({ isActive: false });

  // Shipper applications stats
  const pendingApplications = await User.countDocuments({ 
    'shipperInfo.status': 'pending' 
  });
  const approvedApplications = await User.countDocuments({ 
    'shipperInfo.status': 'approved' 
  });
  const rejectedApplications = await User.countDocuments({ 
    'shipperInfo.status': 'rejected' 
  });

  // New users in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newUsers = await User.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
  });

  // Users by month (last 12 months)
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
        total: pendingApplications + approvedApplications + rejectedApplications
      }
    },
  });
});

// @desc    Check specific user status (Debug endpoint)
// @route   GET /api/users/check/:email
// @access  Private/Admin
const checkUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.params.email });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
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
        updatedAt: user.updatedAt
      }
    },
  });
});

// @desc    Create shipper application
// @route   POST /api/users/shipper-applications
// @access  Private
const createShipperApplication = asyncHandler(async (req, res) => {
  const { vehicleType, licensePlate, drivingLicense, experience } = req.body;
  const userId = req.user._id;

  // Check if user already has a shipper application
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.role === 'shipper') {
    res.status(400);
    throw new Error('You are already a shipper');
  }

  if (user.shipperInfo && user.shipperInfo.status === 'pending') {
    res.status(400);
    throw new Error('You already have a pending shipper application');
  }

  // Create or update shipper application
  user.shipperInfo = {
    vehicleType,
    licensePlate,
    drivingLicense,
    experience: parseInt(experience) || 0,
    applicationDate: new Date(),
    status: 'pending',
    isVerified: false,
  };

  await user.save();

  res.status(201).json({
    success: true,
    message: 'Shipper application submitted successfully',
    data: {
      application: user.shipperInfo,
    },
  });
});

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats,
  getShipperApplications,
  approveShipperApplication,
  rejectShipperApplication,
  createShipperApplication,
  checkUserStatus,
};
