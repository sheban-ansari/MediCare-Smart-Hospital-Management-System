import API from '../services/api'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
    ArrowLeft,
    User,
    Lock,
    Building2,
    Settings as SettingsIcon,
    Save,
    Mail,
    Phone,
    MapPin,
    Eye,
    EyeOff,
    ShieldCheck,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const Settings = () => {
    const navigate = useNavigate()
    const { user, updateUser } = useAuth()
    const [activeTab, setActiveTab] = useState('profile')
    const [showPassword, setShowPassword] = useState(false)

    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phone: '',
    })

    useEffect(() => {
        if (user) {
            setProfile({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
            })
        }
    }, [user])

    useEffect(() => {
        const fetchHospitalSettings = async () => {
            try {
                const response = await API.get('/hospital-settings')

                if (response.data.settings) {
                    setHospital(response.data.settings)
                    if (response.data.settings.preferences) {
                        setPreferences(response.data.settings.preferences)
                    }
                }
            } catch (error) {
                console.error(
                    'Failed to load hospital settings:',
                    error.response?.data?.message || error.message
                )
            }
        }

        fetchHospitalSettings()
    }, [])

    const [savingProfile, setSavingProfile] = useState(false)
    const [profileMessage, setProfileMessage] = useState('')

    const [savingHospital, setSavingHospital] = useState(false)
    const [hospitalMessage, setHospitalMessage] = useState('')

    const [password, setPassword] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    })

    const [hospital, setHospital] = useState({
        name: 'MediCare Hospital',
        email: '',
        phone: '',
        address: '',
    })

    const [preferences, setPreferences] = useState({
        currency: 'INR',
        dateFormat: 'DD/MM/YYYY',
        language: 'English',
    })

    const tabs = [
        { id: 'profile', label: 'Profile Settings', icon: User },
        { id: 'password', label: 'Change Password', icon: Lock },
        { id: 'hospital', label: 'Hospital Information', icon: Building2 },
        { id: 'preferences', label: 'System Preferences', icon: SettingsIcon },
    ]

    const inputClass =
        'w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

    const handleProfileSave = async () => {
        try {
            setSavingProfile(true)
            setProfileMessage('')

            const response = await API.put('/auth/update-profile', profile)

            updateUser(response.data.user)

            setProfileMessage('Profile updated successfully!')
        } catch (error) {
            setProfileMessage(
                error.response?.data?.message || 'Profile update failed'
            )
        } finally {
            setSavingProfile(false)
        }
    }

    const handleHospitalSave = async () => {
        try {
            setSavingHospital(true)
            setHospitalMessage('')

            const response = await API.put('/hospital-settings', hospital)

            setHospital(response.data.settings)
            setHospitalMessage('Hospital information updated successfully!')
        } catch (error) {
            setHospitalMessage(
                error.response?.data?.message || 'Failed to update hospital information'
            )
        } finally {
            setSavingHospital(false)
        }
    }

    const handlePreferencesSave = async () => {
        try {
            setSavingHospital(true)
            setHospitalMessage('')

            const response = await API.put('/hospital-settings', {
                ...hospital,
                preferences,
            })

            setHospital(response.data.settings)
            setPreferences(response.data.settings.preferences)

            setHospitalMessage('Preferences updated successfully!')
        } catch (error) {
            setHospitalMessage(
                error.response?.data?.message || 'Failed to update preferences'
            )
        } finally {
            setSavingHospital(false)
        }
    }

    const handlePasswordChange = async () => {
        try {
            if (password.newPassword !== password.confirmPassword) {
                setProfileMessage('New password and confirm password do not match')
                return
            }

            const response = await API.put('/auth/change-password', password)

            setProfileMessage(response.data.message)

            setPassword({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            })
        } catch (error) {
            setProfileMessage(
                error.response?.data?.message || 'Password change failed'
            )
        }
    }

    const handleSave = () => {
        alert('Settings UI is ready. Backend integration will be added next.')
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">

                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/')}
                        className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                        <ArrowLeft size={17} />
                        Back to Dashboard
                    </button>

                    <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">
                        Settings
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Manage your account, hospital information and system preferences.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">

                    {/* Sidebar */}
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                        <div className="mb-3 px-3 py-2">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Settings Menu
                            </h2>
                        </div>

                        <div className="space-y-1">
                            {tabs.map((tab) => {
                                const Icon = tab.icon

                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition ${activeTab === tab.id
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        <Icon size={18} />
                                        {tab.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">

                        {activeTab === 'profile' && (
                            <div>
                                <div className="mb-6 border-b border-slate-100 pb-5">
                                    <h2 className="text-lg font-bold text-slate-800">
                                        Profile Settings
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Manage your personal account information.
                                    </p>
                                </div>

                                <div className="mb-6 flex items-center gap-4">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                                        <User size={30} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-800">Admin Profile</h3>
                                        <p className="text-sm text-slate-500">Administrator Account</p>
                                    </div>
                                </div>

                                <div className="grid gap-5 md:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Full Name
                                        </label>
                                        <input
                                            className={inputClass}
                                            placeholder="Enter your full name"
                                            value={profile.name}
                                            onChange={(e) =>
                                                setProfile({ ...profile, name: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            className={inputClass}
                                            placeholder="Enter email address"
                                            value={profile.email}
                                            onChange={(e) =>
                                                setProfile({ ...profile, email: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Phone Number
                                        </label>
                                        <input
                                            className={inputClass}
                                            placeholder="Enter phone number"
                                            value={profile.phone}
                                            onChange={(e) =>
                                                setProfile({ ...profile, phone: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>

                                {profileMessage && (
                                    <p className="mb-4 text-sm font-medium text-green-600">
                                        {profileMessage}
                                    </p>
                                )}

                                <div className="mt-7">
                                    <button
                                        onClick={handleProfileSave}
                                        disabled={savingProfile}
                                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                                    >
                                        <Save size={17} />
                                        {savingProfile ? 'Saving...' : 'Save Profile'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'password' && (
                            <div>
                                <div className="mb-6 border-b border-slate-100 pb-5">
                                    <h2 className="text-lg font-bold text-slate-800">
                                        Change Password
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Update your account password securely.
                                    </p>
                                </div>

                                <div className="max-w-xl space-y-5">
                                    {[
                                        { label: 'Current Password', key: 'currentPassword' },
                                        { label: 'New Password', key: 'newPassword' },
                                        { label: 'Confirm New Password', key: 'confirmPassword' },
                                    ].map((field) => (
                                        <div key={field.key}>
                                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                                {field.label}
                                            </label>

                                            <div className="relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    className={inputClass}
                                                    placeholder={`Enter ${field.label.toLowerCase()}`}
                                                    value={password[field.key]}
                                                    onChange={(e) =>
                                                        setPassword({
                                                            ...password,
                                                            [field.key]: e.target.value,
                                                        })
                                                    }
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                                                >
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {profileMessage && (
                                    <p className="mb-4 text-sm font-medium text-green-600">
                                        {profileMessage}
                                    </p>
                                )}

                                <div className="mt-7">
                                    <button
                                        onClick={handlePasswordChange}
                                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                                    >
                                        <Lock size={17} />
                                        Update Password
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'hospital' && (
                            <div>
                                <div className="mb-6 border-b border-slate-100 pb-5">
                                    <h2 className="text-lg font-bold text-slate-800">
                                        Hospital Information
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Manage your hospital's contact and address information.
                                    </p>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Hospital Name
                                        </label>
                                        <input
                                            className={inputClass}
                                            value={hospital.name}
                                            onChange={(e) =>
                                                setHospital({ ...hospital, name: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-5 md:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                                Hospital Email
                                            </label>
                                            <input
                                                type="email"
                                                className={inputClass}
                                                placeholder="hospital@example.com"
                                                value={hospital.email}
                                                onChange={(e) =>
                                                    setHospital({ ...hospital, email: e.target.value })
                                                }
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                                Contact Number
                                            </label>
                                            <input
                                                className={inputClass}
                                                placeholder="Enter contact number"
                                                value={hospital.phone}
                                                onChange={(e) =>
                                                    setHospital({ ...hospital, phone: e.target.value })
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Hospital Address
                                        </label>
                                        <textarea
                                            rows="3"
                                            className={inputClass}
                                            placeholder="Enter complete hospital address"
                                            value={hospital.address}
                                            onChange={(e) =>
                                                setHospital({ ...hospital, address: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="mt-7">
                                    {hospitalMessage && (
                                        <p className="mb-4 text-sm font-medium text-green-600">
                                            {hospitalMessage}
                                        </p>
                                    )}

                                    <button
                                        onClick={handleHospitalSave}
                                        disabled={savingHospital}
                                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                                    >
                                        <Save size={17} />
                                        {savingHospital ? 'Saving...' : 'Save Hospital Information'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'preferences' && (
                            <div>
                                <div className="mb-6 border-b border-slate-100 pb-5">
                                    <h2 className="text-lg font-bold text-slate-800">
                                        System Preferences
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Configure basic application preferences.
                                    </p>
                                </div>

                                <div className="max-w-xl space-y-5">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Currency
                                        </label>
                                        <select
                                            className={inputClass}
                                            value={preferences.currency}
                                            onChange={(e) =>
                                                setPreferences({
                                                    ...preferences,
                                                    currency: e.target.value,
                                                })
                                            }
                                        >
                                            <option value="INR">INR - Indian Rupee (₹)</option>
                                            <option value="USD">USD - US Dollar ($)</option>
                                            <option value="EUR">EUR - Euro (€)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Date Format
                                        </label>
                                        <select
                                            className={inputClass}
                                            value={preferences.dateFormat}
                                            onChange={(e) =>
                                                setPreferences({
                                                    ...preferences,
                                                    dateFormat: e.target.value,
                                                })
                                            }
                                        >
                                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Language
                                        </label>
                                        <select
                                            className={inputClass}
                                            value={preferences.language}
                                            onChange={(e) =>
                                                setPreferences({
                                                    ...preferences,
                                                    language: e.target.value,
                                                })
                                            }
                                        >
                                            <option value="English">English</option>
                                            <option value="Hindi">Hindi</option>
                                        </select>
                                    </div>
                                </div>

                                {hospitalMessage && (
                                    <p className="mb-4 text-sm font-medium text-green-600">
                                        {hospitalMessage}
                                    </p>
                                )}

                                <div className="mt-7">
                                    <button
                                        onClick={handlePreferencesSave}
                                        disabled={savingHospital}
                                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                                    >
                                        <Save size={17} />
                                        {savingHospital ? 'Saving...' : 'Save Preferences'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="mt-8 flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4">
                            <ShieldCheck size={20} className="mt-0.5 shrink-0 text-blue-600" />
                            <div>
                                <h3 className="text-sm font-semibold text-blue-800">
                                    Account Security
                                </h3>
                                <p className="mt-1 text-xs leading-5 text-blue-700">
                                    Keep your account information updated and use a strong password
                                    to protect your hospital management system.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}

export default Settings