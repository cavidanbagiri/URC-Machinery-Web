// src/components/machines/MachineTable.jsx
import { useDispatch, useSelector } from 'react-redux';
import { ExclamationTriangleIcon, TruckIcon } from '@heroicons/react/24/outline';
import FlaticonIcon from '../ui/FlaticonIcon';
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
  TABLE_TOOLBAR,
} from '../ui/tableStyles';
import MachineSkeleton from './MachineSkeleton';
import StatusBadge from './StatusBadge';
import { setFilter } from '../../stores/machine_slice';

//: 11 görünür sütun + kalan alanı emen dolgu sütunu (boş durum satırı için).
const COLUMN_COUNT = 12;

// Sütunların başlangıç genişlikleri (px). Kullanıcı başlıktaki tutamaçtan
// sürükleyerek değiştirir; seçim tarayıcıda saklanır (useColumnResize).
const MACHINE_COLUMN_WIDTHS = {
  select: 64,
  photo: 92,
  status: 130,
  identification_no: 160,
  plate_no: 150,
  territory: 130,
  car_mark: 140,
  car_model: 160,
  vin_no: 190,
  production_year: 96,
  company: 160,
};

// Üretim yılı backend'de int olarak beklenir; serbest metin 422 üretmesin diye
// seçilebilir yıl listesi kullanılır.
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from(
  { length: CURRENT_YEAR + 1 - 1980 + 1 },
  (_, index) => CURRENT_YEAR + 1 - index
);

export default function MachineTable({
  selectedId,
  onSelect,
  onOpenDetail,
  onOpenFilters,
  hasActiveFilters,
  handleDetail
}) {
  const dispatch = useDispatch();
  const { items, loading, filters } = useSelector((s) => s.machine);
  const lookups = useSelector((s) => s.lookup.data);

  // Excel tarzı genişlik ayarı: başlığın sağ kenarındaki tutamaçtan sürüklenir,
  // genişlikler tarayıcıda saklanır. (Skeleton erken `return`'ünden önce
  // çağrılmalı — hooks kuralı.)
  const resize = useColumnResize('machines:list', MACHINE_COLUMN_WIDTHS);

  const handleFilterChange = (key, value) => {
    dispatch(setFilter({ key, value }));
  };

  // List rows already carry their photos (with a presigned `url`); prefer the
  // primary one and fall back to the first uploaded photo.
  const primaryPhotoOf = (machine) => {
    const photos = machine.photos || [];
    return photos.find((photo) => photo.is_primary) || photos[0] || null;
  };

  // Lookup ID → ad
  const lookupName = (key, id) => {
    if (!id) return '—';
    const found = lookups[key]?.find((x) => x.id === id);
    return found?.name || `#${id}`;
  };

  // İl çıxar (DateTime → year)
  const extractYear = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).getFullYear();
    } catch {
      return '—';
    }
  };

  // Skeleton göstər
  if (loading && items.length === 0) {
    return (
      <div className={TABLE_CARD}>
        <MachineSkeleton rows={5} />
      </div>
    );
  }

  // Status tap
  const getStatus = (statusId) => {
    return lookups.car_status?.find((s) => s.id === statusId);
  };

  // Kolon başlıkları — `filter` taşıyan başlıklar Excel tarzı açılır filtre alır.
  const headerColumns = [
    { id: 'photo', label: 'Fotoğraf' },
    {
      id: 'status',
      label: 'Durum',
      filter: { kind: 'select', key: 'status_id', options: lookups.car_status },
    },
    {
      id: 'identification_no',
      label: 'Kimlik No',
      filter: {
        kind: 'text',
        key: 'identification_no',
        placeholder: 'TRK-001',
      },
    },
    {
      id: 'plate_no',
      label: 'Plaka No',
      filter: { kind: 'text', key: 'plate_no', placeholder: '90 AB 123' },
    },
    {
      id: 'territory',
      label: 'Bölge',
      filter: {
        kind: 'select',
        key: 'territory_id',
        options: lookups.territory,
      },
    },
    {
      id: 'car_mark',
      label: 'Marka',
      filter: { kind: 'select', key: 'car_mark_id', options: lookups.car_mark },
    },
    {
      id: 'car_model',
      label: 'Model',
      filter: {
        kind: 'select',
        key: 'car_model_id',
        options: lookups.car_model,
      },
    },
    {
      id: 'vin_no',
      label: 'VIN No',
      filter: { kind: 'text', key: 'vin_no', placeholder: 'WDB963...' },
    },
    {
      id: 'production_year',
      label: 'Yıl',
      filter: {
        kind: 'select',
        key: 'production_year',
        options: YEAR_OPTIONS,
      },
    },
    {
      id: 'company',
      label: 'Şirket',
      filter: { kind: 'select', key: 'company_id', options: lookups.company },
    },
  ];

  // Sütun id'leri: seçim sütunu + filtre başlıkları.
  const columnIds = ['select', ...headerColumns.map((column) => column.id)];

  // Menü içeriği `filter.kind` ile belirlenir (select / text).
  return (
    <div className={TABLE_CARD}>
      <div className={TABLE_TOOLBAR}>
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-500">
            <TruckIcon className="h-3.5 w-3.5" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Makine Listesi
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
              <ResizableTh
                resize={resize}
                columnId="select"
                label="Seç"
                className={`text-left ${TABLE_HEAD_CELL}`}
              >
                <span className="sr-only">Seç</span>
              </ResizableTh>

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
            {!loading && items.length === 0 && (
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
                        : 'Henüz hiçbir makine eklenmemiş'}
                    </p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={onOpenFilters}
                        className="mt-3 rounded-md bg-blue-50 px-3 py-1.5 text-[12px] font-medium text-blue-600 transition hover:bg-blue-100"
                      >
                        Filtreleri temizle
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {items.map((machine) => {
              const photo = primaryPhotoOf(machine);
              const photoCount = machine.photos?.length || 0;
              const isSelected = selectedId === machine.id;
              const detailCell = {
                onClick: () => handleDetail(machine),
                className: `${TABLE_CELL} text-slate-700`,
              };

              return (
                <tr
                  key={machine.id}
                  className={`${TABLE_ROW} ${
                    isSelected ? 'bg-blue-50/70 hover:bg-blue-50/70' : ''
                  }`}
                >
                  <td className={`${TABLE_CELL} w-10`}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onSelect(machine.id)}
                      className="h-4 w-4 cursor-pointer accent-blue-600"
                      aria-label="Makineyi seç"
                    />
                  </td>

                  {/* Fotoğraf — ana fotoğraf, tıklayınca detay açılır */}
                  <td className={TABLE_CELL}>
                    <button
                      type="button"
                      onClick={() => onOpenDetail?.(machine)}
                      disabled={!onOpenDetail}
                      title={
                        photo?.url
                          ? 'Fotoğrafı büyüt'
                          : 'Fotoğraf yok — detaydan yükleyin'
                      }
                      aria-label={`${machine.identification_no || 'Makine'} fotoğrafı`}
                      className="group relative block h-10 w-14 overflow-hidden rounded-md border border-slate-200 bg-slate-50 disabled:cursor-default"
                    >
                      {photo?.url ? (
                        <img
                          src={photo.url}
                          alt={`${machine.identification_no || 'Makine'} fotoğrafı`}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-slate-300">
                          <FlaticonIcon name="picture" size="md" />
                        </span>
                      )}
                      {photoCount > 1 && (
                        <span className="absolute bottom-0 right-0 rounded-tl bg-slate-900/60 px-1 text-[10px] font-medium leading-4 text-white">
                          {photoCount}
                        </span>
                      )}
                    </button>
                  </td>

                  <td className={TABLE_CELL}>
                    <StatusBadge status={getStatus(machine.status_id)} />
                  </td>

                  <td {...detailCell}>
                    <span className={`cursor-pointer hover:underline ${TABLE_PRIMARY}`}>
                      {machine.identification_no || '—'}
                    </span>
                  </td>

                  <td
                    {...detailCell}
                    className={`${TABLE_CELL} font-mono tabular-nums text-slate-700`}
                  >
                    <span className="cursor-pointer hover:underline">
                      {machine.plate_no || '—'}
                    </span>
                  </td>

                  <td {...detailCell}>
                    <span className="cursor-pointer hover:underline">
                      {lookupName('territory', machine.territory_id)}
                    </span>
                  </td>

                  <td {...detailCell}>
                    <span className="cursor-pointer hover:underline">
                      {lookupName('car_mark', machine.car_mark_id)}
                    </span>
                  </td>

                  <td {...detailCell}>
                    <span className="cursor-pointer hover:underline">
                      {lookupName('car_model', machine.car_model_id)}
                    </span>
                  </td>

                  <td {...detailCell}>
                    <span className="cursor-pointer hover:underline">
                      {machine.vin_no || '—'}
                    </span>
                  </td>

                  <td {...detailCell}>
                    <span className="cursor-pointer tabular-nums hover:underline">
                      {extractYear(machine.production_year)}
                    </span>
                  </td>

                  <td {...detailCell}>
                    <span className="cursor-pointer hover:underline">
                      {lookupName('company', machine.company_id)}
                    </span>
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
