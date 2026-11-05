// src/components/repair/RepairAdvancedFilters.jsx
// Filters that have no column in the repair table. They live in the small
// "Gelişmiş" popover so every server-side filter stays reachable after the
// old filter panel was replaced by the column filters.
import { useDispatch, useSelector } from 'react-redux';

import AdvancedFiltersPopover, {
  AdvancedFilterField,
} from '../ui/AdvancedFiltersPopover';
import { setFilter } from '../../stores/repair_slice';

const ADVANCED_KEYS = ['territory_id', 'type_id', 'company_id'];

export default function RepairAdvancedFilters() {
  const dispatch = useDispatch();
  const filters = useSelector((s) => s.repair.filters);
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
        label="Bölge"
        value={filters.territory_id}
        onChange={(value) => handleChange('territory_id', value)}
        options={lookups.territory || []}
      />

      <AdvancedFilterField
        label="Taşıma Tipi"
        value={filters.type_id}
        onChange={(value) => handleChange('type_id', value)}
        options={lookups.type_transport || []}
      />

      <AdvancedFilterField
        label="Şirket"
        value={filters.company_id}
        onChange={(value) => handleChange('company_id', value)}
        options={lookups.company || []}
      />
    </AdvancedFiltersPopover>
  );
}
