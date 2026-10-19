// src/components/maintenance/MaintenanceHistoryDrawer.jsx
import { Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  SignalIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useDispatch, useSelector } from 'react-redux';

import StatusBadge from '../machines/StatusBadge';
import {
  clearHistory,
  fetchMaintenanceHistory,
} from '../../stores/maintenance_slice';
import {
  formatCounter,
  formatDate,
  formatDateTime,
} from '../../utils/maintenance';

function HistoryRow({ record }) {
  const isMaintenance = record.record_type === 'maintenance';
  const Icon = isMaintenance ? CheckCircleIcon : SignalIcon;

  return (
    <li className="relative flex gap-3 pb-6">
      <span
        className={`relative z-10 flex h-8 w-8 flex-none items-center justify-center rounded-full ${
          isMaintenance
            ? 'bg-emerald-100 text-emerald-600'
            : 'bg-blue-100 text-blue-600'
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-gray-900">
            {isMaintenance ? 'Bakım tamamlandı' : 'Sayaç kaydı'}
          </p>
          <p className="text-xs text-gray-500">{formatDate(record.record_date)}</p>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
          <span>
            Sayaç:{' '}
            <span className="font-medium text-gray-900">
              {formatCounter(record.counter_value, record.usage_unit)}
            </span>
          </span>
          {record.interval_value !== null &&
            record.interval_value !== undefined && (
              <span>
                Aralık:{' '}
                <span className="font-medium text-gray-900">
                  {formatCounter(record.interval_value, record.usage_unit)}
                </span>
              </span>
            )}
        </div>

        {record.notes && (
          <p className="mt-1.5 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
            {record.notes}
          </p>
        )}

        <p className="mt-1.5 text-[11px] text-gray-400">
          {record.created_by_name || 'Sistem'}
          {record.created_at ? ` · ${formatDateTime(record.created_at)}` : ''}
        </p>
      </div>
    </li>
  );
}

export default function MaintenanceHistoryDrawer({ open, onClose, machine }) {
  const dispatch = useDispatch();
  const { history } = useSelector((s) => s.maintenance);

  useEffect(() => {
    if (open && machine) {
      dispatch(fetchMaintenanceHistory({ machineId: machine.machine_id }));
    }
  }, [open, machine, dispatch]);

  const handleClose = () => {
    dispatch(clearHistory());
    onClose();
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={handleClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-out duration-200"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in duration-150"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto flex w-screen max-w-md flex-col bg-white shadow-xl">
                  <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Dialog.Title className="text-base font-semibold text-gray-900">
                          Bakım Geçmişi
                        </Dialog.Title>
                        {machine?.status && (
                          <StatusBadge status={machine.status} />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {machine
                          ? `${
                              machine.identification_no ||
                              `Makine #${machine.machine_id}`
                            }${machine.plate_no ? ` · ${machine.plate_no}` : ''}`
                          : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      aria-label="Kapat"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-5 py-5">
                    {history.loading && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        Geçmiş yükleniyor...
                      </div>
                    )}

                    {!history.loading && history.error && (
                      <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <p>{history.error}</p>
                        <button
                          type="button"
                          onClick={() =>
                            machine &&
                            dispatch(
                              fetchMaintenanceHistory({
                                machineId: machine.machine_id,
                              })
                            )
                          }
                          className="mt-2 text-xs font-medium underline"
                        >
                          Tekrar dene
                        </button>
                      </div>
                    )}

                    {!history.loading &&
                      !history.error &&
                      history.items.length === 0 && (
                        <div className="rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center">
                          <SignalIcon className="mx-auto h-8 w-8 text-gray-300" />
                          <p className="mt-2 text-sm font-medium text-gray-700">
                            Kayıt bulunmuyor
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Sayaç kaydı veya bakım tamamlandığında burada
                            görünecektir.
                          </p>
                        </div>
                      )}

                    {!history.loading && history.items.length > 0 && (
                      <ul className="relative">
                        <span className="absolute bottom-6 left-4 top-2 w-px bg-gray-200" />
                        {history.items.map((record) => (
                          <HistoryRow key={record.id} record={record} />
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="border-t border-gray-200 bg-gray-50 px-5 py-3 text-[11px] text-gray-500">
                    Toplam {history.items.length} kayıt gösteriliyor (en yeni
                    önce)
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

