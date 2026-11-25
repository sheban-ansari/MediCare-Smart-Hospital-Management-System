
const mongoose = require('mongoose')
const Appointment = require('../models/Appointment')
const Patient = require('../models/Patient')
const Doctor = require('../models/Doctor')

// Get all appointments
// Get all appointments
const getAllAppointments = async (req, res) => {
  try {
    let filter = {}

    // Doctors can only see their own appointments
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

      filter.doctor = doctor._id
    }

    const appointments = await Appointment.find(filter)
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
      .sort({ appointmentDate: 1, appointmentTime: 1 })

    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: error.message,
    })
  }
}

// Create appointment
const createAppointment = async (req, res) => {
  try {
    const {
      patient,
      doctor,
      appointmentDate,
      appointmentTime,
      reason,
      notes,
    } = req.body

    if (
      !patient ||
      !doctor ||
      !appointmentDate ||
      !appointmentTime ||
      !reason
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required appointment fields',
      })
    }

    if (
      !mongoose.Types.ObjectId.isValid(patient) ||
      !mongoose.Types.ObjectId.isValid(doctor)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient or doctor ID',
      })
    }

    const parsedDate = new Date(appointmentDate)

    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment date',
      })
    }

    const patientExists = await Patient.findById(patient)

    if (!patientExists) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      })
    }

    const doctorExists = await Doctor.findById(doctor)

    if (!doctorExists) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      })
    }

    if (doctorExists.availability !== 'Available') {
      return res.status(400).json({
        success: false,
        message: 'Selected doctor is currently unavailable',
      })
    }

    const existingAppointment = await Appointment.findOne({
      doctor,
      appointmentDate: parsedDate,
      appointmentTime,
      status: { $ne: 'Cancelled' },
    })

    if (existingAppointment) {
      return res.status(409).json({
        success: false,
        message: 'Doctor already has an appointment at this date and time',
      })
    }

    const appointment = await Appointment.create({
      patient,
      doctor,
      appointmentDate: parsedDate,
      appointmentTime,
      reason,
      notes,
    })

    const populatedAppointment = await Appointment.findById(
      appointment._id
    )
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

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      appointment: populatedAppointment,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create appointment',
      error: error.message,
    })
  }
}

// Update appointment
const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID',
      })
    }

    const appointment = await Appointment.findById(id)

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      })
    }

    const {
      patient,
      doctor,
      appointmentDate,
      appointmentTime,
      reason,
      notes,
      status,
    } = req.body

    if (patient !== undefined) {
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

      appointment.patient = patient
    }

    if (doctor !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(doctor)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid doctor ID',
        })
      }

      const doctorExists = await Doctor.findById(doctor)

      if (!doctorExists) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found',
        })
      }

      if (doctorExists.availability !== 'Available') {
        return res.status(400).json({
          success: false,
          message: 'Selected doctor is currently unavailable',
        })
      }

      appointment.doctor = doctor
    }

    if (appointmentDate !== undefined) {
      const parsedDate = new Date(appointmentDate)

      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid appointment date',
        })
      }

      appointment.appointmentDate = parsedDate
    }

    if (appointmentTime !== undefined) {
      appointment.appointmentTime = appointmentTime
    }

    if (reason !== undefined) {
      appointment.reason = reason
    }

    if (notes !== undefined) {
      appointment.notes = notes
    }

    if (status !== undefined) {
      if (
        !['Pending', 'Confirmed', 'Completed', 'Cancelled'].includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid appointment status',
        })
      }

      appointment.status = status
    }

    const existingAppointment = await Appointment.findOne({
      _id: { $ne: id },
      doctor: appointment.doctor,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      status: { $ne: 'Cancelled' },
    })

    if (existingAppointment && appointment.status !== 'Cancelled') {
      return res.status(409).json({
        success: false,
        message: 'Doctor already has an appointment at this date and time',
      })
    }

    await appointment.save()

    const updatedAppointment = await Appointment.findById(id)
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

    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      appointment: updatedAppointment,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment',
      error: error.message,
    })
  }
}

// Delete appointment
const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID',
      })
    }

    const appointment = await Appointment.findById(id)

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      })
    }

    await appointment.deleteOne()

    res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete appointment',
      error: error.message,
    })
  }
}

module.exports = {
  getAllAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
}
