
import { useAuth } from '../context/AuthContext'
import {
  HeartPulse,
  UserRound,
  CalendarDays,
  LogOut,
  ClipboardList,
} from 'lucide-react'

const ReceptionistDashboard = () => {
  const { user, logout } = useAuth()

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
                Receptionist Portal
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 font-medium text-red-600 transition hover:bg-red-100"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg sm:p-8">
          <p className="text-sm text-blue-100">
            Welcome back,
          </p>

          <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
            {user?.name || 'Receptionist'}
          </h2>

          <p className="mt-4 text-sm leading-6 text-blue-100">
            Welcome to your MediCare Receptionist Portal.
            Manage your hospital front-desk activities from here.
          </p>
        </div>

        <h2 className="mb-2 text-xl font-bold text-gray-900">
          Receptionist Workspace
        </h2>

        <p className="mb-6 text-sm text-gray-500">
          Your receptionist account is active.
        </p>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 inline-flex rounded-xl bg-blue-100 p-3 text-blue-600">
              <CalendarDays size={25} />
            </div>
            <h3 className="font-bold text-gray-900">
              Appointment Desk
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Hospital appointment desk.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 inline-flex rounded-xl bg-green-100 p-3 text-green-600">
              <UserRound size={25} />
            </div>
            <h3 className="font-bold text-gray-900">
              Patient Support
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Patient registration and assistance.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 inline-flex rounded-xl bg-purple-100 p-3 text-purple-600">
              <ClipboardList size={25} />
            </div>
            <h3 className="font-bold text-gray-900">
              Front Desk
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Receptionist workspace.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <h3 className="font-semibold text-blue-900">
            Account Information
          </h3>
          <p className="mt-2 text-sm text-blue-800">
            Name: {user?.name || 'N/A'}
          </p>
          <p className="mt-1 text-sm text-blue-800">
            Email: {user?.email || 'N/A'}
          </p>
          <p className="mt-1 text-sm text-blue-800">
            Role: {user?.role || 'Receptionist'}
          </p>
        </div>
      </main>
    </div>
  )
}

export default ReceptionistDashboard
