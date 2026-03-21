const express = require('express');
const router = express.Router();

const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartCount,
} = require('../controllers/cart.controller');

const { protect } = require('../middleware/auth');
const { addToCartValidation, updateCartValidation, mongoIdValidation } = require('../middleware/validate');

// All routes require authentication
router.use(protect);

router.get('/', getCart);
router.get('/count', getCartCount);
router.post('/items', addToCartValidation, addToCart);
router.put('/items/:productId', mongoIdValidation('productId'), updateCartValidation, updateCartItem);
router.delete('/items/:productId', mongoIdValidation('productId'), removeFromCart);
router.delete('/', clearCart);

module.exports = router;
