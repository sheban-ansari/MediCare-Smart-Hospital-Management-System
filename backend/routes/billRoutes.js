
const express = require('express')

const {
  getAllBills,
  createBill,
  updateBill,
  recordPayment,
  cancelBill,
} = require('../controllers/billController')

const {
  protect,
  authorize,
} = require('../middleware/authMiddleware')

const router = express.Router()

// Only Admin can access billing management
router.use(protect, authorize('admin'))

// Get all bills
router.get('/', getAllBills)

// Create new bill
router.post('/', createBill)

// Update bill
router.put('/:id', updateBill)

// Record payment
router.post('/:id/payment', recordPayment)

// Cancel bill
router.patch('/:id/cancel', cancelBill)

module.exports = router
