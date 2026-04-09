import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../api/services'
import { CURRENCIES, getErrorMessage } from '../utils/helpers'
import toast from 'react-hot-toast'
import { TrendingDown, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react'

const INPUT = 'w-full bg-gray-800 border border-gray-700 focus:border-indigo-500 text-white placeholder:text-gray-500 rounded-xl px-4 py-2.5 outline-none transition-colors text-sm'
const LABEL = 'block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5'

const FEATURES = [
  { icon: '📊', label: 'Visual spending breakdowns' },
  { icon: '🎯', label: 'Smart budget tracking' },
  { icon: '📅', label: 'Calendar expense view' },
  { icon: '🔍', label: 'Advanced filtering & search' },
]

export default function AuthPage({ mode }) {
  const isLogin = mode === 'login'
  const { login } = useAuth()
  const navigate   = useNavigate()
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm]         = useState({ name: '', email: '', password: '', currency: 'USD' })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      let res
      if (isLogin) {
        res = await authApi.login(form.email, form.password)
      } else {
        if (!form.name.trim()) { toast.error('Name is required'); setLoading(false); return }
        res = await authApi.signup({ name: form.name, email: form.email, password: form.password, currency: form.currency })
      }
      login(res.data.access_token, res.data.user)
      toast.success(isLogin ? 'Welcome back!' : 'Account created!')
      navigate('/')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f17] flex overflow-hidden">

      {/* ── Left branding panel (desktop) ── */}
      <div className="hidden lg:flex flex-col w-[440px] bg-gray-950 border-r border-gray-800 p-12 relative overflow-hidden flex-shrink-0">
        {/* Glow blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/6 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-80 h-80 bg-indigo-800/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <TrendingDown size={19} className="text-white" />
            </div>
            <span className="font-bold text-white text-2xl">Spendly</span>
          </div>

          {/* Hero copy */}
          <div className="flex-1 flex flex-col justify-center gap-6">
            <div className="inline-flex items-center gap-2 bg-indigo-600/10 border border-indigo-600/20 rounded-full px-4 py-1.5 w-fit">
              <Sparkles size={13} className="text-indigo-400" />
              <span className="text-indigo-400 text-xs font-medium">Smart expense tracking</span>
            </div>
            <h2 className="font-bold text-4xl text-white leading-snug">
              Track every dirham,<br />
              <span className="text-indigo-400">own your finances.</span>
            </h2>
            <p className="text-gray-400 text-base leading-relaxed">
              Beautiful dashboards, powerful insights, and budget management — all in one place.
            </p>
            <div className="space-y-3 mt-2">
              {FEATURES.map(f => (
                <div key={f.label} className="flex items-center gap-3 text-gray-400">
                  <span className="text-lg">{f.icon}</span>
                  <span className="text-sm">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-700">© 2025 Spendly. Your data, your control.</p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-slide-up">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <TrendingDown size={19} className="text-white" />
            </div>
            <span className="font-bold text-white text-2xl">Spendly</span>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 shadow-2xl shadow-black/50">
            <div className="mb-7">
              <h1 className="text-2xl font-bold text-white">
                {isLogin ? 'Welcome back' : 'Create account'}
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                {isLogin ? 'Sign in to your Spendly account' : 'Start tracking your expenses today'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className={LABEL}>Full Name</label>
                  <input className={INPUT} type="text" placeholder="Alex Johnson"
                    value={form.name} onChange={e => set('name', e.target.value)} required />
                </div>
              )}

              <div>
                <label className={LABEL}>Email Address</label>
                <input className={INPUT} type="email" placeholder="you@example.com"
                  value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>

              <div>
                <label className={LABEL}>Password</label>
                <div className="relative">
                  <input
                    className={INPUT + ' pr-12'}
                    type={showPass ? 'text' : 'password'}
                    placeholder={isLogin ? '••••••••' : 'Minimum 6 characters'}
                    value={form.password} onChange={e => set('password', e.target.value)} required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-300"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className={LABEL}>Currency</label>
                  <select className={INPUT} value={form.currency} onChange={e => set('currency', e.target.value)}>
                    {CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {loading
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={16} /></>
                }
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <Link
                to={isLogin ? '/signup' : '/login'}
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}