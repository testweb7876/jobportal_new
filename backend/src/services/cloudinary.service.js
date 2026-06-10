const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const streamifier = require('streamifier');
const { AppError } = require('../utils/AppError');
const logger = require('../config/logger');

// ─── MULTER MEMORY STORAGE ───────────────────────────────────────────────────
const storage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) return cb(null, true);
  cb(new AppError('Only image files are allowed (jpg, png, webp, gif).', 400), false);
};

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (allowedTypes.includes(file.mimetype)) return cb(null, true);
  cb(new AppError('File type not allowed.', 400), false);
};

exports.uploadImage = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_IMAGE_SIZE) || 5 * 1024 * 1024 },
  fileFilter: imageFilter,
});

exports.uploadFile = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 },
  fileFilter,
});

exports.uploadMultiple = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, files: 5 },
  fileFilter,
});

// ─── FOLDER MAPPING ──────────────────────────────────────────────────────────
const FOLDERS = {
  avatar:       'jobportal/users',
  company_logo: 'jobportal/companies',
  resume:       'jobportal/resumes',
  message:      'jobportal/messages',
  verification: 'jobportal/verifications',
  gallery:      'jobportal/gallery',
  cover:        'jobportal/covers',
};

// ─── STREAM UPLOAD TO CLOUDINARY ─────────────────────────────────────────────
const streamUpload = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (result) resolve(result);
      else reject(error);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// ─── UPLOAD IMAGE ─────────────────────────────────────────────────────────────
exports.uploadToCloudinary = async (file, folder = 'avatar', options = {}) => {
  try {
    const folderPath = FOLDERS[folder] || `jobportal/${folder}`;

    const uploadOptions = {
      folder: folderPath,
      resource_type: 'auto',
      quality: 'auto',
      fetch_format: 'auto',
      ...options,
    };

    // Image-specific optimizations
    if (file.mimetype.startsWith('image/')) {
      uploadOptions.transformation = [
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ];
    }

    const result = await streamUpload(file.buffer, uploadOptions);

    return {
      publicId:     result.public_id,
      secureUrl:    result.secure_url,
      fileType:     result.format || file.mimetype,
      fileSize:     result.bytes,
      resourceType: result.resource_type,
      width:        result.width,
      height:       result.height,
    };
  } catch (error) {
    logger.error('Cloudinary upload error:', error);
    throw new AppError('File upload failed. Please try again.', 500);
  }
};

// ─── DELETE FROM CLOUDINARY ───────────────────────────────────────────────────
exports.deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    if (!publicId) return;
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return result;
  } catch (error) {
    logger.error('Cloudinary delete error:', error);
    // Don't throw — deletion failure shouldn't break app flow
  }
};

// ─── UPLOAD MULTIPLE ─────────────────────────────────────────────────────────
exports.uploadMultipleToCloudinary = async (files, folder = 'message') => {
  const uploadPromises = files.map((file) => exports.uploadToCloudinary(file, folder));
  return Promise.all(uploadPromises);
};

// ─── GENERATE RESPONSIVE IMAGES ───────────────────────────────────────────────
exports.getResponsiveUrl = (publicId, width) => {
  return cloudinary.url(publicId, {
    width,
    crop: 'scale',
    quality: 'auto',
    fetch_format: 'auto',
    secure: true,
  });
};
