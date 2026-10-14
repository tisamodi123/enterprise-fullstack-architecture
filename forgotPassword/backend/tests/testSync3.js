const mongoose = require('mongoose');
const { Currency, CurrencyHistory } = require('./models/Currency');
const axios = require('axios');

mongoose.connect('mongodb://localhost:27017/forgotpassword')
  .then(async () => {
    console.log("Connected to DB");
    
    // Check API response
    const response = await axios.get('https://open.er-api.com/v6/latest/USD');
    const rates = response.data.rates;
    console.log("Rates for INR:", rates['INR']);
    
    const activeCurrencies = await Currency.find({ isAutomated: true });
    
    for (let curr of activeCurrencies) {
      const newRate = rates[curr.code];
      const oldRate = curr.exchangeRate;
      
      console.log(`Currency: ${curr.code}, oldRate: ${oldRate}, newRate: ${newRate}, strict inequality: ${oldRate !== newRate}`);
      
      if (newRate) {
        if (oldRate !== newRate) {
          console.log(`Creating history for ${curr.code}`);
          const history = await CurrencyHistory.create({
            currencyCode: curr.code,
            rateBefore: oldRate,
            rateAfter: newRate,
            changedBy: 'AUTOMATED_CRON_JOB'
          });
          console.log("History created:", history);
        } else {
          console.log("Rates are identical. No history.");
        }
      }
    }
    
    const history = await CurrencyHistory.find({});
    console.log("Total history items:", history.length);
    
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
