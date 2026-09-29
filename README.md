# Mini Inventory & Order Management System (MERN Stack)

A full-stack inventory and order management system built with the **MERN** stack (MongoDB, Express.js, React.js, Node.js). The application enables administrators to manage product catalogs, monitor inventory levels in real-time, process customer orders, and track sales performance with rigorous transactional integrity and concurrency control.

---

## Repository & Submission Information
* **GitHub Repository**: [https://github.com/Vaidehi0408/product_managment](https://github.com/Vaidehi0408/product_managment)
* **Frontend Local URL**: `http://localhost:3000`
* **Backend API Local URL**: `http://localhost:5001`

---

## Tech Stack
* **Frontend**: React.js (Vite), Vanilla CSS design system, Lucide Icons, Axios
* **Backend**: Node.js, Express.js
* **Database**: MongoDB (via Mongoose ODM)
* **Architecture**: RESTful API, Controller-Service-Model structure, Finite State Machine (FSM)

---

## Project Structure
```
product_managment/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection logic
│   ├── controllers/
│   │   ├── productController.js  # Product CRUD, search, filter, soft delete
│   │   ├── customerController.js # Customer management & order history
│   │   ├── orderController.js    # Order lifecycle, atomic stock logic, snapshots
│   │   └── dashboardController.js# Aggregated KPIs, sales, low stock alerts
│   ├── middleware/
│   │   ├── errorHandler.js       # Centralized error handler & status mapper
│   │   └── validator.js          # Request validation middleware
│   ├── models/
│   │   ├── Product.js            # Product schema with unique SKU & soft delete
│   │   ├── Customer.js           # Customer schema
│   │   └── Order.js              # Order schema with immutable price snapshots
│   ├── routes/
│   │   ├── productRoutes.js      # /api/products
│   │   ├── customerRoutes.js     # /api/customers
│   │   ├── orderRoutes.js        # /api/orders
│   │   ├── dashboardRoutes.js    # /api/dashboard
│   │   └── seedRoutes.js         # /api/seed
│   ├── utils/
│   │   ├── apiResponse.js        # Standardized API response helper
│   │   └── seedData.js           # Sample database seeder
│   ├── .env.example              # Environment variables template
│   ├── package.json
│   └── server.js                 # Express entry point
├── frontend/
│   ├── src/
│   │   ├── api/                  # Axios service layer
│   │   │   ├── apiClient.js
│   │   │   ├── productService.js
│   │   │   ├── orderService.js
│   │   │   ├── customerService.js
│   │   │   └── dashboardService.js
│   │   ├── components/
│   │   │   ├── common/           # Modal, Badge, StatCard, Sidebar, TopHeader
│   │   │   ├── products/         # ProductFormModal
│   │   │   ├── orders/           # CreateOrderModal, OrderDetailModal
│   │   │   └── customers/        # CustomerFormModal
│   │   ├── context/
│   │   │   └── ToastContext.jsx  # Global toast notifications
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx # Analytics KPIs & recent orders
│   │   │   ├── ProductsPage.jsx  # Product catalog, stock levels, search & filter
│   │   │   ├── OrdersPage.jsx    # Orders list, status tabs, detail modal
│   │   │   └── CustomersPage.jsx # Customer list & customer order history
│   │   ├── styles/
│   │   │   └── index.css         # Modern design tokens & responsive CSS
│   │   ├── App.jsx               # Navigation & application shell
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── .gitignore
└── README.md
```

---

## Getting Started & Running Locally

### Prerequisites
* **Node.js**: v16.20+ or later
* **MongoDB**: Running locally on default port `27017` (e.g. via Homebrew, service, or MongoDB Compass)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/Vaidehi0408/product_managment.git
cd product_managment
```

---

### Step 2: Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Setup environment variables:
   A `.env` file is already preconfigured, or create one from `.env.example`:
   ```bash
   cp .env.example .env
   ```
   **Default `.env` values:**
   ```env
   PORT=5001
   MONGODB_URI=mongodb://localhost:27017/inventory_order_management
   NODE_ENV=development
   ```
4. Seed the initial database (creates 10 products, 4 customers, and 4 sample orders):
   ```bash
   npm run seed
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend API will run on **`http://localhost:5001`**.

---

### Step 3: Frontend Setup
1. Open a **new terminal tab/window** and navigate to the frontend directory:
   ```bash
   cd product_managment/frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to:
   👉 **`http://localhost:3000`**

---

## Database Models & Schema Design

### 1. `Product` Model
* `name` (String, required, trimmed)
* `sku` (String, required, unique, uppercase, indexed)
* `price` (Number, required, min: 0)
* `stock` (Number, required, min: 0, integer)
* `category` (String, required, trimmed)
* `status` (String, enum: `['Active', 'Inactive', 'Archived']`, default: `'Active'`)
* `description` (String)
* `isDeleted` (Boolean, default: `false`, indexed) — *Soft delete flag protecting historic order references*
* `timestamps` (`createdAt`, `updatedAt`)

### 2. `Customer` Model
* `name` (String, required, trimmed)
* `email` (String, required, unique, lowercase, trimmed)
* `phone` (String)
* `address` (String)
* `timestamps` (`createdAt`, `updatedAt`)

### 3. `Order` Model
* `orderNumber` (String, required, unique, e.g. `ORD-20260929-1001`)
* `customer` (ObjectId, ref: `Customer`, required)
* `items` (Array of sub-documents):
  * `product` (ObjectId, ref: `Product`, required)
  * `name` (String) — *Historic snapshot*
  * `sku` (String) — *Historic snapshot*
  * `unitPrice` (Number, min: 0) — *Immutable price snapshot at moment of purchase*
  * `quantity` (Number, min: 1, integer)
  * `subtotal` (Number, `unitPrice * quantity`)
* `totalAmount` (Number, required, min: 0) — *Calculated server-side*
* `status` (String, enum: `['Pending', 'Confirmed', 'Cancelled']`, default: `'Pending'`)
* `stockDeducted` (Boolean, default: `false`) — *Explicit tracking to ensure idempotent transitions*
* `confirmedAt` (Date)
* `cancelledAt` (Date)
* `notes` (String)
* `timestamps` (`createdAt`, `updatedAt`)

---

## Tricky / Open-Ended Business Logic Implementation

The system rigorously handles all edge cases outlined in the task:

### 1. Two users try to order the last available stock (Race Condition)
* **Problem**: If product stock is 1 and two users submit orders simultaneously, a naive check-then-update could result in negative stock.
* **Solution**: Handled with **MongoDB atomic conditional updates**:
  ```javascript
  const updated = await Product.findOneAndUpdate(
    { _id: item.product, stock: { $gte: item.quantity }, isDeleted: false },
    { $inc: { stock: -item.quantity } },
    { new: true }
  );
  ```
  If `updated` is `null`, the stock was claimed concurrently by another transaction; the system aborts immediately with `409 Conflict: Insufficient stock`. For multi-item orders, any previously decremented items are rolled back atomically using compensation logic.

### 2. Same product added multiple times in one order
* **Problem**: User selects the same product in multiple line items within an order.
* **Solution**: Auto-consolidation pipeline prior to validation. Quantities for identical product IDs are summed into a single line item (`mergedQuantity = sum(quantities)`), ensuring a single atomic check and preventing confusing duplicate line entries.

### 3. Product is deleted after it has already been used in an order
* **Problem**: Deleting a product could break historical orders, causing invoices to display `null` or broken links.
* **Solution**: 
  1. Products use **Soft Deletion** (`isDeleted: true`, status: `'Archived'`). Soft-deleted products are hidden from the active catalog and blocked from new orders.
  2. `Order.items` stores an **embedded snapshot** (`name`, `sku`, `unitPrice`, `subtotal`). Even if a product is soft-deleted or permanently unlinked, all past order details and invoices remain 100% complete and intact.

### 4. Cancelled order is cancelled again (Idempotency)
* **Problem**: Cancelling an order multiple times could repeatedly restore inventory, artificially inflating stock.
* **Solution**: Governed by a **Finite State Machine (FSM)**:
  * Only `Confirmed -> Cancelled` restores stock, after which `stockDeducted` is set to `false`.
  * Attempting to cancel an order whose status is already `'Cancelled'` is caught idempotently and rejects re-cancellation with `400 Bad Request`.

### 5. Confirmed order is edited
* **Problem**: Modifying quantities or items on a confirmed order causes inventory reservation desynchronization and invoice discrepancies.
* **Solution**: **Confirmed orders are immutable**. To modify a confirmed order, the admin must cancel the order (which atomically restores stock) and create a corrected order. This guarantees clear audit trails.

### 6. Product price changes after an order is created
* **Problem**: Changing a product's price in the catalog should never retroactively change past order invoices.
* **Solution**: **Price Snapshot Pattern**: When an order is created, the current catalog price is copied into `Order.items[i].unitPrice` and `Order.items[i].subtotal`. Any future updates to `Product.price` only affect subsequent orders.

### 7. Invalid or negative quantity
* **Problem**: Negative or decimal quantities could corrupt inventory or produce negative order totals.
* **Solution**: Validated at two layers:
  1. API validation middleware checks `Number.isInteger(qty) && qty > 0`, rejecting invalid values with `422 Unprocessable Entity`.
  2. Mongoose schema enforces `min: 1` and `validator: Number.isInteger`. Frontend inputs enforce `min="1"` and `step="1"`.

### 8. Duplicate SKU
* **Problem**: SKU must be a unique business identifier.
* **Solution**:
  1. MongoDB compound unique index `{ sku: 1 }, { unique: true }`.
  2. Controller explicitly checks for existing SKUs before creation and update, returning a clear `409 Conflict: SKU already exists`.

---

## REST API Reference

### Products
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | List products with pagination, search (`search`), category (`category`), and status (`status`) filters |
| `GET` | `/api/products/:id` | Get single product by ID |
| `POST` | `/api/products` | Create a new product (validates unique SKU, stock $\ge 0$, price $\ge 0$) |
| `PUT` | `/api/products/:id` | Update product details |
| `DELETE` | `/api/products/:id` | Soft delete/archive product |
| `GET` | `/api/products/meta/categories` | Get distinct categories list |

### Orders
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/orders` | List orders with pagination, status tabs, search |
| `GET` | `/api/orders/:id` | Get order details with customer and snapshot items |
| `POST` | `/api/orders` | Create an order (validates stock, calculates totals, merges duplicates, deducts stock if Confirmed) |
| `PATCH` | `/api/orders/:id/status` | Transition order status (`Confirmed` / `Cancelled`) with atomic stock adjustments |

### Customers
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/customers` | List all customer profiles |
| `POST` | `/api/customers` | Add a new customer |
| `GET` | `/api/customers/:id` | Get customer profile with complete purchasing history |

### Dashboard & Seed
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/stats` | Returns Total Products, Total Orders, Total Stock, Total Sales, Status Counts, Recent Orders, and Low Stock Alerts |
| `POST` | `/api/seed` | Resets and seeds database with realistic sample products, customers, and orders |

---

## Verification & Testing Guide

You can test all tricky edge cases directly using `curl` or from the Web UI:

1. **Test Duplicate SKU**:
   ```bash
   curl -X POST http://localhost:5001/api/products \
     -H "Content-Type: application/json" \
     -d '{"name":"Duplicate SKU Test","sku":"LOGI-MX3S-BLK","price":50,"stock":10,"category":"Electronics"}'
   # Response: 409 Conflict {"success":false,"message":"Product with SKU 'LOGI-MX3S-BLK' already exists"}
   ```

2. **Test Ordering More Than Available Stock**:
   ```bash
   curl -X POST http://localhost:5001/api/orders \
     -H "Content-Type: application/json" \
     -d '{"customerId":"<CUSTOMER_ID>","items":[{"productId":"<LOW_STOCK_PRODUCT_ID>","quantity":9999}],"status":"Confirmed"}'
   # Response: 400 Bad Request {"success":false,"message":"Insufficient stock..."}
   ```

3. **Test Cancelling Confirmed Order Restores Stock**:
   * Create an order with `status: "Confirmed"` -> check product stock decreases.
   * Send `PATCH /api/orders/<ID>/status` with `{"status": "Cancelled"}` -> check product stock increases back to original count.
