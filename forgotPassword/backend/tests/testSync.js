const mongoose = require('mongoose');
const { Currency, CurrencyHistory } = require('./models/Currency');

mongoose.connect('mongodb://localhost:27017/forgotpassword')
  .then(async () => {
    console.log("Connected to DB");
    
    const activeCurrencies = await Currency.find({});
    console.log("All Currencies in DB:", activeCurrencies);
    
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
