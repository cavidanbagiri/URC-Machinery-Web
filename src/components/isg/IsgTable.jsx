// src/components/isg/IsgTable.jsx
import {
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

import { ColumnFilterHeader } from '../ui/ColumnFilter';
import ResizableTable, { ResizableTh } from '../ui/ResizableTable';
import useColumnResize from '../ui/useColumnResize';
import { formatDate } from '../../utils/repair';
import { ISG_STATUS_OPTIONS } from '../../utils/isg';
import IsgEvidenceCell from './IsgEvidenceCell';

//: Durum dropdown renkleri; kodlar backend'deki check constraint ile aynı.
const STATUS_SELECT_CLASS = {
  acik: 'border-amber-200 bg-amber-50 text-amber-800',
  kapali: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};

const COLUMN_WIDTHS = {
  record_date: 110,
  description: 320,
  territory: 120,
  responsible: 170,
  status: 120,
  evidence: 240,
  actions: 90,
};

const COLUMN_IDS = Object.keys(COLUMN_WIDTHS);

const EMPTY_TEXT =
  'Açıklama, şantiye veya sorumlu adı ile arama yapabilirsiniz';

function Skeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex gap-4 px-6 py-3">
          <div className="h-5 w-20 animate-pulse rounded bg-gray-100" />
          <div className="h-5 flex-1 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-24 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-28 animate-pulse rounded-full bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

/** The row's status dropdown — choosing "Kapalı" opens the evidence dialog. */
function StatusSelect({ item, busy, onStatusChange }) {
  const handleChange = async (event) => {
    const nextStatus = event.target.value;
    const applied = await onStatusChange(item, nextStatus);
    // The user cancelled (or the close dialog took over): show the stored value
    // again even though no re-render happened in between.
    if (!applied) event.target.value = item.status;
  };

  return (
    <select
      value={item.status}
      onChange={handleChange}
      disabled={busy}
      aria-label={`${item.id} numaralı kaydın durumu`}
      title="Durumu değiştir"
      className={`w-full max-w-[7rem] cursor-pointer rounded-full border px-2 py-0.5 text-[11px] font-medium outline-none transition focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 ${
        STATUS_SELECT_CLASS[item.status] ||
        'border-gray-200 bg-gray-50 text-gray-600'
      }`}
    >
      {ISG_STATUS_OPTIONS.map((option) => (
        <option key={option.code} value={option.code}>
          {option.label}
        </option>
      ))}
    </select>
  );
}


export default function IsgTable({
  items,
  loading,
  hasActiveFilters,
  onResetFilters,
  filters,
  onFilterChange,
  territories,
  responsibles,
  onEdit,
  onDelete,
  deletingId,
  onStatusChange,
  statusBusyId,
  onUploadEvidence,
  onViewEvidence,
  onDownloadEvidence,
  onDeleteEvidence,
  evidenceBusy,
}) {
  const resize = useColumnResize('isg:list', COLUMN_WIDTHS);

  const headerColumns = [
    {
      id: 'record_date',
      label: 'Tarih',
      filter: { kind: 'dateRange', keys: ['date_from', 'date_to'] },
    },
    {
      id: 'description',
      label: 'Açıklama',
      filter: {
        kind: 'text',
        key: 'search',
        placeholder: 'Açıklama / sorumlu / şantiye',
      },
    },
    {
      id: 'territory',
      label: 'Şantiye',
      filter: {
        kind: 'select',
        key: 'territory_id',
        options: territories,
      },
    },
    {
      id: 'responsible',
      label: 'Sorumlu',
      filter: {
        kind: 'select',
        key: 'responsible_name',
        options: responsibles,
      },
    },
    {
      id: 'status',
      label: 'Durum',
      filter: {
        kind: 'select',
        key: 'status',
        // ColumnFilter reads {value,label}; the store keeps {code,label}.
        options: ISG_STATUS_OPTIONS.map((option) => ({
          value: option.code,
          label: option.label,
        })),
      },
    },
    { id: 'evidence', label: 'Kanıt' },
    { id: 'actions', label: 'İşlemler' },
  ];

  if (loading && items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <Skeleton />
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
        <p className="text-sm font-medium text-gray-900">Sonuç bulunamadı</p>
        <p className="mt-1 text-sm text-gray-500">
          {hasActiveFilters
            ? 'Filtreleri değiştirin veya temizleyin'
            : 'Henüz ISG uygunsuzluk kaydı bulunmuyor'}
        </p>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-3 text-sm font-medium text-blue-600 hover:underline"
          >
            Filtreleri temizle
          </button>
        ) : (
          <p className="mt-2 text-xs text-gray-400">{EMPTY_TEXT}</p>
        )}
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
          columnIds={COLUMN_IDS}
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
                  className="px-4 py-2.5 text-left font-medium"
                >
                  {column.filter ? (
                    <ColumnFilterHeader
                      label={column.label}
                      filter={column.filter}
                      values={filters}
                      onChange={onFilterChange}
                    />
                  ) : (
                    column.label
                  )}
                </ResizableTh>
              ))}
            </tr>
          </thead>

          <tbody className="text-sm text-gray-800">
            {items.map((item) => {
              const deleting = deletingId === item.id;
              const statusBusy = statusBusyId === item.id;

              return (
                <tr
                  key={item.id}
                  className="border-t border-gray-100 align-top hover:bg-gray-50"
                >
                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                    {formatDate(item.record_date)}
                  </td>

                  <td className="px-4 py-2.5">
                    <p
                      className="max-w-[28rem] truncate text-[13px] text-gray-900"
                      title={item.description}
                    >
                      {item.description}
                    </p>
                    {item.status === 'kapali' && item.closed_at && (
                      <p className="mt-0.5 truncate text-[11px] text-emerald-700">
                        Kapandı: {formatDate(item.closed_at)}
                        {item.closed_by_name
                          ? ` · ${item.closed_by_name}`
                          : ''}
                      </p>
                    )}
                    {item.created_by_name && (
                      <p className="mt-0.5 truncate text-[11px] text-gray-400">
                        Açan: {item.created_by_name}
                      </p>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                    {item.territory_name || '—'}
                  </td>

                  <td className="px-4 py-2.5 text-[12px] text-gray-700">
                    <p className="truncate" title={item.responsible_name || ''}>
                      {item.responsible_name || '—'}
                    </p>
                  </td>

                  <td className="px-4 py-2.5">
                    <StatusSelect
                      item={item}
                      busy={statusBusy}
                      onStatusChange={onStatusChange}
                    />
                  </td>

                  <td className="px-4 py-2.5">
                    <IsgEvidenceCell
                      item={item}
                      busy={evidenceBusy}
                      onUpload={onUploadEvidence}
                      onView={onViewEvidence}
                      onDownload={onDownloadEvidence}
                      onDelete={onDeleteEvidence}
                    />
                  </td>

                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        title="Düzenle"
                        aria-label={`${item.id} numaralı kaydı düzenle`}
                        className="rounded-lg p-1.5 text-gray-500 transition hover:bg-blue-50 hover:text-blue-700"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        disabled={deleting}
                        title="Sil"
                        aria-label={`${item.id} numaralı kaydı sil`}
                        className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {deleting ? (
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        ) : (
                          <TrashIcon className="h-4 w-4" />
                        )}
                      </button>
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
