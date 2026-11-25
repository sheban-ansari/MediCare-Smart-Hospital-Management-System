
const mongoose = require('mongoose')

const MedicalRecord = require('../models/MedicalRecord')
const Patient = require('../models/Patient')
const Doctor = require('../models/Doctor')
const Appointment = require('../models/Appointment')

// Get All Medical Records
const getAllMedicalRecords = async (req, res) => {
  try {
    let filter = {}

    // Doctor can only see their own records
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user._id })

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found',
        })
      }

      filter.doctor = doctor._id
    }

    const records = await MedicalRecord.find(filter)
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'name email phone',
        },
      })
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'name email phone',
        },
      })
      .populate('appointment')
      .populate('createdBy', 'name email role')
      .sort({ reportDate: -1 })

    res.status(200).json({
      success: true,
      count: records.length,
      records,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// Create Medical Record
const createMedicalRecord = async (req, res) => {
  try {
    const {
      patient,
      doctor: doctorId,
      appointment,
      recordType,
      title,
      description,
      diagnosis,
      symptoms,
      treatment,
      allergies,
      reportDate,
      notes,
    } = req.body

    if (!patient || !recordType || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Patient, record type, title and description are required',
      })
    }

    if (!mongoose.Types.ObjectId.isValid(patient)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID',
      })
    }

    const patientExists = await Patient.findById(patient)

    if (!patientExists) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      })
    }

    let assignedDoctor

    if (req.user.role === 'doctor') {
      assignedDoctor = await Doctor.findOne({ user: req.user._id })

      if (!assignedDoctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found',
        })
      }
    } else {
      if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
        return res.status(400).json({
          success: false,
          message: 'Valid doctor ID is required',
        })
      }

      assignedDoctor = await Doctor.findById(doctorId)

      if (!assignedDoctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found',
        })
      }
    }

    // Validate optional appointment
    if (appointment) {
      if (!mongoose.Types.ObjectId.isValid(appointment)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid appointment ID',
        })
      }

      const appointmentExists = await Appointment.findById(appointment)

      if (!appointmentExists) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found',
        })
      }

      if (
        appointmentExists.patient.toString() !== patient ||
        appointmentExists.doctor.toString() !== assignedDoctor._id.toString()
      ) {
        return res.status(400).json({
          success: false,
          message: 'Appointment patient or doctor does not match',
        })
      }
    }

    const record = await MedicalRecord.create({
      patient,
      doctor: assignedDoctor._id,
      appointment: appointment || null,
      recordType,
      title,
      description,
      diagnosis,
      symptoms,
      treatment,
      allergies,
      reportDate: reportDate || Date.now(),
      notes,
      createdBy: req.user._id,
    })

    const populatedRecord = await MedicalRecord.findById(record._id)
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'name email phone',
        },
      })
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'name email phone',
        },
      })
      .populate('appointment')
      .populate('createdBy', 'name email role')

    res.status(201).json({
      success: true,
      message: 'Medical record created successfully',
      record: populatedRecord,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// Update Medical Record
const updateMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid medical record ID',
      })
    }

    const record = await MedicalRecord.findById(id)

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found',
      })
    }

    // Doctor can update only their own records
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user._id })

      if (!doctor || record.doctor.toString() !== doctor._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this medical record',
        })
      }
    }

    const allowedFields = [
      'recordType',
      'title',
      'description',
      'diagnosis',
      'symptoms',
      'treatment',
      'allergies',
      'reportDate',
      'notes',
    ]

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        record[field] = req.body[field]
      }
    })

    await record.save()

    const updatedRecord = await MedicalRecord.findById(record._id)
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'name email phone',
        },
      })
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'name email phone',
        },
      })
      .populate('appointment')
      .populate('createdBy', 'name email role')

    res.status(200).json({
      success: true,
      message: 'Medical record updated successfully',
      record: updatedRecord,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// Delete Medical Record (Admin only)
const deleteMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid medical record ID',
      })
    }

    const record = await MedicalRecord.findById(id)

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found',
      })
    }

    await record.deleteOne()

    res.status(200).json({
      success: true,
      message: 'Medical record deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

module.exports = {
  getAllMedicalRecords,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
}
