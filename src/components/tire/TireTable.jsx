// src/components/tire/TireTable.jsx
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ClockIcon,
  DocumentPlusIcon,
  PencilSquareIcon,
  TrashIcon,
  TruckIcon,
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
  TABLE_PRIMARY,
  TABLE_ROW,
  TABLE_TOOLBAR,
} from '../ui/tableStyles';
import { setFilter } from '../../stores/tire_slice';
import { fetchLookupIfNeeded } from '../../stores/lookup_slice';
import { formatDate } from '../../utils/repair';
import { formatFileSize, formatTireBrand } from '../../utils/tire';

function DocumentCell({
  item,
  busy,
  onUploadDocument,
  onViewDocument,
  onDownloadDocument,
  onDeleteDocument,
}) {
  const uploading = busy?.tireId === item.id && busy?.action === 'upload';
  const inputId = `tire-document-${item.id}`;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {(item.documents || []).map((document) => {
        const deleting =
          busy?.action === 'delete' && busy?.documentId === document.id;

        return (
          <span
            key={document.id}
            className="inline-flex max-w-full items-center gap-1 rounded-full border border-blue-100 bg-blue-50 py-0.5 pl-2 pr-1 text-[11px] text-blue-800"
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

function HistoryButton({ item, onShowHistory }) {
  const count = item.previous_count || 0;

  return (
    <button
      type="button"
      onClick={() => onShowHistory(item)}
      title={
        count > 0
          ? `${count} eski kayıt var · geçmişi aç`
          : 'Bu lastik konumu için eski kayıt yok'
      }
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition ${
        count > 0
          ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
          : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
      }`}
    >
      <ClockIcon className="h-3.5 w-3.5" />
      {count > 0 ? `Eski kayıtlar (${count})` : 'Geçmiş'}
    </button>
  );
}

function RowActions({ item, busy, onEdit, onDelete }) {
  const deleting = busy?.tireId === item.id && busy?.action === 'delete';

  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={() => onEdit?.(item)}
        disabled={deleting}
        title="Lastik kaydını düzenle"
        aria-label="Lastik kaydını düzenle"
        className="rounded-md border border-slate-200 p-1.5 text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <PencilSquareIcon className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => onDelete?.(item)}
        disabled={deleting}
        title="Lastik kaydını sil"
        aria-label="Lastik kaydını sil"
        className="rounded-md border border-slate-200 p-1.5 text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {deleting ? (
          <ArrowPathIcon className="h-4 w-4 animate-spin" />
        ) : (
          <TrashIcon className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

function Skeleton() {
  return (
    <div>
      <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50/90 px-4 py-3">
        <div className="h-2.5 w-12 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 w-20 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 w-16 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 flex-1 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 w-16 animate-pulse rounded bg-slate-200/80" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-4 py-3">
            <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
            <div className="h-3 flex-1 animate-pulse rounded bg-slate-100" />
            <div className="h-5 w-32 animate-pulse rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Sütunların başlangıç genişlikleri (px). Kullanıcı başlıktaki tutamaçtan
// sürükleyerek değiştirir; seçim tarayıcıda saklanır (useColumnResize).
const TIRE_COLUMN_WIDTHS = {
  change_date: 120,
  machine: 210,
  machine_type: 150,
  position: 150,
  serial_no: 160,
  brand_model: 180,
  size: 120,
  change_reason: 220,
  km_hour: 130,
  documents: 220,
  history: 130,
  actions: 110,
};

const EMPTY_TEXT =
  'Makine kimlik no, lastik konumu, seri no veya marka / model ile arama yapabilirsiniz';

export default function TireTable({
  items,
  loading,
  hasActiveFilters,
  onResetFilters,
  onShowHistory,
  onUploadDocument,
  onViewDocument,
  onDownloadDocument,
  onDeleteDocument,
  documentBusy,
  onEdit,
  onDelete,
  rowBusy,
}) {
  const dispatch = useDispatch();
  const filters = useSelector((s) => s.tire.filters);
  // Ayarlar → Lastik Konumu (column filter suggestions).
  const positions = useSelector((s) => s.lookup.data.tire_position);

  useEffect(() => {
    dispatch(fetchLookupIfNeeded('tire_position'));
  }, [dispatch]);

  const handleFilterChange = (key, value) => {
    dispatch(setFilter({ key, value }));
  };

  // Kolon başlıkları — `filter` taşıyan başlıklar Excel tarzı açılır filtre alır.
  const headerColumns = [
    {
      id: 'change_date',
      label: 'Tarih',
      filter: { kind: 'dateRange', keys: ['date_from', 'date_to'] },
    },
    {
      id: 'machine',
      label: 'ID No',
      filter: {
        kind: 'text',
        key: 'search',
        placeholder: 'Kimlik no / plaka / seri no',
      },
    },
    { id: 'machine_type', label: 'Ekipman Tipi' },
    {
      id: 'position',
      label: 'Lastik Konumu',
      filter: {
        kind: 'select',
        key: 'position',
        options: positions.map((position) => position.name),
      },
    },
    { id: 'serial_no', label: 'Lastik Seri No' },
    { id: 'brand_model', label: 'Lastik Marka / Model' },
    { id: 'size', label: 'Lastik Ebadı' },
    { id: 'change_reason', label: 'Değişim Sebebi' },
    { id: 'km_hour', label: 'Motor Saati / KM' },
    { id: 'documents', label: 'Evrak' },
    { id: 'history', label: 'Eski Kayıtlar' },
    { id: 'actions', label: 'İşlemler' },
  ];

  // Excel tarzı genişlik ayarı: başlığın sağ kenarındaki tutamaçtan sürüklenir,
  // genişlikler tarayıcıda saklanır.
  const resize = useColumnResize('tires:list', TIRE_COLUMN_WIDTHS);
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
      <div className={TABLE_TOOLBAR}>
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-500">
            <TruckIcon className="h-3.5 w-3.5" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Lastik Değişim Kayıtları
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

      {loading && (
        <div className="h-0.5 w-full overflow-hidden bg-slate-100">
          <div className="h-full w-1/3 animate-pulse bg-slate-400" />
        </div>
      )}

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
                    column.id === 'actions' ? 'text-right' : 'text-left'
                  }`}
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
                <td colSpan={13} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <TruckIcon className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-slate-900">
                      Sonuç bulunamadı
                    </p>
                    <p className="mt-1 text-[12px] text-slate-500">
                      {hasActiveFilters
                        ? 'Filtreleri değiştirin veya temizleyin'
                        : 'Henüz lastik değişim kaydı bulunmuyor'}
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
                      <p className="mt-1 max-w-md text-[11px] text-slate-400">
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
                  {formatDate(item.change_date)}
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

                <td className={TABLE_CELL}>
                  {item.type_name || '—'}
                </td>

                <td className={TABLE_CELL}>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                    {item.position || '—'}
                  </span>
                </td>

                <td className={TABLE_CELL}>
                  <p
                    className="max-w-[10rem] truncate font-mono"
                    title={item.serial_no || ''}
                  >
                    {item.serial_no || '—'}
                  </p>
                </td>

                <td className={TABLE_CELL}>
                  <p
                    className="max-w-[12rem] truncate"
                    title={formatTireBrand(item.brand_model)}
                  >
                    {formatTireBrand(item.brand_model)}
                  </p>
                </td>

                <td className={TABLE_CELL}>
                  {item.size || '—'}
                </td>

                <td className={TABLE_CELL}>
                  <p
                    className="max-w-[14rem] truncate"
                    title={item.change_reason || ''}
                  >
                    {item.change_reason || '—'}
                  </p>
                </td>

                <td className={`${TABLE_CELL} tabular-nums`}>
                  {item.km_hour || '—'}
                </td>

                <td className={TABLE_CELL}>
                  <DocumentCell
                    item={item}
                    busy={documentBusy}
                    onUploadDocument={onUploadDocument}
                    onViewDocument={onViewDocument}
                    onDownloadDocument={onDownloadDocument}
                    onDeleteDocument={onDeleteDocument}
                  />
                </td>

                <td className={TABLE_CELL}>
                  <HistoryButton item={item} onShowHistory={onShowHistory} />
                </td>

                <td className={`${TABLE_CELL} text-right`}>
                  <RowActions
                    item={item}
                    busy={rowBusy}
                    onEdit={onEdit}
                    onDelete={onDelete}
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
