import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../api/services'
import { CURRENCIES, getErrorMessage } from '../utils/helpers'
import { PageHeader } from '../components/UI'
import toast from 'react-hot-toast'
import { User, Mail, Globe, Shield, Loader2, CheckCircle2 } from 'lucide-react'

const INPUT = 'w-full bg-gray-800 border border-gray-700 focus:border-indigo-500 text-white placeholder:text-gray-500 rounded-xl px-4 py-2.5 pl-10 outline-none transition-colors text-sm'
const LABEL = 'block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [form, setForm]       = useState({ name: user?.name || '', currency: user?.currency || 'USD' })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async e => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Name is required'); return }
    setLoading(true)
    try {
      const res = await authApi.updateProfile({ name: form.name, currency: form.currency })
      updateUser(res.data)
      setSaved(true)
      toast.success('Profile updated')
      setTimeout(() => setSaved(false), 2500)
    } catch (err) { toast.error(getErrorMessage(err)) }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-xl space-y-6 animate-fade-in">
      <PageHeader title="Profile" description="Manage your account settings" />

      {/* Avatar card */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-indigo-600/15 border-2 border-indigo-600/25 flex items-center justify-center flex-shrink-0">
          <span className="font-bold text-4xl text-indigo-400">{user?.name?.charAt(0).toUpperCase()}</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{user?.name}</h2>
          <p className="text-sm text-gray-400 mt-0.5">{user?.email}</p>
          <div className="mt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-600/10 text-indigo-400 border border-indigo-600/20">
              <Shield size={11} /> {user?.role || 'user'}
            </span>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-5">Account Details</h3>
        <form onSubmit={handleSave} className="space-y-4">

          <div>
            <label className={LABEL}>Full Name</label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input className={INPUT} type="text" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
          </div>

          <div>
            <label className={LABEL}>Email Address</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input className={INPUT + ' opacity-50 cursor-not-allowed'} type="email" value={user?.email} disabled />
            </div>
            <p className="text-xs text-gray-600 mt-1.5">Email address cannot be changed</p>
          </div>

          <div>
            <label className={LABEL}>Currency Preference</label>
            <div className="relative">
              <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <select className={INPUT} value={form.currency} onChange={e => set('currency', e.target.value)}>
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</option>)}
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2">
            {loading   ? <Loader2 size={16} className="animate-spin" />
             : saved   ? <><CheckCircle2 size={16} /> Saved!</>
             : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Info card */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Account Info</h3>
        <div className="space-y-3 text-sm">
          {[
            { label: 'Member since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—' },
            { label: 'Account role', value: user?.role || 'user', cls: 'capitalize' },
            { label: 'Currency',     value: CURRENCIES.find(c => c.code === user?.currency)?.name || user?.currency },
          ].map(row => (
            <div key={row.label} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
              <span className="text-gray-500">{row.label}</span>
              <span className={`text-gray-300 ${row.cls || ''}`}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}