
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Search,
  Plus,
  CalendarDays,
  Clock,
  Users,
  Stethoscope,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Pencil,
  Trash2,
  X,
  Loader2,
  RefreshCw,
} from 'lucide-react'

import API from '../services/api'
import toast from 'react-hot-toast'

const initialForm = {
  patient: '',
  doctor: '',
  appointmentDate: '',
  appointmentTime: '',
  reason: '',
  notes: '',
  status: 'Pending',
}

const appointmentStatuses = [
  'Pending',
  'Confirmed',
  'Completed',
  'Cancelled',
]

const Appointments = () => {
  const navigate = useNavigate()

  const [appointments, setAppointments] = useState([])
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])

  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const [showModal, setShowModal] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)

  // Fetch appointments, patients and doctors
  const fetchData = async () => {
    try {
      setLoading(true)

      const [
        appointmentsResponse,
        patientsResponse,
        doctorsResponse,
      ] = await Promise.all([
        API.get('/appointments'),
        API.get('/patients'),
        API.get('/admin/doctors'),
      ])

      setAppointments(
        appointmentsResponse.data.appointments || []
      )

      setPatients(
        patientsResponse.data.patients || []
      )

      setDoctors(
        doctorsResponse.data.doctors || []
      )
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Failed to fetch appointment data'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Search and status filter
  const filteredAppointments = appointments.filter(
    (appointment) => {
      const patientName =
        appointment.patient?.user?.name || ''

      const doctorName =
        appointment.doctor?.user?.name || ''

      const reason = appointment.reason || ''

      const matchesSearch =
        patientName.toLowerCase().includes(search.toLowerCase()) ||
        doctorName.toLowerCase().includes(search.toLowerCase()) ||
        reason.toLowerCase().includes(search.toLowerCase())

      const matchesStatus =
        statusFilter === 'All' ||
        appointment.status === statusFilter

      return matchesSearch && matchesStatus
    }
  )

  // Open Add Appointment Modal
  const openAddModal = () => {
    setEditingAppointment(null)
    setForm(initialForm)
    setShowModal(true)
  }

  // Open Edit Appointment Modal
  const openEditModal = (appointment) => {
    setEditingAppointment(appointment)

    setForm({
      patient: appointment.patient?._id || '',
      doctor: appointment.doctor?._id || '',
      appointmentDate: appointment.appointmentDate
        ? new Date(appointment.appointmentDate)
            .toISOString()
            .split('T')[0]
        : '',
      appointmentTime: appointment.appointmentTime || '',
      reason: appointment.reason || '',
      notes: appointment.notes || '',
      status: appointment.status || 'Pending',
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

  // Add or Update Appointment
  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setSubmitting(true)

      const appointmentData = {
        patient: form.patient,
        doctor: form.doctor,
        appointmentDate: form.appointmentDate,
        appointmentTime: form.appointmentTime,
        reason: form.reason.trim(),
        notes: form.notes.trim(),
        status: form.status,
      }

      if (editingAppointment) {
        await API.put(
          `/appointments/${editingAppointment._id}`,
          appointmentData
        )

        toast.success('Appointment updated successfully')
      } else {
        delete appointmentData.status

        await API.post(
          '/appointments',
          appointmentData
        )

        toast.success('Appointment booked successfully')
      }

      setShowModal(false)
      setForm(initialForm)
      setEditingAppointment(null)

      await fetchData()
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Something went wrong'
      )
    } finally {
      setSubmitting(false)
    }
  }

  // Delete Appointment
  const handleDelete = async (appointment) => {
    const patientName =
      appointment.patient?.user?.name || 'this patient'

    const confirmed = window.confirm(
      `Are you sure you want to delete the appointment of ${patientName}?`
    )

    if (!confirmed) return

    try {
      await API.delete(
        `/appointments/${appointment._id}`
      )

      toast.success('Appointment deleted successfully')
      await fetchData()
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Failed to delete appointment'
      )
    }
  }

  // Format appointment date
  const formatDate = (date) => {
    if (!date) return 'N/A'

    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  // Get status styling
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-blue-50 text-blue-700'

      case 'Completed':
        return 'bg-emerald-50 text-emerald-700'

      case 'Cancelled':
        return 'bg-red-50 text-red-700'

      default:
        return 'bg-amber-50 text-amber-700'
    }
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
            Hospital Management / Appointments
          </p>

          <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
            Appointments Management
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Schedule and manage patient appointments.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={19} />
          Book Appointment
        </button>
      </div>

      {/* Statistics */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Total Appointments
              </p>
              <h2 className="mt-2 text-3xl font-bold text-slate-800">
                {appointments.length}
              </h2>
            </div>

            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <CalendarDays size={25} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Pending
              </p>
              <h2 className="mt-2 text-3xl font-bold text-amber-600">
                {
                  appointments.filter(
                    (appointment) =>
                      appointment.status === 'Pending'
                  ).length
                }
              </h2>
            </div>

            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
              <AlertCircle size={25} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Confirmed
              </p>
              <h2 className="mt-2 text-3xl font-bold text-blue-600">
                {
                  appointments.filter(
                    (appointment) =>
                      appointment.status === 'Confirmed'
                  ).length
                }
              </h2>
            </div>

            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <CheckCircle2 size={25} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Completed
              </p>
              <h2 className="mt-2 text-3xl font-bold text-emerald-600">
                {
                  appointments.filter(
                    (appointment) =>
                      appointment.status === 'Completed'
                  ).length
                }
              </h2>
            </div>

            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <ClipboardList size={25} />
            </div>
          </div>
        </div>

      </div>

      {/* Appointments Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center">

          <div>
            <h2 className="text-lg font-bold text-slate-800">
              All Appointments
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              View and manage scheduled appointments.
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
                placeholder="Search appointments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 sm:w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="All">All Statuses</option>
              {appointmentStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <button
              onClick={fetchData}
              className="flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-slate-600 transition hover:bg-slate-50"
              title="Refresh appointments"
            >
              <RefreshCw size={18} />
            </button>

          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left">

            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">
                  Patient
                </th>

                <th className="px-6 py-4 font-semibold">
                  Doctor
                </th>

                <th className="px-6 py-4 font-semibold">
                  Date & Time
                </th>

                <th className="px-6 py-4 font-semibold">
                  Reason
                </th>

                <th className="px-6 py-4 font-semibold">
                  Status
                </th>

                <th className="px-6 py-4 text-right font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">

              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-16 text-center"
                  >
                    <Loader2
                      className="mx-auto animate-spin text-blue-600"
                      size={28}
                    />

                    <p className="mt-3 text-sm text-slate-500">
                      Loading appointments...
                    </p>
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-16 text-center"
                  >
                    <CalendarDays
                      className="mx-auto text-slate-300"
                      size={38}
                    />

                    <p className="mt-3 font-semibold text-slate-700">
                      No appointments found
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Book a new appointment or change your search.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((appointment) => (
                  <tr
                    key={appointment._id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                          {appointment.patient?.user?.name
                            ?.charAt(0)
                            .toUpperCase() || 'P'}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-800">
                            {appointment.patient?.user?.name ||
                              'Unknown Patient'}
                          </p>

                          <p className="text-xs text-slate-500">
                            {appointment.patient?.user?.email || ''}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Stethoscope
                          size={17}
                          className="text-blue-500"
                        />

                        <span className="text-sm font-medium text-slate-700">
                          {appointment.doctor?.user?.name ||
                            'Unknown Doctor'}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-700">
                        {formatDate(appointment.appointmentDate)}
                      </p>

                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <Clock size={13} />
                        {appointment.appointmentTime || 'N/A'}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {appointment.reason || 'N/A'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                          appointment.status
                        )}`}
                      >
                        {appointment.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">

                        <button
                          onClick={() => openEditModal(appointment)}
                          className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                          title="Edit appointment"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          onClick={() => handleDelete(appointment)}
                          className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                          title="Delete appointment"
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
          Showing {filteredAppointments.length} of {appointments.length} appointments
        </div>
      </div>

      {/* Add / Edit Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">

          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {editingAppointment
                    ? 'Edit Appointment'
                    : 'Book New Appointment'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enter appointment information below.
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

              {/* Patient and Doctor */}
              <div className="mb-6">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-blue-600">
                  Patient & Doctor Information
                </h3>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Select Patient *
                    </label>

                    <select
                      name="patient"
                      value={form.patient}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="">
                        Select Patient
                      </option>

                      {patients.map((patient) => (
                        <option
                          key={patient._id}
                          value={patient._id}
                        >
                          {patient.user?.name || 'Unknown Patient'}
                        </option>
                      ))}
                    </select>

                    {patients.length === 0 && (
                      <p className="mt-2 text-xs text-red-500">
                        No patients available. Add a patient first.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Select Doctor *
                    </label>

                    <select
                      name="doctor"
                      value={form.doctor}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="">
                        Select Doctor
                      </option>

                      {doctors.map((doctor) => (
                        <option
                          key={doctor._id}
                          value={doctor._id}
                          disabled={doctor.availability !== 'Available'}
                        >
                          {doctor.user?.name || 'Unknown Doctor'}
                          {doctor.availability !== 'Available'
                            ? ' (Unavailable)'
                            : ''}
                        </option>
                      ))}
                    </select>

                    {doctors.length === 0 && (
                      <p className="mt-2 text-xs text-red-500">
                        No doctors available. Add a doctor first.
                      </p>
                    )}
                  </div>

                </div>
              </div>

              {/* Appointment Details */}
              <div className="mb-6 border-t border-slate-100 pt-5">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-blue-600">
                  Appointment Details
                </h3>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Appointment Date *
                    </label>

                    <input
                      type="date"
                      name="appointmentDate"
                      value={form.appointmentDate}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Appointment Time *
                    </label>

                    <input
                      type="time"
                      name="appointmentTime"
                      value={form.appointmentTime}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Appointment Reason *
                    </label>

                    <input
                      name="reason"
                      value={form.reason}
                      onChange={handleChange}
                      required
                      maxLength={200}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                      placeholder="Enter reason for appointment"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Additional Notes
                    </label>

                    <textarea
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      rows="3"
                      className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                      placeholder="Enter additional notes (optional)"
                    />
                  </div>

                  {editingAppointment && (
                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Appointment Status
                      </label>

                      <select
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                      >
                        {appointmentStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                </div>
              </div>

              {/* Form Buttons */}
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
                  disabled={submitting || patients.length === 0 || doctors.length === 0}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting && (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  )}

                  {editingAppointment
                    ? 'Update Appointment'
                    : 'Book Appointment'}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default Appointments
