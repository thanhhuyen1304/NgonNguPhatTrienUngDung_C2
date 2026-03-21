const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { mongoIdValidation } = require('../middleware/validate');
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require('../controllers/wishlist.controller');

// All routes require authentication
router.use(protect);

router.get('/', getWishlist);
router.post('/:productId', mongoIdValidation('productId'), addToWishlist);
router.delete('/:productId', mongoIdValidation('productId'), removeFromWishlist);

module.exports = router;
