const mongoose = require('mongoose');

// 1. GLOBAL COUPON ARCHITECTURE
const couponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['percentage', 'flat'], required: true },
    discountValue: { type: Number, required: true },

    // 🎯 BUSINESS LIMITATIONS & ELIGIBILITY CONTEXT
    isFirstOrderOnly: { type: Boolean, default: false }, // For NEWUSER codes
    allowedCategory: { type: String, enum: ['all', 'round-cut', 'oval-cut', 'solitaire', 'jewelry'], default: 'all' },

    // 💱 FISCAL CAPS (Stored consistently in Base USD)
    minOrderAmountUSD: { type: Number, default: 0 },
    maxDiscountLimitUSD: { type: Number, default: null }, // Cap limits ($500 cap check)

    // ⏳ ACCURATE RATE EXPIRY & USAGE CRITERIA
    expiryDate: { type: Date, required: true },
    globalUsageLimit: { type: Number, default: 100 },     // Total pool limit
    globalUsedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },         // "Valid twice per user" rule

    isActive: { type: Boolean, default: true }
}, { timestamps: true });


// 🛡️ 2. USER TRANSACTION SNAPSHOT COLLECTION (Prevents concurrent checkout fraud)
const couponUsageSchema = new mongoose.Schema({
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', required: true },
    userId: { type: String, required: true }, // Linking user sessions safely
    orderId: { type: String, default: null }, // If successfully locked into an order
    usageCount: { type: Number, default: 1 },
    status: { type: String, enum: ['locked', 'consumed', 'reverted'], default: 'locked' } // Dynamic states
}, { timestamps: true });

const Coupon = mongoose.model('Coupon', couponSchema);
const CouponUsage = mongoose.model('CouponUsage', couponUsageSchema);

module.exports = { Coupon, CouponUsage };