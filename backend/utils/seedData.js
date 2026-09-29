const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Order = require('../models/Order');

dotenv.config();

const sampleProducts = [
  {
    name: 'Logitech MX Master 3S Wireless Mouse',
    sku: 'LOGI-MX3S-BLK',
    price: 99.99,
    stock: 24,
    category: 'Electronics',
    status: 'Active',
    description: 'Ergonomic wireless mouse with 8K DPI sensor and quiet clicks.',
  },
  {
    name: 'Keychron K2 Mechanical Keyboard',
    sku: 'KEY-K2-RGB',
    price: 89.50,
    stock: 12,
    category: 'Electronics',
    status: 'Active',
    description: '75% layout compact Bluetooth mechanical keyboard with Gateron switches.',
  },
  {
    name: 'Dell UltraSharp 27" 4K Monitor',
    sku: 'DELL-U2723QE',
    price: 529.00,
    stock: 5, // Low stock demo!
    category: 'Electronics',
    status: 'Active',
    description: 'IPS Black technology display with 98% DCI-P3 color coverage.',
  },
  {
    name: 'Sony WH-1000XM5 Wireless Headphones',
    sku: 'SNY-WH1000XM5',
    price: 348.00,
    stock: 8, // Low stock demo!
    category: 'Audio',
    status: 'Active',
    description: 'Industry-leading noise canceling headphones with 30-hour battery life.',
  },
  {
    name: 'Anker USB-C 100W Fast Charger',
    sku: 'ANK-736-NANO',
    price: 45.99,
    stock: 45,
    category: 'Accessories',
    status: 'Active',
    description: 'Compact 3-port GaN II fast wall charger for laptop and mobile.',
  },
  {
    name: 'Ergonomic Mesh Office Chair',
    sku: 'FURN-CHAIR-ERGO',
    price: 249.00,
    stock: 4, // Low stock demo!
    category: 'Furniture',
    status: 'Active',
    description: 'High-back breathable mesh desk chair with adjustable lumbar support.',
  },
  {
    name: 'Hydro Flask 32oz Insulated Bottle',
    sku: 'HYDR-FLSK-32',
    price: 39.95,
    stock: 60,
    category: 'Lifestyle',
    status: 'Active',
    description: 'Double-wall vacuum insulated stainless steel water bottle.',
  },
  {
    name: 'Belkin MagSafe 3-in-1 Wireless Stand',
    sku: 'BLK-WLS-3IN1',
    price: 139.99,
    stock: 15,
    category: 'Accessories',
    status: 'Active',
    description: 'Fast wireless charging stand for iPhone, Apple Watch, and AirPods.',
  },
  {
    name: 'CalDigit TS4 Thunderbolt 4 Dock',
    sku: 'CAL-TS4-DOCK',
    price: 399.95,
    stock: 2, // Very low stock demo!
    category: 'Electronics',
    status: 'Active',
    description: '18-port enterprise grade docking station with 98W host charging.',
  },
  {
    name: 'Kindle Paperwhite 16GB',
    sku: 'AMZN-KNDL-PW16',
    price: 149.99,
    stock: 30,
    category: 'Electronics',
    status: 'Active',
    description: '6.8" glare-free display with adjustable warm light.',
  },
];

const sampleCustomers = [
  {
    name: 'Sarah Connor',
    email: 'sarah.connor@example.com',
    phone: '+1 (555) 234-5678',
    address: '100 Skyway Blvd, Los Angeles, CA 90012',
  },
  {
    name: 'Alex Rivera',
    email: 'alex.rivera@example.com',
    phone: '+1 (555) 876-5432',
    address: '450 Silicon Avenue, San Jose, CA 95110',
  },
  {
    name: 'Maya Patel',
    email: 'maya.patel@example.com',
    phone: '+1 (555) 432-1098',
    address: '78 Austin Tech Way, Austin, TX 78701',
  },
  {
    name: 'David Kim',
    email: 'david.kim@example.com',
    phone: '+1 (555) 654-9870',
    address: '220 Market Street, Seattle, WA 98101',
  },
];

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory_order_management';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
    console.log('[Seed] Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      Product.deleteMany({}),
      Customer.deleteMany({}),
      Order.deleteMany({}),
    ]);
    console.log('[Seed] Cleared existing data');

    // Insert Products
    const createdProducts = await Product.insertMany(sampleProducts);
    console.log(`[Seed] Created ${createdProducts.length} products`);

    // Insert Customers
    const createdCustomers = await Customer.insertMany(sampleCustomers);
    console.log(`[Seed] Created ${createdCustomers.length} customers`);

    // Create Initial Orders
    const p0 = createdProducts[0]; // Logitech Mouse ($99.99)
    const p1 = createdProducts[1]; // Keychron Keyboard ($89.50)
    const p2 = createdProducts[2]; // Dell Monitor ($529.00)
    const p3 = createdProducts[3]; // Sony Headphones ($348.00)
    const p4 = createdProducts[4]; // Anker Charger ($45.99)

    const c0 = createdCustomers[0];
    const c1 = createdCustomers[1];
    const c2 = createdCustomers[2];

    const sampleOrders = [
      {
        orderNumber: 'ORD-20260929-1001',
        customer: c0._id,
        items: [
          {
            product: p0._id,
            name: p0.name,
            sku: p0.sku,
            unitPrice: p0.price,
            quantity: 2,
            subtotal: 199.98,
          },
          {
            product: p1._id,
            name: p1.name,
            sku: p1.sku,
            unitPrice: p1.price,
            quantity: 1,
            subtotal: 89.50,
          },
        ],
        totalAmount: 289.48,
        status: 'Confirmed',
        stockDeducted: true,
        confirmedAt: new Date(Date.now() - 3600000 * 24 * 2), // 2 days ago
        notes: 'Priority delivery requested',
      },
      {
        orderNumber: 'ORD-20260929-1002',
        customer: c1._id,
        items: [
          {
            product: p2._id,
            name: p2.name,
            sku: p2.sku,
            unitPrice: p2.price,
            quantity: 1,
            subtotal: 529.00,
          },
        ],
        totalAmount: 529.00,
        status: 'Confirmed',
        stockDeducted: true,
        confirmedAt: new Date(Date.now() - 3600000 * 12), // 12 hours ago
        notes: 'Standard ground shipping',
      },
      {
        orderNumber: 'ORD-20260929-1003',
        customer: c2._id,
        items: [
          {
            product: p3._id,
            name: p3.name,
            sku: p3.sku,
            unitPrice: p3.price,
            quantity: 1,
            subtotal: 348.00,
          },
          {
            product: p4._id,
            name: p4.name,
            sku: p4.sku,
            unitPrice: p4.price,
            quantity: 2,
            subtotal: 91.98,
          },
        ],
        totalAmount: 439.98,
        status: 'Pending',
        stockDeducted: false,
        notes: 'Awaiting customer payment verification',
      },
      {
        orderNumber: 'ORD-20260929-1004',
        customer: c0._id,
        items: [
          {
            product: p4._id,
            name: p4.name,
            sku: p4.sku,
            unitPrice: p4.price,
            quantity: 1,
            subtotal: 45.99,
          },
        ],
        totalAmount: 45.99,
        status: 'Cancelled',
        stockDeducted: false,
        cancelledAt: new Date(Date.now() - 3600000 * 5),
        notes: 'Customer changed their mind',
      },
    ];

    const createdOrders = await Order.insertMany(sampleOrders);
    console.log(`[Seed] Created ${createdOrders.length} sample orders`);

    console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
    return {
      productsCount: createdProducts.length,
      customersCount: createdCustomers.length,
      ordersCount: createdOrders.length,
    };
  } catch (error) {
    console.error('[Seed Error]:', error);
    throw error;
  }
};

// If run directly from terminal
if (require.main === module) {
  seedDatabase()
    .then(() => {
      mongoose.connection.close();
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = seedDatabase;
