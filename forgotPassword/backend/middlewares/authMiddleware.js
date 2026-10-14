const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Aapka User model path

// =========================================================================
// 🔒 1. PROTECT MIDDLEWARE: Token Validation & User Decoding
// =========================================================================
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Cookie ya Authorization header se token nikalna
    if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ status: 'fail', message: 'You are not logged in. Please login to get access.' });
    }

    // Token verification decode loop
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_production_key');

    // Database se fresh user fetch karna role check karne ke liye
    const freshUser = await User.findById(decoded.id || decoded._id);
    if (!freshUser) {
      return res.status(401).json({ status: 'fail', message: 'The user belonging to this token no longer exists.' });
    }

    // req.user ke andar poore user ka data (including role) inject kar dena
    req.user = freshUser; 

    next(); 
  } catch (error) {
    return res.status(401).json({ status: 'fail', message: 'Invalid token or session expired.' });
  }
};

// =========================================================================
// 👑 2. RESTRICT TO MIDDLEWARE: Role-Based Access Guard (Tisha/Admin Only)
// =========================================================================
exports.restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user humein upar wale 'protect' middleware se decode hokar mila hai
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'Access Denied: You do not have permission to execute corporate admin actions.'
      });
    }
    next(); // Checkpost cleared! Proceed to controller/worker thread
  };
};