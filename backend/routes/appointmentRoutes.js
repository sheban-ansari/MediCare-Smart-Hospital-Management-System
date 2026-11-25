
const express = require('express')

const {
  getAllAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} = require('../controllers/appointmentController')

const {
  protect,
  authorize,
} = require('../middleware/authMiddleware')

const router = express.Router()

// All routes require authentication
router.use(protect)

// Get all appointments - Admin and Doctor
router.get('/', authorize('admin', 'doctor'), getAllAppointments)

// Create appointment - Admin only
router.post('/', authorize('admin'), createAppointment)

// Update appointment - Admin only
router.put('/:id', authorize('admin'), updateAppointment)

// Delete appointment - Admin only
router.delete('/:id', authorize('admin'), deleteAppointment)

module.exports = router
