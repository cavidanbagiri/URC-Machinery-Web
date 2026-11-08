// src/components/dashboard/dashboardColors.js
//
// Dashboard widget'larının ortak renk paleti. Backend durum renklerini semantik
// token olarak döndürüyor ("red", "yellow", ...). Burada hem Recharts için hex
// karşılığını hem de kompakt KPI kartlarının Tailwind sınıflarını tutuyoruz.

export const CHART_COLORS = {
  green: '#10b981',
  yellow: '#f59e0b',
  amber: '#f59e0b',
  orange: '#f97316',
  blue: '#3b82f6',
  sky: '#0ea5e9',
  indigo: '#6366f1',
  red: '#ef4444',
  gray: '#6b7280',
  slate: '#64748b',
};

export function chartColor(token) {
  return CHART_COLORS[token] || CHART_COLORS.gray;
}

// Kompakt metrik kartları ve liste satırları için ton sınıfları.
const TONES = {
  gray: {
    wrap: 'border-gray-200 bg-white hover:border-gray-300',
    icon: 'bg-gray-100 text-gray-600',
    value: 'text-gray-900',
    bar: 'bg-gray-400',
    track: 'bg-gray-100',
    badge: 'bg-gray-100 text-gray-700',
  },
  blue: {
    wrap: 'border-blue-100 bg-blue-50/50 hover:border-blue-200',
    icon: 'bg-blue-100 text-blue-700',
    value: 'text-blue-700',
    bar: 'bg-blue-500',
    track: 'bg-blue-100',
    badge: 'bg-blue-100 text-blue-800',
  },
  sky: {
    wrap: 'border-sky-100 bg-sky-50/60 hover:border-sky-200',
    icon: 'bg-sky-100 text-sky-700',
    value: 'text-sky-700',
    bar: 'bg-sky-500',
    track: 'bg-sky-100',
    badge: 'bg-sky-100 text-sky-800',
  },
  indigo: {
    wrap: 'border-indigo-100 bg-indigo-50/60 hover:border-indigo-200',
    icon: 'bg-indigo-100 text-indigo-700',
    value: 'text-indigo-700',
    bar: 'bg-indigo-500',
    track: 'bg-indigo-100',
    badge: 'bg-indigo-100 text-indigo-800',
  },
  red: {
    wrap: 'border-red-100 bg-red-50/60 hover:border-red-200',
    icon: 'bg-red-100 text-red-700',
    value: 'text-red-700',
    bar: 'bg-red-500',
    track: 'bg-red-100',
    badge: 'bg-red-100 text-red-800',
  },
  amber: {
    wrap: 'border-amber-100 bg-amber-50/60 hover:border-amber-200',
    icon: 'bg-amber-100 text-amber-700',
    value: 'text-amber-700',
    bar: 'bg-amber-500',
    track: 'bg-amber-100',
    badge: 'bg-amber-100 text-amber-800',
  },
  orange: {
    wrap: 'border-orange-100 bg-orange-50/60 hover:border-orange-200',
    icon: 'bg-orange-100 text-orange-700',
    value: 'text-orange-700',
    bar: 'bg-orange-500',
    track: 'bg-orange-100',
    badge: 'bg-orange-100 text-orange-800',
  },
  green: {
    wrap: 'border-emerald-100 bg-emerald-50/60 hover:border-emerald-200',
    icon: 'bg-emerald-100 text-emerald-700',
    value: 'text-emerald-700',
    bar: 'bg-emerald-500',
    track: 'bg-emerald-100',
    badge: 'bg-emerald-100 text-emerald-800',
  },
  slate: {
    wrap: 'border-slate-200 bg-slate-50/70 hover:border-slate-300',
    icon: 'bg-slate-200 text-slate-700',
    value: 'text-slate-700',
    bar: 'bg-slate-500',
    track: 'bg-slate-200',
    badge: 'bg-slate-200 text-slate-700',
  },
};

export function tone(token) {
  return TONES[token] || TONES.gray;
}
