
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Search,
  Plus,
  Users,
  UserCheck,
  Droplet,
  Pencil,
  Trash2,
  X,
  Loader2,
  RefreshCw,
  CalendarDays,
} from 'lucide-react'

import API from '../services/api'
import toast from 'react-hot-toast'

const initialForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  dateOfBirth: '',
  gender: 'Other',
  bloodGroup: '',
  address: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  medicalHistory: '',
  allergies: '',
}

const bloodGroups = [
  'A+', 'A-', 'B+', 'B-',
  'AB+', 'AB-', 'O+', 'O-',
]

const Patients = () => {
  const navigate = useNavigate()

  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [genderFilter, setGenderFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [editingPatient, setEditingPatient] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)

  // Fetch all patients
  const fetchPatients = async () => {
    try {
      setLoading(true)

      const response = await API.get('/patients')
      setPatients(response.data.patients || [])
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to fetch patients'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [])

  // Search and gender filter
  const filteredPatients = patients.filter((patient) => {
    const name = patient.user?.name || ''
    const email = patient.user?.email || ''
    const phone = patient.user?.phone || ''

    const matchesSearch =
      name.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase()) ||
      phone.includes(search)

    const matchesGender =
      genderFilter === 'All' ||
      patient.gender === genderFilter

    return matchesSearch && matchesGender
  })

  // Open Add Patient Modal
  const openAddModal = () => {
    setEditingPatient(null)
    setForm(initialForm)
    setShowModal(true)
  }

  // Open Edit Patient Modal
  const openEditModal = (patient) => {
    setEditingPatient(patient)

    setForm({
      name: patient.user?.name || '',
      email: patient.user?.email || '',
      phone: patient.user?.phone || '',
      password: '',
      dateOfBirth: patient.dateOfBirth
        ? new Date(patient.dateOfBirth).toISOString().split('T')[0]
        : '',
      gender: patient.gender || 'Other',
      bloodGroup: patient.bloodGroup || '',
      address: patient.address || '',
      emergencyContactName: patient.emergencyContactName || '',
      emergencyContactPhone: patient.emergencyContactPhone || '',
      medicalHistory: patient.medicalHistory || '',
      allergies: patient.allergies || '',
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

  // Add or Update Patient
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!editingPatient && form.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    try {
      setSubmitting(true)

      const patientData = {
        ...form,
        dateOfBirth: form.dateOfBirth || null,
      }

      if (editingPatient) {
        delete patientData.password

        await API.put(
          `/patients/${editingPatient._id}`,
          patientData
        )

        toast.success('Patient updated successfully')
      } else {
        await API.post('/patients', patientData)

        toast.success('Patient added successfully')
      }

      setShowModal(false)
      setForm(initialForm)
      setEditingPatient(null)

      await fetchPatients()
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Something went wrong'
      )
    } finally {
      setSubmitting(false)
    }
  }

  // Delete Patient
  const handleDelete = async (patient) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${patient.user?.name}?`
    )

    if (!confirmed) return

    try {
      await API.delete(`/patients/${patient._id}`)

      toast.success('Patient deleted successfully')
      await fetchPatients()
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to delete patient'
      )
    }
  }

  // Calculate patient age
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A'

    const today = new Date()
    const birthDate = new Date(dateOfBirth)

    let age = today.getFullYear() - birthDate.getFullYear()

    const monthDifference = today.getMonth() - birthDate.getMonth()

    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--
    }

    return age >= 0 ? `${age} years` : 'N/A'
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">

      {/* Page Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <button
            onClick={() => navigate('/')}
            className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <ArrowLeft size={17} />
            Back to Dashboard
          </button>

          <p className="mb-1 text-sm font-medium text-blue-600">
            Hospital Management / Patients
          </p>

          <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
            Patients Management
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage registered patients and their medical information.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={19} />
          Add New Patient
        </button>
      </div>

      {/* Statistics */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Patients</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-800">
                {patients.length}
              </h2>
            </div>

            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Users size={25} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Active Patients</p>
              <h2 className="mt-2 text-3xl font-bold text-emerald-600">
                {patients.filter(
                  (patient) => patient.user?.isActive !== false
                ).length}
              </h2>
            </div>

            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <UserCheck size={25} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Blood Groups</p>
              <h2 className="mt-2 text-3xl font-bold text-rose-600">
                {new Set(
                  patients
                    .map((patient) => patient.bloodGroup)
                    .filter(Boolean)
                ).size}
              </h2>
            </div>

            <div className="rounded-xl bg-rose-50 p-3 text-rose-600">
              <Droplet size={25} />
            </div>
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              All Patients
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              View and manage registered patients.
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
                placeholder="Search patients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 sm:w-64"
              />
            </div>

            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="All">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            <button
              onClick={fetchPatients}
              className="flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-slate-600 transition hover:bg-slate-50"
              title="Refresh patients"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">

            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Patient</th>
                <th className="px-6 py-4 font-semibold">Phone</th>
                <th className="px-6 py-4 font-semibold">Gender</th>
                <th className="px-6 py-4 font-semibold">Blood Group</th>
                <th className="px-6 py-4 font-semibold">Age</th>
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
                      Loading patients...
                    </p>
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <Users
                      className="mx-auto text-slate-300"
                      size={38}
                    />

                    <p className="mt-3 font-semibold text-slate-700">
                      No patients found
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Add a new patient or change your search.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr
                    key={patient._id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                          {patient.user?.name?.charAt(0).toUpperCase() || 'P'}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-800">
                            {patient.user?.name || 'Unknown'}
                          </p>

                          <p className="text-xs text-slate-500">
                            {patient.user?.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {patient.user?.phone || 'N/A'}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {patient.gender || 'N/A'}
                    </td>

                    <td className="px-6 py-4">
                      {patient.bloodGroup ? (
                        <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                          {patient.bloodGroup}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">N/A</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {calculateAge(patient.dateOfBirth)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">

                        <button
                          onClick={() => openEditModal(patient)}
                          className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                          title="Edit patient"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          onClick={() => handleDelete(patient)}
                          className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                          title="Delete patient"
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
          Showing {filteredPatients.length} of {patients.length} patients
        </div>
      </div>

      {/* Add / Edit Patient Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">

          <div className="my-8 w-full max-w-3xl rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {editingPatient ? 'Edit Patient' : 'Add New Patient'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enter patient information below.
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={21} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="max-h-[75vh] overflow-y-auto p-6"
            >

              <div className="mb-5">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-blue-600">
                  Personal Information
                </h3>

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
                      placeholder="Enter full name"
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
                      placeholder="patient@example.com"
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

                  {!editingPatient && (
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
                      Date of Birth
                    </label>

                    <input
                      type="date"
                      name="dateOfBirth"
                      value={form.dateOfBirth}
                      onChange={handleChange}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Gender
                    </label>

                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Blood Group
                    </label>

                    <select
                      name="bloodGroup"
                      value={form.bloodGroup}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="">Select Blood Group</option>

                      {bloodGroups.map((group) => (
                        <option key={group} value={group}>
                          {group}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Address
                    </label>

                    <textarea
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      rows="2"
                      className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                      placeholder="Enter complete address"
                    />
                  </div>

                </div>
              </div>

              <div className="mb-5 border-t border-slate-100 pt-5">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-blue-600">
                  Emergency Contact
                </h3>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Contact Person Name
                    </label>

                    <input
                      name="emergencyContactName"
                      value={form.emergencyContactName}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                      placeholder="Emergency contact name"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Contact Phone
                    </label>

                    <input
                      name="emergencyContactPhone"
                      value={form.emergencyContactPhone}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                      placeholder="9876543210"
                    />
                  </div>

                </div>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-blue-600">
                  Medical Information
                </h3>

                <div className="grid grid-cols-1 gap-5">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Medical History
                    </label>

                    <textarea
                      name="medicalHistory"
                      value={form.medicalHistory}
                      onChange={handleChange}
                      rows="3"
                      className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                      placeholder="Enter relevant medical history"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Allergies
                    </label>

                    <textarea
                      name="allergies"
                      value={form.allergies}
                      onChange={handleChange}
                      rows="2"
                      className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                      placeholder="Enter known allergies"
                    />
                  </div>

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

                  {editingPatient ? 'Update Patient' : 'Save Patient'}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default Patients
