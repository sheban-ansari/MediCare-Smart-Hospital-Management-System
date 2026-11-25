
const mongoose = require('mongoose')
const Bill = require('../models/Bill')
const Patient = require('../models/Patient')
const Appointment = require('../models/Appointment')

// Generate unique invoice number
const generateInvoiceNumber = async () => {
  let invoiceNumber
  let exists = true

  while (exists) {
    const date = new Date()
    const datePart = date.toISOString().slice(0, 10).replace(/-/g, '')
    const randomPart = Math.floor(1000 + Math.random() * 9000)

    invoiceNumber = `INV-${datePart}-${randomPart}`

    exists = await Bill.exists({ invoiceNumber })
  }

  return invoiceNumber
}

// Get all bills
const getAllBills = async (req, res) => {
  try {
    const bills = await Bill.find()
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'name email phone' },
      })
      .populate('appointment')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: bills.length,
      bills,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// Create a new bill
const createBill = async (req, res) => {
  try {
    const {
      patient,
      appointment,
      items,
      tax = 0,
      discount = 0,
      paidAmount = 0,
      paymentMethod = 'Cash',
      billDate,
      dueDate,
      notes = '',
    } = req.body

    if (!patient || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Patient and at least one billing item are required',
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

    if (appointment) {
      if (!mongoose.Types.ObjectId.isValid(appointment)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid appointment ID',
        })
      }

      const appointmentExists = await Appointment.findById(appointment)

      if (!appointmentExists || appointmentExists.patient.toString() !== patient) {
        return res.status(400).json({
          success: false,
          message: 'Appointment does not belong to this patient',
        })
      }
    }

    const validMethods = [
      'Cash',
      'Card',
      'UPI',
      'Bank Transfer',
      'Other',
    ]

    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method',
      })
    }

    const parsedTax = Number(tax)
    const parsedDiscount = Number(discount)
    const parsedPaidAmount = Number(paidAmount)

    if (
      !Number.isFinite(parsedTax) ||
      !Number.isFinite(parsedDiscount) ||
      !Number.isFinite(parsedPaidAmount) ||
      parsedTax < 0 ||
      parsedDiscount < 0 ||
      parsedPaidAmount < 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Tax, discount and paid amount must be valid non-negative numbers',
      })
    }

    const formattedItems = items.map((item) => {
      const quantity = Number(item.quantity)
      const unitPrice = Number(item.unitPrice)

      if (
        !item.description?.trim() ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        !Number.isFinite(unitPrice) ||
        unitPrice < 0
      ) {
        throw new Error('Please provide valid billing item details')
      }

      return {
        description: item.description.trim(),
        quantity,
        unitPrice,
        amount: quantity * unitPrice,
      }
    })

    const subtotal = formattedItems.reduce(
      (sum, item) => sum + item.amount,
      0
    )

    const totalAmount = Math.max(
      0,
      subtotal + parsedTax - parsedDiscount
    )

    if (parsedPaidAmount > totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Paid amount cannot exceed total bill amount',
      })
    }

    const dueAmount = totalAmount - parsedPaidAmount

    let paymentStatus = 'Pending'

    if (parsedPaidAmount === totalAmount && totalAmount > 0) {
      paymentStatus = 'Paid'
    } else if (parsedPaidAmount > 0) {
      paymentStatus = 'Partially Paid'
    }

    const bill = await Bill.create({
      invoiceNumber: await generateInvoiceNumber(),
      patient,
      appointment: appointment || null,
      items: formattedItems,
      subtotal,
      tax: parsedTax,
      discount: parsedDiscount,
      totalAmount,
      paidAmount: parsedPaidAmount,
      dueAmount,
      paymentMethod,
      paymentStatus,
      billDate: billDate || Date.now(),
      dueDate: dueDate || null,
      notes,
      createdBy: req.user._id,
    })

    const populatedBill = await Bill.findById(bill._id)
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'name email phone' },
      })
      .populate('appointment')
      .populate('createdBy', 'name email')

    res.status(201).json({
      success: true,
      message: 'Bill created successfully',
      bill: populatedBill,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
}

// Update bill
const updateBill = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bill ID',
      })
    }

    const bill = await Bill.findById(id)

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found',
      })
    }

    if (bill.paymentStatus === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cancelled bills cannot be updated',
      })
    }

    const {
      items,
      tax,
      discount,
      paidAmount,
      paymentMethod,
      billDate,
      dueDate,
      notes,
    } = req.body

    const updatedItems = items !== undefined
      ? items.map((item) => {
          const quantity = Number(item.quantity)
          const unitPrice = Number(item.unitPrice)

          if (
            !item.description?.trim() ||
            !Number.isInteger(quantity) ||
            quantity < 1 ||
            !Number.isFinite(unitPrice) ||
            unitPrice < 0
          ) {
            throw new Error('Please provide valid billing item details')
          }

          return {
            description: item.description.trim(),
            quantity,
            unitPrice,
            amount: quantity * unitPrice,
          }
        })
      : bill.items

    if (updatedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one billing item is required',
      })
    }

    const parsedTax = tax !== undefined ? Number(tax) : bill.tax
    const parsedDiscount = discount !== undefined ? Number(discount) : bill.discount
    const parsedPaidAmount = paidAmount !== undefined
      ? Number(paidAmount)
      : bill.paidAmount

    if (
      !Number.isFinite(parsedTax) ||
      !Number.isFinite(parsedDiscount) ||
      !Number.isFinite(parsedPaidAmount) ||
      parsedTax < 0 ||
      parsedDiscount < 0 ||
      parsedPaidAmount < 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tax, discount or paid amount',
      })
    }

    const subtotal = updatedItems.reduce(
      (sum, item) => sum + item.amount,
      0
    )

    const totalAmount = Math.max(
      0,
      subtotal + parsedTax - parsedDiscount
    )

    if (parsedPaidAmount > totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Paid amount cannot exceed total bill amount',
      })
    }

    if (paymentMethod !== undefined) {
      const validMethods = [
        'Cash',
        'Card',
        'UPI',
        'Bank Transfer',
        'Other',
      ]

      if (!validMethods.includes(paymentMethod)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment method',
        })
      }
    }

    bill.items = updatedItems
    bill.subtotal = subtotal
    bill.tax = parsedTax
    bill.discount = parsedDiscount
    bill.totalAmount = totalAmount
    bill.paidAmount = parsedPaidAmount
    bill.dueAmount = totalAmount - parsedPaidAmount

    bill.paymentStatus =
      parsedPaidAmount === totalAmount && totalAmount > 0
        ? 'Paid'
        : parsedPaidAmount > 0
          ? 'Partially Paid'
          : 'Pending'

    if (paymentMethod !== undefined) bill.paymentMethod = paymentMethod
    if (billDate !== undefined) bill.billDate = billDate
    if (dueDate !== undefined) bill.dueDate = dueDate || null
    if (notes !== undefined) bill.notes = notes

    await bill.save()

    const updatedBill = await Bill.findById(bill._id)
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'name email phone' },
      })
      .populate('appointment')
      .populate('createdBy', 'name email')

    res.status(200).json({
      success: true,
      message: 'Bill updated successfully',
      bill: updatedBill,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
}

// Record a payment against an existing bill
const recordPayment = async (req, res) => {
  try {
    const { id } = req.params
    const { amount, paymentMethod } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bill ID',
      })
    }

    const bill = await Bill.findById(id)

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found',
      })
    }

    if (bill.paymentStatus === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot record payment for a cancelled bill',
      })
    }

    const parsedAmount = Number(amount)

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid payment amount',
      })
    }

    if (parsedAmount > bill.dueAmount) {
      return res.status(400).json({
        success: false,
        message: 'Payment cannot exceed the due amount',
      })
    }

    const validMethods = [
      'Cash',
      'Card',
      'UPI',
      'Bank Transfer',
      'Other',
    ]

    if (paymentMethod && !validMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method',
      })
    }

    bill.paidAmount += parsedAmount
    bill.dueAmount = Math.max(0, bill.totalAmount - bill.paidAmount)
    bill.paymentStatus =
      bill.dueAmount === 0 ? 'Paid' : 'Partially Paid'

    if (paymentMethod) bill.paymentMethod = paymentMethod

    await bill.save()

    const updatedBill = await Bill.findById(bill._id)
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'name email phone' },
      })
      .populate('appointment')
      .populate('createdBy', 'name email')

    res.status(200).json({
      success: true,
      message: 'Payment recorded successfully',
      bill: updatedBill,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
}

// Cancel bill
const cancelBill = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bill ID',
      })
    }

    const bill = await Bill.findById(id)

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found',
      })
    }

    if (bill.paymentStatus === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Bill is already cancelled',
      })
    }

    if (bill.paidAmount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bills with recorded payments cannot be cancelled',
      })
    }

    bill.paymentStatus = 'Cancelled'
    await bill.save()

    res.status(200).json({
      success: true,
      message: 'Bill cancelled successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

module.exports = {
  getAllBills,
  createBill,
  updateBill,
  recordPayment,
  cancelBill,
}
