// const express = require('express');
// const router = express.Router();
// const orderController = require('../controllers/orderController');
// const { protect } = require('../middlewares/authMiddleware'); // Import middleware

// // 🛒 Ab bina token ke koi checkout route ko touch bhi nahi kar payega!
// router.post('/checkout', protect, orderController.placeOrder);
// router.post('/verify-payment', protect, orderController.confirmPayment);

// module.exports = router;
// ... existing require parameters above
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/checkout', protect, orderController.placeOrder);
router.post('/verify-payment', orderController.confirmPayment);

// 🔄 Dynamic Return Life-Cycle Nodes
router.post('/return-request', protect, orderController.requestOrderReturn); // User request
router.post('/admin/resolve-return', orderController.resolveReturnRequest);  // Admin final decision node

module.exports = router;