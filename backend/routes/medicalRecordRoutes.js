
const express = require('express')

const {
  getAllMedicalRecords,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
} = require('../controllers/medicalRecordController')

const {
  protect,
  authorize,
} = require('../middleware/authMiddleware')

const router = express.Router()

// Admin and Doctor access
router.use(protect, authorize('admin', 'doctor'))

// Get all medical records
router.get('/', getAllMedicalRecords)

// Create medical record
router.post('/', createMedicalRecord)

// Update medical record
router.put('/:id', updateMedicalRecord)

// Only Admin can delete medical records
router.delete('/:id', authorize('admin'), deleteMedicalRecord)

module.exports = router
