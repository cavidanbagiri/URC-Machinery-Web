// src/components/machines/ExportButton.jsx
import { useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import FlaticonIcon from '../ui/FlaticonIcon';
import { exportMachinesToExcel } from '../../utils/exportToExcel';
import MachineService from '../../services/MachineService';

export default function ExportButton() {
  const { filters, total } = useSelector((s) => s.machine);
  const lookups = useSelector((s) => s.lookup.data);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (total === 0) {
      toast.error('Dışa aktarılacak makine yok');
      return;
    }

    setExporting(true);
    try {
      // Filtrelənmiş BÜTÜN nəticələri götür (limit=10000)
      // (Backend max 100 limit qoyur, ona görə bir neçə səhifə fetch edək)
      const PAGE_SIZE = 100;
      const pagesNeeded = Math.ceil(total / PAGE_SIZE);

      const allMachines = [];

      for (let i = 0; i < pagesNeeded; i++) {
        const data = await MachineService.fetchMachines({
          limit: PAGE_SIZE,
          offset: i * PAGE_SIZE,
          ...filters,
        });
        allMachines.push(...data.items);
      }

      exportMachinesToExcel(allMachines, lookups);
      toast.success(`${allMachines.length} makine dışa aktarıldı`);
    } catch (err) {
      toast.error(err.message || 'Dışa aktarma hatası');
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting || total === 0}
      className="flex items-center gap-2 border-b border-b-gray-200 px-4 py-1 text-sm font-medium text-green-600 transition cursor-pointer hover:bg-gray-100 rounded-xs disabled:cursor-not-allowed disabled:opacity-50"
    >
      <FlaticonIcon name="file-excel" size="md" />
      {exporting ? 'Dışa aktarılıyor...' : 'Excel'}
    </button>
  );
}