// src/components/dailyfault/DailyFaultTable.jsx
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  DocumentPlusIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
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
  TABLE_MUTED,
  TABLE_NUM,
  TABLE_PRIMARY,
  TABLE_ROW,
  TABLE_TOOLBAR,
} from '../ui/tableStyles';
import { setFilter } from '../../stores/daily_fault_slice';
import { formatDate } from '../../utils/repair';
import { changedPartLabel, formatFileSize } from '../../utils/dailyFault';

//: 8 görünür sütun + kalan alanı emen dolgu sütunu (boş durum satırı için).
const COLUMN_COUNT = 9;

/**
 * "Değişen Parça" cell: the structured part ("315/80 R22.5 · 2 Adet") sits on
 * top, the free-text note stays below so both survive the migration.
 */
function ChangedPartCell({ item }) {
  const partLabel = changedPartLabel(item);
  const note = item.changed_parts || '';

  if (!partLabel) {
    return (
      <p className="max-w-[14rem] truncate" title={note}>
        {note || <span className="text-slate-300">—</span>}
      </p>
    );
  }

  return (
    <>
      <p
        className="max-w-[14rem] truncate text-[12px] font-medium text-slate-800"
        title={partLabel}
      >
        {partLabel}
      </p>
      {note && (
        <p className={`max-w-[14rem] truncate ${TABLE_MUTED}`} title={note}>
          {note}
        </p>
      )}
    </>
  );
}

function DocumentCell({
  item,
  busy,
  onUploadDocument,
  onViewDocument,
  onDownloadDocument,
  onDeleteDocument,
}) {
  const uploading = busy?.faultId === item.id && busy?.action === 'upload';
  const inputId = `daily-fault-document-${item.id}`;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {(item.documents || []).map((document) => {
        const deleting =
          busy?.action === 'delete' && busy?.documentId === document.id;

        return (
          <span
            key={document.id}
            className="inline-flex max-w-full items-center gap-1 rounded-full border border-blue-100 bg-blue-50/80 py-0.5 pl-2 pr-1 text-[11px] text-blue-800"
          >
            <button
              type="button"
              onClick={() => onViewDocument(item, document)}
              title={`${document.file_name} · ${formatFileSize(
                document.file_size
              )} · Görüntüle`}
              className="max-w-[9rem] truncate hover:underline"
            >
              {document.file_name}
            </button>

            <button
              type="button"
              onClick={() => onDownloadDocument(item, document)}
              title="Evrakı indir"
              aria-label={`${document.file_name} indir`}
              className="rounded p-0.5 hover:bg-blue-100"
            >
              <ArrowDownTrayIcon className="h-3 w-3" />
            </button>

            <button
              type="button"
              onClick={() => onDeleteDocument(item, document)}
              disabled={deleting}
              title="Evrakı sil"
              aria-label={`${document.file_name} sil`}
              className="rounded p-0.5 text-red-600 hover:bg-red-100 disabled:opacity-40"
            >
              {deleting ? (
                <ArrowPathIcon className="h-3 w-3 animate-spin" />
              ) : (
                <XMarkIcon className="h-3 w-3" />
              )}
            </button>
          </span>
        );
      })}

      <label
        htmlFor={inputId}
        className={`inline-flex cursor-pointer items-center gap-1 rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-[11px] font-medium text-slate-600 transition hover:border-blue-400 hover:text-blue-700 ${
          uploading ? 'pointer-events-none opacity-60' : ''
        }`}
      >
        {uploading ? (
          <ArrowPathIcon className="h-3 w-3 animate-spin" />
        ) : (
          <DocumentPlusIcon className="h-3.5 w-3.5" />
        )}
        {uploading ? 'Yükleniyor...' : 'Evrak ekle'}
      </label>
      <input
        id={inputId}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        disabled={uploading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) onUploadDocument(item, file);
        }}
      />
    </div>
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
          <div className="h-5 w-20 animate-pulse rounded-full bg-slate-100" />
          <div className="h-5 w-28 animate-pulse rounded bg-slate-100" />
          <div className="h-5 w-24 animate-pulse rounded bg-slate-100" />
          <div className="h-5 flex-1 animate-pulse rounded bg-slate-100" />
          <div className="h-5 w-32 animate-pulse rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

const EMPTY_TEXT = 'Makine, şantiye veya arıza notu ile arama yapabilirsiniz';

// Sütunların başlangıç genişlikleri (px). Kullanıcı başlıktaki tutamaçtan
// sürükleyerek değiştirir; seçim tarayıcıda saklanır (useColumnResize).
const DAILY_FAULT_COLUMN_WIDTHS = {
  fault_date: 120,
  machine: 200,
  km_hour: 110,
  territory: 120,
  repair_type: 140,
  fault_assignment: 240,
  changed_part: 190,
  documents: 250,
};

export default function DailyFaultTable({
  items,
  loading,
  hasActiveFilters,
  onResetFilters,
  onUploadDocument,
  onViewDocument,
  onDownloadDocument,
  onDeleteDocument,
  documentBusy,
}) {
  const dispatch = useDispatch();
  const filters = useSelector((s) => s.dailyFault.filters);
  const lookups = useSelector((s) => s.lookup.data);

  const handleFilterChange = (key, value) => {
    dispatch(setFilter({ key, value }));
  };

  // Kolon başlıkları — `filter` taşıyan başlıklar Excel tarzı açılır filtre alır.
  const headerColumns = [
    {
      id: 'fault_date',
      label: 'Tarih',
      filter: { kind: 'dateRange', keys: ['date_from', 'date_to'] },
    },
    {
      id: 'machine',
      label: 'Makine',
      filter: {
        kind: 'text',
        key: 'search',
        placeholder: 'Kimlik / plaka / parça / not',
      },
    },
    { id: 'km_hour', label: 'KM / Saat' },
    {
      id: 'territory',
      label: 'Şantiye',
      filter: {
        kind: 'select',
        key: 'territory_id',
        options: lookups.territory || [],
      },
    },
    {
      id: 'repair_type',
      label: 'Arıza Tipi',
      filter: {
        kind: 'select',
        key: 'repair_type_id',
        options: lookups.repair_type || [],
      },
    },
    { id: 'fault_assignment', label: 'Arıza Ataması' },
    { id: 'changed_part', label: 'Değişen Parça' },
    { id: 'documents', label: 'Evrak' },
  ];

  // Excel tarzı genişlik ayarı: başlığın sağ kenarındaki tutamaçtan sürüklenir,
  // genişlikler tarayıcıda saklanır.
  const resize = useColumnResize(
    'daily-faults:list',
    DAILY_FAULT_COLUMN_WIDTHS
  );
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
            <ClipboardDocumentListIcon className="h-3.5 w-3.5" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Arıza Kayıtları
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
                  className={`text-left ${TABLE_HEAD_CELL}`}
                >
                  {column.filter ? (
                    <ColumnFilterHeader
                      label={column.label}
                      filter={column.filter}
                      values={filters}
                      onChange={handleFilterChange}
                    />
                  ) : (
                    column.label
                  )}
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
                      <ExclamationTriangleIcon className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-slate-900">
                      Sonuç bulunamadı
                    </p>
                    <p className="mt-1 text-[12px] text-slate-500">
                      {hasActiveFilters
                        ? 'Filtreleri değiştirin veya temizleyin'
                        : 'Henüz günlük arıza kaydı bulunmuyor'}
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
                      <p className="mt-2 text-[11px] text-slate-400">
                        {EMPTY_TEXT}
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            )}
            {items.map((item) => (
              <tr key={item.id} className={`${TABLE_ROW} align-top`}>
                <td className={TABLE_CELL}>
                  <span className={`text-slate-700 ${TABLE_NUM}`}>
                    {formatDate(item.fault_date)}
                  </span>
                </td>

                <td className={TABLE_CELL}>
                  <p className={TABLE_PRIMARY}>
                    {item.identification_no || `Makine #${item.machine_id}`}
                  </p>
                  <p className={TABLE_MUTED}>
                    {[item.plate_no, item.car_mark_name, item.car_model_name]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </p>
                </td>

                <td className={`${TABLE_CELL} text-slate-700 ${TABLE_NUM}`}>
                  {item.km_hour || '—'}
                </td>

                <td className={`${TABLE_CELL} text-slate-600`}>
                  {item.territory_name || '—'}
                </td>

                <td className={TABLE_CELL}>
                  {item.repair_type_name ? (
                    <span className="inline-flex max-w-full items-center truncate rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-inset ring-amber-100">
                      {item.repair_type_name}
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>

                <td className={`${TABLE_CELL} text-slate-700`}>
                  <p
                    className="max-w-[14rem] truncate"
                    title={item.fault_assignment || ''}
                  >
                    {item.fault_assignment || '—'}
                  </p>
                </td>

                <td className={`${TABLE_CELL} text-slate-700`}>
                  <ChangedPartCell item={item} />
                </td>

                <td className="px-4 py-3">
                  <DocumentCell
                    item={item}
                    busy={documentBusy}
                    onUploadDocument={onUploadDocument}
                    onViewDocument={onViewDocument}
                    onDownloadDocument={onDownloadDocument}
                    onDeleteDocument={onDeleteDocument}
                  />
                </td>

                <TableFillerTd />
              </tr>
            ))}
          </tbody>
        </ResizableTable>
      </div>
    </div>
  );
}

