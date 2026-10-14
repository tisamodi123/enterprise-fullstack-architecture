// ✅ FIXED: Centralized destructuring import for both models
const { Currency, CurrencyHistory } = require('../models/Currency');
const axios = require('axios');

// ➕ 1. Add ya Update Currency Rate (Admin Action)
exports.updateExchangeRate = async (req, res) => {
  try {
    const { code, symbol, exchangeRate } = req.body;

    const existingCurrency = await Currency.findOne({ code: code.toUpperCase() });
    const oldRate = existingCurrency ? existingCurrency.exchangeRate : null;

    // Fixed model call hierarchy with dynamic upsert properties
    const currency = await Currency.findOneAndUpdate(
      { code: code.toUpperCase() },
      { symbol, exchangeRate, isActive: true, isAutomated: true }, // Defaulting automation to true
      { new: true, upsert: true }
    );

    if (existingCurrency && oldRate !== Number(exchangeRate)) {
      await CurrencyHistory.create({
        currencyCode: code.toUpperCase(),
        rateBefore: oldRate,
        rateAfter: Number(exchangeRate),
        changedBy: 'ADMIN_UPDATE'
      });
    } else if (!existingCurrency) {
      await CurrencyHistory.create({
        currencyCode: code.toUpperCase(),
        rateBefore: 0,
        rateAfter: Number(exchangeRate),
        changedBy: 'SYSTEM_INIT'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: `Currency ${code.toUpperCase()} updated successfully!`,
      data: { currency }
    });
  } catch (error) {
    console.error("Update Error: ", error.message);
    return res.status(500).json({ status: 'error', message: 'Currency master update failed.' });
  }
};

// 🔍 2. Get All Active Currencies (For Frontend Dropdown Layout)
exports.getAllCurrencies = async (req, res) => {
  try {
    const currencies = await Currency.find({ isActive: true });
    return res.status(200).json({
      status: 'success',
      results: currencies.length,
      data: { currencies }
    });
  } catch (error) {
    console.error("Fetch Error: ", error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch currencies.' });
  }
};

// =========================================================================
// 🔥 3. AUTOMATION CRON: syncLiveExchangeRates (Background Stream Sync)
// =========================================================================
exports.syncLiveExchangeRates = async (req, res) => {
  try {
    const response = await axios.get('https://open.er-api.com/v6/latest/USD');
    const rates = response.data.rates;

    if (!rates) {
      throw new Error('Failed to capture exchange streams from external provider.');
    }

    const activeCurrencies = await Currency.find({ isAutomated: true });

    for (let curr of activeCurrencies) {
      const newRate = rates[curr.code];
      if (newRate) {
        const oldRate = curr.exchangeRate;

        // ✅ FIXED: CurrencyHistory will now execute without ReferenceError
        if (oldRate !== newRate) {
          await CurrencyHistory.create({
            currencyCode: curr.code,
            rateBefore: oldRate,
            rateAfter: newRate,
            changedBy: 'AUTOMATED_CRON_JOB'
          });
        }

        curr.exchangeRate = newRate;
        curr.lastSyncedAt = Date.now();
        await curr.save();
      }
    }

    if (res) return res.status(200).json({ status: 'success', message: 'Global exchange pool synchronised seamlessly.' });
  } catch (error) {
    console.error("CRON Sync Disaster:", error.message);
    if (res) return res.status(500).json({ status: 'error', message: 'Automation sync failed.' });
  }
};

// =========================================================================
// 🔄 4. BULK ENGINE: bulkPriceConvert (Zero Frontend Lag Operation)
// =========================================================================
exports.bulkPriceConvert = async (req, res) => {
  try {
    const { products, targetCurrency } = req.body;

    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid payload structure' });
    }

    let currencyMeta = await Currency.findOne({ code: targetCurrency.toUpperCase(), isActive: true });
    let fallbackTriggered = false;
    
    // Fallback Rule Guard
    if (!currencyMeta) {
      currencyMeta = await Currency.findOne({ code: 'USD' });
      fallbackTriggered = true;
    }

    // Dynamic error handling if even USD is missing in database seed
    if (!currencyMeta) {
      return res.status(404).json({ 
        status: 'fail', 
        message: 'System base currency parameters missing. Please run core currency updates first.' 
      });
    }

    const rate = currencyMeta.exchangeRate;

    const convertedProducts = products.map(prod => ({
      productId: prod.id,
      basePriceUSD: prod.basePriceUSD,
      convertedPrice: Number((prod.basePriceUSD * rate).toFixed(2)),
      currencySymbol: currencyMeta.symbol,
      currencyCode: currencyMeta.code
    }));

    return res.status(200).json({
      status: 'success',
      fallbackTriggered,
      message: fallbackTriggered ? 'Requested currency inactive. Reverted to default system parameters.' : 'Bulk mapping complete.',
      data: { products: convertedProducts }
    });

  } catch (error) {
    console.error("Bulk Engine Error: ", error.message);
    return res.status(500).json({ status: 'error', message: 'Bulk processing engine failure.' });
  }
};

// =========================================================================
// 📜 5. HISTORY AUDIT TRAIL: getCurrencyHistory (Audit Trace Controller)
// =========================================================================
exports.getCurrencyHistory = async (req, res) => {
  try {
    const { code } = req.params;
    const history = await CurrencyHistory.find({ currencyCode: code.toUpperCase() }).sort({ timestamp: -1 });

    return res.status(200).json({
      status: 'success',
      results: history.length,
      data: { history }
    });
  } catch (error) {
    console.error("History Matrix Error: ", error.message);
    return res.status(500).json({ status: 'error', message: 'Error retrieving historic matrix.' });
  }
};