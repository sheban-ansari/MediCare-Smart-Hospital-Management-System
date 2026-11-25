const Patient = require('../models/Patient')
const Doctor = require('../models/Doctor')
const Appointment = require('../models/Appointment')
const Bill = require('../models/Bill')

// Get date range filter
const getDateRange = (range) => {
  const now = new Date()
  const start = new Date(now)

  if (range === 'today') {
    start.setHours(0, 0, 0, 0)
  } else if (range === 'week') {
    start.setHours(0, 0, 0, 0)

    const day = start.getDay()
    const difference = day === 0 ? 6 : day - 1

    start.setDate(start.getDate() - difference)
  } else if (range === 'month') {
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
  } else if (range === 'year') {
    start.setMonth(0, 1)
    start.setHours(0, 0, 0, 0)
  } else {
    return null
  }

  return {
    $gte: start,
    $lte: now,
  }
}

// Get Reports and Analytics
const getReports = async (req, res) => {
  try {
    const range = req.query.range || 'all'

    const allowedRanges = [
      'all',
      'today',
      'week',
      'month',
      'year',
    ]

    if (!allowedRanges.includes(range)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report date range',
      })
    }

    const dateRange = getDateRange(range)

    const patientFilter = dateRange
      ? { createdAt: dateRange }
      : {}

    const doctorFilter = dateRange
      ? { createdAt: dateRange }
      : {}

    const appointmentFilter = dateRange
      ? { appointmentDate: dateRange }
      : {}

    const billFilter = dateRange
      ? { billDate: dateRange }
      : {}

    // Fetch main statistics
    const [
      totalPatients,
      totalDoctors,
      totalAppointments,
      totalBills,
      appointmentStatuses,
      revenueData,
      departmentData,
    ] = await Promise.all([
      Patient.countDocuments(patientFilter),

      Doctor.countDocuments(doctorFilter),

      Appointment.countDocuments(appointmentFilter),

      Bill.countDocuments({
        ...billFilter,
        paymentStatus: { $ne: 'Cancelled' },
      }),

      Appointment.aggregate([
        { $match: appointmentFilter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      Bill.aggregate([
        {
          $match: {
            ...billFilter,
            paymentStatus: { $ne: 'Cancelled' },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            receivedAmount: { $sum: '$paidAmount' },
            pendingDues: { $sum: '$dueAmount' },
          },
        },
      ]),

      Doctor.aggregate([
        {
          $group: {
            _id: {
              $ifNull: ['$department', 'Other'],
            },
            doctorCount: { $sum: 1 },
          },
        },
        {
          $sort: {
            doctorCount: -1,
          },
        },
      ]),
    ])

    // Revenue summary
    const revenue = revenueData[0] || {
      totalRevenue: 0,
      receivedAmount: 0,
      pendingDues: 0,
    }

    // Appointment status summary
    const statusSummary = {
      Pending: 0,
      Confirmed: 0,
      Completed: 0,
      Cancelled: 0,
    }

    appointmentStatuses.forEach((item) => {
      statusSummary[item._id] = item.count
    })

    // Last 6 months activity
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setDate(1)
    sixMonthsAgo.setHours(0, 0, 0, 0)
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)

    const [monthlyAppointments, monthlyPatients] = await Promise.all([
      Appointment.aggregate([
        {
          $match: {
            appointmentDate: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$appointmentDate' },
              month: { $month: '$appointmentDate' },
            },
            appointments: { $sum: 1 },
          },
        },
      ]),

      Patient.aggregate([
        {
          $match: {
            createdAt: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            patients: { $sum: 1 },
          },
        },
      ]),
    ])

    const monthlyActivity = []

    for (let i = 0; i < 6; i++) {
      const monthDate = new Date(sixMonthsAgo)
      monthDate.setMonth(sixMonthsAgo.getMonth() + i)

      const year = monthDate.getFullYear()
      const month = monthDate.getMonth() + 1

      const appointmentEntry = monthlyAppointments.find(
        (item) =>
          item._id.year === year &&
          item._id.month === month
      )

      const patientEntry = monthlyPatients.find(
        (item) =>
          item._id.year === year &&
          item._id.month === month
      )

      monthlyActivity.push({
        month: monthDate.toLocaleString('en-US', {
          month: 'short',
        }),
        appointments: appointmentEntry?.appointments || 0,
        patients: patientEntry?.patients || 0,
      })
    }

    // Final response
    res.status(200).json({
      success: true,

      range,

      overview: {
        totalPatients,
        totalDoctors,
        totalAppointments,
        totalRevenue: revenue.totalRevenue,
        receivedAmount: revenue.receivedAmount,
        pendingDues: revenue.pendingDues,
        totalBills,
      },

      appointmentStatuses: statusSummary,

      monthlyActivity,

      departmentPerformance: departmentData.map((item) => ({
        department: item._id,
        doctors: item.doctorCount,
      })),

      financialSummary: {
        totalRevenue: revenue.totalRevenue,
        receivedAmount: revenue.receivedAmount,
        pendingDues: revenue.pendingDues,
        totalBills,
      },
    })
  } catch (error) {
    console.error('Reports Error:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
    })
  }
}

module.exports = {
  getReports,
}