const express = require('express')

const {
  getReports,
} = require('../controllers/reportController')

const {
  protect,
  authorize,
} = require('../middleware/authMiddleware')

const router = express.Router()

// Only Admin can access reports
router.use(protect, authorize('admin'))

// Get Reports and Analytics
router.get('/', getReports)

module.exports = router