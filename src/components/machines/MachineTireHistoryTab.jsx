// src/components/machines/MachineTireHistoryTab.jsx
import { useEffect, useState } from 'react';
import { TruckIcon } from '@heroicons/react/24/outline';

import TireService from '../../services/TireService';
import { downloadDocument, errorText, viewDocument } from '../../utils/machineHistory';
import { formatDate, formatDateTime } from '../../utils/repair';
import { tireSpecLabel } from '../../utils/tire';
import {
  DocumentChips,
  HistoryEmpty,
  HistoryError,
  HistoryFooter,
  HistoryLoading,
} from './MachineHistoryUi';

export default function MachineTireHistoryTab({ machineId }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const result = await TireService.fetchTires({
          machine_id: machineId,
          limit: 100,
        });
        if (!active) return;
        setItems(result?.items || []);
        setTotal(result?.total ?? result?.items?.length ?? 0);
      } catch (err) {
        if (!active) return;
        setItems([]);
        setTotal(0);
        setError(errorText(err, 'Lastik değişim geçmişi yüklenemedi'));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [machineId, reloadKey]);

  if (loading) {
    return <HistoryLoading label="Lastik değişim geçmişi yükleniyor..." />;
  }
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
          icon={TruckIcon}
          title="Lastik değişim kaydı bulunmuyor"
          hint="Bir lastik değiştirildiğinde konum, ebat ve evrakıyla burada görünür."
        />
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => (
            <TireCard key={item.id} item={item} />
          ))}
        </ul>
      )}

      <HistoryFooter>
        {total} lastik değişimi · en yeni önce
        {total > items.length ? ` (ilk ${items.length} kayıt gösteriliyor)` : ''}
      </HistoryFooter>
    </div>
  );
}

function TireCard({ item }) {
  return (
    <li className="rounded-xl border border-indigo-100 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
          <TruckIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200">
                {item.position || 'Konum belirtilmedi'}
              </span>
              <p className="text-sm font-semibold text-gray-900">
                {tireSpecLabel(item)}
              </p>
            </div>
            <p className="text-xs text-gray-500">
              {formatDate(item.change_date)}
            </p>
          </div>

          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
            {item.serial_no && (
              <span>
                Seri No:{' '}
                <strong className="text-gray-900">{item.serial_no}</strong>
              </span>
            )}
            {item.km_hour && (
              <span>
                KM / Saat:{' '}
                <strong className="text-gray-900">{item.km_hour}</strong>
              </span>
            )}
          </div>

          {item.change_reason && (
            <p className="mt-1.5 whitespace-pre-wrap rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
              Sebep: {item.change_reason}
            </p>
          )}

          <DocumentChips
            documents={item.documents}
            onView={(document) =>
              viewDocument(
                () => TireService.fetchDocument(item.id, document.id),
                document
              )
            }
            onDownload={(document) =>
              downloadDocument(
                () => TireService.fetchDocument(item.id, document.id),
                document
              )
            }
          />

          <p className="mt-1.5 text-[11px] text-gray-400">
            {item.created_by_name || 'Sistem'}
            {item.created_at ? ` · ${formatDateTime(item.created_at)}` : ''}
          </p>
        </div>
      </div>
    </li>
  );
}
