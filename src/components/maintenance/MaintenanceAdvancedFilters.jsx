// src/components/maintenance/MaintenanceAdvancedFilters.jsx
// Kolon filtresi olmayan bakım filtreleri (Kullanım birimi, Şirket, pasif
// planlar) küçük "Gelişmiş" popover'ında tutulur.
import { useDispatch, useSelector } from 'react-redux';

import AdvancedFiltersPopover, {
  AdvancedFilterField,
} from '../ui/AdvancedFiltersPopover';
import { setFilter, setFilters } from '../../stores/maintenance_slice';

const SELECT_KEYS = ['usage_unit', 'company_id'];

const USAGE_UNIT_OPTIONS = [
  { id: 'km', name: 'km' },
  { id: 'hour', name: 'saat' },
];

export default function MaintenanceAdvancedFilters() {
  const dispatch = useDispatch();
  const filters = useSelector((s) => s.maintenance.filters);
  const lookups = useSelector((s) => s.lookup.data);

  const activeCount =
    SELECT_KEYS.filter((key) => {
      const value = filters[key];
      return value !== '' && value !== null && value !== undefined;
    }).length + (filters.include_inactive ? 1 : 0);

  const handleChange = (key, value) => {
    dispatch(setFilter({ key, value }));
  };

  const handleReset = () => {
    SELECT_KEYS.forEach((key) => handleChange(key, ''));
    dispatch(setFilters({ include_inactive: false }));
  };

  return (
    <AdvancedFiltersPopover activeCount={activeCount} onReset={handleReset}>
      <AdvancedFilterField
        label="Kullanım Birimi"
        value={filters.usage_unit}
        onChange={(value) => handleChange('usage_unit', value)}
        options={USAGE_UNIT_OPTIONS}
      />

      <AdvancedFilterField
        label="Şirket"
        value={filters.company_id}
        onChange={(value) => handleChange('company_id', value)}
        options={lookups.company || []}
      />

      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={filters.include_inactive === true}
          onChange={(event) =>
            dispatch(setFilters({ include_inactive: event.target.checked }))
          }
          className="h-4 w-4 rounded accent-blue-600"
        />
        Pasif planları göster
      </label>
    </AdvancedFiltersPopover>
  );
}
