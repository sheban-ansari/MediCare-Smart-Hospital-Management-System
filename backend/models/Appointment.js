
const mongoose = require('mongoose')

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient is required'],
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor is required'],
    },

    appointmentDate: {
      type: Date,
      required: [true, 'Appointment date is required'],
    },

    appointmentTime: {
      type: String,
      required: [true, 'Appointment time is required'],
      trim: true,
    },

    reason: {
      type: String,
      required: [true, 'Appointment reason is required'],
      trim: true,
    },

    notes: {
      type: String,
      trim: true,
      default: '',
    },

    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
)

appointmentSchema.index({
  doctor: 1,
  appointmentDate: 1,
  appointmentTime: 1,
})

module.exports = mongoose.model('Appointment', appointmentSchema)
