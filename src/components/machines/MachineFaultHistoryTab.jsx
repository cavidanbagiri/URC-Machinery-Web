// src/components/machines/MachineFaultHistoryTab.jsx
import { useEffect, useState } from 'react';
import {
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

import DailyFaultService from '../../services/DailyFaultService';
import RepairService from '../../services/RepairService';
import StatusBadge from './StatusBadge';
import { changedPartLabel } from '../../utils/dailyFault';
import { downloadDocument, errorText, viewDocument } from '../../utils/machineHistory';
import { formatDate, formatDateTime } from '../../utils/repair';
import {
  DocumentChips,
  HistoryEmpty,
  HistoryError,
  HistoryFooter,
  HistoryLoading,
  HistoryWarning,
} from './MachineHistoryUi';

function sortNewestFirst(items) {
  return items.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return (b.item.id || 0) - (a.item.id || 0);
  });
}

export default function MachineFaultHistoryTab({ machineId }) {
  const [faults, setFaults] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    (async () => {
      const [faultResult, repairResult] = await Promise.allSettled([
        DailyFaultService.fetchFaults({ machine_id: machineId, limit: 100 }),
        RepairService.fetchHistory(machineId),
      ]);
      if (!active) return;

      const nextFaults =
        faultResult.status === 'fulfilled' ? faultResult.value?.items || [] : [];
      const nextRepairs =
        repairResult.status === 'fulfilled' ? repairResult.value || [] : [];

      const failures = [];
      if (faultResult.status === 'rejected') {
        failures.push(
          errorText(faultResult.reason, 'Günlük arıza kayıtları yüklenemedi')
        );
      }
      if (repairResult.status === 'rejected') {
        failures.push(
          errorText(repairResult.reason, 'Tamir kayıtları yüklenemedi')
        );
      }

      setFaults(nextFaults);
      setRepairs(nextRepairs);
      setError(failures.length === 2 ? failures.join(' · ') : null);
      setWarning(failures.length === 1 ? failures[0] : null);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [machineId, reloadKey]);

  if (loading) return <HistoryLoading label="Arıza geçmişi yükleniyor..." />;
  if (error) {
    return (
      <HistoryError
        message={error}
        onRetry={() => {
          setLoading(true);
          setError(null);
          setWarning(null);
          setReloadKey((value) => value + 1);
        }}
      />
    );
  }

  const items = sortNewestFirst([
    ...faults.map((item) => ({
      kind: 'fault',
      date: item.fault_date || '',
      item,
    })),
    ...repairs.map((item) => ({
      kind: 'repair',
      date: item.entry_date || '',
      item,
    })),
  ]);

  return (
    <div className="space-y-3">
      {warning && <HistoryWarning message={warning} />}

      {items.length === 0 ? (
        <HistoryEmpty
          icon={ExclamationTriangleIcon}
          title="Arıza kaydı bulunmuyor"
          hint="Günlük arıza veya tamir kaydı açıldığında burada görünür."
        />
      ) : (
        <ul className="space-y-2.5">
          {items.map((entry) =>
            entry.kind === 'fault' ? (
              <FaultCard key={`fault-${entry.item.id}`} fault={entry.item} />
            ) : (
              <RepairCard key={`repair-${entry.item.id}`} record={entry.item} />
            )
          )}
        </ul>
      )}

      <HistoryFooter>
        {faults.length} günlük arıza · {repairs.length} tamir kaydı · en yeni
        önce
      </HistoryFooter>
    </div>
  );
}

function FaultCard({ fault }) {
  const part = changedPartLabel(fault);

  return (
    <li className="rounded-xl border border-amber-100 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <ExclamationTriangleIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-gray-900">
                {fault.repair_type_name || 'Arıza'}
              </p>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-inset ring-amber-200">
                Günlük arıza
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {formatDate(fault.fault_date)}
            </p>
          </div>

          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
            <span>
              KM / Saat:{' '}
              <strong className="text-gray-900">{fault.km_hour || '—'}</strong>
            </span>
            {fault.territory_name && (
              <span>
                Bölge:{' '}
                <strong className="text-gray-900">{fault.territory_name}</strong>
              </span>
            )}
            {part && (
              <span>
                Değişen parça:{' '}
                <strong className="text-gray-900">{part}</strong>
              </span>
            )}
          </div>

          {fault.changed_parts && (
            <p className="mt-1.5 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
              {fault.changed_parts}
            </p>
          )}
          {fault.fault_assignment && (
            <p className="mt-1.5 whitespace-pre-wrap text-xs text-gray-700">
              {fault.fault_assignment}
            </p>
          )}

          <DocumentChips
            documents={fault.documents}
            onView={(document) =>
              viewDocument(
                () => DailyFaultService.fetchDocument(fault.id, document.id),
                document
              )
            }
            onDownload={(document) =>
              downloadDocument(
                () => DailyFaultService.fetchDocument(fault.id, document.id),
                document
              )
            }
          />

          <p className="mt-1.5 text-[11px] text-gray-400">
            {fault.created_by_name || 'Sistem'}
            {fault.created_at ? ` · ${formatDateTime(fault.created_at)}` : ''}
          </p>
        </div>
      </div>
    </li>
  );
}

function RepairCard({ record }) {
  const exitLabel = record.exit_date
    ? `Çıkış: ${formatDate(record.exit_date)}`
    : record.estimated_exit_date
      ? `Tahmini çıkış: ${formatDate(record.estimated_exit_date)}`
      : null;

  return (
    <li className="rounded-xl border border-blue-100 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <WrenchScrewdriverIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-gray-900">
                {record.repair_type_name || 'Tamir kaydı'}
              </p>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 ring-1 ring-inset ring-blue-200">
                Tamir kaydı
              </span>
              <StatusBadge status={record.status_detail} />
            </div>
            <p className="text-xs text-gray-500">
              {formatDate(record.entry_date)}
            </p>
          </div>

          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
            {record.garage_service_name && (
              <span>
                Servis:{' '}
                <strong className="text-gray-900">
                  {record.garage_service_name}
                </strong>
              </span>
            )}
            {exitLabel && <span>{exitLabel}</span>}
            {record.duration_days !== null &&
              record.duration_days !== undefined && (
                <span>Süre: {record.duration_days} gün</span>
              )}
          </div>

          {record.fault_location && (
            <p className="mt-1.5 text-xs text-gray-700">
              Arıza yeri: {record.fault_location}
            </p>
          )}
          {record.notes && (
            <p className="mt-1.5 whitespace-pre-wrap rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
              {record.notes}
            </p>
          )}

          <DocumentChips
            documents={record.documents}
            onView={(document) =>
              viewDocument(
                () => RepairService.fetchDocument(record.id, document.id),
                document
              )
            }
            onDownload={(document) =>
              downloadDocument(
                () => RepairService.fetchDocument(record.id, document.id),
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
