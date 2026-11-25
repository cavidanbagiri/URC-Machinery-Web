// src/components/isg/IsgTable.jsx
import {
  ArrowPathIcon,
  PencilSquareIcon,
  ShieldExclamationIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

import { ColumnFilterHeader } from '../ui/ColumnFilter';
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
  TABLE_PRIMARY,
  TABLE_ROW,
  TABLE_TERTIARY,
  TABLE_TOOLBAR,
} from '../ui/tableStyles';
import { formatDate } from '../../utils/repair';
import { ISG_STATUS_OPTIONS } from '../../utils/isg';
import IsgEvidenceCell from './IsgEvidenceCell';

//: Başlık hücresi — hizalama ortak tokenla birlikte verilir.
const HEAD_CLASS = `text-left ${TABLE_HEAD_CELL}`;

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

//: 7 görünür sütun + kalan alanı emen dolgu sütunu (boş durum satırı için).
const COLUMN_COUNT = COLUMN_IDS.length + 1;

const EMPTY_TEXT =
  'Açıklama, şantiye veya sorumlu adı ile arama yapabilirsiniz';

function Skeleton() {
  return (
    <div>
      <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50/90 px-4 py-3">
        <div className="h-2.5 w-16 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 flex-1 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 w-16 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 w-20 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 w-16 animate-pulse rounded bg-slate-200/80" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-4 py-3">
            <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
            <div className="h-3 flex-1 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>
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
        'border-slate-200 bg-slate-50 text-slate-600'
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
            <ShieldExclamationIcon className="h-3.5 w-3.5" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            ISG Kayıtları
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
        <ResizableTable resize={resize} columnIds={COLUMN_IDS} filler>
          <thead className={TABLE_HEAD}>
            <tr className="border-b border-slate-200">
              {headerColumns.map((column) => (
                <ResizableTh
                  key={column.id}
                  resize={resize}
                  columnId={column.id}
                  label={column.label}
                  className={
                    column.id === 'actions'
                      ? `${HEAD_CLASS} text-right`
                      : HEAD_CLASS
                  }
                >
                  {column.filter ? (
                    <ColumnFilterHeader
                      label={column.label}
                      filter={column.filter}
                      values={filters}
                      onChange={onFilterChange}
                    />
                  ) : column.id === 'actions' ? (
                    <span className="sr-only">{column.label}</span>
                  ) : (
                    column.label
                  )}
                </ResizableTh>
              ))}

              <TableFillerTh />
            </tr>
          </thead>

          <tbody className={`divide-y divide-slate-100 ${TABLE_BODY}`}>
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={COLUMN_COUNT} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <ShieldExclamationIcon className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-slate-900">
                      Sonuç bulunamadı
                    </p>
                    <p className="mt-1 text-[12px] text-slate-500">
                      {hasActiveFilters
                        ? 'Filtreleri değiştirin veya temizleyin'
                        : 'Henüz ISG uygunsuzluk kaydı bulunmuyor'}
                    </p>
                    {hasActiveFilters ? (
                      <button
                        type="button"
                        onClick={onResetFilters}
                        className="mt-3 rounded-md bg-blue-50 px-3 py-1.5 text-[12px] font-medium text-blue-600 transition hover:bg-blue-100"
                      >
                        Filtreleri temizle
                      </button>
                    ) : (
                      <p className="mt-1 text-[11px] text-slate-400">
                        {EMPTY_TEXT}
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {items.map((item) => {
              const deleting = deletingId === item.id;
              const statusBusy = statusBusyId === item.id;

              return (
                <tr
                  key={item.id}
                  className={`${TABLE_ROW} align-top ${loading ? 'opacity-60' : ''}`}
                >
                  <td className={`${TABLE_CELL} tabular-nums`}>
                    {formatDate(item.record_date)}
                  </td>

                  <td className={TABLE_CELL}>
                    <p
                      className={`truncate ${TABLE_PRIMARY}`}
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
                      <p className={`mt-0.5 truncate ${TABLE_TERTIARY}`}>
                        Açan: {item.created_by_name}
                      </p>
                    )}
                  </td>

                  <td className={TABLE_CELL}>
                    {item.territory_name || '—'}
                  </td>

                  <td className={TABLE_CELL}>
                    <p className="truncate" title={item.responsible_name || ''}>
                      {item.responsible_name || '—'}
                    </p>
                  </td>

                  <td className={TABLE_CELL}>
                    <StatusSelect
                      item={item}
                      busy={statusBusy}
                      onStatusChange={onStatusChange}
                    />
                  </td>

                  <td className={TABLE_CELL}>
                    <IsgEvidenceCell
                      item={item}
                      busy={evidenceBusy}
                      onUpload={onUploadEvidence}
                      onView={onViewEvidence}
                      onDownload={onDownloadEvidence}
                      onDelete={onDeleteEvidence}
                    />
                  </td>

                  <td className={`${TABLE_CELL} text-right`}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        title="Düzenle"
                        aria-label={`${item.id} numaralı kaydı düzenle`}
                        className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        disabled={deleting}
                        title="Sil"
                        aria-label={`${item.id} numaralı kaydı sil`}
                        className="rounded-md p-1.5 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {deleting ? (
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        ) : (
                          <TrashIcon className="h-4 w-4" />
                        )}
                      </button>
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
