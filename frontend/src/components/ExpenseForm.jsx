import { useState, useEffect } from 'react'
import { Modal } from './UI'
import { categoryApi } from '../api/services'
import { getErrorMessage } from '../utils/helpers'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

const nowIso = () => new Date().toISOString().slice(0, 16)

export default function ExpenseForm({ open, onClose, onSave, expense }) {
  const isEdit = !!expense
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(false)
  const [form, setForm]             = useState({ amount: '', category_id: '', date: nowIso(), notes: '' })

  useEffect(() => {
    categoryApi.list()
      .then(r => {
        setCategories(r.data)
        if (!isEdit && r.data.length > 0)
          setForm(p => ({ ...p, category_id: String(r.data[0].id) }))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (expense) {
      setForm({
        amount:      String(expense.amount),
        category_id: String(expense.category_id),
        date:        expense.date ? expense.date.slice(0, 16) : nowIso(),
        notes:       expense.notes || '',
      })
    } else {
      setForm({ amount: '', category_id: categories[0]?.id ? String(categories[0].id) : '', date: nowIso(), notes: '' })
    }
  }, [expense, open])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async e => {
    e.preventDefault()
    const amount = parseFloat(form.amount)
    if (!form.category_id) { toast.error('Select a category'); return }
    if (isNaN(amount) || amount <= 0) { toast.error('Enter a valid amount'); return }
    setLoading(true)
    try {
      await onSave({
        amount,
        category_id: parseInt(form.category_id),
        date:        new Date(form.date).toISOString(),
        notes:       form.notes || null,
      })
      onClose()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const INPUT = 'w-full bg-gray-800 border border-gray-700 focus:border-indigo-500 text-white placeholder:text-gray-500 rounded-xl px-4 py-2.5 outline-none transition-colors text-sm'
  const LABEL = 'block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5'

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Expense' : 'Add Expense'}>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Amount */}
        <div>
          <label className={LABEL}>Amount *</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              className={INPUT + ' pl-7'}
              type="number" step="0.01" min="0.01" placeholder="0.00"
              value={form.amount} onChange={e => set('amount', e.target.value)} required
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className={LABEL}>Category *</label>
          <select
            className={INPUT}
            value={form.category_id}
            onChange={e => set('category_id', e.target.value)}
            required
          >
            <option value="">Select a category…</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className={LABEL}>Date & Time *</label>
          <input
            className={INPUT}
            type="datetime-local"
            value={form.date} onChange={e => set('date', e.target.value)} required
          />
        </div>

        {/* Notes */}
        <div>
          <label className={LABEL}>Notes</label>
          <textarea
            className={INPUT + ' resize-none'}
            rows={3} placeholder="What was this for?"
            value={form.notes} onChange={e => set('notes', e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button" onClick={onClose}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-2.5 rounded-xl transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            type="submit" disabled={loading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : (isEdit ? 'Save Changes' : 'Add Expense')}
          </button>
        </div>
      </form>
    </Modal>
  )
}