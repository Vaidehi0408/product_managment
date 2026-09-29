const Product = require('../models/Product');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * @desc    Get dashboard metrics, KPIs, and recent orders
 * @route   GET /api/dashboard/stats
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalProducts,
      totalCustomers,
      totalOrders,
      statusCounts,
      stockAggregate,
      salesAggregate,
      recentOrders,
      lowStockProducts,
    ] = await Promise.all([
      // 1. Total Active Products
      Product.countDocuments({ isDeleted: false }),

      // 2. Total Customers
      Customer.countDocuments(),

      // 3. Total Orders
      Order.countDocuments(),

      // 4. Order status breakdown
      Order.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      // 5. Total Stock count across all active products
      Product.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: null,
            totalStock: { $sum: '$stock' },
          },
        },
      ]),

      // 6. Total Sales revenue (Confirmed orders)
      Order.aggregate([
        { $match: { status: 'Confirmed' } },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$totalAmount' },
          },
        },
      ]),

      // 7. Recent 5 Orders
      Order.find()
        .populate('customer', 'name email')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      // 8. Low stock alert items (stock <= 10, not deleted)
      Product.find({ isDeleted: false, stock: { $lte: 10 } })
        .sort({ stock: 1 })
        .limit(10)
        .lean(),
    ]);

    const orderStatusMap = {
      Pending: 0,
      Confirmed: 0,
      Cancelled: 0,
    };
    statusCounts.forEach((sc) => {
      if (orderStatusMap[sc._id] !== undefined) {
        orderStatusMap[sc._id] = sc.count;
      }
    });

    const totalStock = stockAggregate.length > 0 ? stockAggregate[0].totalStock : 0;
    const totalSales = salesAggregate.length > 0 ? Math.round(salesAggregate[0].totalSales * 100) / 100 : 0;

    return sendSuccess(res, {
      totalProducts,
      totalCustomers,
      totalOrders,
      totalStock,
      totalSales,
      orderStatusCounts: orderStatusMap,
      recentOrders,
      lowStockProducts,
    }, 'Dashboard statistics retrieved');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};
