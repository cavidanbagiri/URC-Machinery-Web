// src/components/machines/MachineAdvancedFilters.jsx
// Kolon filtresi olmayan sunucu filtreleri (Taşıma Tipi / Alt Taşıma Tipi)
// burada tutulur; tablo başlıklarının altındaki filtre satırı kolonları kapsar.
import { useDispatch, useSelector } from 'react-redux';

import AdvancedFiltersPopover, {
  AdvancedFilterField,
} from '../ui/AdvancedFiltersPopover';
import { setFilter } from '../../stores/machine_slice';

const ADVANCED_KEYS = ['type_id', 'subtype_id'];

export default function MachineAdvancedFilters() {
  const dispatch = useDispatch();
  const filters = useSelector((s) => s.machine.filters);
  const lookups = useSelector((s) => s.lookup.data);

  const activeCount = ADVANCED_KEYS.filter((key) => {
    const value = filters[key];
    return value !== '' && value !== null && value !== undefined;
  }).length;

  const handleChange = (key, value) => {
    dispatch(setFilter({ key, value }));
  };

  const handleReset = () => {
    ADVANCED_KEYS.forEach((key) => handleChange(key, ''));
  };

  return (
    <AdvancedFiltersPopover activeCount={activeCount} onReset={handleReset}>
      <AdvancedFilterField
        label="Taşıma Tipi"
        value={filters.type_id}
        onChange={(value) => handleChange('type_id', value)}
        options={lookups.type_transport || []}
      />

      <AdvancedFilterField
        label="Alt Taşıma Tipi"
        value={filters.subtype_id}
        onChange={(value) => handleChange('subtype_id', value)}
        options={lookups.sub_type_transport || []}
      />
    </AdvancedFiltersPopover>
  );
}
