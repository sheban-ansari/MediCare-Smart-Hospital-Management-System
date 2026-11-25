
import { useEffect, useState } from 'react'
import {
    ArrowLeft,
    Plus,
    Search,
    RefreshCw,
    Eye,
    Edit,
    Trash2,
    X,
    FileText,
    UserRound,
    Stethoscope,
    CalendarDays,
    ClipboardList,
    Activity,
    LoaderCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import API from '../services/api'
import { useAuth } from '../context/AuthContext'

const initialForm = {
    patient: '',
    doctor: '',
    appointment: '',
    recordType: 'Diagnosis',
    title: '',
    description: '',
    diagnosis: '',
    symptoms: '',
    treatment: '',
    allergies: '',
    reportDate: new Date().toISOString().split('T')[0],
    notes: '',
}

const recordTypes = [
    'Diagnosis',
    'Lab Report',
    'Allergy',
    'Treatment',
    'Medical History',
    'Other',
]

const MedicalRecords = () => {
    const navigate = useNavigate()
    const { user } = useAuth()

    const isDoctor = user?.role === 'doctor'
    const isAdmin = user?.role === 'admin'

    const [records, setRecords] = useState([])
    const [patients, setPatients] = useState([])
    const [doctors, setDoctors] = useState([])
    const [appointments, setAppointments] = useState([])

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('All')

    const [showForm, setShowForm] = useState(false)
    const [showView, setShowView] = useState(false)
    const [editingRecord, setEditingRecord] = useState(null)
    const [selectedRecord, setSelectedRecord] = useState(null)

    const [form, setForm] = useState(initialForm)

    const getPatientName = (record) =>
        record?.patient?.user?.name || 'Unknown Patient'

    const getDoctorName = (record) =>
        record?.doctor?.user?.name || 'Unknown Doctor'

    const getPatientPhone = (record) =>
        record?.patient?.user?.phone || 'N/A'

    const formatDate = (date) => {
        if (!date) return 'N/A'

        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
    }


    const fetchData = async () => {
        try {
            setLoading(true)

            const requests = [
                API.get('/medical-records'),
                API.get('/patients'),
            ]

            if (isAdmin) {
                requests.push(API.get('/admin/doctors'))
            }

            const responses = await Promise.all(requests)

            setRecords(responses[0].data.records || [])
            setPatients(responses[1].data.patients || [])

            if (isAdmin) {
                setDoctors(responses[2].data.doctors || [])
            }
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                'Failed to load medical records'
            )
        } finally {
            setLoading(false)
        }
    }


    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const response = await API.get('/appointments')
                setAppointments(response.data.appointments || [])
            } catch {
                setAppointments([])
            }
        }

        if (isAdmin) {
            fetchAppointments()
        }
    }, [isAdmin])

    const filteredRecords = records.filter((record) => {
        const searchText = search.toLowerCase()

        const matchesSearch =
            getPatientName(record).toLowerCase().includes(searchText) ||
            getDoctorName(record).toLowerCase().includes(searchText) ||
            (record.title || '').toLowerCase().includes(searchText) ||
            (record.diagnosis || '').toLowerCase().includes(searchText)

        const matchesType =
            typeFilter === 'All' || record.recordType === typeFilter

        return matchesSearch && matchesType
    })

    const totalRecords = records.length

    const diagnosisCount = records.filter(
        (record) => record.recordType === 'Diagnosis'
    ).length

    const labReportCount = records.filter(
        (record) => record.recordType === 'Lab Report'
    ).length

    const openCreateModal = () => {
        setEditingRecord(null)
        setSelectedRecord(null)
        setForm(initialForm)
        setShowForm(true)
    }

    const openEditModal = (record) => {
        setEditingRecord(record)

        setForm({
            patient: record.patient?._id || '',
            doctor: record.doctor?._id || '',
            appointment: record.appointment?._id || '',
            recordType: record.recordType || 'Diagnosis',
            title: record.title || '',
            description: record.description || '',
            diagnosis: record.diagnosis || '',
            symptoms: record.symptoms || '',
            treatment: record.treatment || '',
            allergies: record.allergies || '',
            reportDate: record.reportDate
                ? new Date(record.reportDate).toISOString().split('T')[0]
                : '',
            notes: record.notes || '',
        })

        setShowForm(true)
    }

    const openViewModal = (record) => {
        setSelectedRecord(record)
        setShowView(true)
    }

    const handleChange = (e) => {
        const { name, value } = e.target

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }))
    }

    const handleAppointmentChange = (e) => {
        const appointmentId = e.target.value

        const selectedAppointment = appointments.find(
            (item) => item._id === appointmentId
        )

        setForm((previous) => ({
            ...previous,
            appointment: appointmentId,
            patient: selectedAppointment?.patient?._id || previous.patient,
            doctor: selectedAppointment?.doctor?._id || previous.doctor,
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!form.patient || !form.recordType || !form.title || !form.description) {
            toast.error('Please fill all required fields')
            return
        }

        if (isAdmin && !form.doctor) {
            toast.error('Please select a doctor')
            return
        }

        try {
            setSaving(true)

            const payload = {
                ...form,
                doctor: isAdmin ? form.doctor : undefined,
                appointment: form.appointment || null,
            }

            if (editingRecord) {
                const response = await API.put(
                    `/medical-records/${editingRecord._id}`,
                    payload
                )

                toast.success(
                    response.data.message || 'Medical record updated successfully'
                )
            } else {
                const response = await API.post('/medical-records', payload)

                toast.success(
                    response.data.message || 'Medical record created successfully'
                )
            }

            setShowForm(false)
            setEditingRecord(null)
            setForm(initialForm)
            fetchData()
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                'Unable to save medical record'
            )
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            'Are you sure you want to delete this medical record?'
        )

        if (!confirmed) return

        try {
            const response = await API.delete(`/medical-records/${id}`)

            toast.success(
                response.data.message || 'Medical record deleted successfully'
            )

            fetchData()
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                'Unable to delete medical record'
            )
        }
    }

    const closeForm = () => {
        setShowForm(false)
        setEditingRecord(null)
        setForm(initialForm)
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">

            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => navigate('/')}
                    className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                    <ArrowLeft size={17} />
                    Back to Dashboard
                </button>

                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <p className="mb-2 text-sm font-medium text-blue-600">
                            Hospital Management / Medical Records
                        </p>

                        <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
                            Medical Records Management
                        </h1>

                        <p className="mt-2 text-sm text-slate-500">
                            Manage patient medical history, diagnosis and treatment records.
                        </p>
                    </div>

                    <button
                        onClick={openCreateModal}
                        className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >
                        <Plus size={19} />
                        New Medical Record
                    </button>
                </div>
            </div>

            {/* Statistics */}
            <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                Total Medical Records
                            </p>
                            <h2 className="mt-2 text-3xl font-bold text-slate-800">
                                {totalRecords}
                            </h2>
                        </div>
                        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                            <FileText size={25} />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                Diagnosis Records
                            </p>
                            <h2 className="mt-2 text-3xl font-bold text-slate-800">
                                {diagnosisCount}
                            </h2>
                        </div>
                        <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
                            <Activity size={25} />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                Lab Reports
                            </p>
                            <h2 className="mt-2 text-3xl font-bold text-slate-800">
                                {labReportCount}
                            </h2>
                        </div>
                        <div className="rounded-xl bg-green-50 p-3 text-green-600">
                            <ClipboardList size={25} />
                        </div>
                    </div>
                </div>

            </div>

            {/* Records Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="border-b border-slate-200 p-5">
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">
                                All Medical Records
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                View and manage patient medical records.
                            </p>
                        </div>

                        <button
                            onClick={fetchData}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                        <div className="relative flex-1">
                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search patient, doctor, title or diagnosis..."
                                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                        >
                            <option value="All">All Record Types</option>
                            {recordTypes.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="px-5 py-4 font-semibold">Patient</th>
                                <th className="px-5 py-4 font-semibold">Doctor</th>
                                <th className="px-5 py-4 font-semibold">Record Type</th>
                                <th className="px-5 py-4 font-semibold">Title</th>
                                <th className="px-5 py-4 font-semibold">Date</th>
                                <th className="px-5 py-4 text-center font-semibold">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-5 py-12 text-center text-slate-500">
                                        <LoaderCircle className="mx-auto mb-2 animate-spin" size={25} />
                                        Loading medical records...
                                    </td>
                                </tr>
                            ) : filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-5 py-12 text-center">
                                        <FileText size={35} className="mx-auto mb-3 text-slate-300" />
                                        <p className="font-semibold text-slate-600">
                                            No medical records found
                                        </p>
                                        <p className="mt-1 text-xs text-slate-400">
                                            Create a new medical record to get started.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.map((record) => (
                                    <tr key={record._id} className="transition hover:bg-slate-50">

                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-600">
                                                    {getPatientName(record).charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800">
                                                        {getPatientName(record)}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {getPatientPhone(record)}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4 font-medium text-slate-600">
                                            {getDoctorName(record)}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                                                {record.recordType}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 font-medium text-slate-700">
                                            {record.title}
                                        </td>

                                        <td className="px-5 py-4 text-slate-500">
                                            {formatDate(record.reportDate)}
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => openViewModal(record)}
                                                    title="View"
                                                    className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
                                                >
                                                    <Eye size={17} />
                                                </button>

                                                <button
                                                    onClick={() => openEditModal(record)}
                                                    title="Edit"
                                                    className="rounded-lg bg-amber-50 p-2 text-amber-600 hover:bg-amber-100"
                                                >
                                                    <Edit size={17} />
                                                </button>

                                                {isAdmin && (
                                                    <button
                                                        onClick={() => handleDelete(record._id)}
                                                        title="Delete"
                                                        className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
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

                {!loading && filteredRecords.length > 0 && (
                    <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
                        Showing {filteredRecords.length} of {records.length} medical records
                    </div>
                )}

            </div>

            {/* Create / Edit Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
                    <div className="my-auto w-full max-w-3xl rounded-2xl bg-white shadow-2xl">

                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    {editingRecord ? 'Edit Medical Record' : 'New Medical Record'}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Enter patient medical information.
                                </p>
                            </div>

                            <button
                                onClick={closeForm}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X size={21} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="max-h-[75vh] space-y-5 overflow-y-auto p-6">

                            {/* Patient and Doctor */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Patient *
                                    </label>
                                    <select
                                        name="patient"
                                        value={form.patient}
                                        onChange={handleChange}
                                        required
                                        disabled={!!editingRecord}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
                                    >
                                        <option value="">Select Patient</option>
                                        {patients.map((patient) => (
                                            <option key={patient._id} value={patient._id}>
                                                {patient.user?.name || 'Unknown Patient'}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {isAdmin && (
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Doctor *
                                        </label>
                                        <select
                                            name="doctor"
                                            value={form.doctor}
                                            onChange={handleChange}
                                            required
                                            disabled={!!editingRecord}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
                                        >
                                            <option value="">Select Doctor</option>
                                            {doctors.map((doctor) => (
                                                <option key={doctor._id} value={doctor._id}>
                                                    {doctor.user?.name || 'Unknown Doctor'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                            </div>

                            {/* Appointment */}
                            {isAdmin && !editingRecord && (
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Link Appointment (Optional)
                                    </label>
                                    <select
                                        name="appointment"
                                        value={form.appointment}
                                        onChange={handleAppointmentChange}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                                    >
                                        <option value="">No Appointment Linked</option>
                                        {appointments.map((appointment) => (
                                            <option key={appointment._id} value={appointment._id}>
                                                {appointment.patient?.user?.name || 'Patient'} - {appointment.doctor?.user?.name || 'Doctor'} - {formatDate(appointment.appointmentDate)}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-1 text-xs text-slate-400">
                                        Selecting an appointment will automatically fill patient and doctor.
                                    </p>
                                </div>
                            )}

                            {/* Record Details */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Record Type *
                                    </label>
                                    <select
                                        name="recordType"
                                        value={form.recordType}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                                    >
                                        {recordTypes.map((type) => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Record Date *
                                    </label>
                                    <input
                                        type="date"
                                        name="reportDate"
                                        value={form.reportDate}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                    />
                                </div>

                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Record Title *
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={form.title}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. General Health Checkup"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Description *
                                </label>
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    required
                                    rows="3"
                                    placeholder="Enter medical record description..."
                                    className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Diagnosis
                                    </label>
                                    <input
                                        type="text"
                                        name="diagnosis"
                                        value={form.diagnosis}
                                        onChange={handleChange}
                                        placeholder="Enter diagnosis"
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Symptoms
                                    </label>
                                    <input
                                        type="text"
                                        name="symptoms"
                                        value={form.symptoms}
                                        onChange={handleChange}
                                        placeholder="Enter symptoms"
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Treatment
                                    </label>
                                    <input
                                        type="text"
                                        name="treatment"
                                        value={form.treatment}
                                        onChange={handleChange}
                                        placeholder="Enter treatment details"
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Allergies
                                    </label>
                                    <input
                                        type="text"
                                        name="allergies"
                                        value={form.allergies}
                                        onChange={handleChange}
                                        placeholder="Enter allergies (if any)"
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                    />
                                </div>

                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Additional Notes
                                </label>
                                <textarea
                                    name="notes"
                                    value={form.notes}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Additional medical notes..."
                                    className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                                >
                                    {saving && <LoaderCircle size={17} className="animate-spin" />}
                                    {saving
                                        ? 'Saving...'
                                        : editingRecord
                                            ? 'Update Record'
                                            : 'Save Medical Record'}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {showView && selectedRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
                    <div className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-2xl">

                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    Medical Record Details
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Complete patient medical information.
                                </p>
                            </div>

                            <button
                                onClick={() => setShowView(false)}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                            >
                                <X size={21} />
                            </button>
                        </div>

                        <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="rounded-xl bg-blue-50 p-4">
                                    <div className="mb-2 flex items-center gap-2 text-blue-600">
                                        <UserRound size={17} />
                                        <span className="text-xs font-semibold uppercase">Patient</span>
                                    </div>
                                    <p className="font-bold text-slate-800">
                                        {getPatientName(selectedRecord)}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {getPatientPhone(selectedRecord)}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-purple-50 p-4">
                                    <div className="mb-2 flex items-center gap-2 text-purple-600">
                                        <Stethoscope size={17} />
                                        <span className="text-xs font-semibold uppercase">Doctor</span>
                                    </div>
                                    <p className="font-bold text-slate-800">
                                        {getDoctorName(selectedRecord)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                                    {selectedRecord.recordType}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-slate-500">
                                    <CalendarDays size={14} />
                                    {formatDate(selectedRecord.reportDate)}
                                </span>
                            </div>

                            <div>
                                <p className="text-xs font-semibold uppercase text-slate-400">
                                    Record Title
                                </p>
                                <h3 className="mt-1 text-lg font-bold text-slate-800">
                                    {selectedRecord.title}
                                </h3>
                            </div>

                            <div>
                                <p className="mb-2 text-xs font-semibold uppercase text-slate-400">
                                    Description
                                </p>
                                <p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                                    {selectedRecord.description}
                                </p>
                            </div>

                            {[
                                ['Diagnosis', selectedRecord.diagnosis],
                                ['Symptoms', selectedRecord.symptoms],
                                ['Treatment', selectedRecord.treatment],
                                ['Allergies', selectedRecord.allergies],
                                ['Additional Notes', selectedRecord.notes],
                            ].map(([label, value]) => (
                                value ? (
                                    <div key={label}>
                                        <p className="mb-1 text-xs font-semibold uppercase text-slate-400">
                                            {label}
                                        </p>
                                        <p className="whitespace-pre-wrap text-sm text-slate-700">
                                            {value}
                                        </p>
                                    </div>
                                ) : null
                            ))}

                            {selectedRecord.appointment && (
                                <div className="rounded-xl bg-slate-50 p-4">
                                    <p className="text-xs font-semibold uppercase text-slate-400">
                                        Linked Appointment
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-slate-700">
                                        {formatDate(selectedRecord.appointment.appointmentDate)}
                                        {' - '}
                                        {selectedRecord.appointment.appointmentTime || ''}
                                    </p>
                                </div>
                            )}

                        </div>

                        <div className="border-t border-slate-100 p-5 text-right">
                            <button
                                onClick={() => setShowView(false)}
                                className="rounded-xl bg-slate-100 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
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

export default MedicalRecords
