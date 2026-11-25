
const User = require('../models/User')
const jwt = require('jsonwebtoken')

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// Register new patient
const registerUser = async (req, res) => {
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

    const normalizedEmail = email.trim().toLowerCase()

    const existingUser = await User.findOne({
      email: normalizedEmail,
    })

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email',
      })
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      phone,
      password,
      role: 'patient',
    })

    res.status(201).json({
      success: true,
      message: 'Patient registration successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      token: generateToken(user._id),
    })
  } catch (error) {
    console.error('Registration error:', error.message)

    res.status(500).json({
      success: false,
      message: 'Registration failed',
    })
  }
}

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      })
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    })

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      })
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive',
      })
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      token: generateToken(user._id),
    })
  } catch (error) {
    console.error('Login error:', error.message)

    res.status(500).json({
      success: false,
      message: 'Login failed',
    })
  }
}

// Get logged-in user profile
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  })
}

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All password fields are required',
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      })
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match',
      })
    }

    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    const isMatch = await user.comparePassword(currentPassword)

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      })
    }

    user.password = newPassword
    await user.save()

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    })
  } catch (error) {
    console.error('Change password error:', error.message)

    res.status(500).json({
      success: false,
      message: 'Password change failed',
    })
  }
}

// Update logged-in user profile
const updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required',
      })
    }

    const normalizedEmail = email.trim().toLowerCase()

    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: req.user._id },
    })

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered',
      })
    }

    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    user.name = name.trim()
    user.email = normalizedEmail
    user.phone = phone ? phone.trim() : ''

    await user.save()

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Profile update error:', error.message)

    res.status(500).json({
      success: false,
      message: 'Profile update failed',
    })
  }
}

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  changePassword,
}
