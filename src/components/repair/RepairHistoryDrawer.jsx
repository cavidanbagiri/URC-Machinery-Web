// src/components/repair/RepairHistoryDrawer.jsx
import { Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  ArrowPathIcon,
  ChatBubbleLeftEllipsisIcon,
  CheckCircleIcon,
  ClockIcon,
  PencilSquareIcon,
  PlusCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useDispatch, useSelector } from 'react-redux';

import StatusBadge from '../machines/StatusBadge';
import { clearHistory, fetchRepairHistory } from '../../stores/repair_slice';
import {
  durationLabel,
  formatDate,
  formatDateTime,
  machineLabel,
} from '../../utils/repair';

const EVENT_META = {
  created: {
    label: 'Kayıt açıldı',
    icon: PlusCircleIcon,
    tone: 'bg-blue-100 text-blue-600',
  },
  updated: {
    label: 'Kayıt güncellendi',
    icon: PencilSquareIcon,
    tone: 'bg-amber-100 text-amber-600',
  },
  note_added: {
    label: 'Not eklendi',
    icon: ChatBubbleLeftEllipsisIcon,
    tone: 'bg-gray-100 text-gray-600',
  },
  closed: {
    label: 'Tamir tamamlandı',
    icon: CheckCircleIcon,
    tone: 'bg-emerald-100 text-emerald-600',
  },
  cancelled: {
    label: 'Tamir iptal edildi',
    icon: XCircleIcon,
    tone: 'bg-red-100 text-red-600',
  },
  reopened: {
    label: 'Tamir yeniden açıldı',
    icon: ArrowPathIcon,
    tone: 'bg-orange-100 text-orange-600',
  },
};

function LogRow({ log }) {
  const meta = EVENT_META[log.event_type] || EVENT_META.updated;
  const Icon = meta.icon;
  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      <span
        className={`relative z-10 flex h-7 w-7 flex-none items-center justify-center rounded-full ${meta.tone}`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
            {meta.label}
          </p>
          <p className="text-[10px] text-gray-400">
            {formatDateTime(log.created_at)}
          </p>
        </div>
        <p className="mt-0.5 whitespace-pre-wrap text-xs text-gray-700">
          {log.message}
        </p>
        <p className="mt-0.5 text-[10px] text-gray-400">
          {log.created_by_name || 'Sistem'}
        </p>
      </div>
    </li>
  );
}

function RepairHistoryCard({ record }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <StatusBadge status={record.status_detail} />
            <span className="text-sm font-medium text-gray-900">
              {record.repair_type_name || 'Tamir'}
            </span>
          </div>
          <span className="text-[11px] text-gray-500">#{record.id}</span>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-gray-600 sm:grid-cols-4">
          <span>
            Giriş: <strong>{formatDate(record.entry_date)}</strong>
          </span>
          <span>
            Tahmini: <strong>{formatDate(record.estimated_exit_date)}</strong>
          </span>
          <span>
            Çıkış: <strong>{formatDate(record.exit_date)}</strong>
          </span>
          <span>
            Süre: <strong>{durationLabel(record.duration_days)}</strong>
          </span>
        </div>

        {(record.fault_location || record.notes) && (
          <div className="mt-2 space-y-1 rounded-lg bg-gray-50 px-3 py-2 text-[11px] text-gray-600">
            {record.fault_location && (
              <p>
                <span className="font-medium text-gray-700">Arıza yeri:</span>{' '}
                {record.fault_location}
              </p>
            )}
            {record.notes && (
              <p className="whitespace-pre-wrap">
                <span className="font-medium text-gray-700">Not:</span>{' '}
                {record.notes}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-3">
        {record.logs?.length > 0 ? (
          <ul className="relative">
            <span className="absolute bottom-2 left-3.5 top-2 w-px bg-gray-200" />
            {record.logs.map((log) => (
              <LogRow key={log.id} log={log} />
            ))}
          </ul>
        ) : (
          <p className="text-xs text-gray-400">Olay kaydı bulunmuyor.</p>
        )}
      </div>
    </div>
  );
}

export default function RepairHistoryDrawer({ open, onClose, machine }) {
  const dispatch = useDispatch();
  const { history } = useSelector((s) => s.repair);

  useEffect(() => {
    if (open && machine) {
      dispatch(fetchRepairHistory(machine.machine_id));
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
                <Dialog.Panel className="pointer-events-auto flex w-screen max-w-xl flex-col bg-gray-50 shadow-xl">
                  <div className="border-b border-gray-200 bg-white px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Dialog.Title className="text-base font-semibold text-gray-900">
                          Tamir Geçmişi
                        </Dialog.Title>
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {machine
                            ? `${machineLabel(machine)}${
                                machine.plate_no ? ` · ${machine.plate_no}` : ''
                              }`
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
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
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
                            dispatch(fetchRepairHistory(machine.machine_id))
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
                        <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-10 text-center">
                          <ClockIcon className="mx-auto h-8 w-8 text-gray-300" />
                          <p className="mt-2 text-sm font-medium text-gray-700">
                            Kayıt bulunmuyor
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Bu makine için tamir kaydı açıldığında burada
                            görünecektir.
                          </p>
                        </div>
                      )}

                    {!history.loading &&
                      !history.error &&
                      history.items.map((record) => (
                        <RepairHistoryCard key={record.id} record={record} />
                      ))}
                  </div>

                  <div className="border-t border-gray-200 bg-white px-5 py-3 text-[11px] text-gray-500">
                    Toplam {history.items.length} tamir kaydı (en yeni önce)
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
