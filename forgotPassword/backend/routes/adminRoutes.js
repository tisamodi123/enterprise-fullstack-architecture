const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// 🔒 SECURITY BOUNDARY CHAIN: Strictly locked for Authenticated Admins only
router.use(protect);
router.use(restrictTo('admin'));

// Core live tracking analytics dashboard snapshot handler
router.get('/dashboard-metrics', adminController.getDashboardMetrics);

module.exports = router;