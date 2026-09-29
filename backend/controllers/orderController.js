const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const { ApiError } = require('../middleware/errorHandler');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Helper to generate unique human-readable order number
 */
const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${dateStr}-${randomSuffix}`;
};

/**
 * Helper: Atomically deduct stock for an array of items.
 * If any product has insufficient stock (e.g. race condition),
 * immediately rolls back previously deducted products and throws 409 Conflict.
 */
const atomicallyDeductStock = async (items) => {
  const deducted = [];

  for (const item of items) {
    const updated = await Product.findOneAndUpdate(
      {
        _id: item.product,
        stock: { $gte: item.quantity },
        isDeleted: false,
      },
      {
        $inc: { stock: -item.quantity },
      },
      { new: true }
    );

    if (!updated) {
      // Rollback already deducted items in this sequence
      for (const roll of deducted) {
        await Product.findByIdAndUpdate(roll.product, {
          $inc: { stock: roll.quantity },
        });
      }
      throw new ApiError(
        `Insufficient stock or concurrent purchase for item: "${item.name}" (SKU: ${item.sku}). Requested: ${item.quantity}.`,
        409
      );
    }

    deducted.push(item);
  }

  return deducted;
};

/**
 * Helper: Restore stock for an array of items
 */
const restoreStock = async (items) => {
  for (const item of items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity },
    });
  }
};

/**
 * @desc    Get all orders with pagination, status filter, customer search
 * @route   GET /api/orders
 */
const getOrders = async (req, res, next) => {
  try {
    const {
      status,
      customer,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (customer) {
      query.customer = customer;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ orderNumber: searchRegex }, { notes: searchRegex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [orders, totalCount] = await Promise.all([
      Order.find(query)
        .populate('customer', 'name email phone')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    return sendSuccess(res, orders, 'Orders retrieved successfully', 200, {
      total: totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single order details by ID
 * @route   GET /api/orders/:id
 */
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone address')
      .populate('items.product', 'name sku price stock isDeleted category');

    if (!order) {
      throw new ApiError('Order not found', 404);
    }

    return sendSuccess(res, order, 'Order fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new order
 * @route   POST /api/orders
 * @body    { customerId, items: [{ productId, quantity }], status: 'Pending' | 'Confirmed', notes }
 */
const createOrder = async (req, res, next) => {
  try {
    const { customerId, items: rawItems, status = 'Pending', notes } = req.body;

    // 1. Validation: customer
    if (!customerId) {
      throw new ApiError('Customer is required', 400);
    }
    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new ApiError('Customer not found', 404);
    }

    // 2. Validation: items existence
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      throw new ApiError('Order must contain at least one product item', 400);
    }

    // 3. Tricky Logic: Handle duplicate products in the same order by aggregating quantities
    const consolidatedMap = new Map();
    for (const raw of rawItems) {
      const pId = String(raw.productId || raw.product || '').trim();
      const qty = Number(raw.quantity);

      if (!pId) {
        throw new ApiError('Product ID is required for each item', 422);
      }
      if (!Number.isInteger(qty) || qty <= 0) {
        throw new ApiError(`Invalid quantity: ${raw.quantity}. Quantity must be a positive integer greater than 0`, 422);
      }

      if (consolidatedMap.has(pId)) {
        consolidatedMap.set(pId, consolidatedMap.get(pId) + qty);
      } else {
        consolidatedMap.set(pId, qty);
      }
    }

    // 4. Fetch products from database
    const productIds = Array.from(consolidatedMap.keys());
    const products = await Product.find({ _id: { $in: productIds } });

    if (products.length !== productIds.length) {
      throw new ApiError('One or more selected products do not exist', 404);
    }

    const productMap = new Map(products.map((p) => [String(p._id), p]));

    // 5. Build order items with immutable price snapshot & pre-check stock
    const orderItems = [];
    let calculatedTotal = 0;

    for (const [pId, quantity] of consolidatedMap.entries()) {
      const product = productMap.get(pId);

      if (product.isDeleted) {
        throw new ApiError(`Product "${product.name}" (SKU: ${product.sku}) has been archived and cannot be ordered`, 400);
      }

      // Check available stock
      if (product.stock < quantity) {
        throw new ApiError(
          `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${quantity}`,
          400
        );
      }

      const unitPrice = Number(product.price);
      const subtotal = Math.round(unitPrice * quantity * 100) / 100;
      calculatedTotal += subtotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        sku: product.sku,
        unitPrice: unitPrice, // Immutable snapshot
        quantity: quantity,
        subtotal: subtotal,
      });
    }

    calculatedTotal = Math.round(calculatedTotal * 100) / 100;

    const initialStatus = status === 'Confirmed' ? 'Confirmed' : 'Pending';
    let stockDeducted = false;

    // 6. If creating order directly as 'Confirmed', atomically deduct stock
    if (initialStatus === 'Confirmed') {
      await atomicallyDeductStock(orderItems);
      stockDeducted = true;
    }

    // 7. Save order
    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      customer: customer._id,
      items: orderItems,
      totalAmount: calculatedTotal,
      status: initialStatus,
      stockDeducted: stockDeducted,
      confirmedAt: initialStatus === 'Confirmed' ? new Date() : null,
      notes: notes ? notes.trim() : '',
    });

    const populatedOrder = await Order.findById(order._id).populate('customer', 'name email phone');

    return sendSuccess(res, populatedOrder, 'Order created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update order status (FSM transitions: Confirm or Cancel)
 * @route   PATCH /api/orders/:id/status
 * @body    { status: 'Confirmed' | 'Cancelled', notes }
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status: targetStatus, notes } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      throw new ApiError('Order not found', 404);
    }

    const currentStatus = order.status;

    // Validate target status
    if (!['Pending', 'Confirmed', 'Cancelled'].includes(targetStatus)) {
      throw new ApiError(`Invalid target status: ${targetStatus}`, 400);
    }

    // 1. Idempotency Check: if status is already the same
    if (currentStatus === targetStatus) {
      return sendSuccess(res, order, `Order is already in '${currentStatus}' status`);
    }

    // 2. Tricky Logic: Cancelled order cancelled again or transitioned
    if (currentStatus === 'Cancelled') {
      throw new ApiError('Cancelled orders cannot be reopened or changed', 400);
    }

    // 3. Transition: Pending -> Confirmed
    if (currentStatus === 'Pending' && targetStatus === 'Confirmed') {
      // Atomically deduct stock
      await atomicallyDeductStock(order.items);
      order.status = 'Confirmed';
      order.stockDeducted = true;
      order.confirmedAt = new Date();
      if (notes) order.notes = notes;
      await order.save();

      const populated = await Order.findById(order._id).populate('customer', 'name email');
      return sendSuccess(res, populated, 'Order confirmed and stock successfully deducted');
    }

    // 4. Transition: Confirmed -> Cancelled
    if (currentStatus === 'Confirmed' && targetStatus === 'Cancelled') {
      // Restore stock only if stock was deducted
      if (order.stockDeducted) {
        await restoreStock(order.items);
        order.stockDeducted = false;
      }
      order.status = 'Cancelled';
      order.cancelledAt = new Date();
      if (notes) order.notes = notes;
      await order.save();

      const populated = await Order.findById(order._id).populate('customer', 'name email');
      return sendSuccess(res, populated, 'Order cancelled and stock restored to inventory');
    }

    // 5. Transition: Pending -> Cancelled
    if (currentStatus === 'Pending' && targetStatus === 'Cancelled') {
      // No stock was deducted for pending order, simply update status
      order.status = 'Cancelled';
      order.cancelledAt = new Date();
      if (notes) order.notes = notes;
      await order.save();

      const populated = await Order.findById(order._id).populate('customer', 'name email');
      return sendSuccess(res, populated, 'Pending order cancelled');
    }

    throw new ApiError(`Unsupported status transition from ${currentStatus} to ${targetStatus}`, 400);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Edit a Pending order (Confirmed orders cannot be edited directly)
 * @route   PUT /api/orders/:id
 */
const updateOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      throw new ApiError('Order not found', 404);
    }

    // Tricky Logic: Confirmed order is edited
    if (order.status === 'Confirmed') {
      throw new ApiError(
        'Confirmed orders cannot be modified directly to maintain invoice and inventory audit integrity. Please cancel this order (which restores inventory) and create a corrected order.',
        400
      );
    }

    if (order.status === 'Cancelled') {
      throw new ApiError('Cancelled orders cannot be edited', 400);
    }

    const { notes } = req.body;
    if (notes !== undefined) {
      order.notes = notes.trim();
    }

    await order.save();
    return sendSuccess(res, order, 'Order updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  updateOrder,
};
