import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Receipt, PiggyBank, Tag, Calendar,
  User, LogOut, Menu, X, TrendingDown, ChevronRight
} from 'lucide-react'

const NAV = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/expenses',   icon: Receipt,         label: 'Expenses' },
  { to: '/budgets',    icon: PiggyBank,        label: 'Budgets' },
  { to: '/categories', icon: Tag,              label: 'Categories' },
  { to: '/calendar',   icon: Calendar,         label: 'Calendar' },
]

function NavItem({ to, icon: Icon, label, exact, onClick }) {
  return (
    <NavLink
      to={to}
      end={exact}
      onClick={onClick}
      className={({ isActive }) =>
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 w-full ' +
        (isActive
          ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/25'
          : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800')
      }
    >
      <Icon size={17} />
      <span className="flex-1">{label}</span>
      <ChevronRight size={13} className="opacity-30" />
    </NavLink>
  )
}

function Sidebar({ onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <TrendingDown size={17} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg leading-none">Spendly</h1>
            <p className="text-xs text-gray-500 mt-0.5">Expense Tracker</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-3 pb-2">Menu</p>
        {NAV.map(item => (
          <NavItem key={item.to} {...item} onClick={onClose} />
        ))}
        <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-3 pb-2 pt-4">Account</p>
        <NavItem to="/profile" icon={User} label="Profile" onClick={onClose} />
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-800/60">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-600/30 flex items-center justify-center flex-shrink-0">
            <span className="text-indigo-400 font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.currency}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-red-400 transition-colors"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Layout() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-screen bg-[#0f0f17] overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-gray-950 border-r border-gray-800 flex-shrink-0">
        <Sidebar onClose={() => {}} />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="relative w-72 bg-gray-950 border-r border-gray-800 h-full z-10 animate-slide-up">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-800 text-gray-400"
            >
              <X size={17} />
            </button>
            <Sidebar onClose={() => setOpen(false)} />
          </aside>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-950">
          <button onClick={() => setOpen(true)} className="p-2 rounded-xl hover:bg-gray-800 text-gray-400">
            <Menu size={19} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <TrendingDown size={13} className="text-white" />
            </div>
            <span className="font-bold text-white">Spendly</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}