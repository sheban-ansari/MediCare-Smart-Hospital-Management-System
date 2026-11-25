
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  HeartPulse,
  UserRound,
  CalendarDays,
  ClipboardList,
  FileText,
  LogOut,
  Activity,
  ArrowRight,
} from 'lucide-react'

const DoctorDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
  }

  const sections = [
    {
      title: 'My Appointments',
      description: 'View and manage your patient appointments.',
      icon: CalendarDays,
      color: 'bg-blue-100 text-blue-600',
      path: '/appointments',
    },
    {
      title: 'My Patients',
      description: 'Access patient information and details.',
      icon: UserRound,
      color: 'bg-green-100 text-green-600',
      path: '/patients',
    },
    {
      title: 'Prescriptions',
      description: 'Create and manage patient prescriptions.',
      icon: ClipboardList,
      color: 'bg-purple-100 text-purple-600',
      path: '/prescriptions',
    },
    {
      title: 'Medical Records',
      description: 'View patient medical records.',
      icon: FileText,
      color: 'bg-orange-100 text-orange-600',
      path: '/medical-records',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-2 text-white">
              <HeartPulse size={25} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                MediCare
              </h1>
              <p className="text-xs text-gray-500">
                Doctor Portal
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 font-medium text-red-600 transition hover:bg-red-100"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg sm:p-8">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white/20 p-3">
              <Activity size={28} />
            </div>
            <div>
              <p className="text-sm text-blue-100">
                Welcome back,
              </p>
              <h2 className="text-2xl font-bold sm:text-3xl">
                {user?.name?.startsWith('Dr.')
                  ? user.name
                  : `Dr. ${user?.name || 'Doctor'}`}
              </h2>
            </div>
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-blue-100">
            Welcome to your MediCare Doctor Portal. Manage your
            appointments, patients, prescriptions and medical records
            from one place.
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Doctor Workspace
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Access your hospital management tools.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {sections.map((section) => {
            const Icon = section.icon

            return (
              <button
                key={section.title}
                type="button"
                onClick={() => navigate(section.path)}
                className="group rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className={`mb-4 inline-flex rounded-xl p-3 ${section.color}`}>
                  <Icon size={25} />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-gray-900">
                    {section.title}
                  </h3>
                  <ArrowRight
                    size={18}
                    className="text-gray-400 transition group-hover:translate-x-1 group-hover:text-blue-600"
                  />
                </div>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  {section.description}
                </p>
              </button>
            )
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <h3 className="font-semibold text-blue-900">
            Doctor Account Information
          </h3>
          <p className="mt-2 text-sm text-blue-800">
            Name: {user?.name || 'N/A'}
          </p>
          <p className="mt-1 text-sm text-blue-800">
            Email: {user?.email || 'N/A'}
          </p>
          <p className="mt-1 text-sm text-blue-800">
            Role: {user?.role || 'Doctor'}
          </p>
        </div>
      </main>
    </div>
  )
}

export default DoctorDashboard
