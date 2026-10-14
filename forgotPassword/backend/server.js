const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const currencyRoutes = require('./routes/currencyRoutes');
const orderRoutes = require('./routes/orderRoutes');
const productRouter = require('./routes/productRoutes');
const couponRoutes = require('./routes/couponRoutes');
const adminRouter = require('./routes/adminRoutes');
const multer = require('multer');
require('dotenv').config(); // Agar aap .env file use kar rahe hain credentials ke liye



const authRoutes = require('./routes/authRoutes'); // Aapke routes ka path
const cors = require('cors');

const app = express();

// ─── MIDDLEWARES ───
app.use(express.json()); // Taaki server JSON data accept kar sake (req.body)
app.use(cookieParser());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // Aapke Next.js frontend ka exact URL (added 3001)
  credentials: true,               // 🔒 CRITICAL: Isse HTTP-Only Cookies browser validate karega
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
})); // Allow frontend origin


// ─── ROUTES ───
app.use('/api/auth', authRoutes); // Hamara forgot-password route iske andar chalega
app.use('/api/currencies', currencyRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRouter);
// Mount the dashboard performance layout router
app.use('/api/admin', adminRouter);

// ─── MONGOOSE & SERVER CONNECTION ───
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/forgotpassword';
const PORT = process.env.PORT || 5001;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('🟢 MongoDB Connected Successfully!');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('🔴 Database connection error:', err);
  });