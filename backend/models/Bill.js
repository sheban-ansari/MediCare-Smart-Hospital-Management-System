
const mongoose = require('mongoose')

const billItemSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: [true, 'Item description is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
)

const billSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
    },
    items: {
      type: [billItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: 'At least one billing item is required',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    dueAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Other'],
      default: 'Cash',
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Partially Paid', 'Paid', 'Cancelled'],
      default: 'Pending',
    },
    billDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      default: null,
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
  { timestamps: true }
)

billSchema.index({ patient: 1, billDate: -1 })
billSchema.index({ paymentStatus: 1 })

module.exports = mongoose.model('Bill', billSchema)
