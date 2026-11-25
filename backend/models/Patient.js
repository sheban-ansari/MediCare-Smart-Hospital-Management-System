
const mongoose = require('mongoose')

const patientSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      default: 'Other',
    },

    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      default: '',
    },

    address: {
      type: String,
      trim: true,
      default: '',
    },

    emergencyContactName: {
      type: String,
      trim: true,
      default: '',
    },

    emergencyContactPhone: {
      type: String,
      trim: true,
      default: '',
    },

    medicalHistory: {
      type: String,
      trim: true,
      default: '',
    },

    allergies: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
)

const Patient = mongoose.model('Patient', patientSchema)

module.exports = Patient
