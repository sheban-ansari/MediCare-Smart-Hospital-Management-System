
const mongoose = require('mongoose')

const doctorSchema = new mongoose.Schema(
  {
    // Link Doctor details with User account
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
    },

    qualification: {
      type: String,
      required: [true, 'Qualification is required'],
      trim: true,
    },

    experience: {
      type: Number,
      required: [true, 'Experience is required'],
      min: [0, 'Experience cannot be negative'],
    },

    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },

    consultationFee: {
      type: Number,
      required: [true, 'Consultation fee is required'],
      min: [0, 'Consultation fee cannot be negative'],
    },

    licenseNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },

    bio: {
      type: String,
      trim: true,
      default: '',
    },

    availability: {
      type: String,
      enum: ['Available', 'Unavailable'],
      default: 'Available',
    },
  },
  {
    timestamps: true,
  }
)

const Doctor = mongoose.model('Doctor', doctorSchema)

module.exports = Doctor
