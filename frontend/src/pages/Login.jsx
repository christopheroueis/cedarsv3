import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Building2, User, Lock, ChevronDown } from 'lucide-react'
import VideoBackground from '../components/VideoBackground'
import LogoAnimation from '../components/LogoAnimation'

export default function Login() {
    const [mfiId, setMfiId] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const { login } = useAuth()
    const navigate = useNavigate()

    const mfis = [
        { id: 'bangladesh-mfi', name: 'Grameen Climate Finance', country: 'Bangladesh 🇧🇩' },
        { id: 'kenya-mfi', name: 'M-Pesa Green Loans', country: 'Kenya 🇰🇪' },
        { id: 'peru-mfi', name: 'Banco Sol Verde', country: 'Peru 🇵🇪' }
    ]

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const result = await login(mfiId, username, password)

        if (result.success) {
            navigate('/')
        } else {
            setError(result.error)
        }
        setLoading(false)
    }

    return (
        <VideoBackground>
            <div className="min-h-screen flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="flex justify-center mb-8">
                        <LogoAnimation size="medium" animation="fadeIn" />
                    </div>

                    {/* Login Card */}
                    <div className="bg-white rounded-2xl shadow-2xl p-8">
                        <div className="mb-6">
                            <h2 className="text-2xl font-semibold mb-2" style={{ color: '#2C2C2C' }}>
                                Sign In
                            </h2>
                            <p className="text-sm" style={{ color: '#666666' }}>
                                Access your climate-smart lending platform
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* MFI Selection */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium flex items-center gap-2" style={{ color: '#2C2C2C' }}>
                                    <Building2 className="w-4 h-4" />
                                    Institution
                                </label>
                                <div className="relative">
                                    <select
                                        value={mfiId}
                                        onChange={(e) => setMfiId(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 border rounded-lg appearance-none pr-10 transition-all"
                                        style={{
                                            backgroundColor: '#FAFAFA',
                                            borderColor: '#E5E5E5',
                                            color: '#2C2C2C'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#2D5F3F'}
                                        onBlur={(e) => e.target.style.borderColor = '#E5E5E5'}
                                    >
                                        <option value="">Select your MFI...</option>
                                        {mfis.map(mfi => (
                                            <option key={mfi.id} value={mfi.id}>
                                                {mfi.name} — {mfi.country}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: '#999999' }} />
                                </div>
                            </div>

                            {/* Username */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium flex items-center gap-2" style={{ color: '#2C2C2C' }}>
                                    <User className="w-4 h-4" />
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your username"
                                    required
                                    autoComplete="username"
                                    className="w-full px-4 py-3 border rounded-lg transition-all"
                                    style={{
                                        backgroundColor: '#FAFAFA',
                                        borderColor: '#E5E5E5',
                                        color: '#2C2C2C'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#2D5F3F'}
                                    onBlur={(e) => e.target.style.borderColor = '#E5E5E5'}
                                />
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium flex items-center gap-2" style={{ color: '#2C2C2C' }}>
                                    <Lock className="w-4 h-4" />
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    autoComplete="current-password"
                                    className="w-full px-4 py-3 border rounded-lg transition-all"
                                    style={{
                                        backgroundColor: '#FAFAFA',
                                        borderColor: '#E5E5E5',
                                        color: '#2C2C2C'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#2D5F3F'}
                                    onBlur={(e) => e.target.style.borderColor = '#E5E5E5'}
                                />
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="p-3 rounded-lg text-sm" style={{
                                    backgroundColor: 'rgb(239 68 68 / 0.1)',
                                    border: '1px solid rgb(239 68 68 / 0.3)',
                                    color: '#E53935'
                                }}>
                                    {error}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 rounded-lg font-semibold text-white transition-all duration-200 
                                         disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] hover:shadow-lg"
                                style={{ backgroundColor: '#2D5F3F' }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgb(45, 95, 63 / 0.9)'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#2D5F3F'}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Signing in...
                                    </span>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>

                        {/* Demo Credentials */}
                        <div className="mt-6 pt-6 border-t" style={{ borderColor: '#E5E5E5' }}>
                            <p className="text-xs text-center mb-2" style={{ color: '#999999' }}>Demo Credentials</p>
                            <div className="text-center text-xs p-2 rounded" style={{ backgroundColor: '#F5F3ED', color: '#666666' }}>
                                <code>officer1 / officer2 / officer3</code> — Password: <code>demo123</code>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-center mt-6 text-sm text-white/80">
                        © 2026 ClimateCredit • Climate-Smart Lending Platform
                    </p>
                </div>
            </div>
        </VideoBackground>
    )
}
