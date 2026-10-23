// src/components/machines/MachineTable.jsx
import { useSelector } from 'react-redux';
import FlaticonIcon from '../ui/FlaticonIcon';
import MachineSkeleton from './MachineSkeleton';
import StatusBadge from './StatusBadge';




export default function MachineTable({
  selectedId,
  onSelect,
  onOpenDetail,
  onOpenFilters,
  hasActiveFilters,
}) {
  const { items, loading } = useSelector((s) => s.machine);
  const lookups = useSelector((s) => s.lookup.data);

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

  // Boş nəticə
  if (!loading && items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
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
            onClick={onOpenFilters}
            className="mt-3 text-sm font-medium text-blue-600 hover:underline"
          >
            Filtreleri aç
          </button>
        )}
      </div>
    );
  }

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
          </thead>
          <tbody className="divide-y divide-gray-100" >
            {items.map((machine) => {
              const photo = primaryPhotoOf(machine);
              const photoCount = machine.photos?.length || 0;

              return (
              <tr
                key={machine.id}
                className={
                  selectedId === machine.id
                    ? 'bg-blue-50 hover:bg-blue-50'
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
                {/* YENİ — Status */}
                <td className="whitespace-nowrap px-6 py-2">
                  <StatusBadge status={getStatus(machine.status_id)} />
                </td>
                <td className="whitespace-nowrap px-6 py-2 text-[11px] font-medium text-gray-900">
                  {machine.identification_no || '—'}
                </td>
                <td style={{ fontFamily: 'Inter' }} className="whitespace-nowrap px-6 py-2 text-[11px] font-mono text-gray-700">
                  {machine.plate_no || '—'}                                       {/* ← YENİ */}
                </td>
                <td style={{ fontFamily: 'Inter' }} className="whitespace-nowrap px-6 py-2 text-[12px] text-gray-700">
                  {lookupName('territory', machine.territory_id)}
                </td>
                <td style={{ fontFamily: 'Inter' }} className="whitespace-nowrap px-6 py-2 text-[12px] text-gray-700">
                  {lookupName('car_mark', machine.car_mark_id)}
                </td>
                <td className="whitespace-nowrap px-6 py-2 text-[12px] text-gray-700">
                  {lookupName('car_model', machine.car_model_id)}
                </td>
                <td className="whitespace-nowrap px-6 py-2 text-[12px] text-gray-700">
                  {machine.vin_no || '—'}
                </td>
                <td className="whitespace-nowrap px-6 py-2 text-[12px] text-gray-700">
                  {extractYear(machine.production_year)}
                </td>
                <td className="whitespace-nowrap px-6 py-2 text-[12px] text-gray-700">
                  {lookupName('company', machine.company_id)}
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