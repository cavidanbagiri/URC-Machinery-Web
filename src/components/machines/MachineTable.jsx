// src/components/machines/MachineTable.jsx
import { useDispatch, useSelector } from 'react-redux';
import FlaticonIcon from '../ui/FlaticonIcon';
import FilterRow from '../ui/FilterRow';
import MachineSkeleton from './MachineSkeleton';
import StatusBadge from './StatusBadge';
import { setFilter } from '../../stores/machine_slice';

const COLUMN_COUNT = 11;

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
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <MachineSkeleton rows={5} />
      </div>
    );
  }

  // Status tap
  const getStatus = (statusId) => {
    return lookups.car_status?.find((s) => s.id === statusId);
  };

  // Kolon filtre satırı — her başlık hücresi için bir giriş (null = boş hücre).
  const columnFilters = [
    { kind: 'actions' },
    null,
    {
      kind: 'select',
      key: 'status_id',
      label: 'Durum',
      placeholder: 'Durum',
      options: lookups.car_status || [],
    },
    { kind: 'text', key: 'identification_no', label: 'Kimlik No', placeholder: 'TRK-001' },
    { kind: 'text', key: 'plate_no', label: 'Plaka No', placeholder: '90 AB 123' },
    {
      kind: 'select',
      key: 'territory_id',
      label: 'Bölge',
      placeholder: 'Bölge',
      options: lookups.territory || [],
    },
    {
      kind: 'select',
      key: 'car_mark_id',
      label: 'Marka',
      placeholder: 'Marka',
      options: lookups.car_mark || [],
    },
    {
      kind: 'select',
      key: 'car_model_id',
      label: 'Model',
      placeholder: 'Model',
      options: lookups.car_model || [],
    },
    { kind: 'text', key: 'vin_no', label: 'VIN No', placeholder: 'WDB963...' },
    {
      kind: 'select',
      key: 'production_year',
      label: 'Yıl',
      placeholder: 'Yıl',
      options: YEAR_OPTIONS,
    },
    {
      kind: 'select',
      key: 'company_id',
      label: 'Şirket',
      placeholder: 'Şirket',
      options: lookups.company || [],
    },
  ];

  return (
    <div className=" bg-white">
      {/* Header */}
      {/* <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Siyahı</h2>
          <p className="text-xs text-gray-500">Cəmi: {total} maşın</p>
        </div>
      </div> */}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full rounded-lg" style={{'fontFamily':'Inter'}}>
          <thead className="bg-gray-100 text-[11px] uppercase text-gray-700 rounded-lg">
            <tr>
              <th className="w-10 px-4 py-2 text-left font-medium">
                <span className="sr-only">Seç</span>
              </th>
              <th className="px-6 py-2 text-left font-medium">Fotoğraf</th>
              <th className="px-6 py-2 text-left font-medium">Durum</th>
              <th className="px-6 py-2 text-left font-medium">Kimlik No</th>
              <th className="px-6 py-2 text-left font-medium">Plaka No</th>       {/* ← YENİ */}
              <th className="px-6 py-2 text-left font-medium">Bölge</th>
              <th className="px-6 py-2 text-left font-medium">Marka</th>
              <th className="px-6 py-2 text-left font-medium">Model</th>
              <th className="px-6 py-2 text-left font-medium">VIN No</th>
              <th className="px-6 py-2 text-left font-medium">Yıl</th>
              <th className="px-6 py-2 text-left font-medium">Şirket</th>
            </tr>
            <FilterRow
              columns={columnFilters}
              values={filters}
              onChange={handleFilterChange}
            />
          </thead>
          <tbody className="divide-y divide-gray-100" >
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={COLUMN_COUNT} className="px-4 py-12 text-center">
                  <p className="text-sm font-medium text-gray-900">
                    Sonuç bulunamadı
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {hasActiveFilters
                      ? 'Filtreleri değiştirin veya temizleyin'
                      : 'Henüz hiçbir makine eklenmemiş'}
                  </p>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={onOpenFilters}
                      className="mt-3 text-sm font-medium text-blue-600 hover:underline"
                    >
                      Filtreleri temizle
                    </button>
                  )}
                </td>
              </tr>
            )}
            {items.map((machine) => {
              const photo = primaryPhotoOf(machine);
              const photoCount = machine.photos?.length || 0;

              return (
              <tr
                key={machine.id}
                className={
                  selectedId === machine.id
                    ? 'bg-blue-50 hover:bg-blue-50 '
                    : 'hover:bg-gray-50'
                }
              >
                <td className="w-10 whitespace-nowrap px-4 py-2">
                  <input
                    type="checkbox"
                    checked={selectedId === machine.id}
                    onChange={() => onSelect(machine.id)}
                    className="h-4 w-4 cursor-pointer accent-blue-600"
                    aria-label="Makineyi seç"
                  />
                </td>
                {/* Fotoğraf — ana fotoğraf, tıklayınca detay açılır */}
                <td className="whitespace-nowrap px-6 py-2">
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
                    className="group relative block h-10 w-14 overflow-hidden rounded-md border border-gray-200 bg-gray-50 disabled:cursor-default"
                  >
                    {photo?.url ? (
                      <img
                        src={photo.url}
                        alt={`${machine.identification_no || 'Makine'} fotoğrafı`}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-gray-300">
                        <FlaticonIcon name="picture" size="md" />
                      </span>
                    )}
                    {photoCount > 1 && (
                      <span className="absolute bottom-0 right-0 rounded-tl bg-black/60 px-1 text-[10px] font-medium leading-4 text-white">
                        {photoCount}
                      </span>
                    )}
                  </button>
                </td>
                <td className="whitespace-nowrap px-6 py-2">
                  <StatusBadge status={getStatus(machine.status_id)} />
                </td>
                <td
                onClick={()=>{
                  handleDetail(machine)
                }}
                className="whitespace-nowrap px-6 py-2 text-[11px] font-medium text-gray-900">
                  <span className='cursor-pointer hover:underline '>{machine.identification_no || '—'}</span>
                </td>
                <td onClick={()=>{
                  handleDetail(machine)
                }}
                 style={{ fontFamily: 'Inter' }} className="whitespace-nowrap px-6 py-2 text-[11px] font-mono text-gray-700">
                  <span className='cursor-pointer hover:underline '>{machine.plate_no || '—'}</span>                                      
                </td>
                <td onClick={()=>{
                  handleDetail(machine)
                }}
                 style={{ fontFamily: 'Inter' }} className="whitespace-nowrap px-6 py-2 text-[12px] text-gray-700">
                  <span className='cursor-pointer hover:underline '>
                    {lookupName('territory', machine.territory_id)}
                  </span>
                </td>
                <td onClick={()=>{
                  handleDetail(machine)
                }}
                 style={{ fontFamily: 'Inter' }} className="whitespace-nowrap px-6 py-2 text-[12px] text-gray-700">
                  <span className='cursor-pointer hover:underline '>
                  {lookupName('car_mark', machine.car_mark_id)}
                  </span>
                </td>
                <td onClick={()=>{
                  handleDetail(machine)
                }}
                 className="whitespace-nowrap px-6 py-2 text-[12px] text-gray-700">
                  <span className='cursor-pointer hover:underline '>
                  {lookupName('car_model', machine.car_model_id)}
                  </span>  
                </td>
                <td onClick={()=>{
                  handleDetail(machine)
                }}
                 className="whitespace-nowrap px-6 py-2 text-[12px] text-gray-700">
                  <span className='cursor-pointer hover:underline '>
                  {machine.vin_no || '—'}
                  </span>
                </td>
                <td onClick={()=>{
                  handleDetail(machine)
                }}
                 className="whitespace-nowrap px-6 py-2 text-[12px] text-gray-700">
                  <span className='cursor-pointer hover:underline '>
                    {extractYear(machine.production_year)}
                  </span>
                </td>
                <td
                onClick={()=>{
                  handleDetail(machine)
                }}
                 className="whitespace-nowrap px-6 py-2 text-[12px] text-gray-700">
                  {/* {lookupName('company', machine.company_id)} */}
                  <span className='cursor-pointer hover:underline '>{lookupName('company', machine.company_id)}</span>
                </td>
                
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}