const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [
    {
      shape: String,
      color: String,
      clarity: String,
      carat_from: Number,
      carat_to: Number,
      selling_price_per_ct: Number,
      quantity: { type: Number, default: 1 }
    }
  ],
  totalItems: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.models.Cart || mongoose.model('Cart', cartSchema);