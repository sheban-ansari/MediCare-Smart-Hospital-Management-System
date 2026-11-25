
require('dotenv').config()

const mongoose = require('mongoose')
const User = require('../models/User')

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)

    console.log('MongoDB Connected')

    const name = process.env.ADMIN_NAME
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
    const password = process.env.ADMIN_PASSWORD

    if (!name || !email || !password) {
      throw new Error('Please provide ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in .env')
    }

    if (password.length < 8) {
      throw new Error('Admin password must be at least 8 characters')
    }

    const existingAdmin = await User.findOne({ email })

    if (existingAdmin) {
      console.log('A user with this email already exists.')
      return
    }

    const admin = await User.create({
      name,
      email,
      password,
      role: 'admin',
    })

    console.log('Admin account created successfully!')
    console.log(`Admin Email: ${admin.email}`)
  } catch (error) {
    console.error('Admin creation failed:', error.message)
    process.exitCode = 1
  } finally {
    await mongoose.disconnect()
  }
}

createAdmin()
