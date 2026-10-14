const jwt = require('jsonwebtoken');
const User = require('../models/userModel'); // User model ko import kiya verification ke liye

const protect = async (req, res, next) => {
  let token;

  // Check karo ki headers mein Authorization hai ya nahi aur kya woh Bearer se shuru ho raha hai
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Token ko alag karo (Format hota hai: "Bearer token_string_yahan_hoti_hai")
      token = req.headers.authorization.split(' ')[1];

      // Token ko verify karo jo .env mein JWT_SECRET hai usse
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Database se user ka data nikaalo (password ko chhodkar) aur use req.user mein daal do
      // Isse req.user.id ya req.user.name pure project ke controllers mein automatic mil jayega!
      req.user = await User.findById(decoded.id);

      if (!req.user) {
        return res.status(401).json({ success: false, error: 'User nahi mila, unauthorized!' });
      }

      // Agar sab sahi hai, toh agle function (controller) par jaane do
      return next();
    } catch (error) {
      return res.status(401).json({ success: false, error: 'Not authorized, token galat hai ya expire ho gaya hai!' });
    }
  }

  // 2. Agar header mein token mila hi nahi
  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized, koi token nahi mila!' });
  }
};

module.exports = { protect };