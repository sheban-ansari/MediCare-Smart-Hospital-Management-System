
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Doctors from './pages/Doctors'
import Patients from './pages/Patients'
import Appointments from './pages/Appointments'
import Receptionists from './pages/Receptionists'
import Prescriptions from './pages/Prescriptions'
import MedicalRecords from './pages/MedicalRecords'
import Billing from './pages/Billing'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import DoctorDashboard from './pages/DoctorDashboard'
import ReceptionistDashboard from './pages/ReceptionistDashboard'
import Dashboard from './Dashboard'

// Protected Role-Based Route
const ProtectedRoute = ({ children, allowedRoles = ['admin'] }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600 font-medium">
          Checking authentication...
        </p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

// Unauthorized Page
const Unauthorized = () => {
  const { logout } = useAuth()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 px-4">
      <h1 className="text-4xl font-bold text-red-600 mb-3">
        Access Denied
      </h1>

      <p className="text-slate-600 mb-6 text-center">
        You do not have permission to access this page.
      </p>

      <button
        onClick={logout}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
      >
        Logout
      </button>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Admin Dashboard */}
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Doctor Dashboard */}
        <Route
          path="/doctor-dashboard"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Receptionist Dashboard */}
        <Route
          path="/receptionist-dashboard"
          element={
            <ProtectedRoute allowedRoles={['receptionist']}>
              <ReceptionistDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctors"
          element={
            <ProtectedRoute>
              <Doctors />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patients"
          element={
            <ProtectedRoute allowedRoles={['admin', 'doctor']}>
              <Patients />
            </ProtectedRoute>
          }
        />

        <Route
          path="/appointments"
          element={
            <ProtectedRoute allowedRoles={['admin', 'doctor']}>
              <Appointments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/receptionists"
          element={
            <ProtectedRoute>
              <Receptionists />
            </ProtectedRoute>
          }
        />

        <Route
          path="/prescriptions"
          element={
            <ProtectedRoute allowedRoles={['admin', 'doctor']}>
              <Prescriptions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/medical-records"
          element={
            <ProtectedRoute allowedRoles={['admin', 'doctor']}>
              <MedicalRecords />
            </ProtectedRoute>
          }
        />

        <Route
          path="/billing"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Billing />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Reports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/unauthorized"
          element={<Unauthorized />}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
