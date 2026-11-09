// src/components/tire/TireHistoryModal.jsx
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

import RepairModal, { SecondaryButton } from '../repair/RepairModal';
import { clearHistory, fetchTireHistory } from '../../stores/tire_slice';
import { formatDate, formatDateTime } from '../../utils/repair';
import { formatFileSize } from '../../utils/tire';

/**
 * "Eski kayıtlar": the earlier changes of the same machine + position, newest
 * first. The papers of each old record stay readable from here.
 */
export default function TireHistoryModal({
  open,
  item,
  onClose,
  onViewDocument,
  onDownloadDocument,
}) {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((s) => s.tire.history);

  useEffect(() => {
    if (!open || !item) return;
    dispatch(fetchTireHistory({ tireId: item.id }));
  }, [open, item, dispatch]);

  useEffect(() => {
    if (!open) dispatch(clearHistory());
  }, [open, dispatch]);

  if (!item) return null;

  return (
    <RepairModal
      open={open}
      onClose={onClose}
      title="Eski kayıtlar"
      subtitle={`${
        item.identification_no || `Makine #${item.machine_id}`
      } · ${item.position} konumu`}
      footer={<SecondaryButton onClick={onClose}>Kapat</SecondaryButton>}
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800">
          Bu lastik konumunda daha önce yapılan değişimler aşağıda listelenir.
          Seçili kayıt: <strong>{formatDate(item.change_date)}</strong> ·{' '}
          {item.brand_model || 'Marka / model belirtilmedi'}
          {item.size ? ` · ${item.size}` : ''}
        </div>

        {loading && (
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-6 text-sm text-gray-500">
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
            Eski kayıtlar yükleniyor...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {String(error)}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center">
            <ClockIcon className="mx-auto h-6 w-6 text-gray-300" />
            <p className="mt-2 text-sm font-medium text-gray-900">
              Eski kayıt bulunmuyor
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Bu makinede {item.position} konumu için ilk lastik değişimi.
            </p>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <ol className="space-y-3">
            {items.map((old) => (
              <li
                key={old.id}
                className="rounded-lg border border-gray-200 bg-white px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDate(old.change_date)}
                  </p>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                    {old.km_hour || 'KM / saat girilmedi'}
                  </span>
                </div>

                <p className="mt-1 text-[12px] text-gray-700">
                  {[old.brand_model, old.size].filter(Boolean).join(' · ') ||
                    'Marka / model ve ebat belirtilmedi'}
                </p>

                {old.change_reason && (
                  <p
                    className="mt-1 text-[12px] text-gray-600"
                    title={old.change_reason}
                  >
                    Sebep: {old.change_reason}
                  </p>
                )}

                <p className="mt-1 text-[11px] text-gray-400">
                  {[old.created_by_name, formatDateTime(old.created_at)]
                    .filter(Boolean)
                    .join(' · ')}
                </p>

                {(old.documents || []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {old.documents.map((document) => (
                      <span
                        key={document.id}
                        className="inline-flex max-w-full items-center gap-1 rounded-full border border-blue-100 bg-blue-50 py-0.5 pl-2 pr-1 text-[11px] text-blue-800"
                      >
                        <button
                          type="button"
                          onClick={() => onViewDocument(old, document)}
                          title={`${document.file_name} · ${formatFileSize(
                            document.file_size
                          )}`}
                          className="max-w-[10rem] truncate hover:underline"
                        >
                          {document.file_name}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDownloadDocument(old, document)}
                          title="Evrakı indir"
                          aria-label={`${document.file_name} indir`}
                          className="rounded p-0.5 hover:bg-blue-100"
                        >
                          <ArrowDownTrayIcon className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </RepairModal>
  );
}
