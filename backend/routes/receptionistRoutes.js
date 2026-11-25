
const express = require('express')
const router = express.Router()

const {
  getAllReceptionists,
  createReceptionist,
  updateReceptionist,
  deleteReceptionist,
} = require('../controllers/receptionistController')

const { protect, authorize } = require('../middleware/authMiddleware')

// Admin-only receptionist management
router.use(protect, authorize('admin'))

router.get('/', getAllReceptionists)
router.post('/', createReceptionist)
router.put('/:id', updateReceptionist)
router.delete('/:id', deleteReceptionist)

module.exports = router
