// src/components/machines/MachineMaintenanceHistoryTab.jsx
import { useEffect, useState } from 'react';
import { CheckCircleIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

import MaintenanceService from '../../services/MaintenanceService';
import {
  formatCounter,
  formatDate,
  formatDateTime,
} from '../../utils/maintenance';
import { downloadDocument, errorText, viewDocument } from '../../utils/machineHistory';
import {
  DocumentChips,
  HistoryEmpty,
  HistoryError,
  HistoryFooter,
  HistoryLoading,
} from './MachineHistoryUi';

export default function MachineMaintenanceHistoryTab({ machineId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const result = await MaintenanceService.fetchHistory(machineId, {
          record_type: 'maintenance',
          limit: 200,
        });
        if (!active) return;
        setItems(result || []);
      } catch (err) {
        if (!active) return;
        setItems([]);
        setError(errorText(err, 'Bakım geçmişi yüklenemedi'));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [machineId, reloadKey]);

  if (loading) return <HistoryLoading label="Bakım geçmişi yükleniyor..." />;
  if (error) {
    return (
      <HistoryError
        message={error}
        onRetry={() => {
          setLoading(true);
          setError(null);
          setReloadKey((value) => value + 1);
        }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <HistoryEmpty
          icon={WrenchScrewdriverIcon}
          title="Bakım kaydı bulunmuyor"
          hint="Bakım tamamlandığında sayaç, not ve evrakıyla burada görünür."
        />
      ) : (
        <ul className="space-y-2.5">
          {items.map((record) => (
            <MaintenanceCard key={record.id} record={record} />
          ))}
        </ul>
      )}

      <HistoryFooter>
        {items.length} bakım kaydı · en yeni önce
      </HistoryFooter>
    </div>
  );
}

function MaintenanceCard({ record }) {
  const hasInterval =
    record.interval_value !== null && record.interval_value !== undefined;

  return (
    <li className="rounded-xl border border-emerald-100 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircleIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-gray-900">
              Bakım tamamlandı
            </p>
            <p className="text-xs text-gray-500">
              {formatDate(record.record_date)}
            </p>
          </div>

          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
            <span>
              Sayaç:{' '}
              <strong className="text-gray-900">
                {formatCounter(record.counter_value, record.usage_unit)}
              </strong>
            </span>
            {hasInterval && (
              <span>
                Bakım paketi:{' '}
                <strong className="text-gray-900">
                  {formatCounter(record.interval_value, record.usage_unit)}
                </strong>
              </span>
            )}
          </div>

          {record.notes && (
            <p className="mt-1.5 whitespace-pre-wrap rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
              {record.notes}
            </p>
          )}

          <DocumentChips
            documents={record.documents}
            onView={(document) =>
              viewDocument(
                () => MaintenanceService.fetchDocument(document.id),
                document
              )
            }
            onDownload={(document) =>
              downloadDocument(
                () => MaintenanceService.fetchDocument(document.id),
                document
              )
            }
          />

          <p className="mt-1.5 text-[11px] text-gray-400">
            {record.created_by_name || 'Sistem'}
            {record.created_at ? ` · ${formatDateTime(record.created_at)}` : ''}
          </p>
        </div>
      </div>
    </li>
  );
}
