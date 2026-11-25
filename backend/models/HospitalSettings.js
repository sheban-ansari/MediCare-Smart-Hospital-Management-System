
const mongoose = require('mongoose')

const hospitalSettingsSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            default: 'MediCare Hospital',
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: '',
        },
        phone: {
            type: String,
            trim: true,
            default: '',
        },
        address: {
            type: String,
            trim: true,
            default: '',
        },
        preferences: {
            currency: {
                type: String,
                default: 'INR',
            },
            dateFormat: {
                type: String,
                default: 'DD/MM/YYYY',
            },
            language: {
                type: String,
                default: 'English',
            },
        },
    },
    { timestamps: true }
)

const HospitalSettings = mongoose.model(
    'HospitalSettings',
    hospitalSettingsSchema
)

module.exports = HospitalSettings
