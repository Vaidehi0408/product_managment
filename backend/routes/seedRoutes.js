const express = require('express');
const router = express.Router();
const seedDatabase = require('../utils/seedData');
const { sendSuccess } = require('../utils/apiResponse');

router.post('/', async (req, res, next) => {
  try {
    const result = await seedDatabase();
    return sendSuccess(res, result, 'Database seeded successfully with demo data');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
