
const mongoose = require('mongoose')

// Medicine details schema
const medicineSchema = new mongoose.Schema(
  {
    medicineName: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
    },

    dosage: {
      type: String,
      required: [true, 'Dosage is required'],
      trim: true,
    },

    frequency: {
      type: String,
      required: [true, 'Frequency is required'],
      trim: true,
    },

    duration: {
      type: String,
      required: [true, 'Duration is required'],
      trim: true,
    },

    instructions: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    _id: true,
  }
)

// Prescription schema
const prescriptionSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: [true, 'Appointment is required'],
    },

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

    diagnosis: {
      type: String,
      required: [true, 'Diagnosis is required'],
      trim: true,
    },

    symptoms: {
      type: String,
      trim: true,
      default: '',
    },

    medicines: {
      type: [medicineSchema],
      validate: {
        validator: function (medicines) {
          return medicines.length > 0
        },
        message: 'At least one medicine is required',
      },
    },

    advice: {
      type: String,
      trim: true,
      default: '',
    },

    notes: {
      type: String,
      trim: true,
      default: '',
    },

    followUpDate: {
      type: Date,
      default: null,
    },

    prescriptionDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
)

// Improve search performance
prescriptionSchema.index({ patient: 1, prescriptionDate: -1 })
prescriptionSchema.index({ doctor: 1, prescriptionDate: -1 })

const Prescription = mongoose.model(
  'Prescription',
  prescriptionSchema
)

module.exports = Prescription
