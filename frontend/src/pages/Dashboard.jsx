import { useState, useEffect } from 'react'
import { dashboardApi } from '../api/services'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, formatDate, MONTH_NAMES, MONTH_NAMES_FULL } from '../utils/helpers'
import { StatCard, Skeleton, EmptyState } from '../components/UI'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, Legend
} from 'recharts'
import { DollarSign, TrendingUp, Hash, ChevronLeft, ChevronRight, Receipt } from 'lucide-react'

const TT = {
  contentStyle: { background: '#111827', border: '1px solid #374151', borderRadius: 10, fontFamily: 'inherit', fontSize: 13 },
  labelStyle:   { color: '#9ca3af', fontSize: 11 },
  itemStyle:    { color: '#fff' },
}

export default function Dashboard() {
  const { user } = useAuth()
  const now = new Date()
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data,  setData]  = useState(null)
  const [yearlyData, setYearlyData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([dashboardApi.summary(year, month), dashboardApi.yearly()])
      .then(([s, y]) => { setData(s.data); setYearlyData(y.data) })
      .finally(() => setLoading(false))
  }, [year, month])

  const prevMonth = () => month === 1 ? (setMonth(12), setYear(y => y - 1)) : setMonth(m => m - 1)
  const nextMonth = () => month === 12 ? (setMonth(1),  setYear(y => y + 1)) : setMonth(m => m + 1)

  const currency   = user?.currency || 'USD'
  const trendData  = (data?.monthly_trend || []).slice(-12).map(m => ({ name: `${MONTH_NAMES[m.month-1]} ${m.year}`, total: m.total }))
  const barGrouped = {}
  yearlyData.forEach(d => {
    if (!barGrouped[d.month]) barGrouped[d.month] = { month: MONTH_NAMES[d.month - 1] }
    barGrouped[d.month][String(d.year)] = d.total
  })
  const barData = Object.values(barGrouped)
  const years   = [...new Set(yearlyData.map(d => d.year))].sort().slice(-2)
  const YR_CLR  = ['#4f46e5', '#10b981']

  if (loading) return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0,1,2].map(i => <Skeleton key={i} className="h-28" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[0,1,2,3].map(i => <Skeleton key={i} className="h-64" />)}
      </div>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your financial overview</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-900 border border-gray-700 rounded-xl p-1">
          <button onClick={prevMonth} className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
            <ChevronLeft size={15} />
          </button>
          <span className="text-sm font-medium text-white px-2 w-36 text-center">
            {MONTH_NAMES_FULL[month - 1]} {year}
          </span>
          <button onClick={nextMonth} className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total All Time"                          value={formatCurrency(data?.total_all_time || 0, currency)} icon={DollarSign} color="#4f46e5" />
        <StatCard label={`${MONTH_NAMES_FULL[month-1]} Spending`} value={formatCurrency(data?.month_total   || 0, currency)} icon={TrendingUp}  color="#10b981" />
        <StatCard label="Transactions This Month"                 value={data?.month_count || 0}                             icon={Hash}         color="#f59e0b" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pie */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4">Category Breakdown</h3>
          {data?.category_breakdown?.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <ResponsiveContainer width={190} height={175}>
                <PieChart>
                  <Pie data={data.category_breakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={76} paddingAngle={3} dataKey="total">
                    {data.category_breakdown.map((e, i) => <Cell key={i} fill={e.color || '#4f46e5'} />)}
                  </Pie>
                  <Tooltip formatter={v => formatCurrency(v, currency)} {...TT} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2 min-w-0">
                {data.category_breakdown.slice(0, 6).map(c => (
                  <div key={c.id} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
                    <span className="text-xs text-gray-400 flex-1 truncate">{c.icon} {c.name}</span>
                    <span className="text-xs font-mono text-white">{c.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <EmptyState icon={Receipt} title="No data yet" description="Add expenses to see breakdown" />}
        </div>

        {/* Line */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4">Spending Trend</h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={175}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? (v/1000).toFixed(1)+'k' : v} />
                <Tooltip formatter={v => formatCurrency(v, currency)} {...TT} />
                <Line type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={2.5} dot={{ fill: '#4f46e5', r: 4 }} activeDot={{ r: 6, fill: '#818cf8' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyState icon={TrendingUp} title="No trend data" description="Add more expenses to see trends" />}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Bar */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4">Monthly Comparison</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? (v/1000).toFixed(1)+'k' : v} />
                <Tooltip formatter={v => formatCurrency(v, currency)} {...TT} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
                {years.map((yr, i) => <Bar key={yr} dataKey={String(yr)} fill={YR_CLR[i]} radius={[4,4,0,0]} maxBarSize={32} />)}
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState icon={Receipt} title="No comparison data" description="Track expenses across months" />}
        </div>

        {/* Recent */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4">Recent Transactions</h3>
          {data?.recent_expenses?.length > 0 ? (
            <div className="space-y-2">
              {data.recent_expenses.map(e => (
                <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-800 transition-colors">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: (e.category?.color || '#4f46e5') + '20' }}>
                    {e.category?.icon || '💰'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{e.notes || e.category?.name || 'Expense'}</p>
                    <p className="text-xs text-gray-500">{formatDate(e.date)}</p>
                  </div>
                  <span className="text-sm font-mono text-white flex-shrink-0">-{formatCurrency(e.amount, currency)}</span>
                </div>
              ))}
            </div>
          ) : <EmptyState icon={Receipt} title="No transactions" description="Start adding expenses" />}
        </div>
      </div>

      {/* Category table */}
      {data?.category_breakdown?.length > 0 && (
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4">Category Summary — {MONTH_NAMES_FULL[month - 1]}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Category','Transactions','Amount','Share'].map((h, i) => (
                    <th key={h} className={`pb-3 text-xs text-gray-500 font-semibold uppercase tracking-wider ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {data.category_breakdown.map(c => (
                  <tr key={c.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{c.icon}</span>
                        <span className="text-white font-medium">{c.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right text-gray-400">{c.count}</td>
                    <td className="py-3 text-right font-mono text-white">{formatCurrency(c.total, currency)}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${c.percentage}%`, background: c.color }} />
                        </div>
                        <span className="text-gray-400 text-xs w-9 text-right">{c.percentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}