
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Search,
  Settings,
  Stethoscope,
  Users,
  UserRound,
  X,
  Bell,
  HeartPulse,
  Plus,
  LoaderCircle,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import toast, { Toaster } from 'react-hot-toast'

import API from './services/api'
import { useAuth } from './context/AuthContext'

const navigation = [
  {
    title: 'MAIN MENU',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard },
      { label: 'Appointments', icon: CalendarDays },
      { label: 'Patients', icon: Users },
      { label: 'Doctors', icon: Stethoscope },
      { label: 'Receptionists', icon: UserRound },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      { label: 'Prescriptions', icon: FileText },
      { label: 'Medical Records', icon: ClipboardList },
      { label: 'Billing & Payments', icon: CreditCard },
      { label: 'Reports & Analytics', icon: Activity },
    ],
  },
  {
    title: 'PREFERENCES',
    items: [
      { label: 'Settings', icon: Settings },
    ],
  },
]

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN')}`

const formatDate = (value) => {
  if (!value) return 'N/A'

  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const formatTime = (value) => {
  if (!value) return 'N/A'

  // Appointment time is stored as a string in the database.
  return value
}

const getRelativeTime = (value) => {
  if (!value) return 'Time unavailable'

  const date = new Date(value)
  const difference = Math.max(0, Date.now() - date.getTime())

  const minutes = Math.floor(difference / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`

  return formatDate(value)
}

function StatCard({ title, value, icon: Icon, iconBg }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon size={21} />
        </div>

        <button
          onClick={() => toast(`${title}: ${value}`)}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          aria-label={`More about ${title}`}
        >
          <MoreHorizontal size={20} />
        </button>
      </div>

      <p className="mt-4 text-sm font-medium text-slate-500">{title}</p>

      <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-800">
        {value}
      </h3>

      <p className="mt-2 text-xs text-slate-400">
        Live database statistics
      </p>
    </div>
  )
}

function App() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [activePage, setActivePage] = useState('Dashboard')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [search, setSearch] = useState('')

  const [dashboardData, setDashboardData] = useState({
    statistics: {
      totalUsers: 0,
      totalPatients: 0,
      totalDoctors: 0,
      totalReceptionists: 0,
      totalAdmins: 0,
    },
    revenueData: [],
    appointmentData: [],
    recentAppointments: [],
    recentActivities: [],
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch complete dashboard data from MongoDB through backend API.
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await API.get('/admin/dashboard')

      setDashboardData({
        statistics: response.data.statistics || {},
        revenueData: response.data.revenueData || [],
        appointmentData: response.data.appointmentData || [],
        recentAppointments: response.data.recentAppointments || [],
        recentActivities: response.data.recentActivities || [],
      })
    } catch (error) {
      console.error('Dashboard API error:', error)

      setError(
        error.response?.data?.message ||
          'Unable to load dashboard data. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const statistics = dashboardData.statistics
  const revenueData = dashboardData.revenueData
  const appointmentData = dashboardData.appointmentData
  const appointments = dashboardData.recentAppointments
  const activities = dashboardData.recentActivities

  const filteredAppointments = useMemo(() => {
    const searchText = search.trim().toLowerCase()

    if (!searchText) return appointments

    return appointments.filter((item) =>
      `${item.name} ${item.doctor} ${item.department} ${item.status}`
        .toLowerCase()
        .includes(searchText)
    )
  }, [appointments, search])

  const weeklyAppointmentTotal = appointmentData.reduce(
    (total, item) => total + Number(item.count || 0),
    0
  )

  const adminName = user?.name || 'Admin User'

  const adminInitials = adminName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const handleNavigation = (label) => {
    setActivePage(label)
    setMobileMenu(false)

    const routes = {
      Doctors: '/doctors',
      Patients: '/patients',
      Appointments: '/appointments',
      Receptionists: '/receptionists',
      Prescriptions: '/prescriptions',
      'Medical Records': '/medical-records',
      'Billing & Payments': '/billing',
      'Reports & Analytics': '/reports',
      Settings: '/settings',
    }

    if (routes[label]) {
      navigate(routes[label])
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
    toast.success('Logged out successfully')
  }

  const getActivityIcon = (type) => {
    if (type === 'patient') return Users
    if (type === 'appointment') return CalendarDays
    if (type === 'payment') return CreditCard

    return Activity
  }

  const getStatusStyle = (status) => {
    if (status === 'Confirmed') {
      return 'bg-emerald-50 text-emerald-700'
    }

    if (status === 'Pending') {
      return 'bg-amber-50 text-amber-700'
    }

    if (status === 'Completed') {
      return 'bg-blue-50 text-blue-700'
    }

    return 'bg-rose-50 text-rose-600'
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-800">
      <Toaster position="top-right" />

      {mobileMenu && (
        <button
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          onClick={() => setMobileMenu(false)}
          aria-label="Close menu"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-100 bg-white transition-transform duration-300 ${
          mobileMenu ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <HeartPulse size={23} />
            </div>

            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-800">
                MediCare
              </h1>
              <p className="text-[10px] font-semibold uppercase tracking-[2px] text-blue-600">
                Smart Healthcare
              </p>
            </div>
          </div>

          <button
            className="text-slate-400 lg:hidden"
            onClick={() => setMobileMenu(false)}
          >
            <X size={21} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          {navigation.map((group) => (
            <div key={group.title} className="mb-7">
              <p className="mb-3 px-3 text-[10px] font-bold tracking-[1.5px] text-slate-400">
                {group.title}
              </p>

              <div className="space-y-1">
                {group.items.map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    onClick={() => handleNavigation(label)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                      activePage === label
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
                    }`}
                  >
                    <Icon size={19} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
              {adminInitials}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{adminName}</p>
              <p className="text-xs text-slate-400">Administrator</p>
            </div>

            <button
              onClick={handleLogout}
              aria-label="Logout"
              title="Logout"
              className="text-slate-400 hover:text-rose-500"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-h-screen lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-100 bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setMobileMenu(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu size={22} />
            </button>

            <div>
              <h2 className="text-lg font-bold text-slate-800 sm:text-xl">
                {activePage}
              </h2>
              <p className="hidden text-xs text-slate-400 sm:block">
                Welcome back! Here's what's happening today.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:flex">
              <Search size={17} className="text-slate-400" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search appointments..."
                className="w-40 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />

              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="text-slate-400"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <button
              onClick={() => toast('You are all caught up!')}
              className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50"
              aria-label="Notifications"
            >
              <Bell size={19} />
            </button>

            <div className="hidden h-9 w-px bg-slate-200 sm:block" />

            <button
              onClick={() => toast(`Logged in as ${adminName}`)}
              className="flex items-center gap-2"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                {adminInitials}
              </div>

              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold">{adminName}</p>
                <p className="text-[11px] text-slate-400">Super Admin</p>
              </div>

              <ChevronDown size={15} className="hidden text-slate-400 sm:block" />
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {/* Dashboard Heading */}
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">
                MediCare Administration
              </p>
              <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
                Hospital Overview
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Monitor your hospital's performance at a glance.
              </p>
            </div>

            <button
              onClick={() => navigate('/appointments')}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
            >
              <Plus size={18} /> New Appointment
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <span>{error}</span>
              <button
                onClick={fetchDashboardData}
                className="font-semibold underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Statistics */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Patients"
              value={loading ? '...' : Number(statistics.totalPatients || 0).toLocaleString('en-IN')}
              icon={Users}
              iconBg="bg-blue-50 text-blue-600"
            />

            <StatCard
              title="Total Doctors"
              value={loading ? '...' : Number(statistics.totalDoctors || 0).toLocaleString('en-IN')}
              icon={Stethoscope}
              iconBg="bg-purple-50 text-purple-600"
            />

            <StatCard
              title="Receptionists"
              value={loading ? '...' : Number(statistics.totalReceptionists || 0).toLocaleString('en-IN')}
              icon={UserRound}
              iconBg="bg-emerald-50 text-emerald-600"
            />

            <StatCard
              title="Total Users"
              value={loading ? '...' : Number(statistics.totalUsers || 0).toLocaleString('en-IN')}
              icon={Activity}
              iconBg="bg-orange-50 text-orange-600"
            />
          </section>

          {loading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <LoaderCircle size={16} className="animate-spin" />
              Fetching live dashboard data...
            </div>
          )}

          {/* Charts */}
          <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
            {/* Revenue Analytics */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-2 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-slate-800">
                    Revenue Analytics
                  </h4>
                  <p className="mt-1 text-xs text-slate-400">
                    Actual monthly collected payments · Last 12 months
                  </p>
                </div>

                <span className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                  Live Revenue
                </span>
              </div>

              <div className="mt-6 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient
                        id="revenueFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#2563eb" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid stroke="#eef2f7" vertical={false} />

                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      tickFormatter={(value) =>
                        value >= 1000 ? `${value / 1000}k` : value
                      }
                    />

                    <Tooltip
                      formatter={(value) => [
                        formatCurrency(value),
                        'Collected Revenue',
                      ]}
                    />

                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      fill="url(#revenueFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 flex gap-5 text-xs text-slate-500">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-600" />
                  Collected Revenue
                </span>
              </div>
            </div>

            {/* Weekly Appointments */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800">
                    Weekly Appointments
                  </h4>
                  <p className="mt-1 text-xs text-slate-400">
                    Current week · Monday to Sunday
                  </p>
                </div>

                <button
                  onClick={() => navigate('/appointments')}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-50"
                  aria-label="View appointments"
                >
                  <MoreHorizontal size={20} />
                </button>
              </div>

              <div className="mt-6 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={appointmentData}>
                    <CartesianGrid stroke="#eef2f7" vertical={false} />

                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                    />

                    <YAxis hide allowDecimals={false} />

                    <Tooltip
                      formatter={(value) => [
                        `${value} appointments`,
                        'Appointments',
                      ]}
                    />

                    <Bar
                      dataKey="count"
                      name="Appointments"
                      fill="#3b82f6"
                      radius={[6, 6, 0, 0]}
                      barSize={22}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 rounded-xl bg-blue-50 p-3">
                <p className="text-xs text-blue-600">
                  Total appointments this week
                </p>
                <p className="mt-1 text-xl font-bold text-blue-900">
                  {loading ? '...' : weeklyAppointmentTotal} Appointments
                </p>
              </div>
            </div>
          </section>

          {/* Recent Appointments and Activity */}
          <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
            {/* Recent Appointments */}
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm xl:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 sm:px-6">
                <div>
                  <h4 className="font-bold text-slate-800">
                    Recent Appointments
                  </h4>
                  <p className="mt-1 text-xs text-slate-400">
                    Latest appointments from hospital database
                  </p>
                </div>

                <button
                  onClick={() => navigate('/appointments')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  View all
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Patient</th>
                      <th className="px-4 py-3 font-semibold">Doctor</th>
                      <th className="px-4 py-3 font-semibold">Department</th>
                      <th className="px-4 py-3 font-semibold">Date & Time</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-50">
                    {filteredAppointments.map((item) => (
                      <tr
                        key={item._id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                              {item.initials}
                            </div>

                            <span className="whitespace-nowrap text-sm font-semibold text-slate-700">
                              {item.name}
                            </span>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">
                          {item.doctor}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">
                          {item.department}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">
                          <div>{formatDate(item.date)}</div>
                          <div className="mt-1 text-xs text-slate-400">
                            {formatTime(item.time)}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${getStatusStyle(item.status)}`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {!loading && filteredAppointments.length === 0 && (
                      <tr>
                        <td
                          colSpan="5"
                          className="px-6 py-8 text-center text-sm text-slate-400"
                        >
                          {search
                            ? 'No matching appointments found.'
                            : 'No appointments available yet.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800">
                    Recent Activity
                  </h4>
                  <p className="mt-1 text-xs text-slate-400">
                    Latest database record updates
                  </p>
                </div>

                <button
                  onClick={fetchDashboardData}
                  className="text-slate-400 hover:text-blue-600"
                  aria-label="Refresh dashboard"
                  title="Refresh"
                >
                  <MoreHorizontal size={20} />
                </button>
              </div>

              <div className="mt-6 space-y-6">
                {activities.map((activity, index) => {
                  const Icon = getActivityIcon(activity.type)

                  return (
                    <div
                      key={`${activity.type}-${activity.createdAt}-${index}`}
                      className="flex gap-3"
                    >
                      <div className="relative">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <Icon size={17} />
                        </div>

                        {index !== activities.length - 1 && (
                          <div className="absolute left-1/2 top-10 h-7 w-px -translate-x-1/2 bg-slate-100" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-700">
                          {activity.title}
                        </p>

                        <p className="mt-1 break-words text-xs text-slate-400">
                          {activity.detail}
                        </p>

                        <p className="mt-2 text-[10px] font-medium text-slate-400">
                          {getRelativeTime(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })}

                {!loading && activities.length === 0 && (
                  <p className="py-6 text-center text-sm text-slate-400">
                    No recent activity available.
                  </p>
                )}
              </div>

              <button
                onClick={fetchDashboardData}
                className="mt-7 w-full rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Refresh Dashboard Data
              </button>
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 py-5 text-xs text-slate-400">
            <p>© 2026 MediCare. Smart Hospital Management System.</p>

            <p className="flex items-center gap-1">
              <HeartPulse size={13} className="text-blue-500" />
              Designed for better healthcare
            </p>
          </footer>
        </div>
      </main>
    </div>
  )
}

export default App
