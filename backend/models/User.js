
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
      default: '',
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },

    role: {
      type: String,
      enum: ['admin', 'doctor', 'patient', 'receptionist'],
      default: 'patient',
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return

  this.password = await bcrypt.hash(this.password, 12)
})

// Compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password)
}

const User = mongoose.model('User', userSchema)

module.exports = User
