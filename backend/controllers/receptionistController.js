
const User = require('../models/User')

// Get all receptionists
const getAllReceptionists = async (req, res) => {
  try {
    const receptionists = await User.find({ role: 'receptionist' })
      .select('-password')
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: receptionists.length,
      receptionists,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch receptionists',
      error: error.message,
    })
  }
}

// Add receptionist
const createReceptionist = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required',
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      })
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    })

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email is already registered',
      })
    }

    const receptionist = await User.create({
      name,
      email,
      phone,
      password,
      role: 'receptionist',
    })

    res.status(201).json({
      success: true,
      message: 'Receptionist added successfully',
      receptionist: {
        _id: receptionist._id,
        name: receptionist.name,
        email: receptionist.email,
        phone: receptionist.phone,
        role: receptionist.role,
        isActive: receptionist.isActive,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add receptionist',
      error: error.message,
    })
  }
}

// Update receptionist
const updateReceptionist = async (req, res) => {
  try {
    const { name, email, phone, password, isActive } = req.body

    const receptionist = await User.findOne({
      _id: req.params.id,
      role: 'receptionist',
    })

    if (!receptionist) {
      return res.status(404).json({
        success: false,
        message: 'Receptionist not found',
      })
    }

    if (name !== undefined) receptionist.name = name
    if (email !== undefined) receptionist.email = email
    if (phone !== undefined) receptionist.phone = phone
    if (isActive !== undefined) receptionist.isActive = isActive

    if (password !== undefined && password.trim() !== '') {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters',
        })
      }

      receptionist.password = password
    }

    await receptionist.save()

    res.status(200).json({
      success: true,
      message: 'Receptionist updated successfully',
      receptionist: {
        _id: receptionist._id,
        name: receptionist.name,
        email: receptionist.email,
        phone: receptionist.phone,
        role: receptionist.role,
        isActive: receptionist.isActive,
      },
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email is already registered',
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update receptionist',
      error: error.message,
    })
  }
}

// Delete receptionist
const deleteReceptionist = async (req, res) => {
  try {
    const receptionist = await User.findOneAndDelete({
      _id: req.params.id,
      role: 'receptionist',
    })

    if (!receptionist) {
      return res.status(404).json({
        success: false,
        message: 'Receptionist not found',
      })
    }

    res.status(200).json({
      success: true,
      message: 'Receptionist deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete receptionist',
      error: error.message,
    })
  }
}

module.exports = {
  getAllReceptionists,
  createReceptionist,
  updateReceptionist,
  deleteReceptionist,
}
