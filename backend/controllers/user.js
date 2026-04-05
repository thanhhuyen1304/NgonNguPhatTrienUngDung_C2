const asyncHandler = require('express-async-handler');
const userService = require('../services/userService');

const getUsers = asyncHandler(async (req, res) => {
  const data = await userService.getUsers(req.query);
  res.json({ success: true, data });
});

const getUserById = asyncHandler(async (req, res) => {
  const data = await userService.getUserById(req.params.id);
  res.json({ success: true, data });
});

const updateUser = asyncHandler(async (req, res) => {
  const data = await userService.updateUser({
    userId: req.params.id,
    actorId: req.user._id,
    payload: req.body,
  });
  res.json({ success: true, message: 'User updated successfully', data });
});

const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser({ userId: req.params.id, actorId: req.user._id });
  res.json({ success: true, message: 'User deleted successfully' });
});

const getUserStats = asyncHandler(async (req, res) => {
  const data = await userService.getUserStats();
  res.json({ success: true, data });
});

const checkUserStatus = asyncHandler(async (req, res) => {
  const data = await userService.checkUserStatus(req.params.email);
  res.json({ success: true, data });
});

const getShipperApplications = asyncHandler(async (req, res) => {
  const data = await userService.getShipperApplications(req.query.status || 'pending');
  res.json({ success: true, data });
});

const approveShipperApplication = asyncHandler(async (req, res) => {
  const data = await userService.approveShipperApplication(req.params.id);
  res.json({ success: true, message: 'Approved shipper application successfully', data });
});

const rejectShipperApplication = asyncHandler(async (req, res) => {
  const data = await userService.rejectShipperApplication(req.params.id);
  res.json({ success: true, message: 'Rejected shipper application', data });
});

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
