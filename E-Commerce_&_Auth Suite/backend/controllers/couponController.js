const { Coupon, CouponUsage } = require('../models/Coupon');
const Order = require('../models/Order'); // To check user eligibility & item analytics
const { Currency } = require('../models/Currency');

// =========================================================================
// 🛡️ 1. VALIDATE ELIGIBILITY, STACKED CONFLICTS & GLOBAL USAGE TRACKER
// =========================================================================
exports.validateAndApplyCoupon = async (req, res) => {
    try {
        const { code, cartItems, cartTotalBaseUSD, currentCurrencyCode } = req.body;
        const userId = req.user ? req.user._id.toString() : '6a3d10e8c1d872bae90766e0'; // Standard rishi token check

        // Checkpost 1: DB Presence
        const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
        if (!coupon) return res.status(404).json({ status: 'fail', message: 'Coupon code invalid or expired.' });

        // Checkpost 2: Temporal Expiry
        if (new Date(coupon.expiryDate) < new Date()) {
            return res.status(400).json({ status: 'fail', message: 'Promotional window has expired.' });
        }

        // Checkpost 3: Global Pool Fatigue
        if (coupon.globalUsedCount >= coupon.globalUsageLimit) {
            return res.status(400).json({ status: 'fail', message: 'Total redemption limits reached for this campaign.' });
        }

        // Checkpost 4: Fraud Detection - NEWUSER First Order Validation Rule
        if (coupon.isFirstOrderOnly) {
            const pastOrders = await Order.countDocuments({ user: userId, orderStatus: { $ne: 'cancelled' } });
            if (pastOrders > 0) {
                return res.status(400).json({ status: 'fail', message: 'This coupon is exclusively reserved for your first order.' });
            }
        }

        // Checkpost 5: Per User Limit Mapping ("Valid twice per user")
        const historicalUsage = await CouponUsage.findOne({ couponId: coupon._id, userId, status: 'consumed' });
        if (historicalUsage && historicalUsage.usageCount >= coupon.perUserLimit) {
            return res.status(400).json({ status: 'fail', message: `You have exhausted your usage quota (${coupon.perUserLimit} times) for this code.` });
        }

        // Checkpost 6: Category Isolation Boundaries (e.g., Electronics/Solitaire only)
        if (coupon.allowedCategory !== 'all') {
            const categoryMatch = cartItems.some(item => item.category === coupon.allowedCategory);
            if (!categoryMatch) {
                return res.status(400).json({ status: 'fail', message: `This discount only applies to products under the '${coupon.allowedCategory}' line.` });
            }
        }

        // Checkpost 7: Min Order Metric
        if (cartTotalBaseUSD < coupon.minOrderAmountUSD) {
            return res.status(400).json({ status: 'fail', message: `Cart values do not meet the minimum requirement of $${coupon.minOrderAmountUSD}.` });
        }

        // 🚀 MATHEMATICS & STACKED CAPS PIPELINE
        const currencyMeta = await Currency.findOne({ code: currentCurrencyCode.toUpperCase(), isActive: true });
        const currentRate = currencyMeta ? currencyMeta.exchangeRate : 1.0;

        let discountUSD = 0;
        if (coupon.discountType === 'flat') {
            discountUSD = coupon.discountValue;
        } else if (coupon.discountType === 'percentage') {
            discountUSD = (cartTotalBaseUSD * coupon.discountValue) / 100;

            // Strict Cap enforcement logic (Max discount value control matrix)
            if (coupon.maxDiscountLimitUSD && discountUSD > coupon.maxDiscountLimitUSD) {
                discountUSD = coupon.maxDiscountLimitUSD; // Hard clamp price ceiling
            }
        }

        const discountConverted = Number((discountUSD * currentRate).toFixed(2));

        return res.status(200).json({
            status: 'success',
            message: 'Coupon authorization successful. Discount injected.',
            data: {
                code: coupon.code,
                discountInLocalCurrency: discountConverted,
                currencySymbol: currencyMeta ? currencyMeta.symbol : '$',
                currencyCode: currentCurrencyCode.toUpperCase()
            }
        });

    } catch (error) {
        console.error("Advanced Validate Error: ", error.message);
        return res.status(500).json({ status: 'error', message: 'Error processing stack limits.' });
    }
};

// =========================================================================
// 🔄 2. THE CANCELLATION ENGINE: revertCouponUsage (Vital Operational Logic)
// =========================================================================
exports.revertCouponUsage = async (req, res) => {
    try {
        const { orderId } = req.body;

        // Order trace check
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ status: 'fail', message: 'Order parameters missing.' });

        if (!order.couponApplied) {
            return res.status(400).json({ status: 'fail', message: 'No coupons were embedded during the check-out transaction of this invoice.' });
        }

        const coupon = await Coupon.findOne({ code: order.couponApplied });
        if (!coupon) return res.status(404).json({ status: 'fail', message: 'Target tracking coupon metadata destroyed.' });

        // 1. Revert user specific records
        const userUsage = await CouponUsage.findOne({ couponId: coupon._id, userId: order.user, status: 'consumed' });
        if (userUsage) {
            if (userUsage.usageCount > 1) {
                userUsage.usageCount -= 1;
                await userUsage.save();
            } else {
                await userUsage.deleteOne(); // Entirely free up space if it was one-time lock
            }
        }

        // 2. Revert dynamic global ecosystem pools
        if (coupon.globalUsedCount > 0) {
            coupon.globalUsedCount -= 1;
            await coupon.save();
        }

        return res.status(200).json({
            status: 'success',
            message: `Coupon quota '${coupon.code}' successfully restored back into user profile.`
        });

    } catch (error) {
        return res.status(500).json({ status: 'error', message: 'Reversal engine collapse.' });
    }
};

// =========================================================================
// 🍱 3. THE SWIGGY/ZOMATO MACHINE: autoApplyBestOffer (Algorithm Execution)
// =========================================================================
exports.autoApplyBestOffer = async (req, res) => {
    try {
        const { cartItems, cartTotalBaseUSD, currentCurrencyCode } = req.body;
        const userId = req.user ? req.user._id.toString() : '6a3d10e8c1d872bae90766e0';

        // Fetch all active coupons from enterprise pools
        const activeCoupons = await Coupon.find({ isActive: true, expiryDate: { $gt: new Date() } });
        const currencyMeta = await Currency.findOne({ code: currentCurrencyCode.toUpperCase(), isActive: true });
        const currentRate = currencyMeta ? currencyMeta.exchangeRate : 1.0;

        let bestCoupon = null;
        let maxCalculatedDiscountUSD = 0;

        const pastOrders = await Order.countDocuments({ user: userId, orderStatus: { $ne: 'cancelled' } });

        for (let coupon of activeCoupons) {
            // Inline Eligibility Screening Loops (Pre-Filtering)
            if (coupon.globalUsedCount >= coupon.globalUsageLimit) continue;
            if (coupon.isFirstOrderOnly && pastOrders > 0) continue;
            if (cartTotalBaseUSD < coupon.minOrderAmountUSD) continue;

            if (coupon.allowedCategory !== 'all') {
                const catMatch = cartItems.some(item => item.category === coupon.allowedCategory);
                if (!catMatch) continue;
            }

            const userUsage = await CouponUsage.findOne({ couponId: coupon._id, userId, status: 'consumed' });
            if (userUsage && userUsage.usageCount >= coupon.perUserLimit) continue;

            // Inline calculation matrix mapping
            let currentDiscountUSD = 0;
            if (coupon.discountType === 'flat') {
                currentDiscountUSD = coupon.discountValue;
            } else if (coupon.discountType === 'percentage') {
                currentDiscountUSD = (cartTotalBaseUSD * coupon.discountValue) / 100;
                if (coupon.maxDiscountLimitUSD && currentDiscountUSD > coupon.maxDiscountLimitUSD) {
                    currentDiscountUSD = coupon.maxDiscountLimitUSD;
                }
            }

            // Check if this coupon saves the highest amount of cash streams
            if (currentDiscountUSD > maxCalculatedDiscountUSD) {
                maxCalculatedDiscountUSD = currentDiscountUSD;
                bestCoupon = coupon;
            }
        }

        if (!bestCoupon) {
            return res.status(200).json({ status: 'success', message: 'No eligible system promotions optimized for this cart context.', data: null });
        }

        return res.status(200).json({
            status: 'success',
            message: `Optimal financial configuration matching: ${bestCoupon.code}`,
            data: {
                recommendedCode: bestCoupon.code,
                optimizedSavingsInLocalCurrency: Number((maxCalculatedDiscountUSD * currentRate).toFixed(2)),
                currencySymbol: currencyMeta ? currencyMeta.symbol : '$'
            }
        });

    } catch (error) {
        console.error("Auto Optimization Error: ", error.message);
        return res.status(500).json({ status: 'error', message: 'Auto apply system exception occurred.' });
    }
};

// =========================================================================
// ➕ 4. ADMIN SEED UTILITY: createAdvancedCoupon
// =========================================================================
exports.createAdvancedCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.create(req.body);
        return res.status(201).json({ status: 'success', data: { coupon } });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

// =========================================================================
// 🎫 5. THE REFERRAL ENGINE: generateReferralCode (Unique Invite Codes)
// =========================================================================
exports.generateReferralCode = async (req, res) => {
  try {
    // Tisha, dynamic flow ke liye logged in user ki ID check hogi
    const userId = req.user ? req.user._id.toString() : '6a423edeb8977999be72d95b';
    
    // Unique random corporate string generation (e.g., TISHA839F)
    const uniqueSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const referralCode = `REF-${uniqueSuffix}`;

    // Referral code ko direct system master pool mein as a Flat Reward Coupon save karna
    const newReferralCoupon = await Coupon.create({
      code: referralCode,
      discountType: 'flat',
      discountValue: 50, // Fixed $50 reward for both friends
      minOrderAmountUSD: 500, // Threshold limits
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Valid for 30 Days
      globalUsageLimit: 1, // Individual one-time single token spend lock
      perUserLimit: 1,
      isActive: true
    });

    return res.status(201).json({
      status: 'success',
      message: 'Dynamic unique referral promo-token generated successfully!',
      data: { referralCode, rewardRules: newReferralCoupon }
    });

  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Referral compiler error.' });
  }
};

// =========================================================================
// 🍱 6. THE AUTO-OPTIMIZER ENGINE: autoApplyBestOffer (Swiggy/Zomato Clone)
// =========================================================================
exports.autoApplyBestOffer = async (req, res) => {
  try {
    const { cartItems, cartTotalBaseUSD, currentCurrencyCode } = req.body;
    const userId = req.user ? req.user._id.toString() : '6a423edeb8977999be72d95b';

    // 1. Fetch all system promotions currently active in cloud pools
    const activeCoupons = await Coupon.find({ isActive: true, expiryDate: { $gt: new Date() } });
    const currencyMeta = await Currency.findOne({ code: currentCurrencyCode.toUpperCase(), isActive: true });
    const currentRate = currencyMeta ? currencyMeta.exchangeRate : 1.0;

    let bestCoupon = null;
    let maxCalculatedDiscountUSD = 0;

    // Past orders verify karne ke liye user history tracking (For NEWUSER logic checks)
    const Order = require('../models/Order');
    const pastOrders = await Order.countDocuments({ user: userId, orderStatus: { $ne: 'cancelled' } });

    // 2. Start Algorithmic Screening Loop
    for (let coupon of activeCoupons) {
      if (coupon.globalUsedCount >= coupon.globalUsageLimit) continue;
      if (coupon.isFirstOrderOnly && pastOrders > 0) continue;
      if (cartTotalBaseUSD < coupon.minOrderAmountUSD) continue;

      // Category limits screening matrix (Electronics/Solitaire cut checks)
      if (coupon.allowedCategory !== 'all') {
        const catMatch = cartItems.some(item => item.category === coupon.allowedCategory);
        if (!catMatch) continue;
      }

      // Check user exhaustion quotas
      const userUsage = await CouponUsage.findOne({ couponId: coupon._id, userId, status: 'consumed' });
      if (userUsage && userUsage.usageCount >= coupon.perUserLimit) continue;

      // Calculate localized discount limits for comparison math
      let currentDiscountUSD = 0;
      if (coupon.discountType === 'flat') {
        currentDiscountUSD = coupon.discountValue;
      } else if (coupon.discountType === 'percentage') {
        currentDiscountUSD = (cartTotalBaseUSD * coupon.discountValue) / 100;
        if (coupon.maxDiscountLimitUSD && currentDiscountUSD > coupon.maxDiscountLimitUSD) {
          currentDiscountUSD = coupon.maxDiscountLimitUSD; // Clamp to limit
        }
      }

      // Check configuration for maximum financial savings track
      if (currentDiscountUSD > maxCalculatedDiscountUSD) {
        maxCalculatedDiscountUSD = currentDiscountUSD;
        bestCoupon = coupon;
      }
    }

    if (!bestCoupon) {
      return res.status(200).json({ status: 'success', message: 'No eligible platform offers optimized for your current layout.', data: null });
    }

    return res.status(200).json({
      status: 'success',
      message: `Algorithmic optimization match completed! Maximum savings configuration found: ${bestCoupon.code}`,
      data: {
        recommendedCode: bestCoupon.code,
        optimizedSavingsInLocalCurrency: Number((maxCalculatedDiscountUSD * currentRate).toFixed(2)),
        currencySymbol: currencyMeta ? currencyMeta.symbol : '$'
      }
    });

  } catch (error) {
    console.error("Auto Optimizer Error: ", error.message);
    return res.status(500).json({ status: 'error', message: 'Auto calculation sequence crash.' });
  }
};