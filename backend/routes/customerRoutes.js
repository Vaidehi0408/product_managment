const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
} = require('../controllers/customerController');

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.post('/', createCustomer);

module.exports = router;
