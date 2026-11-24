// src/components/maintenance/MaintenanceArchiveTable.jsx
// "Arşiv" sekmesi: yapılan bakımların kayıt listesi. Periyodik Bakım sayfasının
// ana tablosu makine odaklıdır (her makine tek satır: planı + durumu); burada
// her satır bir bakım kaydıdır (maintenance_records.record_type = "maintenance").
import {
  ArrowDownTrayIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

import ResizableTable, { ResizableTh } from '../ui/ResizableTable';
import useColumnResize from '../ui/useColumnResize';
import {
  formatCounter,
  formatDate,
  formatDateTime,
  formatFileSize,
} from '../../utils/maintenance';

const COLUMN_COUNT = 8;

const ARCHIVE_COLUMN_WIDTHS = {
  date: 130,
  machine: 230,
  vehicle: 200,
  package: 150,
  counter: 150,
  notes: 280,
  created_by: 150,
  documents: 130,
};

function ActionButton({ title, onClick, tone = 'blue', children }) {
  const tones = {
    blue: 'text-blue-600 hover:bg-blue-50',
    green: 'text-emerald-600 hover:bg-emerald-50',
  };

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`rounded-lg p-1.5 transition ${tones[tone] || tones.blue}`}
    >
      {children}
    </button>
  );
}

function Skeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex gap-4 px-6 py-3">
          <div className="h-5 w-20 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-32 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-24 animate-pulse rounded bg-gray-100" />
          <div className="h-5 flex-1 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-24 animate-pulse rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

export default function MaintenanceArchiveTable({
  items,
  loading,
  hasActiveFilters,
  onResetFilters,
  onViewDocument,
  onDownloadDocument,
}) {
  const headerColumns = [
    { id: 'date', label: 'Tarih' },
    { id: 'machine', label: 'Makine' },
    { id: 'vehicle', label: 'Tip / Marka' },
    { id: 'package', label: 'Bakım Paketi' },
    { id: 'counter', label: 'Sayaç' },
    { id: 'notes', label: 'Not' },
    { id: 'created_by', label: 'Yapan' },
    { id: 'documents', label: 'Evrak', align: 'right' },
  ];

  const resize = useColumnResize('maintenance:archive', ARCHIVE_COLUMN_WIDTHS);
  const columnIds = headerColumns.map((column) => column.id);

  if (loading && items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <Skeleton />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {loading && (
        <div className="h-0.5 w-full overflow-hidden bg-blue-100">
          <div className="h-full w-1/3 animate-pulse bg-blue-500" />
        </div>
      )}

      <div className="overflow-x-auto">
        <ResizableTable
          resize={resize}
          columnIds={columnIds}
          style={{ fontFamily: 'Inter' }}
        >
          <thead className="bg-gray-100 text-[11px] uppercase text-gray-700">
            <tr>
              {headerColumns.map((column) => (
                <ResizableTh
                  key={column.id}
                  resize={resize}
                  columnId={column.id}
                  label={column.label}
                  className={`px-4 py-2.5 font-medium ${
                    column.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {column.label}
                </ResizableTh>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {items.length === 0 && (
              <tr>
                <td colSpan={COLUMN_COUNT} className="px-4 py-12 text-center">
                  <p className="text-sm font-medium text-gray-900">
                    Sonuç bulunamadı
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {hasActiveFilters
                      ? 'Filtreleri değiştirin veya temizleyin'
                      : 'Henüz tamamlanmış bakım kaydı bulunmuyor'}
                  </p>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={onResetFilters}
                      className="mt-3 text-sm font-medium text-blue-600 hover:underline"
                    >
                      Filtreleri temizle
                    </button>
                  )}
                </td>
              </tr>
            )}


            {items.map((record) => {
              const vehicle = [record.car_mark_name, record.car_model_name]
                .filter(Boolean)
                .join(' ');

              return (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                    <p className="font-medium text-gray-900">
                      {formatDate(record.record_date)}
                    </p>
                    {record.created_at && (
                      <p className="text-[11px] text-gray-400">
                        {formatDateTime(record.created_at)}
                      </p>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5">
                    <p className="text-[12px] font-medium text-gray-900">
                      {record.identification_no ||
                        `Makine #${record.machine_id}`}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {[record.plate_no, record.territory_name]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                    <p>{record.type_name || '—'}</p>
                    {vehicle && (
                      <p className="text-[11px] text-gray-500">{vehicle}</p>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px]">
                    {record.interval_value === null ||
                    record.interval_value === undefined ? (
                      <span className="text-gray-400">—</span>
                    ) : (
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                        {formatCounter(record.interval_value, record.usage_unit)}
                      </span>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                    {formatCounter(record.counter_value, record.usage_unit)}
                  </td>

                  <td className="min-w-[160px] max-w-[280px] px-4 py-2.5 align-top text-[12px] text-gray-700">
                    {record.notes ? (
                      <p
                        title={record.notes}
                        className="line-clamp-2 whitespace-pre-line break-words"
                      >
                        {record.notes}
                      </p>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                    {record.created_by_name || 'Sistem'}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {record.documents?.length ? (
                        record.documents.map((document) => (
                          <span
                            key={document.id}
                            className="inline-flex items-center gap-0.5"
                          >
                            <ActionButton
                              title={`${document.file_name} · Görüntüle (${formatFileSize(
                                document.file_size
                              )})`}
                              onClick={() => onViewDocument?.(document)}
                              tone="blue"
                            >
                              <DocumentTextIcon className="h-4 w-4" />
                            </ActionButton>
                            <ActionButton
                              title={`${document.file_name} · İndir`}
                              onClick={() => onDownloadDocument?.(document)}
                              tone="green"
                            >
                              <ArrowDownTrayIcon className="h-4 w-4" />
                            </ActionButton>
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </ResizableTable>
      </div>
    </div>
  );
}

