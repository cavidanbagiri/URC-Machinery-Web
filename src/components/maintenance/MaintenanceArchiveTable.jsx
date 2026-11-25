// src/components/maintenance/MaintenanceArchiveTable.jsx
// "Arşiv" sekmesi: yapılan bakımların kayıt listesi. Periyodik Bakım sayfasının
// ana tablosu makine odaklıdır (her makine tek satır: planı + durumu); burada
// her satır bir bakım kaydıdır (maintenance_records.record_type = "maintenance").
// Görsel dil ana tabloyla aynıdır: `tableStyles` sabitleri + dolgu sütunu ile
// mutlak (piksel) sütun genişliği.
import {
  ArrowDownTrayIcon,
  ArchiveBoxIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

import ResizableTable, {
  ResizableTh,
  TableFillerTd,
  TableFillerTh,
} from '../ui/ResizableTable';
import useColumnResize from '../ui/useColumnResize';
import {
  TABLE_BODY,
  TABLE_CARD,
  TABLE_CELL,
  TABLE_HEAD,
  TABLE_HEAD_CELL,
  TABLE_MUTED,
  TABLE_NUM,
  TABLE_PRIMARY,
  TABLE_ROW,
  TABLE_TERTIARY,
  TABLE_TOOLBAR,
} from '../ui/tableStyles';
import {
  formatCounter,
  formatDate,
  formatDateTime,
  formatFileSize,
} from '../../utils/maintenance';

//: 8 görünür sütun + kalan alanı emen dolgu sütunu (boş durum satırı için).
const COLUMN_COUNT = 9;

const ARCHIVE_COLUMN_WIDTHS = {
  date: 140,
  machine: 240,
  vehicle: 200,
  package: 160,
  counter: 150,
  notes: 300,
  created_by: 150,
  documents: 130,
};

function ActionButton({ title, onClick, tone = 'blue', children }) {
  const tones = {
    blue: 'text-blue-600 hover:bg-blue-50',
    green: 'text-emerald-600 hover:bg-emerald-50',
    slate: 'text-slate-400 hover:bg-slate-100 hover:text-slate-700',
  };

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`rounded-md p-1.5 transition ${tones[tone] || tones.blue}`}
    >
      {children}
    </button>
  );
}

function Skeleton() {
  return (
    <div className="divide-y divide-slate-100">
      <div className="flex gap-4 bg-slate-50/90 px-4 py-3">
        {[56, 96, 72, 104, 120].map((width) => (
          <div
            key={width}
            className="h-3 animate-pulse rounded-full bg-slate-200/80"
            style={{ width }}
          />
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 px-4 py-3.5">
          <div className="h-5 w-24 animate-pulse rounded-full bg-slate-100" />
          <div className="h-5 w-32 animate-pulse rounded bg-slate-100" />
          <div className="h-5 w-24 animate-pulse rounded bg-slate-100" />
          <div className="h-5 flex-1 animate-pulse rounded bg-slate-100" />
          <div className="h-5 w-20 animate-pulse rounded-full bg-slate-100" />
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
      <div className={TABLE_CARD}>
        <Skeleton />
      </div>
    );
  }

  return (
    <div className={TABLE_CARD}>
      {loading && (
        <div className="h-0.5 w-full overflow-hidden bg-blue-100">
          <div className="h-full w-1/3 animate-pulse bg-blue-500" />
        </div>
      )}

      <div className={TABLE_TOOLBAR}>
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-500">
            <ArchiveBoxIcon className="h-3.5 w-3.5" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Bakım Kayıtları
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-slate-500">
            {items.length}
          </span>
        </div>

        {resize.isCustomized && (
          <button
            type="button"
            onClick={resize.resetAll}
            className="shrink-0 rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            Sütun genişliklerini sıfırla
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <ResizableTable
          resize={resize}
          columnIds={columnIds}
          filler
          style={{ fontFamily: 'Inter' }}
        >
          <thead className={TABLE_HEAD}>
            <tr className="border-b border-slate-200">
              {headerColumns.map((column) => (
                <ResizableTh
                  key={column.id}
                  resize={resize}
                  columnId={column.id}
                  label={column.label}
                  className={`${TABLE_HEAD_CELL} ${
                    column.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {column.label}
                </ResizableTh>
              ))}

              <TableFillerTh />
            </tr>
          </thead>

          <tbody className={`divide-y divide-slate-100 ${TABLE_BODY}`}>
            {items.length === 0 && (
              <tr>
                <td colSpan={COLUMN_COUNT} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <ArchiveBoxIcon className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-slate-900">
                      Sonuç bulunamadı
                    </p>
                    <p className="mt-1 text-[12px] text-slate-500">
                      {hasActiveFilters
                        ? 'Filtreleri değiştirin veya temizleyin'
                        : 'Henüz tamamlanmış bakım kaydı bulunmuyor'}
                    </p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={onResetFilters}
                        className="mt-3 rounded-md bg-blue-50 px-3 py-1.5 text-[12px] font-medium text-blue-600 transition hover:bg-blue-100"
                      >
                        Filtreleri temizle
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}


            {items.map((record) => {
              const vehicle = [record.car_mark_name, record.car_model_name]
                .filter(Boolean)
                .join(' ');

              return (
                <tr key={record.id} className={TABLE_ROW}>
                  <td className={TABLE_CELL}>
                    <p
                      className={`text-[12px] font-medium text-slate-800 ${TABLE_NUM}`}
                    >
                      {formatDate(record.record_date)}
                    </p>
                    {record.created_at && (
                      <p className={`${TABLE_TERTIARY} ${TABLE_NUM}`}>
                        {formatDateTime(record.created_at)}
                      </p>
                    )}
                  </td>

                  <td className={TABLE_CELL}>
                    <p className={TABLE_PRIMARY}>
                      {record.identification_no ||
                        `Makine #${record.machine_id}`}
                    </p>
                    <p className={TABLE_MUTED}>
                      {[record.plate_no, record.territory_name]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </p>
                  </td>

                  <td className={TABLE_CELL}>
                    <p className="text-slate-700">{record.type_name || '—'}</p>
                    {vehicle && <p className={TABLE_MUTED}>{vehicle}</p>}
                  </td>

                  <td className={TABLE_CELL}>
                    {record.interval_value === null ||
                    record.interval_value === undefined ? (
                      <span className="text-slate-300">—</span>
                    ) : (
                      <span
                        className={`inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ${TABLE_NUM}`}
                      >
                        {formatCounter(record.interval_value, record.usage_unit)}
                      </span>
                    )}
                  </td>

                  <td className={TABLE_CELL}>
                    <span className={`text-slate-800 ${TABLE_NUM}`}>
                      {formatCounter(record.counter_value, record.usage_unit)}
                    </span>
                  </td>

                  <td className="whitespace-normal px-4 py-3 align-top text-slate-600">
                    {record.notes ? (
                      <p
                        title={record.notes}
                        className="line-clamp-2 whitespace-pre-line break-words"
                      >
                        {record.notes}
                      </p>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  <td className={`${TABLE_CELL} text-slate-600`}>
                    {record.created_by_name || 'Sistem'}
                  </td>

                  <td className={`${TABLE_CELL} text-right`}>
                    <div className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
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
                        <span className="px-1.5 text-slate-300">—</span>
                      )}
                    </div>
                  </td>

                  <TableFillerTd />
                </tr>
              );
            })}
          </tbody>
        </ResizableTable>
      </div>
    </div>
  );
}

