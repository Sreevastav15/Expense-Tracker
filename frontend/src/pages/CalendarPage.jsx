import { useState, useEffect } from 'react'
import { expenseApi } from '../api/services'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, MONTH_NAMES_FULL, getCalendarDays, getErrorMessage } from '../utils/helpers'
import { PageHeader, Spinner, EmptyState } from '../components/UI'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarPage() {
  const { user } = useAuth()
  const currency = user?.currency || 'USD'
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [calendarData, setCalendarData] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(null)

  useEffect(() => {
    setLoading(true)
    expenseApi.calendar(year, month)
      .then(r => setCalendarData(r.data))
      .catch(err => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [year, month])

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const { days, startPad } = getCalendarDays(year, month)
  const totalPad = startPad

  const getDay = (date) => {
    const key = format(date, 'yyyy-MM-dd')
    return calendarData[key] || null
  }

  const maxTotal = Math.max(...Object.values(calendarData).map(d => d.total), 1)

  const selectedKey = selectedDay ? format(selectedDay, 'yyyy-MM-dd') : null
  const selectedData = selectedKey ? calendarData[selectedKey] : null

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Calendar"
        description="View expenses by day"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar */}
        <div className="lg:col-span-2 card p-5">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-surface-3 text-gray-400 hover:text-white transition-colors">
              <ChevronLeft size={18} />
            </button>
            <h2 className="font-display font-bold text-xl text-white">
              {MONTH_NAMES_FULL[month - 1]} {year}
            </h2>
            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-surface-3 text-gray-400 hover:text-white transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                {d}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20"><Spinner size={24} /></div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {/* Padding cells */}
              {Array.from({ length: totalPad }).map((_, i) => (
                <div key={`pad-${i}`} className="aspect-square" />
              ))}

              {/* Day cells */}
              {days.map(date => {
                const dayData = getDay(date)
                const isToday = format(date, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')
                const isSelected = selectedDay && format(date, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd')
                const intensity = dayData ? Math.max(0.15, dayData.total / maxTotal) : 0

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDay(isSelected ? null : date)}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 text-xs transition-all relative overflow-hidden
                      ${isSelected ? 'ring-2 ring-brand-400 ring-offset-1 ring-offset-surface-1' : ''}
                      ${dayData ? 'hover:scale-105 cursor-pointer' : 'cursor-default hover:bg-surface-2'}
                    `}
                    style={{
                      background: dayData ? `rgba(61, 98, 245, ${intensity * 0.7})` : undefined,
                      border: isToday ? '1.5px solid #3d62f5' : '1.5px solid transparent',
                    }}
                  >
                    <span className={`font-medium ${isToday ? 'text-brand-400' : dayData ? 'text-white' : 'text-gray-500'}`}>
                      {date.getDate()}
                    </span>
                    {dayData && (
                      <span className="text-[9px] text-brand-300 leading-none font-mono">
                        {dayData.expenses.length}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-surface-3">
            <span className="text-xs text-gray-500">Less</span>
            {[0.1, 0.25, 0.5, 0.75, 1].map(v => (
              <div key={v} className="w-5 h-5 rounded-md" style={{ background: `rgba(61, 98, 245, ${v * 0.7})`, border: '1px solid rgba(61, 98, 245, 0.2)' }} />
            ))}
            <span className="text-xs text-gray-500">More</span>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-sm border-1.5 border-brand-500" style={{ border: '1.5px solid #3d62f5' }} />
              <span className="text-xs text-gray-500">Today</span>
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="card p-5">
          {selectedDay && selectedData ? (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="font-display font-semibold text-white">
                  {format(selectedDay, 'MMMM d, yyyy')}
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  {selectedData.expenses.length} expense{selectedData.expenses.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-3">
                <p className="text-xs text-gray-400">Total Spent</p>
                <p className="font-display font-bold text-xl text-white mt-0.5">
                  {formatCurrency(selectedData.total, currency)}
                </p>
              </div>
              <div className="space-y-2">
                {selectedData.expenses.map(e => (
                  <div key={e.id} className="flex items-center gap-3 p-2.5 bg-surface-2 rounded-xl">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                      style={{ background: (e.category?.color || '#6366f1') + '20' }}
                    >
                      {e.category?.icon || '💰'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{e.notes || e.category?.name}</p>
                      <p className="text-xs text-gray-500">{e.category?.name}</p>
                    </div>
                    <span className="text-sm font-mono text-white flex-shrink-0">
                      -{formatCurrency(e.amount, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : selectedDay ? (
            <div className="flex flex-col items-center justify-center h-full py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-surface-3 flex items-center justify-center mb-3">
                <Calendar size={22} className="text-gray-500" />
              </div>
              <p className="text-white font-medium">{format(selectedDay, 'MMMM d')}</p>
              <p className="text-gray-500 text-sm mt-1">No expenses on this day</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-surface-3 flex items-center justify-center mb-3">
                <Calendar size={22} className="text-gray-500" />
              </div>
              <p className="text-white font-medium">Select a day</p>
              <p className="text-gray-500 text-sm mt-1">Click on any highlighted day to see expenses</p>

              {/* Monthly summary */}
              <div className="mt-6 w-full border-t border-surface-3 pt-4 text-left space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Month Summary</p>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Days with expenses</span>
                  <span className="text-sm text-white font-medium">{Object.keys(calendarData).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Total expenses</span>
                  <span className="text-sm text-white font-medium">
                    {Object.values(calendarData).reduce((s, d) => s + d.expenses.length, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Month total</span>
                  <span className="text-sm font-mono font-bold text-white">
                    {formatCurrency(Object.values(calendarData).reduce((s, d) => s + d.total, 0), currency)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}