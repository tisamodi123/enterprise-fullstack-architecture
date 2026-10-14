const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Cart = require('../models/Cart');

exports.getDashboardMetrics = async (req, res) => {
  try {
    // 1. KPI COUNTERS (Parallel thread execution loops for high production performance)
    const [
      totalOrdersCount,
      totalJewelleryCount,
      totalCustomersCount,
      pendingCustomersCount,
      activeCartsList,
      recentOrdersList
    ] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments(),
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ status: 'pending' }), // Context checking from senior view
      Cart.find().populate('user', 'name email phoneNumber').limit(5).sort({ updatedAt: -1 }),
      Order.find().populate('user', 'name email').limit(5).sort({ createdAt: -1 })
    ]);

    // 2. REVENUE METRICS AGGREGATION LOOP (Sum calculation of all successfully processed orders)
    const revenueAggregation = await Order.aggregate([
      { $match: { orderStatus: { $in: ['processing', 'completed'] } } },
      { $group: { _id: null, totalSales: { $sum: '$grandTotalLocal' } } }
    ]);

    const orderSalesTotal = revenueAggregation.length > 0 ? revenueAggregation[0].totalSales : 0;

    // 3. ONLINE USERS TRACKER MOCK UP SIMULATION (Can be linked later with WebSocket Active connections)
    const onlineUsersMockCount = 24; 

    // Return exact enterprise layout matrix matched with senior's image_56ba01.png
    return res.status(200).json({
      status: 'success',
      data: {
        metrics: {
          onlineUsers: onlineUsersMockCount,
          totalOrders: totalOrdersCount,
          totalJewellery: totalJewelleryCount,
          orderSalesRevenue: orderSalesTotal,
          verifyPendingCustomer: pendingCustomersCount,
          totalCustomer: totalCustomersCount
        },
        recentOrders: recentOrdersList,
        currentCarts: activeCartsList.map(cart => ({
          id: cart._id,
          totalItems: cart.totalItems,
          name: cart.user ? cart.user.name : 'Guest/Deleted User',
          email: cart.user ? cart.user.email : 'N/A',
          mobile: cart.user ? cart.user.phoneNumber : 'N/A'
        }))
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 'error', message: 'Metrics data analytics aggregation failed.' });
  }
};