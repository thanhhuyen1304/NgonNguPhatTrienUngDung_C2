const express = require('express');
const router = express.Router();

const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats,
  checkUserStatus,
  getShipperApplications,
  approveShipperApplication,
  rejectShipperApplication,
} = require('../controllers/user');

const { protect, admin } = require('../middleware/auth');
const { mongoIdValidation, paginationValidation } = require('../middleware/validate');

// All routes require admin access
router.use(protect, admin);

router.get('/stats', getUserStats);
router.get('/check/:email', checkUserStatus);
router.get('/shipper-applications', getShipperApplications);
router.put('/shipper-applications/:id/approve', mongoIdValidation('id'), approveShipperApplication);
router.put('/shipper-applications/:id/reject', mongoIdValidation('id'), rejectShipperApplication);
router.get('/', paginationValidation, getUsers);
router.get('/:id', mongoIdValidation('id'), getUserById);
router.put('/:id', mongoIdValidation('id'), updateUser);
router.delete('/:id', mongoIdValidation('id'), deleteUser);

module.exports = router;
