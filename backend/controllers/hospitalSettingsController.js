
const HospitalSettings = require('../models/HospitalSettings')

// Get Hospital Settings
const getHospitalSettings = async (req, res) => {
    try {
        let settings = await HospitalSettings.findOne()

        if (!settings) {
            settings = await HospitalSettings.create({
                name: 'MediCare Hospital',
            })
        }

        res.status(200).json({
            success: true,
            settings,
        })
    } catch (error) {
        console.error('Get Hospital Settings Error:', error.message)

        res.status(500).json({
            success: false,
            message: 'Failed to fetch hospital settings',
        })
    }
}

// Update Hospital Settings
const updateHospitalSettings = async (req, res) => {
    try {
        const { name, email, phone, address, preferences } = req.body

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Hospital name is required',
            })
        }

        let settings = await HospitalSettings.findOne()

        if (!settings) {
            settings = new HospitalSettings()
        }

        settings.name = name.trim()
        settings.email = email ? email.trim().toLowerCase() : ''
        settings.phone = phone ? phone.trim() : ''
        settings.address = address ? address.trim() : ''
        if (preferences) {
            settings.preferences = {
                currency: preferences.currency || 'INR',
                dateFormat: preferences.dateFormat || 'DD/MM/YYYY',
                language: preferences.language || 'English',
            }
        }

        await settings.save()

        res.status(200).json({
            success: true,
            message: 'Hospital information updated successfully',
            settings,
        })
    } catch (error) {
        console.error('Update Hospital Settings Error:', error.message)

        res.status(500).json({
            success: false,
            message: 'Failed to update hospital settings',
        })
    }
}

module.exports = {
    getHospitalSettings,
    updateHospitalSettings,
}
