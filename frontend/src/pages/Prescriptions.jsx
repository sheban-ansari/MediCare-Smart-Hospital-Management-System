
import { useEffect, useMemo, useState } from 'react'
import {
    ArrowLeft,
    FileText,
    Plus,
    Search,
    RefreshCw,
    Eye,
    Download,
    Edit,
    Trash2,
    X,
    Pill,
    CalendarDays,
    ClipboardList,
    Activity,
    LoaderCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import API from '../services/api'
import { useAuth } from '../context/AuthContext'

const emptyMedicine = () => ({
    medicineName: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
})

const emptyForm = () => ({
    appointment: '',
    patient: '',
    diagnosis: '',
    symptoms: '',
    medicines: [emptyMedicine()],
    advice: '',
    notes: '',
    followUpDate: '',
})

const formatDate = (date) => {
    if (!date) return 'Not scheduled'

    return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

const getPatientName = (prescription) =>
    prescription?.patient?.user?.name || 'Unknown Patient'

const getDoctorName = (prescription) =>
    prescription?.doctor?.user?.name || 'Unknown Doctor'

function Prescriptions() {
    const navigate = useNavigate()
    const { user } = useAuth()

    const isAdmin = user?.role === 'admin'

    const [prescriptions, setPrescriptions] = useState([])
    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [search, setSearch] = useState('')
    const [modal, setModal] = useState('')
    const [selectedPrescription, setSelectedPrescription] = useState(null)
    const [form, setForm] = useState(emptyForm())

    // Fetch prescriptions and appointments
    const fetchData = async () => {
        try {
            setLoading(true)

            const [prescriptionResponse, appointmentResponse] =
                await Promise.all([
                    API.get('/prescriptions'),
                    API.get('/prescriptions/appointments'),
                ])

            setPrescriptions(
                prescriptionResponse.data.prescriptions || []
            )

            setAppointments(
                appointmentResponse.data.appointments || []
            )
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                'Failed to load prescriptions'
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    // Search prescriptions
    const filteredPrescriptions = useMemo(() => {
        const searchValue = search.toLowerCase().trim()

        if (!searchValue) return prescriptions

        return prescriptions.filter((item) => {
            const patient = getPatientName(item).toLowerCase()
            const doctor = getDoctorName(item).toLowerCase()
            const diagnosis = (item.diagnosis || '').toLowerCase()
            const appointmentReason = (
                item.appointment?.reason || ''
            ).toLowerCase()

            return (
                patient.includes(searchValue) ||
                doctor.includes(searchValue) ||
                diagnosis.includes(searchValue) ||
                appointmentReason.includes(searchValue)
            )
        })
    }, [prescriptions, search])

    const updateField = (name, value) => {
        setForm((previous) => ({
            ...previous,
            [name]: value,
        }))
    }

    const handleAppointmentChange = (appointmentId) => {
        const selected = appointments.find(
            (item) => item._id === appointmentId
        )

        setForm((previous) => ({
            ...previous,
            appointment: appointmentId,
            patient: selected?.patient?._id || '',
        }))
    }

    const updateMedicine = (index, field, value) => {
        setForm((previous) => {
            const medicines = [...previous.medicines]

            medicines[index] = {
                ...medicines[index],
                [field]: value,
            }

            return {
                ...previous,
                medicines,
            }
        })
    }

    const addMedicine = () => {
        setForm((previous) => ({
            ...previous,
            medicines: [...previous.medicines, emptyMedicine()],
        }))
    }

    const removeMedicine = (index) => {
        setForm((previous) => ({
            ...previous,
            medicines: previous.medicines.filter(
                (_, medicineIndex) => medicineIndex !== index
            ),
        }))
    }

    const openCreateModal = () => {
        setSelectedPrescription(null)
        setForm(emptyForm())
        setModal('form')
    }

    const openEditModal = (prescription) => {
        setSelectedPrescription(prescription)

        setForm({
            appointment: prescription.appointment?._id || '',
            patient: prescription.patient?._id || '',
            diagnosis: prescription.diagnosis || '',
            symptoms: prescription.symptoms || '',
            medicines: prescription.medicines?.length
                ? prescription.medicines.map((medicine) => ({
                    medicineName: medicine.medicineName || '',
                    dosage: medicine.dosage || '',
                    frequency: medicine.frequency || '',
                    duration: medicine.duration || '',
                    instructions: medicine.instructions || '',
                }))
                : [emptyMedicine()],
            advice: prescription.advice || '',
            notes: prescription.notes || '',
            followUpDate: prescription.followUpDate
                ? new Date(prescription.followUpDate)
                    .toISOString()
                    .split('T')[0]
                : '',
        })

        setModal('form')
    }

    const closeModal = () => {
        if (saving) return

        setModal('')
        setSelectedPrescription(null)
    }

    // Create or update prescription
    const handleSubmit = async (event) => {
        event.preventDefault()

        if (!form.appointment && !selectedPrescription) {
            toast.error('Please select an appointment')
            return
        }

        if (!form.diagnosis.trim()) {
            toast.error('Please enter diagnosis')
            return
        }

        const invalidMedicine = form.medicines.some(
            (medicine) =>
                !medicine.medicineName.trim() ||
                !medicine.dosage.trim() ||
                !medicine.frequency.trim() ||
                !medicine.duration.trim()
        )

        if (invalidMedicine) {
            toast.error('Please complete all required medicine fields')
            return
        }

        const payload = {
            appointment: form.appointment,
            patient: form.patient,
            diagnosis: form.diagnosis.trim(),
            symptoms: form.symptoms,
            medicines: form.medicines,
            advice: form.advice,
            notes: form.notes,
            followUpDate: form.followUpDate || null,
        }

        try {
            setSaving(true)

            if (selectedPrescription) {
                await API.put(
                    `/prescriptions/${selectedPrescription._id}`,
                    payload
                )

                toast.success('Prescription updated successfully')
            } else {
                await API.post('/prescriptions', payload)
                toast.success('Prescription created successfully')
            }

            setModal('')
            setSelectedPrescription(null)
            setForm(emptyForm())

            await fetchData()
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                'Failed to save prescription'
            )
        } finally {
            setSaving(false)
        }
    }

    // Delete prescription
    const handleDelete = async (prescription) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete the prescription for ${getPatientName(prescription)}?`
        )

        if (!confirmed) return

        try {
            await API.delete(`/prescriptions/${prescription._id}`)
            toast.success('Prescription deleted successfully')
            await fetchData()
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                'Failed to delete prescription'
            )
        }
    }

    // Download prescription as printable PDF
    const handleDownloadPrescription = (prescription) => {
        if (!prescription) {
            toast.error('Prescription details not found')
            return
        }

        const escapeHTML = (value) => {
            return String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;')
        }

        const patientName = getPatientName(prescription)
        const doctorName = getDoctorName(prescription)

        const medicinesHTML = (prescription.medicines || [])
            .map((medicine, index) => `
                <tr>
                    <td>${index + 1}. ${escapeHTML(medicine.medicineName)}</td>
                    <td>${escapeHTML(medicine.dosage)}</td>
                    <td>${escapeHTML(medicine.frequency)}</td>
                    <td>${escapeHTML(medicine.duration)}</td>
                    <td>${escapeHTML(medicine.instructions || 'N/A')}</td>
                </tr>
            `)
            .join('')

        const printWindow = window.open(
            '',
            '_blank',
            'width=900,height=700'
        )

        if (!printWindow) {
            toast.error('Please allow pop-ups to download the prescription')
            return
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>MediCare Prescription</title>

                <style>
                    * {
                        box-sizing: border-box;
                    }

                    body {
                        font-family: Arial, sans-serif;
                        color: #1e293b;
                        padding: 35px;
                        line-height: 1.6;
                    }

                    .header {
                        text-align: center;
                        border-bottom: 3px solid #2563eb;
                        padding-bottom: 18px;
                        margin-bottom: 25px;
                    }

                    .header h1 {
                        color: #2563eb;
                        margin: 0;
                        font-size: 30px;
                    }

                    .header p {
                        margin: 4px 0;
                        color: #64748b;
                    }

                    h2 {
                        font-size: 17px;
                        color: #1e40af;
                        margin-bottom: 10px;
                    }

                    .details {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 15px;
                        margin-bottom: 25px;
                    }

                    .detail-box {
                        background: #f1f5f9;
                        padding: 15px;
                        border-radius: 8px;
                    }

                    .detail-box p {
                        margin: 5px 0;
                    }

                    .section {
                        margin-top: 22px;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 12px;
                        font-size: 12px;
                    }

                    th, td {
                        border: 1px solid #cbd5e1;
                        padding: 10px;
                        text-align: left;
                    }

                    th {
                        background: #eff6ff;
                        color: #1e40af;
                    }

                    .text-box {
                        background: #f8fafc;
                        padding: 12px;
                        border-radius: 6px;
                        white-space: pre-wrap;
                    }

                    .footer {
                        margin-top: 45px;
                        border-top: 1px solid #cbd5e1;
                        padding-top: 15px;
                        text-align: center;
                        color: #64748b;
                        font-size: 12px;
                    }

                    @media print {
                        body {
                            padding: 10px;
                        }
                    }
                </style>
            </head>

            <body>
                <div class="header">
                    <h1>MediCare</h1>
                    <p>Smart Hospital Management System</p>
                    <p>Medical Prescription</p>
                </div>

                <div class="details">
                    <div class="detail-box">
                        <h2>Patient Details</h2>
                        <p><strong>Name:</strong> ${escapeHTML(patientName)}</p>
                        <p><strong>Phone:</strong> ${escapeHTML(prescription.patient?.user?.phone || 'N/A')}</p>
                    </div>

                    <div class="detail-box">
                        <h2>Doctor Details</h2>
                        <p><strong>Name:</strong> ${escapeHTML(doctorName)}</p>
                        <p><strong>Specialization:</strong> ${escapeHTML(prescription.doctor?.specialization || 'Doctor')}</p>
                    </div>
                </div>

                <div class="section">
                    <h2>Appointment Information</h2>
                    <p><strong>Prescription Date:</strong> ${escapeHTML(formatDate(prescription.prescriptionDate))}</p>
                    <p><strong>Follow-up Date:</strong> ${escapeHTML(formatDate(prescription.followUpDate))}</p>
                    <p><strong>Appointment:</strong> ${escapeHTML(formatDate(prescription.appointment?.appointmentDate))} at ${escapeHTML(prescription.appointment?.appointmentTime || 'N/A')}</p>
                </div>

                <div class="section">
                    <h2>Diagnosis</h2>
                    <div class="text-box">${escapeHTML(prescription.diagnosis || 'N/A')}</div>
                </div>

                ${prescription.symptoms ? `
                    <div class="section">
                        <h2>Symptoms</h2>
                        <div class="text-box">${escapeHTML(prescription.symptoms)}</div>
                    </div>
                ` : ''}

                <div class="section">
                    <h2>Prescribed Medicines</h2>

                    <table>
                        <thead>
                            <tr>
                                <th>Medicine</th>
                                <th>Dosage</th>
                                <th>Frequency</th>
                                <th>Duration</th>
                                <th>Instructions</th>
                            </tr>
                        </thead>

                        <tbody>
                            ${medicinesHTML || '<tr><td colspan="5">No medicines recorded</td></tr>'}
                        </tbody>
                    </table>
                </div>

                ${prescription.advice ? `
                    <div class="section">
                        <h2>Medical Advice</h2>
                        <div class="text-box">${escapeHTML(prescription.advice)}</div>
                    </div>
                ` : ''}

                ${prescription.notes ? `
                    <div class="section">
                        <h2>Additional Notes</h2>
                        <div class="text-box">${escapeHTML(prescription.notes)}</div>
                    </div>
                ` : ''}

                <div class="footer">
                    <p><strong>MediCare – Smart Hospital Management System</strong></p>
                    <p>Designed for better healthcare.</p>
                </div>

                <script>
                    window.onload = function () {
                        window.focus()
                        window.print()
                    }
                </script>
            </body>
            </html>
        `)

        printWindow.document.close()
    }

    const openViewModal = (prescription) => {
        setSelectedPrescription(prescription)
        setModal('view')
    }

    const stats = [
        {
            label: 'Total Prescriptions',
            value: prescriptions.length,
            icon: FileText,
            color: 'blue',
        },
        {
            label: 'Available Appointments',
            value: appointments.length,
            icon: CalendarDays,
            color: 'emerald',
        },
        {
            label: 'Total Medicines',
            value: prescriptions.reduce(
                (total, item) =>
                    total + (item.medicines?.length || 0),
                0
            ),
            icon: Pill,
            color: 'violet',
        },
    ]

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
                    <div>
                        <button
                            onClick={() => navigate('/')}
                            className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                            <ArrowLeft size={17} />
                            Back to Dashboard
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 text-blue-700 p-3 rounded-xl">
                                <FileText size={25} />
                            </div>

                            <div>
                                <p className="text-sm text-slate-500">
                                    Hospital Management / Prescriptions
                                </p>
                                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                                    Prescriptions Management
                                </h1>
                            </div>
                        </div>

                        <p className="text-slate-500 mt-2">
                            Create and manage patient medical prescriptions.
                        </p>
                    </div>

                    <button
                        onClick={openCreateModal}
                        disabled={appointments.length === 0}
                        className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-5 py-3 rounded-xl font-semibold shadow-sm"
                    >
                        <Plus size={19} />
                        New Prescription
                    </button>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                    {stats.map((stat) => {
                        const Icon = stat.icon

                        const colorClasses = {
                            blue: 'bg-blue-100 text-blue-600',
                            emerald: 'bg-emerald-100 text-emerald-600',
                            violet: 'bg-violet-100 text-violet-600',
                        }

                        return (
                            <div
                                key={stat.label}
                                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-500">
                                            {stat.label}
                                        </p>
                                        <h2 className="text-3xl font-bold text-slate-800 mt-2">
                                            {stat.value}
                                        </h2>
                                    </div>

                                    <div className={`p-3 rounded-xl ${colorClasses[stat.color]}`}>
                                        <Icon size={23} />
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Prescriptions List */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-5 sm:p-6 border-b border-slate-200">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                    All Prescriptions
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">
                                    View and manage prescription records.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative">
                                    <Search
                                        size={18}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                    <input
                                        type="text"
                                        placeholder="Search prescriptions..."
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        className="w-full sm:w-64 pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                    />
                                </div>

                                <button
                                    onClick={fetchData}
                                    disabled={loading}
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                                >
                                    <RefreshCw
                                        size={17}
                                        className={loading ? 'animate-spin' : ''}
                                    />
                                    Refresh
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-6 py-4">Patient</th>
                                    <th className="px-6 py-4">Doctor</th>
                                    <th className="px-6 py-4">Diagnosis</th>
                                    <th className="px-6 py-4">Medicines</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="py-16 text-center">
                                            <LoaderCircle
                                                className="animate-spin text-blue-600 mx-auto mb-3"
                                                size={30}
                                            />
                                            <p className="text-slate-500">
                                                Loading prescriptions...
                                            </p>
                                        </td>
                                    </tr>
                                ) : filteredPrescriptions.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-16 text-center">
                                            <FileText
                                                size={40}
                                                className="text-slate-300 mx-auto mb-3"
                                            />
                                            <p className="font-semibold text-slate-700">
                                                No prescriptions found
                                            </p>
                                            <p className="text-sm text-slate-500 mt-1">
                                                {search
                                                    ? 'Try a different search term.'
                                                    : 'Create your first prescription to get started.'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPrescriptions.map((prescription) => (
                                        <tr
                                            key={prescription._id}
                                            className="hover:bg-slate-50"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                                                        {getPatientName(prescription)
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>

                                                    <div>
                                                        <p className="font-semibold text-slate-800 whitespace-nowrap">
                                                            {getPatientName(prescription)}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {prescription.patient?.user?.phone || 'No phone'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">
                                                {getDoctorName(prescription)}
                                            </td>

                                            <td className="px-6 py-4">
                                                <p className="text-sm font-medium text-slate-800 max-w-48 truncate">
                                                    {prescription.diagnosis}
                                                </p>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
                                                    <Pill size={13} />
                                                    {prescription.medicines?.length || 0}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                                                {formatDate(prescription.prescriptionDate)}
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => openViewModal(prescription)}
                                                        title="View"
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                    >
                                                        <Eye size={17} />
                                                    </button>

                                                    <button
                                                        onClick={() => openEditModal(prescription)}
                                                        title="Edit"
                                                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                                    >
                                                        <Edit size={17} />
                                                    </button>

                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => handleDelete(prescription)}
                                                            title="Delete"
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                        >
                                                            <Trash2 size={17} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-6 py-4 border-t border-slate-100 text-sm text-slate-500">
                        Showing {filteredPrescriptions.length} of {prescriptions.length} prescriptions
                    </div>
                </div>
            </div>

            {/* Create / Edit Modal */}
            {modal === 'form' && (
                <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-3 sm:p-6">
                    <div className="bg-white w-full max-w-4xl max-h-[94vh] overflow-y-auto rounded-2xl shadow-2xl">
                        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    {selectedPrescription
                                        ? 'Edit Prescription'
                                        : 'Create New Prescription'}
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">
                                    Enter patient diagnosis and medication details.
                                </p>
                            </div>

                            <button
                                onClick={closeModal}
                                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                            >
                                <X size={21} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">

                            {/* Appointment Details */}
                            <section>
                                <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
                                    <CalendarDays size={18} className="text-blue-600" />
                                    Appointment Details
                                </h3>

                                {!selectedPrescription ? (
                                    <select
                                        required
                                        value={form.appointment}
                                        onChange={(event) =>
                                            handleAppointmentChange(event.target.value)
                                        }
                                        className="w-full px-4 py-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                    >
                                        <option value="">Select Appointment</option>

                                        {appointments.map((appointment) => (
                                            <option
                                                key={appointment._id}
                                                value={appointment._id}
                                            >
                                                {appointment.patient?.user?.name || 'Patient'} — {appointment.doctor?.user?.name || 'Doctor'} — {formatDate(appointment.appointmentDate)} ({appointment.appointmentTime})
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700">
                                        <p>
                                            <strong>Patient:</strong>{' '}
                                            {form.patient
                                                ? getPatientName(selectedPrescription)
                                                : 'Patient'}
                                        </p>
                                        <p className="mt-1">
                                            <strong>Appointment:</strong>{' '}
                                            {formatDate(selectedPrescription.appointment?.appointmentDate)}
                                        </p>
                                    </div>
                                )}

                                {form.appointment && (
                                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {(() => {
                                            const selected = appointments.find(
                                                (item) => item._id === form.appointment
                                            )

                                            const patientName =
                                                selected?.patient?.user?.name ||
                                                getPatientName(selectedPrescription)

                                            const doctorName =
                                                selected?.doctor?.user?.name ||
                                                getDoctorName(selectedPrescription)

                                            return (
                                                <>
                                                    <div className="p-3 rounded-lg bg-blue-50 text-sm">
                                                        <p className="text-blue-600 text-xs mb-1">Patient</p>
                                                        <p className="font-semibold text-slate-800">
                                                            {patientName}
                                                        </p>
                                                    </div>

                                                    <div className="p-3 rounded-lg bg-emerald-50 text-sm">
                                                        <p className="text-emerald-600 text-xs mb-1">Doctor</p>
                                                        <p className="font-semibold text-slate-800">
                                                            {doctorName}
                                                        </p>
                                                    </div>
                                                </>
                                            )
                                        })()}
                                    </div>
                                )}
                            </section>

                            {/* Diagnosis */}
                            <section>
                                <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
                                    <Activity size={18} className="text-blue-600" />
                                    Medical Assessment
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Diagnosis *
                                        </label>
                                        <input
                                            required
                                            value={form.diagnosis}
                                            onChange={(event) =>
                                                updateField('diagnosis', event.target.value)
                                            }
                                            placeholder="Enter diagnosis"
                                            className="w-full px-4 py-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Symptoms
                                        </label>
                                        <textarea
                                            rows="3"
                                            value={form.symptoms}
                                            onChange={(event) =>
                                                updateField('symptoms', event.target.value)
                                            }
                                            placeholder="Describe patient symptoms..."
                                            className="w-full px-4 py-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 resize-y"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Medicines */}
                            <section>
                                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                        <Pill size={18} className="text-violet-600" />
                                        Medicines
                                    </h3>

                                    <button
                                        type="button"
                                        onClick={addMedicine}
                                        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                                    >
                                        <Plus size={16} />
                                        Add Medicine
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {form.medicines.map((medicine, index) => (
                                        <div
                                            key={index}
                                            className="border border-slate-200 rounded-xl p-4"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <p className="font-semibold text-slate-700">
                                                    Medicine {index + 1}
                                                </p>

                                                {form.medicines.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeMedicine(index)}
                                                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {[
                                                    ['medicineName', 'Medicine Name', 'e.g. Paracetamol'],
                                                    ['dosage', 'Dosage', 'e.g. 500 mg'],
                                                    ['frequency', 'Frequency', 'e.g. Twice daily'],
                                                    ['duration', 'Duration', 'e.g. 5 days'],
                                                ].map(([field, label, placeholder]) => (
                                                    <div key={field}>
                                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                                            {label} *
                                                        </label>

                                                        <input
                                                            required
                                                            value={medicine[field]}
                                                            onChange={(event) =>
                                                                updateMedicine(
                                                                    index,
                                                                    field,
                                                                    event.target.value
                                                                )
                                                            }
                                                            placeholder={placeholder}
                                                            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                                        />
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-4">
                                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                                    Instructions
                                                </label>

                                                <input
                                                    value={medicine.instructions}
                                                    onChange={(event) =>
                                                        updateMedicine(
                                                            index,
                                                            'instructions',
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder="e.g. Take after food"
                                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Additional Instructions */}
                            <section>
                                <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
                                    <ClipboardList size={18} className="text-blue-600" />
                                    Additional Instructions
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Medical Advice
                                        </label>

                                        <textarea
                                            rows="3"
                                            value={form.advice}
                                            onChange={(event) =>
                                                updateField('advice', event.target.value)
                                            }
                                            placeholder="Enter medical advice..."
                                            className="w-full px-4 py-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 resize-y"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Additional Notes
                                        </label>

                                        <textarea
                                            rows="2"
                                            value={form.notes}
                                            onChange={(event) =>
                                                updateField('notes', event.target.value)
                                            }
                                            placeholder="Enter additional notes..."
                                            className="w-full px-4 py-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 resize-y"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Follow-up Date
                                        </label>

                                        <input
                                            type="date"
                                            min={new Date().toISOString().split('T')[0]}
                                            value={form.followUpDate}
                                            onChange={(event) =>
                                                updateField('followUpDate', event.target.value)
                                            }
                                            className="w-full sm:w-1/2 px-4 py-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            </section>

                            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-slate-200 pt-5">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={saving}
                                    className="px-5 py-3 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold"
                                >
                                    {saving && (
                                        <LoaderCircle size={17} className="animate-spin" />
                                    )}

                                    {selectedPrescription
                                        ? 'Update Prescription'
                                        : 'Create Prescription'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Prescription Modal */}
            {modal === 'view' && selectedPrescription && (
                <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-3 sm:p-6">
                    <div className="bg-white w-full max-w-3xl max-h-[94vh] overflow-y-auto rounded-2xl shadow-2xl">
                        <div className="flex items-center justify-between p-5 border-b border-slate-200">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    Prescription Details
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">
                                    Medical prescription record
                                </p>
                            </div>

                            <button
                                onClick={closeModal}
                                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
                            >
                                <X size={21} />
                            </button>
                        </div>

                        <div className="p-5 sm:p-6 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-blue-50 rounded-xl p-4">
                                    <p className="text-xs text-blue-600 mb-1">Patient</p>
                                    <p className="font-bold text-slate-800">
                                        {getPatientName(selectedPrescription)}
                                    </p>
                                    <p className="text-sm text-slate-600 mt-1">
                                        {selectedPrescription.patient?.user?.phone || 'No phone'}
                                    </p>
                                </div>

                                <div className="bg-emerald-50 rounded-xl p-4">
                                    <p className="text-xs text-emerald-600 mb-1">Doctor</p>
                                    <p className="font-bold text-slate-800">
                                        {getDoctorName(selectedPrescription)}
                                    </p>
                                    <p className="text-sm text-slate-600 mt-1">
                                        {selectedPrescription.doctor?.specialization || 'Doctor'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <p>
                                    <strong>Prescription Date:</strong>{' '}
                                    {formatDate(selectedPrescription.prescriptionDate)}
                                </p>

                                <p>
                                    <strong>Follow-up Date:</strong>{' '}
                                    {formatDate(selectedPrescription.followUpDate)}
                                </p>

                                <p className="sm:col-span-2">
                                    <strong>Appointment:</strong>{' '}
                                    {formatDate(selectedPrescription.appointment?.appointmentDate)}
                                    {' '}at{' '}
                                    {selectedPrescription.appointment?.appointmentTime || 'N/A'}
                                </p>
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-800 mb-2">
                                    Diagnosis
                                </h3>
                                <p className="text-slate-600 bg-slate-50 rounded-lg p-3">
                                    {selectedPrescription.diagnosis}
                                </p>
                            </div>

                            {selectedPrescription.symptoms && (
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-2">
                                        Symptoms
                                    </h3>
                                    <p className="text-slate-600 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">
                                        {selectedPrescription.symptoms}
                                    </p>
                                </div>
                            )}

                            <div>
                                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
                                    <Pill size={18} className="text-violet-600" />
                                    Prescribed Medicines
                                </h3>

                                <div className="space-y-3">
                                    {selectedPrescription.medicines?.map(
                                        (medicine, index) => (
                                            <div
                                                key={medicine._id || index}
                                                className="border border-slate-200 rounded-xl p-4"
                                            >
                                                <p className="font-bold text-slate-800">
                                                    {index + 1}. {medicine.medicineName}
                                                </p>

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-sm">
                                                    <p>
                                                        <span className="text-slate-500">Dosage:</span>{' '}
                                                        {medicine.dosage}
                                                    </p>
                                                    <p>
                                                        <span className="text-slate-500">Frequency:</span>{' '}
                                                        {medicine.frequency}
                                                    </p>
                                                    <p>
                                                        <span className="text-slate-500">Duration:</span>{' '}
                                                        {medicine.duration}
                                                    </p>
                                                </div>

                                                {medicine.instructions && (
                                                    <p className="text-sm text-slate-600 mt-3">
                                                        <strong>Instructions:</strong>{' '}
                                                        {medicine.instructions}
                                                    </p>
                                                )}
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>

                            {selectedPrescription.advice && (
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-2">
                                        Medical Advice
                                    </h3>
                                    <p className="text-slate-600 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">
                                        {selectedPrescription.advice}
                                    </p>
                                </div>
                            )}

                            {selectedPrescription.notes && (
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-2">
                                        Additional Notes
                                    </h3>
                                    <p className="text-slate-600 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">
                                        {selectedPrescription.notes}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Download and Close Buttons */}
                        <div className="p-5 border-t border-slate-200 flex flex-col-reverse sm:flex-row justify-between gap-3">
                            <button
                                onClick={() =>
                                    handleDownloadPrescription(selectedPrescription)
                                }
                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold"
                            >
                                <Download size={17} />
                                Download PDF
                            </button>

                            <button
                                onClick={closeModal}
                                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Prescriptions
