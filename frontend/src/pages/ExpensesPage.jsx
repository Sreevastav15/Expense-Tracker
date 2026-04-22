import { useState, useEffect, useCallback } from 'react'
import { expenseApi, categoryApi, budgetApi } from '../api/services'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, formatDate, getErrorMessage } from '../utils/helpers'
import { PageHeader, EmptyState, ConfirmDialog, Spinner } from '../components/UI'
import ExpenseForm from '../components/ExpenseForm'
import toast from 'react-hot-toast'
import { Plus, Search, Pencil, Trash2, Receipt, ChevronLeft, ChevronRight, X, SlidersHorizontal } from 'lucide-react'

const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Date (newest)' },
  { value: 'date_asc', label: 'Date (oldest)' },
  { value: 'amount_desc', label: 'Amount (high)' },
  { value: 'amount_asc', label: 'Amount (low)' },
]

const INPUT = 'w-full bg-gray-800 border border-gray-700 focus:border-indigo-500 text-white placeholder:text-gray-500 rounded-xl px-3 py-2 outline-none transition-colors text-sm'

export default function ExpensesPage() {
  const { user } = useAuth()
  const currency = user?.currency || 'USD'

  const [expenses, setExpenses] = useState([])
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editExpense, setEditExpense] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const [filters, setFilters] = useState({
    search: '', category_id: '', budget_id: '', date_from: '', date_to: '',
    amount_min: '', amount_max: '', sort: 'date_desc',
  })
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 400)
    return () => clearTimeout(t)
  }, [filters.search])

  const loadExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const res = await expenseApi.list({
        page, limit: 15, sort: filters.sort,
        ...(debouncedSearch     && { search:      debouncedSearch }),
        ...(filters.category_id && { category_id: filters.category_id }),
        ...(filters.budget_id   && { budget_id:   filters.budget_id }),
        ...(filters.date_from   && { date_from:   filters.date_from }),
        ...(filters.date_to     && { date_to:     filters.date_to }),
        ...(filters.amount_min  && { amount_min:  filters.amount_min }),
        ...(filters.amount_max  && { amount_max:  filters.amount_max }),
      })
      setExpenses(res.data.items)
      setTotal(res.data.total)
      setPages(res.data.pages)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally { setLoading(false) }
  }, [page, debouncedSearch, filters.category_id, filters.budget_id, filters.date_from, filters.date_to, filters.amount_min, filters.amount_max, filters.sort])

  const loadBudget = async () => {
    setLoading(true)
    try { const r = await budgetApi.list(); setBudgets(r.data) }
    catch (err) { toast.error(getErrorMessage(err)) }
    finally { setLoading(false) }
  }

  useEffect(() => { categoryApi.list().then(r => setCategories(r.data)).catch(() => { }) }, [])
  useEffect(() => { loadExpenses() }, [loadExpenses])
  useEffect(() => { loadBudget() }, [])
  useEffect(() => { setPage(1) }, [filters])

  const setFilter    = (k, v) => setFilters(p => ({ ...p, [k]: v }))
  const clearFilters = ()     => setFilters({ search: '', category_id: '', budget_id: '', date_from: '', date_to: '', amount_min: '', amount_max: '', sort: 'date_desc' })
  const hasActive    = filters.category_id || filters.budget_id || filters.date_from || filters.date_to || filters.amount_min || filters.amount_max

  const handleSave = async data => {
    if (editExpense) { await expenseApi.update(editExpense.id, data); toast.success('Expense updated') }
    else             { await expenseApi.create(data);                  toast.success('Expense added') }
    setEditExpense(null)
    loadExpenses()
  }

  const handleDelete = async () => {
    setDeleting(true)
    try { await expenseApi.delete(deleteId); toast.success('Deleted'); setDeleteId(null); loadExpenses() }
    catch (err) { toast.error(getErrorMessage(err)) }
    finally { setDeleting(false) }
  }

  console.log(budgets)

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Expenses"
        description={`${total} transaction${total !== 1 ? 's' : ''} total`}
        action={
          <button
            onClick={() => { setEditExpense(null); setShowForm(true) }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-xl transition-colors text-sm"
          >
            <Plus size={15} /> Add Expense
          </button>
        }
      />

      {/* Search / Filter bar */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-3 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              className={INPUT + ' pl-8'}
              placeholder="Search notes…"
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
            />
          </div>
          <select className={INPUT + ' w-40'} value={filters.sort} onChange={e => setFilter('sort', e.target.value)}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button
            onClick={() => setShowFilters(p => !p)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
              hasActive
                ? 'bg-indigo-600/10 border-indigo-600/30 text-indigo-400'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal size={15} />
            <span className="hidden sm:inline">Filters</span>
            {hasActive && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-gray-800 animate-fade-in">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Category</label>
              <select className={INPUT} value={filters.category_id} onChange={e => setFilter('category_id', e.target.value)}>
                <option value="">All categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Budget</label>
              <select className={INPUT} value={filters.budget_id} onChange={e => setFilter('budget_id', e.target.value)}>
                <option value="">All budgets</option>
                {budgets.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">From Date</label>
              <input className={INPUT} type="date" value={filters.date_from} onChange={e => setFilter('date_from', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">To Date</label>
              <input className={INPUT} type="date" value={filters.date_to} onChange={e => setFilter('date_to', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Amount Range</label>
              <div className="flex gap-1.5">
                <input className={INPUT} type="number" placeholder="Min" value={filters.amount_min} onChange={e => setFilter('amount_min', e.target.value)} />
                <input className={INPUT} type="number" placeholder="Max" value={filters.amount_max} onChange={e => setFilter('amount_max', e.target.value)} />
              </div>
            </div>
            {hasActive && (
              <div className="col-span-2 sm:col-span-5 flex justify-end">
                <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors">
                  <X size={11} /> Clear filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table / List */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner size={24} /></div>
        ) : expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses found"
            description={hasActive ? 'Try adjusting your filters' : 'Add your first expense to get started'}
            action={!hasActive && (
              <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-xl transition-colors text-sm">
                <Plus size={15} /> Add Expense
              </button>
            )}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-800">
                  <tr>
                    {['Category', 'Date', 'Notes', 'Amount', 'Budget', ''].map((h, i) => (
                      <th key={i} className={`py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left ${i === 0 ? 'pl-5' : ''}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {expenses.map(e => (
                    <tr key={e.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 px-4 pl-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                            style={{ background: (e.category?.color || '#4f46e5') + '20' }}>
                            {e.category?.icon || '💰'}
                          </div>
                          <span className="text-white font-medium">{e.category?.name || '—'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-400 whitespace-nowrap">{formatDate(e.date)}</td>
                      <td className="py-3 px-4 text-gray-400 max-w-[200px] truncate">
                        {e.notes || <span className="text-gray-600 italic">No notes</span>}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-white whitespace-nowrap">
                        -{formatCurrency(e.amount, currency)}
                      </td>
                      <td className="py-3 px-4 text-left whitespace-nowrap">
                        {e.budget ? (
                          <span className="px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-medium">
                            {e.budget.label}
                          </span>
                        ) : (
                          <span className="text-gray-600 italic text-xs">No budget</span>
                        )}
                      </td>
                      <td className="py-3 px-4 pr-5">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => { setEditExpense(e); setShowForm(true) }}
                            className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-white transition-colors">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => setDeleteId(e.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="sm:hidden divide-y divide-gray-800">
              {expenses.map(e => (
                <div key={e.id} className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: (e.category?.color || '#4f46e5') + '20' }}>
                    {e.category?.icon || '💰'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{e.notes || e.category?.name}</p>
                    <p className="text-xs text-gray-500">{e.category?.name} · {formatDate(e.date)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-mono text-white">-{formatCurrency(e.amount, currency)}</span>
                    <button onClick={() => { setEditExpense(e); setShowForm(true) }} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500"><Pencil size={13} /></button>
                    <button onClick={() => setDeleteId(e.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-800">
                <p className="text-xs text-gray-500">Page {page} of {pages}</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 disabled:opacity-40 transition-colors">
                    <ChevronLeft size={15} />
                  </button>
                  {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                    const p = page <= 3 ? i + 1 : page - 2 + i
                    if (p < 1 || p > pages) return null
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-sm transition-colors ${p === page ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800 text-gray-400'}`}>
                        {p}
                      </button>
                    )
                  })}
                  <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                    className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 disabled:opacity-40 transition-colors">
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ExpenseForm open={showForm} onClose={() => { setShowForm(false); setEditExpense(null) }} onSave={handleSave} expense={editExpense} budget={budgets} />
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} title="Delete Expense" message="This expense will be permanently removed." />
    </div>
  )
}