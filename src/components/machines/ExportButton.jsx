// src/components/machines/ExportButton.jsx
import { useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

import { exportMachinesToExcel } from '../../utils/exportToExcel';
import MachineService from '../../services/MachineService';

export default function ExportButton() {
  const { filters, total } = useSelector((s) => s.machine);
  const lookups = useSelector((s) => s.lookup.data);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (total === 0) {
      toast.error('Export üçün heç bir maşın yoxdur');
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
      toast.success(`${allMachines.length} maşın export olundu`);
    } catch (err) {
      toast.error(err.message || 'Export xətası');
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting || total === 0}
      className="flex items-center gap-2 border-b text-green-600 border-b-gray-200 px-4 py-1 mr-3 text-sm font-medium transition cursor-pointer hover:bg-gray-100 rounded-xs disabled:cursor-not-allowed disabled:opacity-50"
    >
      <ArrowDownTrayIcon className="h-4 w-4" />
      {exporting ? 'Export edilir...' : 'Excel'}
    </button>
  );
}