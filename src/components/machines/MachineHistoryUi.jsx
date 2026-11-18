// src/components/machines/MachineHistoryUi.jsx
// Shared building blocks for the machine detail history tabs.
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

import { formatFileSize } from '../../utils/dailyFault';

export function HistoryLoading({ label = 'Geçmiş yükleniyor...' }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-8 text-sm text-gray-500">
      <ArrowPathIcon className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export function HistoryError({ message, onRetry }) {
  return (
    <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-4 text-sm text-red-700">
      <p>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 text-xs font-semibold underline underline-offset-2"
        >
          Tekrar dene
        </button>
      )}
    </div>
  );
}

export function HistoryWarning({ message }) {
  return (
    <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-800">
      {message}
    </div>
  );
}

export function HistoryEmpty({ icon: Icon, title, hint }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-10 text-center">
      {Icon && <Icon className="mx-auto h-8 w-8 text-gray-300" />}
      <p className="mt-2 text-sm font-medium text-gray-700">{title}</p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export function HistoryFooter({ children }) {
  return (
    <p className="rounded-lg bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
      {children}
    </p>
  );
}

export function DocumentChips({ documents, onView, onDownload }) {
  if (!documents?.length) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {documents.map((document) => (
        <span
          key={document.id}
          className="inline-flex max-w-full items-center gap-1 rounded-full border border-blue-100 bg-blue-50 py-0.5 pl-2 pr-1 text-[11px] text-blue-800"
        >
          <button
            type="button"
            onClick={() => onView?.(document)}
            title={`${document.file_name} · Görüntüle`}
            className="inline-flex min-w-0 items-center gap-1 hover:underline"
          >
            <DocumentTextIcon className="h-3.5 w-3.5 flex-none" />
            <span className="max-w-[12rem] truncate">{document.file_name}</span>
          </button>
          <span className="flex-none text-[10px] text-blue-500">
            {formatFileSize(document.file_size)}
          </span>
          <button
            type="button"
            onClick={() => onDownload?.(document)}
            title="Evrakı indir"
            aria-label={`${document.file_name} indir`}
            className="flex-none rounded p-0.5 text-emerald-600 transition hover:bg-emerald-100"
          >
            <ArrowDownTrayIcon className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
}
