import { X, AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '../utils/helpers'

/* ─── MODAL ──────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null
  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative w-full bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl shadow-black/60 animate-scale-in', widths[size])}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ─── CONFIRM DIALOG ─────────────────────────────────────────── */
export function ConfirmDialog({ open, onClose, onConfirm, title, message, loading }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl animate-scale-in">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{title}</h3>
            <p className="text-sm text-gray-400 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── SKELETON ───────────────────────────────────────────────── */
export function Skeleton({ className }) {
  return (
    <div
      className={cn('rounded-xl bg-gray-800 animate-pulse', className)}
      style={{ minHeight: '1rem' }}
    />
  )
}

/* ─── EMPTY STATE ────────────────────────────────────────────── */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center mb-4">
        {Icon && <Icon size={28} className="text-gray-500" />}
      </div>
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-xs">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

/* ─── STAT CARD ──────────────────────────────────────────────── */
export function StatCard({ label, value, icon: Icon, color = '#4f46e5' }) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-gray-600 transition-colors">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
        style={{ background: color + '20', border: `1px solid ${color}30` }}>
        {Icon && <Icon size={18} style={{ color }} />}
      </div>
      <p className="text-2xl font-bold text-white leading-none">{value}</p>
      <p className="text-xs text-gray-500 mt-1.5">{label}</p>
    </div>
  )
}

/* ─── SPINNER ────────────────────────────────────────────────── */
export function Spinner({ size = 20 }) {
  return <Loader2 size={size} className="animate-spin text-indigo-400" />
}

/* ─── PAGE HEADER ────────────────────────────────────────────── */
export function PageHeader({ title, description, action }) {
  return (
    <div className="flex items-start justify-between mb-6 gap-4">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}