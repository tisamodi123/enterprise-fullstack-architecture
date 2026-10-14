const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8
  },
  
  // ROLE ACCESS CONTROL LAYER 
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user' // By default sab normal user honge, hum manually database se admin set karenge
  },

  passwordResetToken: String,
  passwordResetExpires: Date, // Ek baar yahan standard clean-up kar diya hai

  // OTP Verification Fields
  loginOTP: {
    type: String
  },
  loginOTPExpires: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);