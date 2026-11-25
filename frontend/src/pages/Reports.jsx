
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  FileBarChart,
  Users,
  CalendarDays,
  IndianRupee,
  Activity,
  Download,
  RefreshCw,
  Stethoscope,
  ClipboardList,
  AlertCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'

const Reports = () => {
  const navigate = useNavigate()

  const [activeReport, setActiveReport] = useState('overview')
  const [dateRange, setDateRange] = useState('all')
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const reports = [
    { id: 'overview', label: 'Overview', icon: FileBarChart },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'doctors', label: 'Doctors', icon: Stethoscope },
    { id: 'appointments', label: 'Appointments', icon: CalendarDays },
    { id: 'revenue', label: 'Revenue', icon: IndianRupee },
  ]

  // Fetch live reports from backend
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await API.get(
          `/reports?range=${dateRange}`
        )

        setReportData(response.data)
      } catch (err) {
        setError(
          err.response?.data?.message ||
          'Unable to load reports. Please try again.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [dateRange, refreshKey])

  const overview = reportData?.overview || {}

  const formatCurrency = (amount = 0) => {
    return `₹${Number(amount).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })}`
  }

  const stats = [
    {
      title: 'Total Patients',
      value: (overview.totalPatients || 0).toLocaleString('en-IN'),
      icon: Users,
      color: 'blue',
    },
    {
      title: 'Total Doctors',
      value: (overview.totalDoctors || 0).toLocaleString('en-IN'),
      icon: Stethoscope,
      color: 'purple',
    },
    {
      title: 'Appointments',
      value: (overview.totalAppointments || 0).toLocaleString('en-IN'),
      icon: CalendarDays,
      color: 'green',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(overview.totalRevenue),
      icon: IndianRupee,
      color: 'orange',
    },
  ]

  const monthlyData = reportData?.monthlyActivity || []

  const departmentData = reportData?.departmentPerformance || []

  const appointmentStatuses = reportData?.appointmentStatuses || {}

  const maxValue = Math.max(
    1,
    ...monthlyData.flatMap((item) => [
      item.patients || 0,
      item.appointments || 0,
    ])
  )

  const maxDepartmentDoctors = Math.max(
    1,
    ...departmentData.map((item) => item.doctors || 0)
  )

  const filteredTitle = useMemo(() => {
    return (
      reports.find((item) => item.id === activeReport)?.label ||
      'Overview'
    )
  }, [activeReport])

  // Export live report data as CSV
  const handleExport = () => {
    if (!reportData) return

    const rows = [
      ['MediCare - Reports & Analytics'],
      ['Report Period', dateRange],
      [],
      ['Overview', 'Value'],
      ['Total Patients', overview.totalPatients || 0],
      ['Total Doctors', overview.totalDoctors || 0],
      ['Total Appointments', overview.totalAppointments || 0],
      ['Total Revenue', overview.totalRevenue || 0],
      ['Amount Received', overview.receivedAmount || 0],
      ['Pending Dues', overview.pendingDues || 0],
      ['Total Bills', overview.totalBills || 0],
      [],
      ['Appointment Status', 'Count'],
      ...Object.entries(appointmentStatuses),
      [],
      ['Monthly Activity', 'Patients', 'Appointments'],
      ...monthlyData.map((item) => [
        item.month,
        item.patients,
        item.appointments,
      ]),
      [],
      ['Department', 'Doctors'],
      ...departmentData.map((item) => [
        item.department,
        item.doctors,
      ]),
    ]

    const csvContent = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n')

    const blob = new Blob(
      ['\uFEFF' + csvContent],
      { type: 'text/csv;charset=utf-8;' }
    )

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'medicare-report.csv'
    link.click()

    URL.revokeObjectURL(url)
  }

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
  }

  const visibleStats = stats.filter((item) => {
    if (activeReport === 'patients') {
      return item.title === 'Total Patients'
    }

    if (activeReport === 'doctors') {
      return item.title === 'Total Doctors'
    }

    if (activeReport === 'appointments') {
      return item.title === 'Appointments'
    }

    if (activeReport === 'revenue') {
      return item.title === 'Total Revenue'
    }

    return true
  })

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                <FileBarChart size={25} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">
                  Reports & Analytics
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Hospital performance, statistics and financial reports.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>

            <button
              onClick={handleExport}
              disabled={!reportData || loading}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={17} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Report Navigation */}
        <div className="mb-7 flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2">
          {reports.map((report) => {
            const Icon = report.icon

            return (
              <button
                key={report.id}
                onClick={() => setActiveReport(report.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${
                  activeReport === report.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon size={17} />
                {report.label}
              </button>
            )
          })}
        </div>

        {/* Report Heading */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {filteredTitle} Report
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Live hospital database statistics
            </p>
          </div>

          <button
            onClick={() => {
              setActiveReport('overview')
              setDateRange('all')
              setRefreshKey((prev) => prev + 1)
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={15} />
            Reset
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="mb-7 rounded-xl border border-slate-200 bg-white p-12 text-center">
            <RefreshCw className="mx-auto animate-spin text-blue-600" size={30} />

            <p className="mt-3 text-sm font-medium text-slate-600">
              Loading live reports...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mb-7 rounded-xl border border-red-200 bg-red-50 p-5">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle size={22} />

              <div>
                <h3 className="font-semibold">
                  Reports could not be loaded
                </h3>

                <p className="mt-1 text-sm">
                  {error}
                </p>
              </div>
            </div>

            <button
              onClick={() => setRefreshKey((prev) => prev + 1)}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Report Content */}
        {!loading && !error && reportData && (
          <>
            {/* Statistics Cards */}
            <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {visibleStats.map((item) => {
                const Icon = item.icon

                return (
                  <div
                    key={item.title}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500">
                          {item.title}
                        </p>

                        <h3 className="mt-2 text-2xl font-bold text-slate-800">
                          {item.value}
                        </h3>
                      </div>

                      <div className={`rounded-xl p-3 ${colorClasses[item.color]}`}>
                        <Icon size={22} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Monthly Activity and Department Performance */}
            {(activeReport === 'overview' ||
              activeReport === 'patients' ||
              activeReport === 'appointments' ||
              activeReport === 'doctors') && (
              <div className="mb-7 grid grid-cols-1 gap-6 lg:grid-cols-3">

                {/* Monthly Chart */}
                {(activeReport === 'overview' ||
                  activeReport === 'patients' ||
                  activeReport === 'appointments') && (
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
                    <div className="mb-6">
                      <h3 className="font-bold text-slate-800">
                        Monthly Hospital Activity
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Patient registrations and appointments - Last 6 Months
                      </p>
                    </div>

                    {monthlyData.length > 0 ? (
                      <>
                        <div className="flex h-64 items-end justify-between gap-2 border-b border-slate-200 pb-2">
                          {monthlyData.map((item) => (
                            <div
                              key={item.month}
                              className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                            >
                              <div className="flex h-full w-full items-end justify-center gap-1">
                                <div
                                  title={`Patients: ${item.patients}`}
                                  className="w-2/5 rounded-t bg-blue-500 transition-all hover:bg-blue-600"
                                  style={{
                                    height: `${(item.patients / maxValue) * 100}%`,
                                  }}
                                />

                                <div
                                  title={`Appointments: ${item.appointments}`}
                                  className="w-2/5 rounded-t bg-emerald-500 transition-all hover:bg-emerald-600"
                                  style={{
                                    height: `${(item.appointments / maxValue) * 100}%`,
                                  }}
                                />
                              </div>

                              <span className="text-[10px] text-slate-500 sm:text-xs">
                                {item.month}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="mt-5 flex flex-wrap justify-center gap-5 text-xs text-slate-600">
                          <span className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-sm bg-blue-500" />
                            Patients
                          </span>

                          <span className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-sm bg-emerald-500" />
                            Appointments
                          </span>
                        </div>
                      </>
                    ) : (
                      <p className="py-16 text-center text-sm text-slate-500">
                        No monthly activity available.
                      </p>
                    )}
                  </div>
                )}

                {/* Department Chart */}
                {(activeReport === 'overview' ||
                  activeReport === 'doctors') && (
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="font-bold text-slate-800">
                      Department Performance
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Doctors by department
                    </p>

                    <div className="mt-7 space-y-5">
                      {departmentData.length > 0 ? (
                        departmentData.map((item, index) => (
                          <div key={item.department}>
                            <div className="mb-2 flex justify-between gap-2 text-sm">
                              <span className="font-medium text-slate-700">
                                {item.department}
                              </span>

                              <span className="text-slate-500">
                                {item.doctors}
                              </span>
                            </div>

                            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full ${
                                  [
                                    'bg-blue-500',
                                    'bg-purple-500',
                                    'bg-green-500',
                                    'bg-orange-500',
                                    'bg-pink-500',
                                  ][index % 5]
                                }`}
                                style={{
                                  width: `${(item.doctors / maxDepartmentDoctors) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">
                          No department data available.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Appointment Status Report */}
            {(activeReport === 'overview' ||
              activeReport === 'appointments') && (
              <div className="mb-7 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5">
                  <h3 className="font-bold text-slate-800">
                    Appointment Status Summary
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Breakdown of appointments by status
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      label: 'Pending',
                      value: appointmentStatuses.Pending || 0,
                      color: 'text-yellow-600 bg-yellow-50',
                    },
                    {
                      label: 'Confirmed',
                      value: appointmentStatuses.Confirmed || 0,
                      color: 'text-blue-600 bg-blue-50',
                    },
                    {
                      label: 'Completed',
                      value: appointmentStatuses.Completed || 0,
                      color: 'text-green-600 bg-green-50',
                    },
                    {
                      label: 'Cancelled',
                      value: appointmentStatuses.Cancelled || 0,
                      color: 'text-red-600 bg-red-50',
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-slate-100 p-4"
                    >
                      <p className="text-sm text-slate-500">
                        {item.label}
                      </p>

                      <h4 className={`mt-2 inline-block rounded-lg px-3 py-1 text-2xl font-bold ${item.color}`}>
                        {item.value}
                      </h4>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Revenue Report */}
            {(activeReport === 'overview' ||
              activeReport === 'revenue') && (
              <div className="mb-7 grid grid-cols-1 gap-6 lg:grid-cols-2">

                {/* Financial Summary */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="rounded-lg bg-green-50 p-3 text-green-600">
                      <IndianRupee size={22} />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-800">
                        Financial Summary
                      </h3>

                      <p className="text-sm text-slate-500">
                        Hospital income overview
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      {
                        label: 'Total Revenue',
                        amount: overview.totalRevenue,
                        color: 'text-green-600',
                      },
                      {
                        label: 'Amount Received',
                        amount: overview.receivedAmount,
                        color: 'text-blue-600',
                      },
                      {
                        label: 'Pending Payments',
                        amount: overview.pendingDues,
                        color: 'text-orange-600',
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0"
                      >
                        <span className="text-sm text-slate-600">
                          {item.label}
                        </span>

                        <span className={`font-bold ${item.color}`}>
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hospital Summary */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="rounded-lg bg-purple-50 p-3 text-purple-600">
                      <Activity size={22} />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-800">
                        Hospital Summary
                      </h3>

                      <p className="text-sm text-slate-500">
                        Key operational indicators
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">
                        Total Bills
                      </p>

                      <h4 className="mt-2 text-xl font-bold text-slate-800">
                        {overview.totalBills || 0}
                      </h4>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">
                        Total Patients
                      </p>

                      <h4 className="mt-2 text-xl font-bold text-slate-800">
                        {overview.totalPatients || 0}
                      </h4>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">
                        Completed Appointments
                      </p>

                      <h4 className="mt-2 text-xl font-bold text-slate-800">
                        {appointmentStatuses.Completed || 0}
                      </h4>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">
                        Pending Appointments
                      </p>

                      <h4 className="mt-2 text-xl font-bold text-slate-800">
                        {appointmentStatuses.Pending || 0}
                      </h4>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Information */}
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-white p-2 text-blue-600">
                  <ClipboardList size={20} />
                </div>

                <div>
                  <h3 className="font-semibold text-blue-900">
                    Reports Information
                  </h3>

                  <p className="mt-1 text-sm leading-relaxed text-blue-800">
                    This dashboard displays live hospital statistics,
                    patient activity, appointments, department information
                    and financial performance fetched from the MediCare
                    database.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Reports
