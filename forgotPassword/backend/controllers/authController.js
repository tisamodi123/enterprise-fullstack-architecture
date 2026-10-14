const crypto = require('crypto');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');
const jwt = require('jsonwebtoken');

// 🪙 Token generate karne ka helper function
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 din tak valid
    httpOnly: true, // 🔒 Hacker's JavaScript cannot read this cookie! (Prevents XSS)
    secure: process.env.NODE_ENV === 'production', // Sirf HTTPS par chalega production mein
    sameSite: 'lax', // CSRF protection ke liye
  };

  // Response header mein cookie set karo
  res.cookie('jwt', token, cookieOptions);

  // Hide password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token, // Backup token for tracking if needed
    data: { user }
  });
};

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check karo agar user pehle se exist karta hai
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email is already registered!'
      });
    }

    // Password ko bcrypt se hash karo
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Naya user create karo
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword
    });

    // JWT Token generate karo
    const token = signToken(newUser._id);

    // Security Rule: Response mein password wapas nahi bhejte
    newUser.password = undefined;

    // return res.status(201).json({
    //   status: 'success',
    //   token,
    //   data: { user: newUser }
    // });

    createSendToken(newUser, 201, res);
  } catch (error) {
    console.error("Signup Error:", error);
    return res.status(500).json({ status: 'error', message: 'Server error during signup.' });
  }
};

// ==========================================
// ─── NEW: LOGIN CONTROLLER ────────────────
// ==========================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check karo email aur password aaya hai ya nahi
    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password!'
      });
    }

    // 2. User ko dhoondho aur database se uska password bhi nikaalo
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password'
      });
    }

    // 3. Password match karke dekho (Bcrypt Compare)
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password'
      });
    }

    // 4. Agar password match ho gaya, toh direct login ke bajaye OTP generate karo
    const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
    const otp = generateOTP();

    // 5. OTP aur Expiry ko Database mein save karo (10 minutes valid)
    user.loginOTP = otp;
    user.loginOTPExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    // 6. Terminal mein OTP print karo (Email na hone par Postman testing ke liye)
    console.log("\n=======================================================");
    console.log(`🔐 LOGIN OTP FOR ${user.email} IS: ${otp}`);
    console.log("=======================================================\n");

    // 7. (Optional) Real Email bhej sakte ho yahan sendEmail() se
    // try {
    //   await sendEmail({ email: user.email, subject: 'Your Login OTP', message: `Your OTP is ${otp}` });
    // } catch (err) { ... }

    // 8. User ko response do ki OTP bhej diya gaya hai
    return res.status(200).json({
      status: 'success',
      message: 'OTP sent successfully to your email. Please verify to login.'
    });

  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ status: 'error', message: 'Server error during login.' });
  }
};

// ─── PART 1: FORGOT PASSWORD ──────────────
// ==========================================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check karo user database mein hai ya nahi
    const user = await User.findOne({ email });

    // PRODUCTION SECURITY RULE: Privacy bani rahe
    if (!user) {
      return res.status(200).json({
        status: 'success',
        message: 'If that email exists, a reset link has been generated.'
      });
    }

    // Crypto se unguessable random token generate karo (Raw Token)
    const rawResetToken = crypto.randomBytes(32).toString('hex');

    // Token ko SHA-256 se HASH karke Database mein save karo
    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(rawResetToken)
      .digest('hex');

    // Token ki expiry set karo (15 minutes)
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000;

    // Changes ko MongoDB mein save karo
    await user.save();

    // 🔥 FIXED HERE: Variable changed from 'token' to 'rawResetToken' to match line 128
    const resetLink = `${process.env.FRONTEND_URL_ADMIN || 'http://localhost:3000'}/password-reset?token=${rawResetToken}`;

    // Terminal mein clickable link dikhane ke liye
    console.log("\n=======================================================");
    console.log("🔥 CLICK THIS LINK TO RESET PASSWORD (Terminal Testing):");
    console.log(resetLink);
    console.log("=======================================================\n");

    // 🔥 FIXED HERE: Passed 'resetLink' inside the message string instead of 'resetURL'
    const message = `Aapke password reset karne ki request aayi hai. Kripya is link par click karein: \n\n ${resetLink} \n\n Yeh link 15 minutes mein expire ho jayega.`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Request (Temp Mail)',
        message: message
      });
    } catch (err) {
      console.error('Email bhejne mein error:', err);
      // Operational Fix: Agar email fail ho toh DB clear karo
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      return res.status(500).json({
        status: 'error',
        message: 'Email send nahi ho paya, kripya dobara try karein.'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'If that email exists, a reset link has been generated.'
    });

  } catch (error) {
    console.error("Forgot Password Error: ", error);
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong on the server.'
    });
  }
};


// ==========================================
// ─── PART 2: RESET PASSWORD ───────────────
// ==========================================
exports.resetPassword = async (req, res) => {
  try {
    // URL se aane wale token ko trim karein taaki spaces nikal jayein
    const token = req.params.token.trim();
    const { password } = req.body;

    console.log("➡️ Incoming Raw Token from URL:", token);

    // Incoming URL token ko hash karo DB se match karne ke liye
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    console.log("➡️ Hashed Token (Jo DB mein search hoga):", hashedToken);

    // 1. User ko dhoondho jiska token valid aur unexpired ho ($gt = Greater Than)
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      console.log("❌ User not found with this token, or token has expired.");
      return res.status(400).json({
        status: 'fail',
        message: 'Token is invalid or has expired.'
      });
    }

    // 2. Naye password ko hash karke update karo
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(password, salt);

    // 3. Token fields ko clear karo (Single-use rule)
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // Database mein final save karo
    await user.save();

    // 4. CONFIRMATION EMAIL BHEJNA
    const confirmationMessage = `Hello,\n\nThis is a confirmation that the password for your account ${user.email} has just been changed successfully.\n\nIf you did not request this change, please contact our support team immediately to secure your account.`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Security Alert: Your Password Has Been Changed',
        message: confirmationMessage
      });

      return res.status(200).json({
        status: 'success',
        message: 'Password reset successful! A confirmation email has been sent.'
      });

    } catch (emailErr) {
      console.error("Confirmation Email Failed to Send: ", emailErr);

      return res.status(200).json({
        status: 'success',
        message: 'Password reset successful, but we couldn\'t send the confirmation email.'
      });
    }

  } catch (error) {
    console.error("Reset Password Error: ", error);
    return res.status(500).json({ status: 'error', message: 'Server error during password reset.' });
  }
};

// ==========================================
// ─── 🔥 NEW: VERIFY OTP CONTROLLER ─────────
// ==========================================
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // 1. User ko dhoondho jiska OTP valid ho aur expiry baaki ho ($gt = Greater Than)
    const user = await User.findOne({
      email,
      loginOTP: otp,
      loginOTPExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid OTP or the OTP has expired. Please try again.'
      });
    }

    // 2. Single-use rule: OTP verify hote hi DB se fields clear karo
    user.loginOTP = undefined;
    user.loginOTPExpires = undefined;
    await user.save();

    // 3. 🔒 Validation cleared! Ab real HTTP-Only Cookie generate karke login complete karo
    createSendToken(user, 200, res);

  } catch (error) {
    console.error("Verify OTP Error:", error);
    return res.status(500).json({ status: 'error', message: 'Server error during OTP verification.' });
  }
};

// ==========================================
// ─── 🔥 NEW: MODERN PASSWORDLESS LOGIN ───
// ==========================================
exports.passwordlessLogin = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ status: 'fail', message: 'Please provide a valid email address!' });
    }

    // 1. Check karo ki kya yeh admin already registered hai?
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'This email is not registered as an Admin.' });
    }

    // 2. Direct 6-Digit Numeric OTP generate karo (No password check!)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. DB mein save karo with 5 mins expiry
    user.loginOTP = otp;
    user.loginOTPExpires = Date.now() + 5 * 60 * 1000;
    await user.save();

    // 4. Send Notification log
    console.log(`============= 🧪 PASSWORDLESS TEST LOG =============\n🔥 MAGIC OTP FOR ${user.email}: ${otp}\n===================================================`);

    return res.status(200).json({
      status: 'success',
      message: 'Magic OTP has been sent to your email!'
    });

  } catch (error) {
    console.error("Passwordless Login Error:", error);
    return res.status(500).json({ status: 'error', message: 'Server error during passwordless auth.' });
  }
};