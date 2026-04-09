import { format, formatDistanceToNow, parseISO, eachDayOfInterval, getDay, getDaysInMonth } from 'date-fns'

export const CURRENCY_SYMBOLS = {
  USD: '$', EUR: '€', GBP: '£', AED: 'د.إ', INR: '₹', JPY: '¥', CAD: 'C$', AUD: 'A$'
}

export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar',        symbol: '$'    },
  { code: 'EUR', name: 'Euro',             symbol: '€'    },
  { code: 'GBP', name: 'British Pound',    symbol: '£'    },
  { code: 'AED', name: 'UAE Dirham',       symbol: 'د.إ'  },
  { code: 'INR', name: 'Indian Rupee',     symbol: '₹'    },
  { code: 'JPY', name: 'Japanese Yen',     symbol: '¥'    },
  { code: 'CAD', name: 'Canadian Dollar',  symbol: 'C$'   },
  { code: 'AUD', name: 'Australian Dollar',symbol: 'A$'   },
]

export const MONTH_NAMES      = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
export const MONTH_NAMES_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December']

export function formatCurrency(amount, currency = 'USD') {
  const symbol = CURRENCY_SYMBOLS[currency] || '$'
  return `${symbol}${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDate(dateStr) {
  try { return format(parseISO(dateStr), 'MMM d, yyyy') } catch { return dateStr }
}

export function formatRelative(dateStr) {
  try { return formatDistanceToNow(parseISO(dateStr), { addSuffix: true }) } catch { return dateStr }
}

export function getCalendarDays(year, month) {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay  = new Date(year, month - 1, getDaysInMonth(firstDay))
  const days     = eachDayOfInterval({ start: firstDay, end: lastDay })
  const startPad = getDay(firstDay)
  return { days, startPad }
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function getErrorMessage(err) {
  return err?.response?.data?.detail || err?.message || 'Something went wrong'
}