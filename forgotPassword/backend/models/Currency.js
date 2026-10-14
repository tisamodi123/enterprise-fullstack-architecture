const mongoose = require('mongoose');

// 1. MASTER COLLECTION
const currencySchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  symbol: { type: String, required: true },
  exchangeRate: { type: Number, required: true }, // Base relative to 1 USD
  isAutomated: { type: Boolean, default: true },   // Kya yeh external API se sync hoga ya manual override?
  isActive: { type: Boolean, default: true },
  lastSyncedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// 2. AUDIT LOG HISTORY COLLECTION (For precise Refund calculations)
const currencyHistorySchema = new mongoose.Schema({
  currencyCode: { type: String, required: true, uppercase: true },
  rateBefore: { type: Number, required: true },
  rateAfter: { type: Number, required: true },
  changedBy: { type: String, default: 'SYSTEM_CRON' }, // System API or Admin Name
  timestamp: { type: Date, default: Date.now }
});

const Currency = mongoose.model('Currency', currencySchema);
const CurrencyHistory = mongoose.model('CurrencyHistory', currencyHistorySchema);

module.exports = { Currency, CurrencyHistory };