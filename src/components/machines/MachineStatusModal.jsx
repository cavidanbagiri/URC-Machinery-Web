// src/components/machines/MachineStatusModal.jsx
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

// Mock statuslar
export const MOCK_STATUSES = [
  {
    id: 1,
    name: 'Active',
    color: 'green',
    description: 'Maşın aktiv istifadədədir',
  },
  {
    id: 2,
    name: 'Tamirde',
    color: 'yellow',
    description: 'Maşın təmirdədir',
  },
  {
    id: 3,
    name: 'Bakimda',
    color: 'blue',
    description: 'Planlı texniki baxışdadır',
  },
  {
    id: 4,
    name: 'Hurda',
    color: 'red',
    description: 'İstifadədən çıxarılıb',
  },
];

const colorClasses = {
  green: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    ring: 'ring-green-200',
    selected: 'border-green-500 bg-green-50',
  },
  yellow: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    ring: 'ring-yellow-200',
    selected: 'border-yellow-500 bg-yellow-50',
  },
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    ring: 'ring-blue-200',
    selected: 'border-blue-500 bg-blue-50',
  },
  red: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    ring: 'ring-red-200',
    selected: 'border-red-500 bg-red-50',
  },
};

export default function MachineStatusModal({
  open,
  onClose,
  machine,
  currentStatusId = 1,   // mock default
  onSubmit,
  loading = false,
}) {
  const [selected, setSelected] = useState(currentStatusId);

  // Modal açıldıqda seçimi sıfırla
  useEffect(() => {
    if (open) setSelected(currentStatusId);
  }, [open, currentStatusId]);

  if (!machine) return null;

  const handleSubmit = () => {
    onSubmit(selected);
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
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

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-md rounded-xl bg-white shadow-xl">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    Statusu dəyişdir
                  </Dialog.Title>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {machine.identification_no || `Maşın #${machine.id}`}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="space-y-2 px-6 py-5">
                {MOCK_STATUSES.map((status) => {
                  const c = colorClasses[status.color];
                  const isSelected = selected === status.id;

                  return (
                    <button
                      key={status.id}
                      onClick={() => setSelected(status.id)}
                      className={`flex w-full items-start gap-3 rounded-lg border-2 p-3 text-left transition ${
                        isSelected
                          ? c.selected
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${c.bg} ${c.text} ${c.ring}`}
                          >
                            {status.name}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-600">
                          {status.description}
                        </p>
                      </div>

                      {isSelected && (
                        <CheckCircleIcon className={`h-5 w-5 ${c.text}`} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  Ləğv et
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || selected === currentStatusId}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Yenilənir...' : 'Təsdiqlə'}
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}