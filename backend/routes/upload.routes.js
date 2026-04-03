const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect, admin } = require('../middleware/auth');
const { upload, deleteImage } = require('../config/cloudinary');

// @desc    Upload single image
// @route   POST /api/upload/single
// @access  Private/Admin
router.post(
  '/single',
  protect,
  admin,
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400);
      throw new Error('Please upload an image');
    }

    res.json({
      success: true,
      data: {
        url: req.file.path,
        publicId: req.file.filename,
      },
    });
  })
);

// @desc    Upload multiple images
// @route   POST /api/upload/multiple
// @access  Private/Admin
router.post(
  '/multiple',
  protect,
  admin,
  upload.array('images', 10),
  asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      res.status(400);
      throw new Error('Please upload at least one image');
    }

    const images = req.files.map((file) => ({
      url: file.path,
      publicId: file.filename,
    }));

    res.json({
      success: true,
      data: { images },
    });
  })
);

// @desc    Delete image
// @route   DELETE /api/upload/:publicId
// @access  Private/Admin
router.delete(
  '/:publicId',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { publicId } = req.params;

    await deleteImage(publicId);

    res.json({
      success: true,
      message: 'Image deleted successfully',
    });
  })
);

module.exports = router;
