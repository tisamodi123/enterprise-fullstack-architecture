const express = require('express');
const router = express.Router();
const multer = require('multer');
const productController = require('../controllers/productController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// Setup secure destination path mapping for physical spreadsheets
const uploadInterceptor = multer({ dest: 'uploads/' });

// Public Endpoint: Users can view the diamond collection items 
router.get('/catalog', productController.getAllProducts);

// 🔒 SECURITY GATE CHAIN: All endpoints defined below are strictly locked for Admin role only
router.use(protect);
router.use(restrictTo('admin'));

// Asynchronous Excel thread entry node
router.post('/import-excel', uploadInterceptor.single('file'), productController.importBulkExcel);

// Core Admin CRUD routes
router.post('/add', productController.addProduct);
router.put('/update/:id', productController.updateProduct); 
router.delete('/delete/:id', productController.deleteProduct);

module.exports = router;