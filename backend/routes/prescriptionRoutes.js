
const express = require('express')

const {
  getAllPrescriptions,
  getPrescriptionAppointments,
  createPrescription,
  updatePrescription,
  deletePrescription,
} = require('../controllers/prescriptionController')

const {
  protect,
  authorize,
} = require('../middleware/authMiddleware')

const router = express.Router()

// Admin and Doctor access
router.use(protect, authorize('admin', 'doctor'))

// Get all prescriptions
router.get('/', getAllPrescriptions)

// Get appointments available for prescriptions
router.get('/appointments', getPrescriptionAppointments)

// Create prescription
router.post('/', createPrescription)

// Update prescription
router.put('/:id', updatePrescription)

// Only Admin can delete prescriptions
router.delete('/:id', authorize('admin'), deletePrescription)

module.exports = router
