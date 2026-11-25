
const mongoose = require('mongoose')
const Prescription = require('../models/Prescription')
const Appointment = require('../models/Appointment')
const Doctor = require('../models/Doctor')
const Patient = require('../models/Patient')

// Populate prescription details
const populatePrescription = (query) => {
    return query
        .populate({
            path: 'patient',
            populate: {
                path: 'user',
                select: 'name email phone',
            },
        })
        .populate({
            path: 'doctor',
            populate: {
                path: 'user',
                select: 'name email phone',
            },
        })
        .populate({
            path: 'appointment',
            select: 'appointmentDate appointmentTime reason status',
        })
}

// Get all prescriptions
const getAllPrescriptions = async (req, res) => {
    try {
        let filter = {}

        // Doctor can only view their own prescriptions
        if (req.user.role === 'doctor') {
            const doctor = await Doctor.findOne({
                user: req.user._id,
            })

            if (!doctor) {
                return res.status(404).json({
                    success: false,
                    message: 'Doctor profile not found',
                })
            }

            filter.doctor = doctor._id
        }

        const prescriptions = await populatePrescription(
            Prescription.find(filter)
        ).sort({ prescriptionDate: -1 })

        res.status(200).json({
            success: true,
            count: prescriptions.length,
            prescriptions,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch prescriptions',
            error: error.message,
        })
    }
}

// Create prescription
const createPrescription = async (req, res) => {
    try {
        const {
            appointment,
            patient,
            diagnosis,
            symptoms,
            medicines,
            advice,
            notes,
            followUpDate,
        } = req.body

        if (!appointment || !patient || !diagnosis || !medicines) {
            return res.status(400).json({
                success: false,
                message: 'Please provide appointment, patient, diagnosis and medicines',
            })
        }

        if (
            !mongoose.Types.ObjectId.isValid(appointment) ||
            !mongoose.Types.ObjectId.isValid(patient)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid appointment or patient ID',
            })
        }

        if (!Array.isArray(medicines) || medicines.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one medicine is required',
            })
        }

        const appointmentExists = await Appointment.findById(appointment)

        if (!appointmentExists) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found',
            })
        }

        if (appointmentExists.patient.toString() !== patient) {
            return res.status(400).json({
                success: false,
                message: 'Patient does not match the selected appointment',
            })
        }

        if (appointmentExists.status === 'Cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Cannot create prescription for a cancelled appointment',
            })
        }

        const patientExists = await Patient.findById(patient)

        if (!patientExists) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            })
        }

        // Identify doctor from authenticated account
        let doctorId

        if (req.user.role === 'doctor') {
            const doctor = await Doctor.findOne({
                user: req.user._id,
            })

            if (!doctor) {
                return res.status(404).json({
                    success: false,
                    message: 'Doctor profile not found',
                })
            }

            if (appointmentExists.doctor.toString() !== doctor._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only prescribe for your own appointments',
                })
            }

            doctorId = doctor._id
        } else {
            doctorId = appointmentExists.doctor
        }

        const existingPrescription = await Prescription.findOne({
            appointment,
        })

        if (existingPrescription) {
            return res.status(409).json({
                success: false,
                message: 'A prescription already exists for this appointment',
            })
        }

        const prescription = await Prescription.create({
            appointment,
            patient,
            doctor: doctorId,
            diagnosis,
            symptoms,
            medicines,
            advice,
            notes,
            followUpDate: followUpDate || null,
        })

        const populatedPrescription = await populatePrescription(
            Prescription.findById(prescription._id)
        )

        res.status(201).json({
            success: true,
            message: 'Prescription created successfully',
            prescription: populatedPrescription,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create prescription',
            error: error.message,
        })
    }
}

// Update prescription
const updatePrescription = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid prescription ID',
            })
        }

        const prescription = await Prescription.findById(id)

        if (!prescription) {
            return res.status(404).json({
                success: false,
                message: 'Prescription not found',
            })
        }

        // Doctor can only update their own prescriptions
        if (req.user.role === 'doctor') {
            const doctor = await Doctor.findOne({
                user: req.user._id,
            })

            if (
                !doctor ||
                prescription.doctor.toString() !== doctor._id.toString()
            ) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only update your own prescriptions',
                })
            }
        }

        const {
            diagnosis,
            symptoms,
            medicines,
            advice,
            notes,
            followUpDate,
        } = req.body

        if (diagnosis !== undefined) {
            if (typeof diagnosis !== 'string' || !diagnosis.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Diagnosis cannot be empty',
                })
            }

            prescription.diagnosis = diagnosis
        }

        if (symptoms !== undefined) prescription.symptoms = symptoms

        if (medicines !== undefined) {
            if (!Array.isArray(medicines) || medicines.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'At least one medicine is required',
                })
            }

            prescription.medicines = medicines
        }

        if (advice !== undefined) prescription.advice = advice
        if (notes !== undefined) prescription.notes = notes

        if (followUpDate !== undefined) {
            prescription.followUpDate = followUpDate || null
        }

        await prescription.save()

        const updatedPrescription = await populatePrescription(
            Prescription.findById(id)
        )

        res.status(200).json({
            success: true,
            message: 'Prescription updated successfully',
            prescription: updatedPrescription,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update prescription',
            error: error.message,
        })
    }
}

// Delete prescription (Admin only)
const deletePrescription = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid prescription ID',
            })
        }

        const prescription = await Prescription.findById(id)

        if (!prescription) {
            return res.status(404).json({
                success: false,
                message: 'Prescription not found',
            })
        }

        await prescription.deleteOne()

        res.status(200).json({
            success: true,
            message: 'Prescription deleted successfully',
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete prescription',
            error: error.message,
        })
    }
}


// Get appointments available for prescriptions
const getPrescriptionAppointments = async (req, res) => {
    try {
        let filter = {
            status: { $ne: 'Cancelled' },
        }

        // Doctor can only see their own appointments
        if (req.user.role === 'doctor') {
            const doctor = await Doctor.findOne({
                user: req.user._id,
            })

            if (!doctor) {
                return res.status(404).json({
                    success: false,
                    message: 'Doctor profile not found',
                })
            }

            filter.doctor = doctor._id
        }

        // Exclude appointments that already have prescriptions
        const existingPrescriptions = await Prescription.find()
            .select('appointment')

        const prescribedAppointmentIds = existingPrescriptions.map(
            (item) => item.appointment
        )

        filter._id = { $nin: prescribedAppointmentIds }

        const appointments = await Appointment.find(filter)
            .populate({
                path: 'patient',
                populate: {
                    path: 'user',
                    select: 'name email phone',
                },
            })
            .populate({
                path: 'doctor',
                populate: {
                    path: 'user',
                    select: 'name email phone',
                },
            })
            .sort({ appointmentDate: -1 })

        res.status(200).json({
            success: true,
            count: appointments.length,
            appointments,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch prescription appointments',
            error: error.message,
        })
    }
}



module.exports = {
    getAllPrescriptions,
    getPrescriptionAppointments,
    createPrescription,
    updatePrescription,
    deletePrescription,
}

