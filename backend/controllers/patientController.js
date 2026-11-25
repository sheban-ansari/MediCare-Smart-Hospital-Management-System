
const User = require('../models/User')
const Patient = require('../models/Patient')
const Appointment = require('../models/Appointment')
const Doctor = require('../models/Doctor')

// Get all patients
// Get all patients
const getAllPatients = async (req, res) => {
  try {
    let filter = {}

    // Doctors can only see patients assigned to them
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({
        user: req.user._id,
      })

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found',
        })
      }

      const patientIds = await Appointment.distinct('patient', {
        doctor: doctor._id,
      })

      filter._id = { $in: patientIds }
    }

    const patients = await Patient.find(filter)
      .populate('user', 'name email phone isActive')
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: patients.length,
      patients,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patients',
      error: error.message,
    })
  }
}

// Create patient
const createPatient = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      emergencyContactName,
      emergencyContactPhone,
      medicalHistory,
      allergies,
    } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required',
      })
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      })
    }

    const normalizedEmail = email.trim().toLowerCase()

    const existingUser = await User.findOne({
      email: normalizedEmail,
    })

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists',
      })
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      phone,
      password,
      role: 'patient',
    })

    try {
      const patient = await Patient.create({
        user: user._id,
        dateOfBirth,
        gender,
        bloodGroup,
        address,
        emergencyContactName,
        emergencyContactPhone,
        medicalHistory,
        allergies,
      })

      const populatedPatient = await Patient.findById(patient._id)
        .populate('user', 'name email phone isActive')

      return res.status(201).json({
        success: true,
        message: 'Patient created successfully',
        patient: populatedPatient,
      })
    } catch (error) {
      await User.findByIdAndDelete(user._id)
      throw error
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create patient',
      error: error.message,
    })
  }
}

// Update patient
const updatePatient = async (req, res) => {
  try {
    const { id } = req.params

    const {
      name,
      email,
      phone,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      emergencyContactName,
      emergencyContactPhone,
      medicalHistory,
      allergies,
    } = req.body

    const patient = await Patient.findById(id)

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      })
    }

    const user = await User.findById(patient.user)

    if (!user || user.role !== 'patient') {
      return res.status(404).json({
        success: false,
        message: 'Patient account not found',
      })
    }

    if (email !== undefined) {
      const normalizedEmail = email.trim().toLowerCase()

      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      })

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists',
        })
      }

      user.email = normalizedEmail
    }

    if (name !== undefined) user.name = name
    if (phone !== undefined) user.phone = phone

    await user.save()

    const fields = {
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      emergencyContactName,
      emergencyContactPhone,
      medicalHistory,
      allergies,
    }

    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined) patient[key] = value
    })

    await patient.save()

    const updatedPatient = await Patient.findById(id)
      .populate('user', 'name email phone isActive')

    res.status(200).json({
      success: true,
      message: 'Patient updated successfully',
      patient: updatedPatient,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update patient',
      error: error.message,
    })
  }
}

// Delete patient
const deletePatient = async (req, res) => {
  try {
    const { id } = req.params

    const patient = await Patient.findById(id)

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      })
    }

    await User.findByIdAndDelete(patient.user)
    await Patient.findByIdAndDelete(id)

    res.status(200).json({
      success: true,
      message: 'Patient deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete patient',
      error: error.message,
    })
  }
}

module.exports = {
  getAllPatients,
  createPatient,
  updatePatient,
  deletePatient,
}
