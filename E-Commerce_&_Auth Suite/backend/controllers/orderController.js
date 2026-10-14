const Order = require('../models/Order');
const { Coupon, CouponUsage } = require('../models/Coupon');
const { Currency } = require('../models/Currency');
const Razorpay = require('razorpay');
const crypto = require('crypto');
// Razorpay Instance Definition (Credentials process.env se aayenge)
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_your_dummy_key_here',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_dummy_secret_here'
});

// Update standard placeOrder function ke return data ko...
exports.placeOrder = async (req, res) => {
  try {
    const { items, currencyCode, couponCode } = req.body;
    const userId = req.user._id.toString(); 

    if (!items || items.length === 0) {
      return res.status(400).json({ status: 'fail', message: 'Cart execution cannot proceed with an empty item index.' });
    }

    // 💵 A. Currency Master Table Extraction Snapshot
    const currencyMeta = await Currency.findOne({ code: currencyCode.toUpperCase(), isActive: true });
    if (!currencyMeta) {
      return res.status(404).json({ status: 'fail', message: 'Requested currency exchange channel is currently disabled.' });
    }
    const currentRate = currencyMeta.exchangeRate;

    // 🧮 B. Subtotal Processing & Multi-Currency Price Freezing
    let cartTotalBaseUSD = 0;
    const lockedItems = items.map(item => {
      cartTotalBaseUSD += item.basePriceUSD;
      return {
        productId: item.id,
        name: item.name,
        category: item.category,
        basePriceUSD: item.basePriceUSD,
        convertedPrice: Number((item.basePriceUSD * currentRate).toFixed(2))
      };
    });

    let subTotalLocal = Number((cartTotalBaseUSD * currentRate).toFixed(2));
    let discountUSD = 0;
    let targetCoupon = null;

    // 🎟️ C. Coupon Master Verification & Dynamic Interceptor
    if (couponCode) {
      targetCoupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (!targetCoupon) {
        return res.status(404).json({ status: 'fail', message: 'The specified coupon parameters were not found.' });
      }

      // Time matrix validation check
      if (new Date(targetCoupon.expiryDate) < new Date()) {
        return res.status(400).json({ status: 'fail', message: 'Coupon validity timeline elapsed.' });
      }

      // Check global limit exhaust
      if (targetCoupon.globalUsedCount >= targetCoupon.globalUsageLimit) {
        return res.status(400).json({ status: 'fail', message: 'Redemption limits reached for this coupon.' });
      }

      // Calculate localized discount with Max Cap ceiling enforcement
      if (targetCoupon.discountType === 'flat') {
        discountUSD = targetCoupon.discountValue;
      } else if (targetCoupon.discountType === 'percentage') {
        discountUSD = (cartTotalBaseUSD * targetCoupon.discountValue) / 100;
        
        if (targetCoupon.maxDiscountLimitUSD && discountUSD > targetCoupon.maxDiscountLimitUSD) {
          discountUSD = targetCoupon.maxDiscountLimitUSD; 
        }
      }
    }

    let discountLocal = Number((discountUSD * currentRate).toFixed(2));
    let grandTotalLocal = Math.max(0, subTotalLocal - discountLocal);

    // 🚀 D. Document Creation Inside Orders Collection
    const order = await Order.create({
      user: userId,
      items: lockedItems,
      currency: currencyCode.toUpperCase(),
      exchangeRateUsed: currentRate,
      couponApplied: couponCode ? couponCode.toUpperCase() : null,
      subTotalLocal,
      discountLocal,
      grandTotalLocal,
      orderStatus: 'pending_payment'
    });

    // 🔒 E. Anti-Double Spend Token Allocation (Temporary Lock)
    if (targetCoupon) {
      await CouponUsage.create({
        couponId: targetCoupon._id,
        userId: userId,
        orderId: order._id.toString(),
        usageCount: 1,
        status: 'locked'
      });
      
      targetCoupon.globalUsedCount += 1;
      await targetCoupon.save();
    }

    const savedOrder = order;

    // 💳 SAFE GATEWAY POOL INTEGRATION
    try {
      // Direct instance initialization check
      if (!razorpayInstance || !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('YourDummyKey')) {
        throw new Error("Razorpay instance keys not loaded in environment.");
      }

      const gatewayOptions = {
        amount: Math.round(order.grandTotalLocal * 100), // Paisa translation layer
        currency: order.currency,
        receipt: savedOrder._id.toString(),
      };

      const razorpayOrder = await razorpayInstance.orders.create(gatewayOptions);

      return res.status(201).json({
        status: 'success',
        message: 'Order pipeline frozen. Gateway checkout token generated.',
        data: {
          order: savedOrder,
          gatewayToken: { id: razorpayOrder.id, amount: razorpayOrder.amount, currency: razorpayOrder.currency }
        }
      });

    } catch (gatewayError) {
      // 📡 BACKUP PLAN: Agar keys local configuration mein nahi hain, toh dummy test link bypass do
      console.log("⚠️ Razorpay Bypass Tracker: " + gatewayError.message);
      
      return res.status(201).json({
        status: 'success',
        message: 'Order created but Razorpay mock bypass triggered.',
        data: {
          order: savedOrder,
          gatewayToken: { 
            id: `rzp_mock_${Math.random().toString(36).substring(2, 9)}`, 
            amount: order.grandTotalLocal * 100, 
            currency: order.currency 
          }
        }
      });
    }

  } catch (error) {
    console.error("🔥 True Master Crash Log:", error);
    return res.status(500).json({ status: 'error', message: 'Order transaction channel collapsed.' });
  }
};
// =========================================================================
// 💳 2. GATEWAY HANDLER: confirmPayment Webhook Simulator (Success / Fail)
// =========================================================================
exports.confirmPayment = async (req, res) => {
  try {
    const { orderId, paymentSuccess } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ status: 'fail', message: 'Invoice execution target missing.' });

    if (paymentSuccess) {
      // SUCCESS: Order changes to 'processing' and coupon consumed permanently
      order.orderStatus = 'processing';
      await order.save();

      if (order.couponApplied) {
        const coupon = await Coupon.findOne({ code: order.couponApplied });
        if (coupon) {
          await CouponUsage.findOneAndUpdate(
            { orderId: order._id.toString(), couponId: coupon._id },
            { status: 'consumed' } // Permanently locked down!
          );
        }
      }

      return res.status(200).json({ status: 'success', message: 'Payment authenticated. Order processing scheduled.', data: { order } });
    
    } else {
      // 🔄 REVERSAL LOGIC: Payment Failed, cancel order and free up coupon instantly!
      order.orderStatus = 'cancelled';
      await order.save();

      if (order.couponApplied) {
        const coupon = await Coupon.findOne({ code: order.couponApplied });
        if (coupon) {
          // User usage limit records release
          await CouponUsage.deleteOne({ orderId: order._id.toString(), couponId: coupon._id });
          
          // Global pool count restore
          if (coupon.globalUsedCount > 0) {
            coupon.globalUsedCount -= 1;
            await coupon.save();
          }
        }
      }

      return res.status(200).json({ 
        status: 'fail', 
        message: 'Payment verification failed. Operational sequence aborted and coupon quota restored.' 
      });
    }

  } catch (error) {
    console.error("Payment Confirmation Crash: ", error.message);
    return res.status(500).json({ status: 'error', message: 'Payment handler processing exception.' });
  }
};


// =========================================================================
// 🔄 3. USER INTERFACE: Request Product Return/Rejection
// =========================================================================
exports.requestOrderReturn = async (req, res) => {
  try {
    const { orderId, type, reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ status: 'fail', message: 'Target order context not found.' });

    // Boundary check: Return sirf tabhi ho sakta hai jab order delivered ho chuka ho
    if (order.orderStatus !== 'processing' && order.orderStatus !== 'shipped' && order.orderStatus !== 'delivered') {
      return res.status(400).json({ status: 'fail', message: 'Orders pending payment or already cancelled cannot initiate return tracks.' });
    }

    // Anti-Spam: Agar pehle se request pending hai toh block karo
    if (order.returnRequest.isRequested && order.returnRequest.status === 'pending') {
      return res.status(400).json({ status: 'fail', message: 'An active evaluation track is already open for this invoice.' });
    }

    // Inject Return Parameters Snapshot
    order.returnRequest = {
      isRequested: true,
      type: type, // 'full_return' ya 'partial_rejection'
      reason: reason,
      status: 'pending',
      requestedAt: new Date()
    };

    await order.save();
    return res.status(200).json({ status: 'success', message: 'Return pipeline triggered. Pending admin review.', data: { order } });

  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Return initialization fault.' });
  }
};

// =========================================================================
// 👑 4. ADMIN DASHBOARD: Resolve Return (Approve / Reject Matrix)
// =========================================================================
exports.resolveReturnRequest = async (req, res) => {
  try {
    const { orderId, decision, adminNotes } = req.body; // decision: 'approved' ya 'rejected'

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ status: 'fail', message: 'Invoice context missing.' });

    if (!order.returnRequest.isRequested || order.returnRequest.status !== 'pending') {
      return res.status(400).json({ status: 'fail', message: 'No active return logs require mediation on this target.' });
    }

    order.returnRequest.status = decision;
    order.returnRequest.adminNotes = adminNotes;
    order.returnRequest.resolvedAt = new Date();

    if (decision === 'approved') {
      order.orderStatus = 'returned'; // Change state metrics
      await order.save();

      // 🔄 REVERSAL ENGINE INTEGRATION: Agar user ka order valid return ho gaya, toh uska coupon space free karo!
      if (order.couponApplied) {
        const { Coupon, CouponUsage } = require('../models/Coupon');
        const coupon = await Coupon.findOne({ code: order.couponApplied });
        if (coupon) {
          await CouponUsage.deleteOne({ orderId: order._id.toString(), couponId: coupon._id });
          if (coupon.globalUsedCount > 0) {
            coupon.globalUsedCount -= 1;
            await coupon.save();
          }
        }
      }
    } else {
      // Rejection branch matrix
      // Status remains processing/delivered, request is closed as rejected
      await order.save();
    }

    return res.status(200).json({
      status: 'success',
      message: `Operational decision finalized: Request has been ${decision.toUpperCase()}`,
      data: { order }
    });

  } catch (error) {
    console.error("Resolution Crash: ", error.message);
    return res.status(500).json({ status: 'error', message: 'Admin resolution processing exception.' });
  }
};
exports.confirmPayment = async (req, res) => {
  try {
    const { orderId, paymentSuccess, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ status: 'fail', message: 'Invoice execution target missing.' });

    let isSuccess = false;

    // 🕹️ Support for Mock Simulator flow from frontend
    if (paymentSuccess !== undefined) {
      isSuccess = paymentSuccess;
    } else {
      // 🔒 HMAC SHA256 Signature Verification Match Loop
      const generated_signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'your_dummy_secret_here')
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest('hex');
      isSuccess = (generated_signature === razorpay_signature);
    }

    if (isSuccess) {
      // Security Match Success! 
      order.orderStatus = 'processing';
      await order.save();
      
      // Permanently consume coupon
      if (order.couponApplied) {
        const coupon = await Coupon.findOne({ code: order.couponApplied });
        if (coupon) {
          await CouponUsage.findOneAndUpdate(
            { orderId: order._id.toString(), couponId: coupon._id },
            { status: 'consumed' }
          );
        }
      }
      
      return res.status(200).json({ status: 'success', message: 'Payment authenticated via secure gateway.' });
    } else {
      order.orderStatus = 'cancelled';
      await order.save();
      
      // Revert coupon usage
      if (order.couponApplied) {
        const coupon = await Coupon.findOne({ code: order.couponApplied });
        if (coupon) {
          await CouponUsage.deleteOne({ orderId: order._id.toString(), couponId: coupon._id });
          if (coupon.globalUsedCount > 0) {
            coupon.globalUsedCount -= 1;
            await coupon.save();
          }
        }
      }

      return res.status(400).json({ status: 'fail', message: 'Payment verification failed or signature manipulation detected.' });
    }
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Payment validation fault.' });
  }
};