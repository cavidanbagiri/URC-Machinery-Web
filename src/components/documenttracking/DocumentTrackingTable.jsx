// src/components/documenttracking/DocumentTrackingTable.jsx
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowPathIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';

import { ColumnFilterHeader } from '../ui/ColumnFilter';
import ResizableTable, { ResizableTh } from '../ui/ResizableTable';
import useColumnResize from '../ui/useColumnResize';
import { setFilter } from '../../stores/document_tracking_slice';
import {
  DOCUMENT_DATE_FIELDS,
  DOCUMENT_DATE_LABELS,
  dateToneClass,
  dateToneTitle,
  formatDate,
} from '../../utils/documentTracking';

const COLUMN_COUNT = 4 + DOCUMENT_DATE_FIELDS.length + 1;

const DOCUMENT_COLUMN_WIDTHS = {
  machine: 150,
  territory: 125,
  type: 135,
  mark_model: 175,
  compulsory_traffic_insurance_date: 130,
  inspection_end_date: 145,
  passenger_transport_license_date: 140,
  partial_technical_inspection_date: 145,
  full_technical_inspection_date: 140,
  hazardous_production_facility_date: 145,
  leasing_date: 110,
  equipment_control_date: 130,
  actions: 165,
};

const DATE_INPUT_CLASS =
  'w-full rounded-md border border-blue-300 bg-white px-1.5 py-1 text-[12px] text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60';

function Skeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex gap-4 px-6 py-3">
          <div className="h-5 w-24 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-20 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-24 animate-pulse rounded bg-gray-100" />
          <div className="h-5 flex-1 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-24 animate-pulse rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

function DocumentDate({ value }) {
  return (
    <span
      className={`whitespace-nowrap text-[12px] ${dateToneClass(value)}`}
      title={dateToneTitle(value)}
    >
      {formatDate(value)}
    </span>
  );
}

function machineLabel(item) {
  return item.identification_no || `Makine #${item.machine_id}`;
}

function markModelLabel(item) {
  return (
    [item.car_mark_name, item.car_model_name].filter(Boolean).join(' ') || '—'
  );
}

export default function DocumentTrackingTable({
  items,
  loading,
  hasActiveFilters,
  onResetFilters,
  onBeforeFilterChange,
  editingId,
  draft,
  updating,
  updatingId,
  onStartEdit,
  onChangeDraft,
  onCancelEdit,
  onSave,
}) {
  const dispatch = useDispatch();
  const filters = useSelector((s) => s.documentTracking.filters);
  const lookups = useSelector((s) => s.lookup.data);

  const resize = useColumnResize('documentTracking:list', DOCUMENT_COLUMN_WIDTHS);

  const handleFilterChange = (key, value) => {
    onBeforeFilterChange?.();
    dispatch(setFilter({ key, value }));
  };

  const headerColumns = [
    { id: 'machine', label: 'Makine ID' },
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
      id: 'type',
      label: 'Tipi',
      filter: {
        kind: 'select',
        key: 'type_id',
        options: lookups.type_transport || [],
      },
    },
    {
      id: 'mark_model',
      label: 'Marka Model',
      filter: {
        kind: 'stack',
        fields: [
          {
            key: 'car_mark_id',
            kind: 'select',
            label: 'Marka',
            options: lookups.car_mark || [],
          },
          {
            key: 'car_model_id',
            kind: 'select',
            label: 'Model',
            options: lookups.car_model || [],
          },
        ],
      },
    },
    ...DOCUMENT_DATE_FIELDS.map((field) => ({
      id: field,
      label: DOCUMENT_DATE_LABELS[field],
    })),
    { id: 'actions', label: 'İşlem', align: 'right' },
  ];

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
                  className={`px-3 py-2.5 font-medium ${
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
                      : 'Takip edilecek makine bulunmuyor'}
                  </p>
                  {hasActiveFilters && onResetFilters && (
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

            {items.map((item) => {
              const rowEditing = editingId === item.machine_id;
              const savingRow = updatingId === item.machine_id;
              const anotherRowIsEditing =
                Boolean(editingId) && !rowEditing;

              return (
                <tr
                  key={item.machine_id}
                  className={`align-top transition ${
                    rowEditing ? 'bg-blue-50/60' : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-3 py-2">
                    <p className="text-[13px] font-medium text-gray-900">
                      {machineLabel(item)}
                    </p>
                    {item.plate_no && (
                      <p className="text-[11px] text-gray-500">
                        {item.plate_no}
                      </p>
                    )}
                  </td>

                  <td className="px-3 py-2 text-[12px] text-gray-700">
                    <p className="max-w-[9rem] truncate" title={item.territory_name || ''}>
                      {item.territory_name || '—'}
                    </p>
                  </td>

                  <td className="px-3 py-2 text-[12px] text-gray-700">
                    <p className="max-w-[9rem] truncate" title={item.type_name || ''}>
                      {item.type_name || '—'}
                    </p>
                  </td>

                  <td className="px-3 py-2 text-[12px] text-gray-700">
                    <p
                      className="max-w-[10rem] truncate"
                      title={markModelLabel(item)}
                    >
                      {markModelLabel(item)}
                    </p>
                  </td>

                  {DOCUMENT_DATE_FIELDS.map((field) => (
                    <td key={field} className="px-3 py-2">
                      {rowEditing ? (
                        <input
                          type="date"
                          value={draft[field] || ''}
                          onChange={(event) =>
                            onChangeDraft(field, event.target.value)
                          }
                          disabled={updating}
                          aria-label={DOCUMENT_DATE_LABELS[field]}
                          className={DATE_INPUT_CLASS}
                        />
                      ) : (
                        <DocumentDate value={item[field]} />
                      )}
                    </td>
                  ))}

                  <td className="px-3 py-2 text-right">
                    {rowEditing ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSave(item)}
                          disabled={updating}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {savingRow && (
                            <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                          )}
                          {savingRow ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                        <button
                          type="button"
                          onClick={onCancelEdit}
                          disabled={updating}
                          className="rounded-lg px-2 py-1.5 text-[11px] font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Vazgeç
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onStartEdit(item)}
                        disabled={anotherRowIsEditing || updating}
                        title={
                          anotherRowIsEditing
                            ? 'Önce açık düzenlemeyi kaydedin veya vazgeçin'
                            : 'Evrak tarihlerini güncelle'
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2.5 py-1.5 text-[11px] font-medium text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <PencilSquareIcon className="h-3.5 w-3.5" />
                        Güncelle
                      </button>
                    )}
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
