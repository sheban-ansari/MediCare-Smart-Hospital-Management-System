
const express = require('express')

const {
  getAdminDashboard,
  createDoctor,
  getAllDoctors,
  updateDoctor,
  deleteDoctor,
} = require('../controllers/adminController')

const {
  protect,
  authorize,
} = require('../middleware/authMiddleware')

const router = express.Router()

// Admin Dashboard - Admin Only
router.get('/dashboard', protect, authorize('admin'), getAdminDashboard)

// Doctor Management - Admin Only
router.post('/doctors', protect, authorize('admin'), createDoctor)

router.get('/doctors', protect, authorize('admin'), getAllDoctors)

router.put('/doctors/:id', protect, authorize('admin'), updateDoctor)

router.delete('/doctors/:id', protect, authorize('admin'), deleteDoctor)

module.exports = router
