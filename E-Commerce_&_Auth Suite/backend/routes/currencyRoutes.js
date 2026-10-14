const express = require('express');
const router = express.Router();
const currencyController = require('../controllers/currencyController');

// ➕ Admin currency master injection node
router.post('/update', currencyController.updateExchangeRate);

// 🔍 Active collection extraction list
router.get('/list', currencyController.getAllCurrencies);

// ⚡ Dynamic background live sync execution
router.post('/sync-live', currencyController.syncLiveExchangeRates);

// 🧮 Bulk pipeline runtime converter
router.post('/bulk-convert', currencyController.bulkPriceConvert);

// 📜 Audit log database mapping trace
router.get('/history/:code', currencyController.getCurrencyHistory);

module.exports = router;