const mongoose = require('mongoose');
const { Currency, CurrencyHistory } = require('./models/Currency');
const { syncLiveExchangeRates, getCurrencyHistory } = require('./controllers/currencyController');

mongoose.connect('mongodb://localhost:27017/forgotpassword')
  .then(async () => {
    console.log("Connected to DB");
    
    // Manually set INR rate to 80
    await Currency.updateOne({ code: 'INR' }, { exchangeRate: 80 });
    console.log("Changed INR rate to 80");
    
    const req = {};
    const res = {
      status: (code) => ({
        json: (data) => {
          console.log("Response JSON:", data);
        }
      })
    };
    
    console.log("Running syncLiveExchangeRates...");
    await syncLiveExchangeRates(req, res);
    
    console.log("Running getCurrencyHistory for INR...");
    req.params = { code: 'INR' };
    await getCurrencyHistory(req, res);
    
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
