const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const { protect } = require('../middleware/auth.middleware');
const { uploadImage, uploadFile, uploadMultiple } = require('../services/cloudinary.service');

router.post('/image',             protect, uploadImage.single('file'),         uploadController.uploadImage);
router.post('/file',              protect, uploadFile.single('file'),           uploadController.uploadFile);
router.post('/multiple',          protect, uploadMultiple.array('files', 5),   uploadController.uploadMultiple);
router.delete('/delete/:publicId', protect,                                     uploadController.deleteFile);

module.exports = router;
