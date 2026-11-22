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
  XMarkIcon,
} from '@heroicons/react/24/outline';

import { ColumnFilterHeader } from '../ui/ColumnFilter';
import ResizableTable, { ResizableTh } from '../ui/ResizableTable';
import useColumnResize from '../ui/useColumnResize';
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
    <div className="flex min-w-[12rem] flex-wrap items-center gap-1.5">
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
        className={`inline-flex cursor-pointer items-center gap-1 rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-[11px] font-medium text-gray-600 transition hover:border-blue-400 hover:text-blue-700 ${
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
          : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'
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
        className="rounded-lg border border-gray-200 p-1.5 text-gray-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <PencilSquareIcon className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => onDelete?.(item)}
        disabled={deleting}
        title="Lastik kaydını sil"
        aria-label="Lastik kaydını sil"
        className="rounded-lg border border-gray-200 p-1.5 text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
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
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex gap-4 px-6 py-3">
          <div className="h-5 w-20 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-28 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-24 animate-pulse rounded bg-gray-100" />
          <div className="h-5 flex-1 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-32 animate-pulse rounded-full bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

// Sütunların başlangıç genişlikleri (px). Kullanıcı başlıktaki tutamaçtan
// sürükleyerek değiştirir; seçim tarayıcıda saklanır (useColumnResize).
const TIRE_COLUMN_WIDTHS = {
  change_date: 120,
  machine: 210,
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
            : 'Henüz lastik değişim kaydı bulunmuyor'}
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
            </tr>
          </thead>

          <tbody className="text-sm text-gray-800">
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-t border-gray-100 align-top hover:bg-gray-50"
              >
                <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                  {formatDate(item.change_date)}
                </td>

                <td className="px-4 py-2.5">
                  <p className="text-[13px] font-medium text-gray-900">
                    {item.identification_no || `Makine #${item.machine_id}`}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {[item.plate_no, item.car_mark_name, item.car_model_name]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </p>
                </td>

                <td className="whitespace-nowrap px-4 py-2.5">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                    {item.position || '—'}
                  </span>
                </td>

                <td className="px-4 py-2.5 text-[12px] text-gray-700">
                  <p
                    className="max-w-[10rem] truncate font-mono"
                    title={item.serial_no || ''}
                  >
                    {item.serial_no || '—'}
                  </p>
                </td>

                <td className="px-4 py-2.5 text-[12px] text-gray-700">
                  <p
                    className="max-w-[12rem] truncate"
                    title={formatTireBrand(item.brand_model)}
                  >
                    {formatTireBrand(item.brand_model)}
                  </p>
                </td>

                <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                  {item.size || '—'}
                </td>

                <td className="px-4 py-2.5 text-[12px] text-gray-700">
                  <p
                    className="max-w-[14rem] truncate"
                    title={item.change_reason || ''}
                  >
                    {item.change_reason || '—'}
                  </p>
                </td>

                <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                  {item.km_hour || '—'}
                </td>

                <td className="px-4 py-2.5">
                  <DocumentCell
                    item={item}
                    busy={documentBusy}
                    onUploadDocument={onUploadDocument}
                    onViewDocument={onViewDocument}
                    onDownloadDocument={onDownloadDocument}
                    onDeleteDocument={onDeleteDocument}
                  />
                </td>

                <td className="whitespace-nowrap px-4 py-2.5">
                  <HistoryButton item={item} onShowHistory={onShowHistory} />
                </td>

                <td className="whitespace-nowrap px-4 py-2.5 text-right">
                  <RowActions
                    item={item}
                    busy={rowBusy}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </ResizableTable>
      </div>
    </div>
  );
}
