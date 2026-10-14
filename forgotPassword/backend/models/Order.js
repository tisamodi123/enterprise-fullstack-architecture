const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: String, // Dynamic user link session token (jaise tisha ya rishi ki id)
    required: true
  },
  items: [{
    productId: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true }, // Needed for category bounds validation ('round-cut')
    basePriceUSD: { type: Number, required: true }, 
    convertedPrice: { type: Number, required: true } // Selected currency price snapshot
  }],
  currency: {
    type: String,
    required: true,
    uppercase: true
  },
  exchangeRateUsed: {
    type: Number,
    required: true // Checkout exchange rate lock
  },
  couponApplied: {
    type: String,
    uppercase: true,
    default: null
  },
  subTotalLocal: { type: Number, required: true },
  discountLocal: { type: Number, default: 0 },
  grandTotalLocal: { type: Number, required: true },
  
  // 📦 SYSTEM ORDER STATES
  orderStatus: {
    type: String,
    enum: ['pending_payment', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending_payment'
  },

  // 🔄 RETURN & REJECTION PARAMETERS
  returnRequest: {
    isRequested: { type: Boolean, default: false },
    type: { type: String, enum: ['full_return', 'partial_rejection'], default: null },
    reason: { type: String, default: null }, 
    adminNotes: { type: String, default: null }, 
    status: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
    requestedAt: Date,
    resolvedAt: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);