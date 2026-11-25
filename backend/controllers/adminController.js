
const User = require('../models/User')
const Doctor = require('../models/Doctor')
const Appointment = require('../models/Appointment')
const Patient = require('../models/Patient')
const Bill = require('../models/Bill')

// Get Admin Dashboard Statistics and Analytics
const getAdminDashboard = async (req, res) => {
  try {
    // 1. Dashboard Statistics
    const totalUsers = await User.countDocuments()
    const totalPatients = await Patient.countDocuments()
    const totalDoctors = await User.countDocuments({ role: 'doctor' })
    const totalReceptionists = await User.countDocuments({
      role: 'receptionist',
    })
    const totalAdmins = await User.countDocuments({ role: 'admin' })

    // 2. Revenue Analytics - Last 12 Months
    const currentDate = new Date()
    const twelveMonthsAgo = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 11,
      1
    )

    const monthlyRevenue = await Bill.aggregate([
      {
        $match: {
          billDate: { $gte: twelveMonthsAgo },
          paymentStatus: { $ne: 'Cancelled' },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$billDate' },
            month: { $month: '$billDate' },
          },
          revenue: { $sum: '$paidAmount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ])

    const revenueMap = new Map(
      monthlyRevenue.map((item) => [
        `${item._id.year}-${item._id.month}`,
        item.revenue,
      ])
    )

    const revenueData = []

    for (let i = 11; i >= 0; i--) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      )

      const year = date.getFullYear()
      const month = date.getMonth() + 1

      revenueData.push({
        month: date.toLocaleString('en-US', { month: 'short' }),
        revenue: revenueMap.get(`${year}-${month}`) || 0,
      })
    }

    // 3. Weekly Appointments - Current Week (Monday to Sunday)
    const startOfWeek = new Date(currentDate)
    startOfWeek.setHours(0, 0, 0, 0)

    const day = startOfWeek.getDay()
    const difference = day === 0 ? 6 : day - 1

    startOfWeek.setDate(startOfWeek.getDate() - difference)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(endOfWeek.getDate() + 7)

    const weeklyAppointments = await Appointment.aggregate([
      {
        $match: {
          appointmentDate: {
            $gte: startOfWeek,
            $lt: endOfWeek,
          },
          status: { $ne: 'Cancelled' },
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: '$appointmentDate' },
          count: { $sum: 1 },
        },
      },
    ])

    const weeklyMap = new Map(
      weeklyAppointments.map((item) => [item._id, item.count])
    )

    const weekDays = [
      { day: 'Mon', mongoDay: 2 },
      { day: 'Tue', mongoDay: 3 },
      { day: 'Wed', mongoDay: 4 },
      { day: 'Thu', mongoDay: 5 },
      { day: 'Fri', mongoDay: 6 },
      { day: 'Sat', mongoDay: 7 },
      { day: 'Sun', mongoDay: 1 },
    ]

    const appointmentData = weekDays.map((item) => ({
      day: item.day,
      count: weeklyMap.get(item.mongoDay) || 0,
    }))

    // 4. Recent Appointments
    const recentAppointments = await Appointment.find()
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'name' },
      })
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name' },
      })
      .sort({ appointmentDate: -1, createdAt: -1 })
      .limit(5)
      .lean()

    const formattedAppointments = recentAppointments.map((appointment) => {
      const patientName = appointment.patient?.user?.name || 'Unknown Patient'

      return {
        _id: appointment._id,
        name: patientName,
        initials: patientName
          .split(' ')
          .map((part) => part[0])
          .join('')
          .substring(0, 2)
          .toUpperCase(),
        doctor: appointment.doctor?.user?.name || 'Unknown Doctor',
        department: appointment.doctor?.department || 'N/A',
        date: appointment.appointmentDate,
        time: appointment.appointmentTime,
        status: appointment.status,
      }
    })

    // 5. Recent Activity
    const [recentPatients, recentActivityAppointments, recentBills] =
      await Promise.all([
        Patient.find()
          .populate('user', 'name')
          .sort({ createdAt: -1 })
          .limit(3)
          .lean(),

        Appointment.find()
          .populate({
            path: 'doctor',
            populate: { path: 'user', select: 'name' },
          })
          .sort({ createdAt: -1 })
          .limit(3)
          .lean(),

        Bill.find({ paymentStatus: { $ne: 'Cancelled' } })
          .sort({ updatedAt: -1 })
          .limit(3)
          .lean(),
      ])

    const recentActivities = [
      ...recentPatients.map((patient) => ({
        type: 'patient',
        title: 'New patient registered',
        detail: patient.user?.name || 'Patient',
        createdAt: patient.createdAt,
      })),

      ...recentActivityAppointments.map((appointment) => ({
        type: 'appointment',
        title: `Appointment ${appointment.status.toLowerCase()}`,
        detail: appointment.doctor?.user?.name || 'Doctor',
        createdAt: appointment.createdAt,
      })),

      ...recentBills.map((bill) => ({
        type: 'payment',
        title: 'Billing record updated',
        detail: `${bill.invoiceNumber} · ₹${bill.paidAmount}`,
        createdAt: bill.updatedAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)

    // 6. Dashboard Response
    res.status(200).json({
      success: true,
      message: 'Admin dashboard data fetched successfully',
      statistics: {
        totalUsers,
        totalPatients,
        totalDoctors,
        totalReceptionists,
        totalAdmins,
      },
      revenueData,
      appointmentData,
      recentAppointments: formattedAppointments,
      recentActivities,
    })
  } catch (error) {
    console.error('Admin dashboard error:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin dashboard data',
    })
  }
}

// Add New Doctor
const createDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      specialization,
      qualification,
      experience,
      department,
      consultationFee,
      licenseNumber,
      bio,
    } = req.body

    if (
      !name ||
      !email ||
      !password ||
      !specialization ||
      !qualification ||
      experience === undefined ||
      !department ||
      consultationFee === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required doctor details',
      })
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Doctor password must be at least 8 characters',
      })
    }

    const normalizedEmail = email.trim().toLowerCase()

    const existingUser = await User.findOne({
      email: normalizedEmail,
    })

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      })
    }

    if (
      !Number.isFinite(Number(experience)) ||
      Number(experience) < 0 ||
      !Number.isFinite(Number(consultationFee)) ||
      Number(consultationFee) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Experience and consultation fee must be valid non-negative numbers',
      })
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone,
      password,
      role: 'doctor',
    })

    try {
      const doctor = await Doctor.create({
        user: user._id,
        specialization,
        qualification,
        experience: Number(experience),
        department,
        consultationFee: Number(consultationFee),
        licenseNumber,
        bio,
      })

      res.status(201).json({
        success: true,
        message: 'Doctor added successfully',
        doctor,
      })
    } catch (error) {
      await User.findByIdAndDelete(user._id)
      throw error
    }
  } catch (error) {
    console.error('Create doctor error:', error.message)

    res.status(500).json({
      success: false,
      message: 'Failed to add doctor',
    })
  }
}

// Get All Doctors
const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .populate('user', 'name email phone isActive')
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: doctors.length,
      doctors,
    })
  } catch (error) {
    console.error('Get doctors error:', error.message)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctors',
    })
  }
}

// Update Doctor
const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params

    const doctor = await Doctor.findById(id)

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      })
    }

    const {
      name,
      email,
      phone,
      specialization,
      qualification,
      experience,
      department,
      consultationFee,
      licenseNumber,
      bio,
      availability,
    } = req.body

    const user = await User.findById(doctor.user)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Doctor account not found',
      })
    }

    if (email) {
      const normalizedEmail = email.trim().toLowerCase()

      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      })

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'This email is already in use',
        })
      }

      user.email = normalizedEmail
    }

    if (name !== undefined) user.name = name.trim()
    if (phone !== undefined) user.phone = phone

    await user.save()

    if (specialization !== undefined) doctor.specialization = specialization
    if (qualification !== undefined) doctor.qualification = qualification
    if (department !== undefined) doctor.department = department
    if (licenseNumber !== undefined) doctor.licenseNumber = licenseNumber
    if (bio !== undefined) doctor.bio = bio

    if (experience !== undefined) {
      if (!Number.isFinite(Number(experience)) || Number(experience) < 0) {
        return res.status(400).json({
          success: false,
          message: 'Experience must be a valid non-negative number',
        })
      }

      doctor.experience = Number(experience)
    }

    if (consultationFee !== undefined) {
      if (
        !Number.isFinite(Number(consultationFee)) ||
        Number(consultationFee) < 0
      ) {
        return res.status(400).json({
          success: false,
          message: 'Consultation fee must be a valid non-negative number',
        })
      }

      doctor.consultationFee = Number(consultationFee)
    }

    if (availability !== undefined) {
      if (!['Available', 'Unavailable'].includes(availability)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid availability status',
        })
      }

      doctor.availability = availability
    }

    await doctor.save()

    const updatedDoctor = await Doctor.findById(doctor._id)
      .populate('user', 'name email phone isActive')

    res.status(200).json({
      success: true,
      message: 'Doctor updated successfully',
      doctor: updatedDoctor,
    })
  } catch (error) {
    console.error('Update doctor error:', error.message)

    res.status(500).json({
      success: false,
      message: 'Failed to update doctor',
    })
  }
}

// Delete Doctor
const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      })
    }

    await User.findByIdAndDelete(doctor.user)
    await Doctor.findByIdAndDelete(doctor._id)

    res.status(200).json({
      success: true,
      message: 'Doctor deleted successfully',
    })
  } catch (error) {
    console.error('Delete doctor error:', error.message)

    res.status(500).json({
      success: false,
      message: 'Failed to delete doctor',
    })
  }
}

module.exports = {
  getAdminDashboard,
  createDoctor,
  getAllDoctors,
  updateDoctor,
  deleteDoctor,
}
