const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const hasCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME && 
  !process.env.CLOUDINARY_CLOUD_NAME.startsWith('your_')
);

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const getFolder = (req, file) => {
  if (file.fieldname === 'avatar' || req.path.includes('/auth/')) {
    return 'ecommerce/avatars';
  }

  if (req.path.includes('/support/')) {
    return 'ecommerce/support';
  }

  return 'ecommerce/products';
};

const storage = hasCloudinary
  ? new CloudinaryStorage({
      cloudinary,
      params: async (req, file) => ({
        folder: getFolder(req, file),
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [{ width: 400, height: 400, crop: 'fill' }],
      }),
    })
  : multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const deleteImage = async (publicId) => {
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

const uploadImage = async (filePath, folder = 'ecommerce/products') => {
  try {
    return await cloudinary.uploader.upload(filePath, {
      folder: folder,
      transformation: [{ width: 800, height: 800, crop: 'limit' }],
    });
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw error;
  }
};

const uploadBuffer = (buffer, folder = 'ecommerce/avatars') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, transformation: [{ width: 400, height: 400, crop: 'fill' }] },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });
};

module.exports = {
  cloudinary,
  upload,
  deleteImage,
  uploadImage,
  uploadBuffer,
};
