
const express = require('express')

const {
  getAllPatients,
  createPatient,
  updatePatient,
  deletePatient,
} = require('../controllers/patientController')

const {
  protect,
  authorize,
} = require('../middleware/authMiddleware')

const router = express.Router()

// All routes require authentication
router.use(protect)

// Get all patients - Admin and Doctor
router.get('/', authorize('admin', 'doctor'), getAllPatients)

// Create patient - Admin only
router.post('/', authorize('admin'), createPatient)

// Update patient - Admin only
router.put('/:id', authorize('admin'), updatePatient)

// Delete patient - Admin only
router.delete('/:id', authorize('admin'), deletePatient)

module.exports = router
