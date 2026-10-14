const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');

// 📂 Middlewares / Joi Validators Import (validateVerifyOTP jodha hai)
const {
  validateForgotPassword,
  validateResetPassword,
  validateSignup,
  validateLogin,
  validateVerifyOTP
} = require('../middlewares/validators');

// ===================================================
// 🛡️ RATE LIMITER CONFIGURATION (SECURITY RULES)
// ===================================================
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minutes ka time window set kiya hai
  max: 3, // Ek single IP address se max 3 requests allowed hain
  message: {
    status: 'fail',
    message: 'Too many password reset requests from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true, // `RateLimit-*` headers return karega
  legacyHeaders: false, // Purane `X-RateLimit-*` headers disable
});

// ==========================================
// ─── 🛣️ AUTHENTICATION ROUTES ─────────────
// ==========================================

// 1. New Admin Registration
router.post('/signup', validateSignup, authController.signup);

// 2. Login Step 1: Password Check & OTP Trigger 🔥
router.post('/login', validateLogin, authController.login);

// 3. Login Step 2: Final 6-Digit OTP Verification 🔒
router.post('/verify-otp', validateVerifyOTP, authController.verifyOTP);

// 4. Forgot Password Email Initialization (with Rate Limiter)
router.post('/forgot-password', validateForgotPassword, forgotPasswordLimiter, authController.forgotPassword);

// 5. Reset Password Execution
router.post('/reset-password', validateResetPassword, authController.resetPassword);

// ⚡ Modern Passwordless Entry Route
router.post('/passwordless-login', validateForgotPassword,authController.passwordlessLogin);

module.exports = router;