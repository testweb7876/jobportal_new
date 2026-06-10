const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company.controller');
const { protect, optionalAuth, employerOnly, adminOnly } = require('../middleware/auth.middleware');
const { uploadImage, uploadFile, uploadMultiple } = require('../services/cloudinary.service');

router.get('/',                    optionalAuth,          companyController.getCompanies);
router.get('/my-company',          protect, employerOnly, companyController.getMyCompany);
router.get('/:id',                 optionalAuth,          companyController.getCompany);
router.post('/',                   protect, employerOnly, companyController.createCompany);
router.patch('/:id',               protect,               companyController.updateCompany);
router.post('/logo',               protect, employerOnly, uploadImage.single('logo'), companyController.uploadLogo);
router.post('/gallery',            protect, employerOnly, uploadImage.single('image'), companyController.uploadGalleryImage);
router.delete('/gallery',          protect, employerOnly, companyController.deleteGalleryImage);
router.post('/verify/submit',      protect, employerOnly, uploadFile.array('documents', 5), companyController.submitVerification);
router.post('/:id/follow',         protect,               companyController.toggleFollow);
router.patch('/:id/verify',        protect, adminOnly,    companyController.verifyCompany);
router.get( '/admin/all', protect, adminOnly, companyController.getAllCompaniesAdmin);

module.exports = router;
