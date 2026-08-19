const { fromBuffer: fileTypeFromBuffer } = require('file-type');
const { AppError } = require('./AppError');

const ALLOWED_IMAGE_TYPES = ['jpg', 'png', 'webp', 'gif'];
const ALLOWED_DOCUMENT_TYPES = ['pdf', 'doc', 'docx'];

/**
 * Validates the REAL file content (magic bytes) against an allowed-type list.
 * Use this after multer has buffered the file, before uploading to Cloudinary.
 *
 * @param {Buffer} buffer - the uploaded file's buffer (req.file.buffer)
 * @param {string[]} allowedExtensions - e.g. ALLOWED_IMAGE_TYPES
 */
exports.validateFileType = async (buffer, allowedExtensions) => {
  const detected = await fileTypeFromBuffer(buffer);

  if (!detected) {
    throw new AppError('Could not determine file type. File may be corrupted or unsupported.', 400);
  }

  if (!allowedExtensions.includes(detected.ext)) {
    throw new AppError(
      `File content does not match an allowed type (detected: ${detected.ext}). Allowed: ${allowedExtensions.join(', ')}.`,
      400
    );
  }

  return detected; // { ext, mime }
};

exports.ALLOWED_IMAGE_TYPES = ALLOWED_IMAGE_TYPES;
exports.ALLOWED_DOCUMENT_TYPES = ALLOWED_DOCUMENT_TYPES;