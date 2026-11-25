import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    ArrowLeft,
    Search,
    Plus,
    Stethoscope,
    Users,
    IndianRupee,
    Pencil,
    Trash2,
    X,
    Loader2,
    RefreshCw,
} from 'lucide-react'

import API from '../services/api'
import toast from 'react-hot-toast'

const initialForm = {
    name: '',
    email: '',
    phone: '',
    password: '',
    specialization: '',
    qualification: '',
    experience: '',
    department: '',
    consultationFee: '',
    licenseNumber: '',
    bio: '',
}

const departments = [
    'Cardiology',
    'Neurology',
    'Orthopedics',
    'Dermatology',
    'Pediatrics',
    'Gynecology',
    'General Medicine',
    'ENT',
    'Ophthalmology',
    'Emergency',
]

const Doctors = () => {
    const navigate = useNavigate()

    const [doctors, setDoctors] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [departmentFilter, setDepartmentFilter] = useState('All')
    const [showModal, setShowModal] = useState(false)
    const [editingDoctor, setEditingDoctor] = useState(null)
    const [form, setForm] = useState(initialForm)
    const [submitting, setSubmitting] = useState(false)

    // Fetch all doctors
    const fetchDoctors = async () => {
        try {
            setLoading(true)

            const response = await API.get('/admin/doctors')
            setDoctors(response.data.doctors || [])
        } catch (error) {
            toast.error(
                error.response?.data?.message || 'Failed to fetch doctors'
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDoctors()
    }, [])

    // Search and department filter
    const filteredDoctors = doctors.filter((doctor) => {
        const name = doctor.user?.name || ''
        const email = doctor.user?.email || ''

        const matchesSearch =
            name.toLowerCase().includes(search.toLowerCase()) ||
            email.toLowerCase().includes(search.toLowerCase()) ||
            doctor.specialization.toLowerCase().includes(search.toLowerCase())

        const matchesDepartment =
            departmentFilter === 'All' ||
            doctor.department === departmentFilter

        return matchesSearch && matchesDepartment
    })

    // Open Add Doctor Modal
    const openAddModal = () => {
        setEditingDoctor(null)
        setForm(initialForm)
        setShowModal(true)
    }

    // Open Edit Doctor Modal
    const openEditModal = (doctor) => {
        setEditingDoctor(doctor)

        setForm({
            name: doctor.user?.name || '',
            email: doctor.user?.email || '',
            phone: doctor.user?.phone || '',
            password: '',
            specialization: doctor.specialization || '',
            qualification: doctor.qualification || '',
            experience: doctor.experience ?? '',
            department: doctor.department || '',
            consultationFee: doctor.consultationFee ?? '',
            licenseNumber: doctor.licenseNumber || '',
            bio: doctor.bio || '',
        })

        setShowModal(true)
    }

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value } = e.target

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }))
    }

    // Add or Update Doctor
    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            setSubmitting(true)

            const doctorData = {
                ...form,
                experience: Number(form.experience),
                consultationFee: Number(form.consultationFee),
            }

            if (editingDoctor) {
                delete doctorData.password

                await API.put(
                    `/admin/doctors/${editingDoctor._id}`,
                    doctorData
                )

                toast.success('Doctor updated successfully')
            } else {
                await API.post('/admin/doctors', doctorData)

                toast.success('Doctor added successfully')
            }

            setShowModal(false)
            setForm(initialForm)
            setEditingDoctor(null)

            await fetchDoctors()
        } catch (error) {
            toast.error(
                error.response?.data?.message || 'Something went wrong'
            )
        } finally {
            setSubmitting(false)
        }
    }

    // Delete Doctor
    const handleDelete = async (doctor) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete ${doctor.user?.name}?`
        )

        if (!confirmed) return

        try {
            await API.delete(`/admin/doctors/${doctor._id}`)

            toast.success('Doctor deleted successfully')
            await fetchDoctors()
        } catch (error) {
            toast.error(
                error.response?.data?.message || 'Failed to delete doctor'
            )
        }
    }

    // Toggle availability
    const toggleAvailability = async (doctor) => {
        const newStatus =
            doctor.availability === 'Available'
                ? 'Unavailable'
                : 'Available'

        try {
            await API.put(`/admin/doctors/${doctor._id}`, {
                availability: newStatus,
            })

            toast.success(`Doctor marked as ${newStatus}`)
            await fetchDoctors()
        } catch (error) {
            toast.error(
                error.response?.data?.message || 'Failed to update availability'
            )
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
            {/* Page Header */}
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    {/* Back to Dashboard Button */}
                    <button
                        onClick={() => navigate('/')}
                        className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                        <ArrowLeft size={17} />
                        Back to Dashboard
                    </button>

                    <p className="mb-1 text-sm font-medium text-blue-600">
                        Hospital Management / Doctors
                    </p>

                    <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
                        Doctors Management
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Manage your hospital doctors and their professional details.
                    </p>
                </div>

                <button
                    onClick={openAddModal}
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                    <Plus size={19} />
                    Add New Doctor
                </button>
            </div>

            {/* Statistics */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">Total Doctors</p>
                            <h2 className="mt-2 text-3xl font-bold text-slate-800">
                                {doctors.length}
                            </h2>
                        </div>

                        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                            <Stethoscope size={25} />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">Available Doctors</p>
                            <h2 className="mt-2 text-3xl font-bold text-emerald-600">
                                {doctors.filter(
                                    (doctor) => doctor.availability === 'Available'
                                ).length}
                            </h2>
                        </div>

                        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                            <Users size={25} />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">Departments</p>
                            <h2 className="mt-2 text-3xl font-bold text-violet-600">
                                {new Set(doctors.map((doctor) => doctor.department)).size}
                            </h2>
                        </div>

                        <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
                            <Stethoscope size={25} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Doctors Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            All Doctors
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            View and manage registered doctors.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="relative">
                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="text"
                                placeholder="Search doctors..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 sm:w-64"
                            />
                        </div>

                        <select
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                        >
                            <option value="All">All Departments</option>

                            {departments.map((department) => (
                                <option key={department} value={department}>
                                    {department}
                                </option>
                            ))}
                        </select>

                        <button
                            onClick={fetchDoctors}
                            className="flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-slate-600 transition hover:bg-slate-50"
                            title="Refresh doctors"
                        >
                            <RefreshCw size={18} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-left">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Doctor</th>
                                <th className="px-6 py-4 font-semibold">Department</th>
                                <th className="px-6 py-4 font-semibold">Experience</th>
                                <th className="px-6 py-4 font-semibold">Consultation Fee</th>
                                <th className="px-6 py-4 font-semibold">Availability</th>
                                <th className="px-6 py-4 text-right font-semibold">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center">
                                        <Loader2
                                            className="mx-auto animate-spin text-blue-600"
                                            size={28}
                                        />
                                        <p className="mt-3 text-sm text-slate-500">
                                            Loading doctors...
                                        </p>
                                    </td>
                                </tr>
                            ) : filteredDoctors.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center">
                                        <Stethoscope
                                            className="mx-auto text-slate-300"
                                            size={38}
                                        />
                                        <p className="mt-3 font-semibold text-slate-700">
                                            No doctors found
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Add a new doctor or change your search.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredDoctors.map((doctor) => (
                                    <tr
                                        key={doctor._id}
                                        className="transition hover:bg-slate-50"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                                                    {doctor.user?.name?.charAt(0).toUpperCase()}
                                                </div>

                                                <div>
                                                    <p className="font-semibold text-slate-800">
                                                        {doctor.user?.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {doctor.user?.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <p className="font-medium text-slate-700">
                                                {doctor.department}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {doctor.specialization}
                                            </p>
                                        </td>

                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {doctor.experience} years
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 font-semibold text-slate-700">
                                                <IndianRupee size={15} />
                                                {doctor.consultationFee}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => toggleAvailability(doctor)}
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${doctor.availability === 'Available'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-red-100 text-red-700'
                                                    }`}
                                            >
                                                {doctor.availability || 'Available'}
                                            </button>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(doctor)}
                                                    className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                                                    title="Edit doctor"
                                                >
                                                    <Pencil size={17} />
                                                </button>

                                                <button
                                                    onClick={() => handleDelete(doctor)}
                                                    className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                                                    title="Delete doctor"
                                                >
                                                    <Trash2 size={17} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="border-t border-slate-100 px-6 py-4 text-sm text-slate-500">
                    Showing {filteredDoctors.length} of {doctors.length} doctors
                </div>
            </div>

            {/* Add / Edit Doctor Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-3 backdrop-blur-sm sm:p-5">
                    <div className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2.5rem)]">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Enter doctor information below.
                                </p>
                            </div>

                            <button
                                onClick={() => setShowModal(false)}
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                            >
                                <X size={21} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Full Name *
                                    </label>
                                    <input
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                        placeholder="Dr. John Smith"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                        placeholder="doctor@medicare.com"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Phone Number
                                    </label>
                                    <input
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                        placeholder="9876543210"
                                    />
                                </div>

                                {!editingDoctor && (
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Password *
                                        </label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={form.password}
                                            onChange={handleChange}
                                            required
                                            minLength={8}
                                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                            placeholder="Minimum 8 characters"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Specialization *
                                    </label>
                                    <input
                                        name="specialization"
                                        value={form.specialization}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                        placeholder="Cardiology"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Qualification *
                                    </label>
                                    <input
                                        name="qualification"
                                        value={form.qualification}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                        placeholder="MBBS, MD"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Experience (Years) *
                                    </label>
                                    <input
                                        type="number"
                                        name="experience"
                                        value={form.experience}
                                        onChange={handleChange}
                                        required
                                        min="0"
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                        placeholder="5"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Department *
                                    </label>
                                    <select
                                        name="department"
                                        value={form.department}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map((department) => (
                                            <option key={department} value={department}>
                                                {department}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Consultation Fee (₹) *
                                    </label>
                                    <input
                                        type="number"
                                        name="consultationFee"
                                        value={form.consultationFee}
                                        onChange={handleChange}
                                        required
                                        min="0"
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                        placeholder="800"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Medical License Number
                                    </label>
                                    <input
                                        name="licenseNumber"
                                        value={form.licenseNumber}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                        placeholder="MED123456"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Professional Bio
                                    </label>
                                    <textarea
                                        name="bio"
                                        value={form.bio}
                                        onChange={handleChange}
                                        rows="3"
                                        className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                        placeholder="Write a short professional description..."
                                    />
                                </div>
                            </div>

                            <div className="mt-7 flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {submitting && (
                                        <Loader2 size={17} className="animate-spin" />
                                    )}

                                    {editingDoctor ? 'Update Doctor' : 'Save Doctor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Doctors