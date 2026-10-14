const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

// REGISTER USER
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check karo user pehle se toh nahi hai
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ success: false, error: 'Email pehle se registered hai' });

    // Naya user banao
    const user = await User.create({ name, email, password });

    // Token generate karo
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

    res.status(201).json({ success: true, token, data: { name: user.name, email: user.email } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// 2. LOGIN USER
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || user.password !== password) { 
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Login successful, generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

    res.status(200).json({ success: true, token, data: { id: user._id, name: user.name } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { registerUser, loginUser };