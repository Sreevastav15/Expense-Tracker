import { useState, useEffect } from 'react'
import { categoryApi } from '../api/services'
import { getErrorMessage } from '../utils/helpers'
import { PageHeader, EmptyState, Modal, ConfirmDialog, Spinner } from '../components/UI'
import toast from 'react-hot-toast'
import { Plus, Tag, Pencil, Trash2, Loader2, Lock } from 'lucide-react'

const ICONS  = ['🍔','🚗','📄','🛍️','🎬','💊','✈️','📚','🏠','💰','☕','🎮','🏋️','🎁','🎓','💼','🏥','🍕','🚀','⚡','🌊','🎵','📱','🛒','🔧','🎯','💎','🌿']
const COLORS = ['#4f46e5','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#f97316','#84cc16','#6366f1','#14b8a6','#f43f5e']
const INPUT  = 'w-full bg-gray-800 border border-gray-700 focus:border-indigo-500 text-white placeholder:text-gray-500 rounded-xl px-4 py-2.5 outline-none transition-colors text-sm'
const LABEL  = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5'

function CategoryForm({ open, onClose, onSave, category }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', icon: '💰', color: '#6366f1' })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    if (category) setForm({ name: category.name, icon: category.icon, color: category.color })
    else          setForm({ name: '', icon: '💰', color: '#6366f1' })
  }, [category, open])

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Category name required'); return }
    setLoading(true)
    try { await onSave(form); onClose() }
    catch (err) { toast.error(getErrorMessage(err)) }
    finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={category ? 'Edit Category' : 'New Category'}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={LABEL}>Name *</label>
          <input className={INPUT} placeholder="e.g. Groceries" value={form.name} onChange={e => set('name', e.target.value)} required />
        </div>

        <div>
          <label className={LABEL}>Icon</label>
          <div className="grid grid-cols-9 gap-1.5">
            {ICONS.map(icon => (
              <button key={icon} type="button" onClick={() => set('icon', icon)}
                className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                  form.icon === icon ? 'bg-indigo-600/20 border-2 border-indigo-500' : 'hover:bg-gray-700 border-2 border-transparent'
                }`}>
                {icon}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={LABEL}>Color</label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map(color => (
              <button key={color} type="button" onClick={() => set('color', color)}
                className={`w-8 h-8 rounded-lg transition-transform ${form.color === color ? 'scale-125 ring-2 ring-white/25' : 'hover:scale-110'}`}
                style={{ background: color }} />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-xl p-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: form.color + '20' }}>{form.icon}</div>
          <div>
            <p className="text-sm font-medium text-white">{form.name || 'Category name'}</p>
            <p className="text-xs text-gray-500">Preview</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-2.5 rounded-xl transition-colors text-sm">Cancel</button>
          <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
            {loading ? <Loader2 size={15} className="animate-spin" /> : (category ? 'Save Changes' : 'Create')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [editCat,    setEditCat]    = useState(null)
  const [deleteId,   setDeleteId]   = useState(null)
  const [deleting,   setDeleting]   = useState(false)

  const load = async () => {
    setLoading(true)
    try { const r = await categoryApi.list(); setCategories(r.data) }
    catch (err) { toast.error(getErrorMessage(err)) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const handleSave = async data => {
    if (editCat) { await categoryApi.update(editCat.id, data); toast.success('Category updated') }
    else         { await categoryApi.create(data);              toast.success('Category created') }
    setEditCat(null); load()
  }

  const handleDelete = async () => {
    setDeleting(true)
    try { await categoryApi.delete(deleteId); toast.success('Category deleted'); setDeleteId(null); load() }
    catch (err) { toast.error(getErrorMessage(err)) }
    finally { setDeleting(false) }
  }

  const defaults = categories.filter(c =>  c.is_default)
  const custom   = categories.filter(c => !c.is_default)

  const CatCard = ({ cat, editable }) => (
    <div className={`bg-gray-900 border border-gray-700 rounded-2xl p-4 ${editable ? 'hover:border-gray-600 transition-colors group' : 'opacity-70'}`}>
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: cat.color + '20' }}>{cat.icon}</div>
        {editable ? (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => { setEditCat(cat); setShowForm(true) }} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-white transition-colors"><Pencil size={13} /></button>
            <button onClick={() => setDeleteId(cat.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
          </div>
        ) : (
          <Lock size={12} className="text-gray-700 mt-1" />
        )}
      </div>
      <p className="text-sm font-medium text-white mt-3 truncate">{cat.name}</p>
      <div className="w-full h-1 rounded-full mt-2" style={{ background: cat.color + '30' }}>
        <div className="h-full rounded-full w-1/2" style={{ background: cat.color }} />
      </div>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Categories"
        description="Organize your expenses with custom categories"
        action={
          <button onClick={() => { setEditCat(null); setShowForm(true) }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-xl transition-colors text-sm">
            <Plus size={15} /> New Category
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20"><Spinner size={24} /></div>
      ) : (
        <div className="space-y-8">
          {/* Defaults */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lock size={13} className="text-gray-500" />
              <p className="text-sm font-semibold text-gray-400">Default Categories</p>
              <span className="text-xs text-gray-600">{defaults.length}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {defaults.map(cat => <CatCard key={cat.id} cat={cat} editable={false} />)}
            </div>
          </div>

          {/* Custom */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Tag size={13} className="text-gray-500" />
              <p className="text-sm font-semibold text-gray-400">Custom Categories</p>
              <span className="text-xs text-gray-600">{custom.length}</span>
            </div>
            {custom.length === 0 ? (
              <div className="bg-gray-900 border border-gray-700 rounded-2xl">
                <EmptyState icon={Tag} title="No custom categories" description="Create your own categories to better organize expenses"
                  action={<button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-xl transition-colors text-sm"><Plus size={15} /> Create Category</button>}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {custom.map(cat => <CatCard key={cat.id} cat={cat} editable={true} />)}
              </div>
            )}
          </div>
        </div>
      )}

      <CategoryForm open={showForm} onClose={() => { setShowForm(false); setEditCat(null) }} onSave={handleSave} category={editCat} />
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} title="Delete Category" message="Expenses using this category won't be deleted, but they'll lose their category." />
    </div>
  )
}