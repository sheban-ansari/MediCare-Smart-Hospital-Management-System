
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    ArrowLeft,
    Search,
    Plus,
    Users,
    UserCheck,
    UserX,
    Pencil,
    Trash2,
    X,
    Loader2,
    RefreshCw,
    Phone,
    Mail,
    ShieldCheck,
} from 'lucide-react'
import API from '../services/api'
import toast from 'react-hot-toast'

const initialForm = {
    name: '',
    email: '',
    phone: '',
    password: '',
    isActive: true,
}

const Receptionists = () => {
    const navigate = useNavigate()

    const [receptionists, setReceptionists] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('All')
    const [showModal, setShowModal] = useState(false)
    const [editingReceptionist, setEditingReceptionist] = useState(null)
    const [form, setForm] = useState(initialForm)
    const [submitting, setSubmitting] = useState(false)

    // Fetch receptionists
    const fetchReceptionists = async () => {
        try {
            setLoading(true)

            const response = await API.get('/receptionists')

            setReceptionists(response.data.receptionists || [])
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                'Failed to fetch receptionists'
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchReceptionists()
    }, [])

    // Open Add Modal
    const handleAdd = () => {
        setEditingReceptionist(null)
        setForm(initialForm)
        setShowModal(true)
    }

    // Open Edit Modal
    const handleEdit = (receptionist) => {
        setEditingReceptionist(receptionist)

        setForm({
            name: receptionist.name || '',
            email: receptionist.email || '',
            phone: receptionist.phone || '',
            password: '',
            isActive: receptionist.isActive,
        })

        setShowModal(true)
    }

    // Form Input Change
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target

        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }))
    }

    // Save Receptionist
    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!form.name.trim() || !form.email.trim()) {
            toast.error('Please fill all required fields')
            return
        }

        if (!editingReceptionist && form.password.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }

        try {
            setSubmitting(true)

            if (editingReceptionist) {
                const updateData = {
                    name: form.name,
                    email: form.email,
                    phone: form.phone,
                    isActive: form.isActive,
                }

                if (form.password.trim()) {
                    updateData.password = form.password
                }

                await API.put(
                    `/receptionists/${editingReceptionist._id}`,
                    updateData
                )

                toast.success('Receptionist updated successfully')
            } else {
                await API.post('/receptionists', {
                    name: form.name,
                    email: form.email,
                    phone: form.phone,
                    password: form.password,
                })

                toast.success('Receptionist added successfully')
            }

            setShowModal(false)
            setForm(initialForm)
            setEditingReceptionist(null)

            fetchReceptionists()
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                'Something went wrong'
            )
        } finally {
            setSubmitting(false)
        }
    }

    // Delete Receptionist
    const handleDelete = async (receptionist) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete ${receptionist.name}?`
        )

        if (!confirmed) return

        try {
            await API.delete(`/receptionists/${receptionist._id}`)

            toast.success('Receptionist deleted successfully')
            fetchReceptionists()
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                'Failed to delete receptionist'
            )
        }
    }

    // Search and Filter
    const filteredReceptionists = receptionists.filter(
        (receptionist) => {
            const searchText = search.toLowerCase()

            const matchesSearch =
                receptionist.name?.toLowerCase().includes(searchText) ||
                receptionist.email?.toLowerCase().includes(searchText) ||
                receptionist.phone?.includes(searchText)

            const matchesStatus =
                statusFilter === 'All' ||
                (statusFilter === 'Active' && receptionist.isActive) ||
                (statusFilter === 'Inactive' && !receptionist.isActive)

            return matchesSearch && matchesStatus
        }
    )

    const activeCount = receptionists.filter(
        (item) => item.isActive
    ).length

    const inactiveCount = receptionists.filter(
        (item) => !item.isActive
    ).length

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">

                {/* Header */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <button
                            onClick={() => navigate('/')}
                            className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                            <ArrowLeft size={17} />
                            Back to Dashboard
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                                <Users size={26} />
                            </div>

                            <div>
                                <p className="text-sm font-medium text-blue-600">
                                    Hospital Management / Staff
                                </p>
                                <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
                                    Receptionists Management
                                </h1>
                            </div>
                        </div>

                        <p className="mt-3 text-sm text-slate-500">
                            Manage hospital receptionists and their account details.
                        </p>
                    </div>

                    <button
                        onClick={handleAdd}
                        className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >
                        <Plus size={19} />
                        Add Receptionist
                    </button>
                </div>

                {/* Statistics */}
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Total Receptionists
                                </p>
                                <h2 className="mt-2 text-3xl font-bold text-slate-800">
                                    {receptionists.length}
                                </h2>
                            </div>

                            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                                <Users size={25} />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Active Receptionists
                                </p>
                                <h2 className="mt-2 text-3xl font-bold text-green-600">
                                    {activeCount}
                                </h2>
                            </div>

                            <div className="rounded-xl bg-green-100 p-3 text-green-600">
                                <UserCheck size={25} />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Inactive Receptionists
                                </p>
                                <h2 className="mt-2 text-3xl font-bold text-red-600">
                                    {inactiveCount}
                                </h2>
                            </div>

                            <div className="rounded-xl bg-red-100 p-3 text-red-600">
                                <UserX size={25} />
                            </div>
                        </div>
                    </div>

                </div>

                {/* Receptionists List */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="border-b border-slate-200 p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                    All Receptionists
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    View and manage registered receptionists.
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
                                        placeholder="Search receptionist..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-64"
                                    />
                                </div>

                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                                >
                                    <option value="All">All Status</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>

                                <button
                                    onClick={fetchReceptionists}
                                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                                >
                                    <RefreshCw size={16} />
                                    Refresh
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[750px] text-left">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Receptionist</th>
                                    <th className="px-6 py-4 font-semibold">Phone</th>
                                    <th className="px-6 py-4 font-semibold">Email</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 text-center font-semibold">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">

                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="py-16 text-center">
                                            <Loader2
                                                className="mx-auto animate-spin text-blue-600"
                                                size={30}
                                            />
                                            <p className="mt-3 text-sm text-slate-500">
                                                Loading receptionists...
                                            </p>
                                        </td>
                                    </tr>
                                ) : filteredReceptionists.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-16 text-center">
                                            <Users
                                                size={38}
                                                className="mx-auto text-slate-300"
                                            />
                                            <p className="mt-3 font-semibold text-slate-700">
                                                No receptionists found
                                            </p>
                                            <p className="mt-1 text-sm text-slate-500">
                                                {search || statusFilter !== 'All'
                                                    ? 'Try changing your search or filter.'
                                                    : 'Add your first receptionist to get started.'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredReceptionists.map((receptionist) => (
                                        <tr
                                            key={receptionist._id}
                                            className="transition hover:bg-slate-50"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                                                        {receptionist.name?.charAt(0).toUpperCase()}
                                                    </div>

                                                    <div>
                                                        <p className="font-semibold text-slate-800">
                                                            {receptionist.name}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            Receptionist
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                <span className="flex items-center gap-2">
                                                    <Phone size={15} className="text-slate-400" />
                                                    {receptionist.phone || 'Not provided'}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                <span className="flex items-center gap-2">
                                                    <Mail size={15} className="text-slate-400" />
                                                    {receptionist.email}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${receptionist.isActive
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                        }`}
                                                >
                                                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                                    {receptionist.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(receptionist)}
                                                        title="Edit Receptionist"
                                                        className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                                                    >
                                                        <Pencil size={17} />
                                                    </button>

                                                    <button
                                                        onClick={() => handleDelete(receptionist)}
                                                        title="Delete Receptionist"
                                                        className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
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
                        Showing {filteredReceptionists.length} of {receptionists.length} receptionists
                    </div>

                </div>

                {/* Add / Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4">
                        <div className="my-8 w-full max-w-xl rounded-2xl bg-white shadow-2xl">

                            <div className="flex items-center justify-between border-b border-slate-200 p-5">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">
                                        {editingReceptionist
                                            ? 'Edit Receptionist'
                                            : 'Add New Receptionist'}
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Enter receptionist account details.
                                    </p>
                                </div>

                                <button
                                    onClick={() => setShowModal(false)}
                                    className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
                                >
                                    <X size={21} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5 p-5">

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder="Enter full name"
                                        required
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="Enter email address"
                                        required
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                        placeholder="Enter phone number"
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        {editingReceptionist
                                            ? 'New Password (Optional)'
                                            : 'Password *'}
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder={
                                            editingReceptionist
                                                ? 'Leave blank to keep current password'
                                                : 'Minimum 6 characters'
                                        }
                                        required={!editingReceptionist}
                                        minLength={6}
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                {editingReceptionist && (
                                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4">
                                        <input
                                            type="checkbox"
                                            name="isActive"
                                            checked={form.isActive}
                                            onChange={handleChange}
                                            className="h-4 w-4 accent-blue-600"
                                        />
                                        <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                            <ShieldCheck size={18} className="text-blue-600" />
                                            Account Active
                                        </span>
                                    </label>
                                )}

                                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        disabled={submitting}
                                        className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
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
                                        {editingReceptionist
                                            ? 'Update Receptionist'
                                            : 'Save Receptionist'}
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}

export default Receptionists
