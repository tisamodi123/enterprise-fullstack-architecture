const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');

// ➕ Admin node to inject automated bounds coupons
router.post('/create-advanced', couponController.createAdvancedCoupon);

// 🛡️ Standard core checkout authorization validate controller
router.post('/validate-advanced', couponController.validateAndApplyCoupon);

// 🔄 Automatic refund restoration webhook/route node
router.post('/revert-usage', couponController.revertCouponUsage);

//  Bento Engine algorithmic checkout lookup tool
router.post('/auto-optimize', couponController.autoApplyBestOffer);

// 🚀 Advanced optimization nodes
router.post('/generate-referral', couponController.generateReferralCode); // Dynamic referral codes
router.post('/auto-optimize', couponController.autoApplyBestOffer);               // Swiggy optimization engine

module.exports = router;