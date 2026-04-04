const User = require('../schemas/User');
const { AppError } = require('../middleware/error');

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

const getUsers = async (queryParams = {}) => {
  const page = parseInt(queryParams.page, 10) || 1;
  const limit = parseInt(queryParams.limit, 10) || DEFAULT_PAGE_SIZE;
  const skip = (page - 1) * limit;
  const query = {};

  if (queryParams.search) {
    query.$or = [
      { name: { $regex: queryParams.search, $options: 'i' } },
      { email: { $regex: queryParams.search, $options: 'i' } },
    ];
  }

  if (queryParams.role) {
    query.role = queryParams.role;
  }

  if (queryParams.isActive !== undefined) {
    query.isActive = queryParams.isActive === 'true';
  }

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .select('-refreshToken')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    users,
    pagination: getPagination(page, limit, total),
  };
};

const getUserById = async (userId) => {
  const user = await User.findById(userId).select('-refreshToken');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return { user };
};

const updateUser = async ({ userId, actorId, payload = {} }) => {
  const user = await getUserOrThrow(userId);

  if (user._id.toString() === actorId.toString() && payload.role && payload.role !== 'admin') {
    throw new AppError('Cannot change your own role', 400);
  }

  user.name = payload.name || user.name;
  user.email = payload.email || user.email;
  user.role = payload.role || user.role;
  user.phone = payload.phone || user.phone;

  if (payload.isActive !== undefined) {
    user.isActive = payload.isActive;
  }

  if (payload.address) {
    user.address = { ...user.address, ...payload.address };
  }

  const updatedUser = await user.save();
  return { user: updatedUser };
};

const deleteUser = async ({ userId, actorId }) => {
  const user = await getUserOrThrow(userId);

  if (user._id.toString() === actorId.toString()) {
    throw new AppError('Cannot delete your own account', 400);
  }

  await User.findByIdAndDelete(userId);
};

const getUserStats = async () => {
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

  return {
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
  };
};

const checkUserStatus = async (email) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return {
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
  };
};

const getShipperApplications = async (status = 'pending') => {
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

  return { applications, total: applications.length };
};

const approveShipperApplication = async (userId) => {
  const user = await getUserOrThrow(userId);

  if (!user.shipperInfo || user.shipperInfo.status !== 'pending') {
    throw new AppError('No pending shipper application for this user', 400);
  }

  user.shipperInfo.status = 'approved';
  user.shipperInfo.isVerified = true;
  user.role = 'shipper';

  const updatedUser = await user.save();

  return {
    user: {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      shipperInfo: updatedUser.shipperInfo,
    },
  };
};

const rejectShipperApplication = async (userId) => {
  const user = await getUserOrThrow(userId);

  if (!user.shipperInfo || user.shipperInfo.status !== 'pending') {
    throw new AppError('No pending shipper application for this user', 400);
  }

  user.shipperInfo.status = 'rejected';
  user.shipperInfo.isVerified = false;

  const updatedUser = await user.save();
  return { user: updatedUser };
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats,
  checkUserStatus,
  getShipperApplications,
  approveShipperApplication,
  rejectShipperApplication,
};
