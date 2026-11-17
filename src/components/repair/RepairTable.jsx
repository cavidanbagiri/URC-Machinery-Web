// src/components/repair/RepairTable.jsx
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowPathIcon,
  ChatBubbleLeftEllipsisIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

import StatusBadge from '../machines/StatusBadge';
import { ColumnFilterHeader } from '../ui/ColumnFilter';
import ResizableTable, { ResizableTh } from '../ui/ResizableTable';
import useColumnResize from '../ui/useColumnResize';
import {
  setFilter,
  setFilters,
} from '../../stores/repair_slice';
import { durationLabel, formatDate, remainingLabel } from '../../utils/repair';

const COLUMN_COUNT = 9;

// Sütunların başlangıç genişlikleri (px). Kullanıcı başlıktaki tutamaçtan
// sürükleyerek değiştirir; seçim tarayıcıda saklanır (useColumnResize).
const REPAIR_COLUMN_WIDTHS = {
  status: 130,
  machine: 230,
  repair_type: 150,
  garage_service: 160,
  fault_location: 170,
  entry: 130,
  estimated_exit: 160,
  notes: 260,
  actions: 170,
};

// Hover kartı tablonun `overflow-x-auto` kabuğu tarafından kırpılmasın diye
// body'ye portal ile, tetikleyici hücrenin ekran koordinatlarına göre çizilir.
const NOTE_PREVIEW_WIDTH = 288;
const NOTE_PREVIEW_ESTIMATED_HEIGHT = 120;

function NotePreview({ preview }) {
  if (!preview) return null;

  return createPortal(
    <div
      role="tooltip"
      style={{
        position: 'fixed',
        top: preview.top,
        left: preview.left,
        width: preview.width,
        transform: preview.placement === 'top' ? 'translateY(-100%)' : undefined,
      }}
      className="pointer-events-none z-50 rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        Güncel durum / not
      </p>
      <p className="mt-1 whitespace-pre-line break-words text-[12px] leading-snug text-gray-700">
        {preview.text}
      </p>
    </div>,
    document.body
  );
}

function ActionButton({ title, onClick, tone = 'blue', children }) {
  const tones = {
    blue: 'text-blue-600 hover:bg-blue-50',
    green: 'text-emerald-600 hover:bg-emerald-50',
    gray: 'text-gray-500 hover:bg-gray-100',
    red: 'text-red-600 hover:bg-red-50',
    amber: 'text-amber-600 hover:bg-amber-50',
  };

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`rounded-lg p-1.5 transition ${
        tones[tone] || tones.blue
      }`}
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
          <div className="h-5 w-20 animate-pulse rounded-full bg-gray-100" />
          <div className="h-5 w-28 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-24 animate-pulse rounded bg-gray-100" />
          <div className="h-5 flex-1 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-24 animate-pulse rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

export default function RepairTable({
  items,
  loading,
  hasActiveFilters,
  onOpenFilters,
  onResetFilters,
  onEdit,
  onCloseRepair,
  onCancel,
  onReopen,
  onNote,
  onHistory,
  onDocuments,
}) {
  const dispatch = useDispatch();
  const filters = useSelector((s) => s.repair.filters);
  const lookups = useSelector((s) => s.lookup.data);
  const [notePreview, setNotePreview] = useState(null);

  const showNotePreview = (event, text) => {
    if (!text) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const width = Math.min(NOTE_PREVIEW_WIDTH, window.innerWidth - 16);
    const placeOnTop =
      rect.bottom + NOTE_PREVIEW_ESTIMATED_HEIGHT > window.innerHeight;

    setNotePreview({
      text,
      width,
      top: placeOnTop ? rect.top - 8 : rect.bottom + 8,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
      placement: placeOnTop ? 'top' : 'bottom',
    });
  };

  const hideNotePreview = () => setNotePreview(null);

  // Kart `position: fixed` olduğu için sayfa/havuz kayınca eski yerinde kalmamalı.
  useEffect(() => {
    if (!notePreview) return undefined;

    const hide = () => setNotePreview(null);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);

    return () => {
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
    };
  }, [notePreview]);

  // "Gecikmiş" / "Yaklaşan" are shortcuts that always imply status=tamirde.
  const statusFilterValue = filters.overdue
    ? 'overdue'
    : filters.due_soon
      ? 'due_soon'
      : filters.status;

  const handleFilterChange = (key, value) => {
    if (key === 'status') {
      if (value === 'overdue' || value === 'due_soon') {
        dispatch(
          setFilters({
            status: 'tamirde',
            overdue: value === 'overdue',
            due_soon: value === 'due_soon',
          })
        );
        return;
      }
      dispatch(setFilters({ status: value, overdue: false, due_soon: false }));
      return;
    }
    dispatch(setFilter({ key, value }));
  };

  const headerColumns = [
    {
      id: 'status',
      label: 'Durum',
      filter: {
        kind: 'select',
        key: 'status',
        value: statusFilterValue,
        options: [
          // The page only lists equipment that is still waiting/under repair,
          // so "Tamamlandı" / "İptal edildi" are not offered any more.
          { value: 'tamirde', label: 'Tamirde' },
          { value: 'overdue', label: 'Yalnızca gecikmiş' },
          { value: 'due_soon', label: 'Yaklaşan (≤3 gün)' },
        ],
      },
    },
    {
      id: 'machine',
      label: 'Makine',
      filter: {
        kind: 'stack',
        fields: [
          {
            key: 'identification_no',
            kind: 'text',
            label: 'Kimlik No',
            placeholder: 'Kimlik No',
          },
          {
            key: 'plate_no',
            kind: 'text',
            label: 'Plaka No',
            placeholder: 'Plaka No',
          },
        ],
      },
    },
    {
      id: 'repair_type',
      label: 'Tamir Tipi',
      filter: {
        kind: 'select',
        key: 'repair_type_id',
        options: lookups.repair_type || [],
      },
    },
    {
      id: 'garage_service',
      label: 'Garaj Servisi',
      filter: {
        kind: 'select',
        key: 'garage_service_id',
        options: lookups.garage_service || [],
      },
    },
    {
      id: 'fault_location',
      label: 'Arıza Yeri',
      filter: {
        kind: 'text',
        key: 'fault_location',
        placeholder: 'Arıza yeri',
      },
    },
    {
      id: 'entry',
      label: 'Giriş',
      filter: { kind: 'dateRange', keys: ['date_from', 'date_to'] },
    },
    {
      id: 'estimated_exit',
      label: 'Tahmini Çıkış',
      filter: {
        kind: 'dateRange',
        keys: ['exit_date_from', 'exit_date_to'],
      },
    },
    {
      id: 'notes',
      label: 'Güncel Durum',
      filter: { kind: 'text', key: 'notes', placeholder: 'Not' },
    },
    { id: 'actions', label: 'İşlemler', align: 'right' },
  ];

  // Excel tarzı genişlik ayarı: başlığın sağ kenarındaki tutamaçtan sürüklenir,
  // genişlikler tarayıcıda saklanır.
  const resize = useColumnResize('repair:list', REPAIR_COLUMN_WIDTHS);
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
                  {column.filter ? (
                    <ColumnFilterHeader
                      label={column.label}
                      filter={column.filter}
                      values={filters}
                      onChange={handleFilterChange}
                      align={column.align}
                    />
                  ) : (
                    column.label
                  )}
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
                      : 'Henüz tamir kaydı bulunmuyor'}
                  </p>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={onResetFilters || onOpenFilters}
                      className="mt-3 text-sm font-medium text-blue-600 hover:underline"
                    >
                      Filtreleri temizle
                    </button>
                  )}
                </td>
              </tr>
            )}
            {items.map((item) => {
              const isActive = item.status === 'tamirde';
              const remaining = remainingLabel(item);
              const documentCount = item.documents?.length || 0;

              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-2.5 ">
                    <StatusBadge status={item.status_detail} />
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5">
                    <p className="text-[12px] font-medium text-gray-900">
                      {item.identification_no || `Makine #${item.machine_id}`}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {[item.plate_no, item.territory_name]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700 min-w-32">
                    {item.repair_type_name || '—'}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700 min-w-32">
                    {
                      item.garage_service_name === 'Garaj'
                      ?
                      <span className='bg-orange-200 text-orange-700 py-0.5 px-2 rounded-md'>{item.garage_service_name}</span>
                      :
                      <span className='bg-green-200  text-green-700 py-0.5 px-2 rounded-md'>{item.garage_service_name}</span>
                    }
                    {/* {item.garage_service_name || '—'} */}
                  </td>

                  <td className="max-w-[220px] px-4 py-2.5 text-[12px] text-gray-700">
                    <p className="truncate">{item.fault_location || '—'}</p>
                    {item.notes && (
                      <p className="truncate text-[11px] text-gray-400">
                        {/* {item.notes} */}
                      </p>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                    <p>{formatDate(item.entry_date)}</p>
                    <p className="text-[11px] text-gray-500">
                      {durationLabel(item.duration_days)}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px]">
                    <p
                      className={
                        item.is_overdue
                          ? 'font-semibold text-red-600'
                          : 'text-gray-700'
                      }
                    >
                      {formatDate(item.estimated_exit_date)}
                    </p>
                    {remaining && (
                      <p
                        className={`text-[11px] ${
                          item.is_overdue
                            ? 'font-medium text-red-600'
                            : 'text-gray-500'
                        }`}
                      >
                        {remaining}
                      </p>
                    )}
                  </td>

                    {/* Makinelerin guncel ariza ariza yerinden cikip guncel durum isimli yeni column asagisinda gonderildi */}
                  <td className="min-w-[150px] max-w-[200px] px-4 py-2.5 align-top text-[12px] text-gray-700">
                    {/* {formatDate(item.exit_date)} */}
                    {item.notes ? (
                      <p
                        className="line-clamp-2 whitespace-pre-line break-words text-gray-800"
                        onMouseEnter={(event) => showNotePreview(event, item.notes)}
                        onMouseLeave={hideNotePreview}
                      >
                        {item.notes}
                      </p>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  {/* <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                  </td> */}

                  <td className="whitespace-nowrap px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <ActionButton
                        title={
                          documentCount
                            ? `Evraklar (${documentCount})`
                            : 'PDF evrak ekle'
                        }
                        onClick={() => onDocuments(item)}
                        tone={documentCount ? 'blue' : 'gray'}
                      >
                        <DocumentTextIcon className="h-4 w-4" />
                      </ActionButton>

                      {isActive && (
                        <>
                          <ActionButton
                            title="Tamir kaydını düzenle"
                            onClick={() => onEdit(item)}
                            tone="blue"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </ActionButton>

                          <ActionButton
                            title="Tamiri tamamla"
                            onClick={() => onCloseRepair(item)}
                            tone="green"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </ActionButton>

                          {/* <ActionButton
                            title="Tamiri iptal et"
                            onClick={() => onCancel(item)}
                            tone="red"
                          >
                            <XCircleIcon className="h-4 w-4" />
                          </ActionButton> */}
                        </>
                      )}

                      {!isActive && (
                        <ActionButton
                          title="Tamiri yeniden aç"
                          onClick={() => onReopen(item)}
                          tone="amber"
                        >
                          <ArrowPathIcon className="h-4 w-4" />
                        </ActionButton>
                      )}
                      {/* Gerek Yok */}
                      {/* <ActionButton
                        title="Not ekle"
                        onClick={() => onNote(item)}
                        tone="gray"
                      >
                        <ChatBubbleLeftEllipsisIcon className="h-4 w-4" />
                      </ActionButton> */}

                      {/* Gerek Yok */}
                      {/* <ActionButton
                        title="Tamir geçmişi"
                        onClick={() => onHistory(item)}
                        tone="gray"
                      >
                        <ClockIcon className="h-4 w-4" />
                      </ActionButton> */}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </ResizableTable>
      </div>

      <NotePreview preview={notePreview} />
    </div>
  );
}
