const { uploadToCloudinary, deleteFromCloudinary, uploadMultipleToCloudinary } = require('../services/cloudinary.service');
const { AppError, asyncHandler, sendSuccess } = require('../utils/AppError');

exports.uploadImage = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('No image uploaded.', 400));
  const folder = req.query.folder || 'avatar';
  const result = await uploadToCloudinary(req.file, folder);
  sendSuccess(res, { file: result }, 'Image uploaded', 201);
});

exports.uploadFile = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('No file uploaded.', 400));
  const folder = req.query.folder || 'resume';
  const result = await uploadToCloudinary(req.file, folder);
  sendSuccess(res, { file: result }, 'File uploaded', 201);
});

exports.uploadMultiple = asyncHandler(async (req, res, next) => {
  if (!req.files?.length) return next(new AppError('No files uploaded.', 400));
  const folder = req.query.folder || 'message';
  const results = await uploadMultipleToCloudinary(req.files, folder);
  sendSuccess(res, { files: results }, 'Files uploaded', 201);
});

exports.deleteFile = asyncHandler(async (req, res, next) => {
  const { publicId } = req.params;
  if (!publicId) return next(new AppError('Public ID required.', 400));
  await deleteFromCloudinary(decodeURIComponent(publicId));
  sendSuccess(res, {}, 'File deleted');
});
