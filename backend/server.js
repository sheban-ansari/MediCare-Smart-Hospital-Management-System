
const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')

const connectDB = require('./config/db')

const authRoutes = require('./routes/authRoutes')
const adminRoutes = require('./routes/adminRoutes')
const patientRoutes = require('./routes/patientRoutes')
const appointmentRoutes = require('./routes/appointmentRoutes')
const receptionistRoutes = require('./routes/receptionistRoutes')
const prescriptionRoutes = require('./routes/prescriptionRoutes')
const medicalRecordRoutes = require('./routes/medicalRecordRoutes')
const billRoutes = require('./routes/billRoutes')
const reportRoutes = require('./routes/reportRoutes')
const hospitalSettingsRoutes = require('./routes/hospitalSettingsRoutes')

dotenv.config()

const app = express()

// Middleware
app.use(
  cors({
    origin: 'http://localhost:5173',
  })
)

app.use(express.json())

// Connect MongoDB
connectDB()

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/patients', patientRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/receptionists', receptionistRoutes)
app.use('/api/prescriptions', prescriptionRoutes)
app.use('/api/medical-records', medicalRecordRoutes)
app.use('/api/bills', billRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/hospital-settings', hospitalSettingsRoutes)

// Default Route
app.get('/', (req, res) => {
  res.send('MediCare Backend API is running!')
})

// Server
const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
