// src/components/dashboard/SectionCard.jsx
//
// Dashboard'daki tüm widget'ların ortak kartı: başlık + sağ aksiyon + gövde.
// Yükleniyor / hata / boş durumları her widget için bağımsız yönetilir.
import { AlertTriangle, ExternalLink, Inbox, RotateCw } from 'lucide-react';

export function CardSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-9 animate-pulse rounded-lg bg-gray-100"
        />
      ))}
    </div>
  );
}

export function CardEmpty({ icon: Icon = Inbox, text, hint }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-6 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <p className="mt-2 text-xs font-medium text-gray-600">{text}</p>
      {hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

export function CardError({ message, onRetry }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-6 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500">
        <AlertTriangle className="h-4.5 w-4.5" />
      </div>
      <p className="mt-2 text-xs font-medium text-gray-600">
        {message || 'Veri yüklenemedi'}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-600 transition hover:bg-gray-50"
        >
          <RotateCw className="h-3 w-3" /> Tekrar dene
        </button>
      )}
    </div>
  );
}

export default function SectionCard({
  title,
  subtitle,
  icon: Icon,
  action,
  onRetry,
  loading = false,
  error = null,
  empty = false,
  emptyText = 'Kayıt yok',
  emptyHint,
  emptyIcon,
  children,
  className = '',
  bodyClassName = '',
}) {
  return (
    <section
      style={{ fontFamily: 'Inter' }}
      className={`flex h-full min-h-0 flex-col rounded-2xl border border-gray-200 bg-white shadow-sm ${className}`}
    >
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon && (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
              <Icon className="h-3.5 w-3.5" strokeWidth={2.1} />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-gray-900">
              {title}
            </h2>
            {subtitle && (
              <p className="truncate text-[11px] text-gray-500">{subtitle}</p>
            )}
          </div>
        </div>

        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-800"
          >
            {action.label}
            <ExternalLink className="h-3 w-3" />
          </button>
        )}
      </header>

      <div
        className={`min-h-0 flex-1 overflow-hidden px-2 py-2 ${bodyClassName}`}
      >
        {loading ? (
          <CardSkeleton rows={4} />
        ) : error ? (
          <CardError message={error} onRetry={onRetry} />
        ) : empty ? (
          <CardEmpty icon={emptyIcon} text={emptyText} hint={emptyHint} />
        ) : (
          children
        )}
      </div>
    </section>
  );
}
