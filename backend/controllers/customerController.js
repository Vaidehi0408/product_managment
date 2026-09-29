const Customer = require('../models/Customer');
const Order = require('../models/Order');
const { ApiError } = require('../middleware/errorHandler');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * @desc    Get all customers
 * @route   GET /api/customers
 */
const getCustomers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const query = {};

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const customers = await Customer.find(query).sort({ name: 1 }).lean();
    return sendSuccess(res, customers, 'Customers retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get customer by ID with their order history
 * @route   GET /api/customers/:id
 */
const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      throw new ApiError('Customer not found', 404);
    }

    const orders = await Order.find({ customer: customer._id })
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, { customer, orders }, 'Customer details retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new customer
 * @route   POST /api/customers
 */
const createCustomer = async (req, res, next) => {
  try {
    const { name, email, phone, address } = req.body;

    if (!name || !email) {
      throw new ApiError('Customer name and email are required', 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await Customer.findOne({ email: cleanEmail });
    if (existing) {
      throw new ApiError(`Customer with email '${cleanEmail}' already exists`, 409);
    }

    const customer = await Customer.create({
      name: name.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : '',
      address: address ? address.trim() : '',
    });

    return sendSuccess(res, customer, 'Customer created successfully', 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
};
