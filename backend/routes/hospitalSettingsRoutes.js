
const express = require('express')

const {
  getHospitalSettings,
  updateHospitalSettings,
} = require('../controllers/hospitalSettingsController')

const {
  protect,
  authorize,
} = require('../middleware/authMiddleware')

const router = express.Router()

// Hospital Settings - Admin Only
router.use(protect, authorize('admin'))

router.get('/', getHospitalSettings)
router.put('/', updateHospitalSettings)

module.exports = router
