
const mongoose = require('mongoose')

const medicalRecordSchema = new mongoose.Schema(
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

    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
    },

    recordType: {
      type: String,
      enum: [
        'Diagnosis',
        'Lab Report',
        'Allergy',
        'Treatment',
        'Medical History',
        'Other',
      ],
      required: [true, 'Record type is required'],
    },

    title: {
      type: String,
      required: [true, 'Record title is required'],
      trim: true,
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },

    diagnosis: {
      type: String,
      trim: true,
      default: '',
    },

    symptoms: {
      type: String,
      trim: true,
      default: '',
    },

    treatment: {
      type: String,
      trim: true,
      default: '',
    },

    allergies: {
      type: String,
      trim: true,
      default: '',
    },

    reportDate: {
      type: Date,
      default: Date.now,
    },

    notes: {
      type: String,
      trim: true,
      default: '',
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

medicalRecordSchema.index({ patient: 1, reportDate: -1 })
medicalRecordSchema.index({ doctor: 1, reportDate: -1 })
medicalRecordSchema.index({ recordType: 1 })

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema)
