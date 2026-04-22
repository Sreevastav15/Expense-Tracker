import { useState, useEffect } from 'react'
import { budgetApi } from '../api/services'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, MONTH_NAMES, getErrorMessage } from '../utils/helpers'
import { PageHeader, EmptyState, Modal, ConfirmDialog, Spinner } from '../components/UI'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Plus, PiggyBank, Trash2, Pencil, Loader2, TrendingUp } from 'lucide-react'

const today = () => new Date().toISOString().slice(0, 10)
const INPUT  = 'w-full bg-gray-800 border border-gray-700 focus:border-indigo-500 text-white placeholder:text-gray-500 rounded-xl px-4 py-2.5 outline-none transition-colors text-sm'
const LABEL  = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5'
const TT     = { contentStyle: { background: '#111827', border: '1px solid #374151', borderRadius: 10, fontFamily: 'inherit', fontSize: 13 }, labelStyle: { color: '#9ca3af' }, itemStyle: { color: '#fff' } }

function BudgetForm({ open, onClose, onSave, budget }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ label: '', total_amount: '', months: '', start_date: today() })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    if (budget) setForm({ label: budget.label || '', total_amount: String(budget.total_amount), months: String(budget.months), start_date: budget.start_date?.slice(0, 10) || today() })
    else        setForm({ label: '', total_amount: '', months: '', start_date: today() })
  }, [budget, open])

  const handleSubmit = async e => {
    e.preventDefault()
    const amt = parseFloat(form.total_amount), mos = parseInt(form.months)
    if (!amt || amt <= 0) { toast.error('Enter a valid budget amount'); return }
    if (!mos || mos <= 0) { toast.error('Enter a valid number of months'); return }
    setLoading(true)
    try {
      await onSave({ total_amount: amt, months: mos, label: form.label || null, start_date: new Date(form.start_date).toISOString() })
      onClose()
    } catch (err) { toast.error(getErrorMessage(err)) }
    finally { setLoading(false) }
  }

  const monthly = form.total_amount && form.months ? (parseFloat(form.total_amount) / parseInt(form.months)).toFixed(2) : null

  return (
    <Modal open={open} onClose={onClose} title={budget ? 'Edit Budget' : 'New Budget'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL}>Label (optional)</label>
          <input className={INPUT} placeholder="e.g. Q1 2025 Budget" value={form.label} onChange={e => set('label', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Total Budget *</label>
            <input className={INPUT} type="number" step="0.01" min="0.01" placeholder="5000.00" value={form.total_amount} onChange={e => set('total_amount', e.target.value)} required />
          </div>
          <div>
            <label className={LABEL}>Over # Months *</label>
            <input className={INPUT} type="number" min="1" placeholder="3" value={form.months} onChange={e => set('months', e.target.value)} required />
          </div>
        </div>
        <div>
          <label className={LABEL}>Start Date</label>
          <input className={INPUT} type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
        </div>
        {monthly && (
          <div className="flex items-center gap-3 bg-indigo-600/10 border border-indigo-600/20 rounded-xl p-3">
            <div className="w-8 h-8 bg-indigo-600/20 rounded-lg flex items-center justify-center">
              <PiggyBank size={15} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Monthly allowance</p>
              <p className="text-white font-bold">${monthly} / month</p>
            </div>
          </div>
        )}
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-2.5 rounded-xl transition-colors text-sm">Cancel</button>
          <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
            {loading ? <Loader2 size={15} className="animate-spin" /> : (budget ? 'Save Changes' : 'Create Budget')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function BudgetsPage() {
  const { user } = useAuth()
  const currency = user?.currency || 'USD'
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editBudget, setEditBudget] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    setLoading(true)
    try { const r = await budgetApi.list(); setBudgets(r.data) }
    catch (err) { toast.error(getErrorMessage(err)) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleSave = async data => {
    if (editBudget) { await budgetApi.update(editBudget.id, data); toast.success('Budget updated') }
    else            { await budgetApi.create(data);                  toast.success('Budget created') }
    setEditBudget(null); load()
  }

  const handleDelete = async () => {
    setDeleting(true)
    try { await budgetApi.delete(deleteId); toast.success('Budget deleted'); setDeleteId(null); load() }
    catch (err) { toast.error(getErrorMessage(err)) }
    finally { setDeleting(false) }
  }

  // Compute total spent + remaining across all budgets for the summary banner
  const totalBudgeted = budgets.reduce((s, b) => s + b.total_amount, 0)
  const totalSpentAll = budgets.reduce((s, b) => s + (b.spent || 0), 0)
  const totalMonthlyAllowance = budgets.reduce((s,b) => s + (b.monthly_allowance || 0), 0)
  const overallProgress = totalBudgeted > 0 ? Math.min(100, (totalSpentAll / totalBudgeted) * 100) : 0

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Budgets"
        description="Set spending limits and track your progress"
        action={
          <button onClick={() => { setEditBudget(null); setShowForm(true) }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-xl transition-colors text-sm">
            <Plus size={15} /> New Budget
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20"><Spinner size={24} /></div>
      ) : budgets.length === 0 ? (
        <div className="bg-gray-900 border border-gray-700 rounded-2xl">
          <EmptyState icon={PiggyBank} title="No budgets yet" description="Create a budget to track your spending against limits"
            action={<button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-xl transition-colors text-sm"><Plus size={15} /> Create Budget</button>}
          />
        </div>
      ) : (
        <div className="space-y-6">

          {/* Overall summary banner */}
          {budgets.length > 1 && (
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-indigo-400" />
                  <p className="text-sm font-semibold text-white">Overall Budget Summary</p>
                </div>
                <span className={`text-sm font-mono font-bold ${totalSpentAll > totalBudgeted ? 'text-red-400' : 'text-indigo-400'}`}>
                  {overallProgress.toFixed(1)}% used
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[
                  { label: 'Total Budgeted', value: formatCurrency(totalBudgeted, currency), color: '#4f46e5' },
                  { label: 'Total Spent',    value: formatCurrency(totalSpentAll, currency), color: totalSpentAll > totalBudgeted ? '#ef4444' : '#f59e0b' },
                  { label: 'Remaining',      value: formatCurrency(Math.max(0, totalBudgeted - totalSpentAll), currency), color: '#10b981' },
                ].map(s => (
                  <div key={s.label} className="bg-gray-800 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                    <p className="font-bold text-sm" style={{ color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, overallProgress)}%`,
                    background: totalSpentAll > totalBudgeted ? '#ef4444' : overallProgress > 80 ? '#f59e0b' : '#4f46e5'
                  }}
                />
              </div>
            </div>
          )}

          {budgets.map(budget => {
            // Use backend-tracked spent value (updated as expenses are added/removed)
            const totalSpent  = budget.spent || 0
            const remaining   = budget.total_amount - totalSpent
            const progress    = budget.total_amount > 0 ? Math.min(100, (totalSpent / budget.total_amount) * 100) : 0
            const over        = totalSpent > budget.total_amount
            const barColor    = over ? '#ef4444' : progress > 80 ? '#f59e0b' : '#4f46e5'

            // Build chart from monthly_actuals (all spending since start date, from backend)
            const actuals   = budget.monthly_actuals || []
            const chartData = actuals.map(a => ({
              name:      `${MONTH_NAMES[a.month - 1]} ${a.year}`,
              Actual:    a.total,
              Allowance: totalMonthlyAllowance,
            }))

            return (
              <div key={budget.id} className="bg-gray-900 border border-gray-700 rounded-2xl p-5 space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{budget.label || 'Budget Plan'}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {budget.months} month{budget.months !== 1 ? 's' : ''} · Started {new Date(budget.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditBudget(budget); setShowForm(true) }} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-white transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => setDeleteId(budget.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>

                {/* Stats — driven by backend `spent` field */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Total Budget',      value: formatCurrency(budget.total_amount,      currency), color: '#4f46e5' },
                    { label: 'Spent So Far',      value: formatCurrency(totalSpent,               currency), color: over ? '#ef4444' : '#f59e0b' },
                    { label: 'Remaining',         value: (over ? '-' : '+') + formatCurrency(Math.abs(remaining), currency), color: over ? '#ef4444' : '#6366f1' },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-800 border border-gray-700 rounded-xl p-3">
                      <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                      <p className="font-bold text-base" style={{ color: s.color }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>Spent: {progress.toFixed(1)}%</span>
                    <span className={over ? 'text-red-400' : 'text-gray-400'}>
                      {over
                        ? `${(totalSpent / budget.total_amount * 100 - 100).toFixed(1)}% over budget`
                        : `${(100 - progress).toFixed(1)}% remaining`}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, progress)}%`, background: barColor }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <BudgetForm open={showForm} onClose={() => { setShowForm(false); setEditBudget(null) }} onSave={handleSave} budget={editBudget} />
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} title="Delete Budget" message="This budget and its configuration will be permanently deleted." />
    </div>
  )
}