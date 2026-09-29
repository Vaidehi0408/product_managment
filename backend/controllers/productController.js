const Product = require('../models/Product');
const Order = require('../models/Order');
const { ApiError } = require('../middleware/errorHandler');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * @desc    Get all products with search, filtering, and pagination
 * @route   GET /api/products
 */
const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      status,
      includeDeleted = 'false',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    // Filter by soft-delete flag
    if (includeDeleted !== 'true') {
      query.isDeleted = false;
    }

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Status filter
    if (status && status !== 'All') {
      query.status = status;
    }

    // Search by name or SKU
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { sku: searchRegex }, { category: searchRegex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [products, totalCount] = await Promise.all([
      Product.find(query).sort(sort).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    return sendSuccess(res, products, 'Products retrieved successfully', 200, {
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
 * @desc    Get single product by ID
 * @route   GET /api/products/:id
 */
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      throw new ApiError('Product not found', 404);
    }
    return sendSuccess(res, product, 'Product fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new product
 * @route   POST /api/products
 */
const createProduct = async (req, res, next) => {
  try {
    const { name, sku, price, stock, category, status, description } = req.body;

    // Basic payload check
    if (!name || !sku || price === undefined || stock === undefined || !category) {
      throw new ApiError('Name, SKU, price, stock, and category are required fields', 400);
    }

    const cleanSku = sku.trim().toUpperCase();

    // Check duplicate SKU explicitly for clean friendly error
    const existingSku = await Product.findOne({ sku: cleanSku });
    if (existingSku) {
      throw new ApiError(`Product with SKU '${cleanSku}' already exists`, 409);
    }

    const numericPrice = Number(price);
    const numericStock = Number(stock);

    if (isNaN(numericPrice) || numericPrice < 0) {
      throw new ApiError('Price must be a non-negative number', 422);
    }

    if (isNaN(numericStock) || numericStock < 0 || !Number.isInteger(numericStock)) {
      throw new ApiError('Stock must be a non-negative integer', 422);
    }

    const product = await Product.create({
      name: name.trim(),
      sku: cleanSku,
      price: numericPrice,
      stock: numericStock,
      category: category.trim(),
      status: status || 'Active',
      description: description ? description.trim() : '',
    });

    return sendSuccess(res, product, 'Product created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 */
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      throw new ApiError('Product not found', 404);
    }

    const { name, sku, price, stock, category, status, description } = req.body;

    if (sku) {
      const cleanSku = sku.trim().toUpperCase();
      if (cleanSku !== product.sku) {
        const existingSku = await Product.findOne({ sku: cleanSku, _id: { $ne: product._id } });
        if (existingSku) {
          throw new ApiError(`SKU '${cleanSku}' is already in use by another product`, 409);
        }
        product.sku = cleanSku;
      }
    }

    if (name !== undefined) product.name = name.trim();
    if (category !== undefined) product.category = category.trim();
    if (status !== undefined) product.status = status;
    if (description !== undefined) product.description = description.trim();

    if (price !== undefined) {
      const numericPrice = Number(price);
      if (isNaN(numericPrice) || numericPrice < 0) {
        throw new ApiError('Price must be a non-negative number', 422);
      }
      product.price = numericPrice;
    }

    if (stock !== undefined) {
      const numericStock = Number(stock);
      if (isNaN(numericStock) || numericStock < 0 || !Number.isInteger(numericStock)) {
        throw new ApiError('Stock must be a non-negative integer', 422);
      }
      product.stock = numericStock;
    }

    await product.save();

    return sendSuccess(res, product, 'Product updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete product (Soft delete to protect order history integrity)
 * @route   DELETE /api/products/:id
 */
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      throw new ApiError('Product not found', 404);
    }

    if (product.isDeleted) {
      throw new ApiError('Product has already been deleted', 400);
    }

    // Check if product is referenced in any existing orders
    const associatedOrdersCount = await Order.countDocuments({
      'items.product': product._id,
    });

    // Soft delete: guarantees historical orders will never have broken links
    product.isDeleted = true;
    product.status = 'Archived';
    await product.save();

    const message =
      associatedOrdersCount > 0
        ? `Product archived successfully. Note: It is associated with ${associatedOrdersCount} existing order(s); past order history is preserved.`
        : 'Product deleted successfully';

    return sendSuccess(res, { id: product._id, isDeleted: true }, message);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all distinct product categories
 * @route   GET /api/products/meta/categories
 */
const getCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category', { isDeleted: false });
    return sendSuccess(res, categories.sort(), 'Categories retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
};
