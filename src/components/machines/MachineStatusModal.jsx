// src/components/machines/MachineStatusModal.jsx
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import FlaticonIcon from '../ui/FlaticonIcon';

const colorClasses = {
  gray: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    ring: 'ring-gray-200',
    selected: 'border-gray-500 bg-gray-50',
  },
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
  orange: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    ring: 'ring-orange-200',
    selected: 'border-orange-500 bg-orange-50',
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    ring: 'ring-purple-200',
    selected: 'border-purple-500 bg-purple-50',
  },
};

export default function MachineStatusModal({
  open,
  onClose,
  machine,
  statuses = [],
  onSubmit,
  loading = false,
}) {

  const currentStatusId = machine?.status_id ?? null;

  // The parent remounts this modal per machine/status (key), so no sync effect
  // is needed. See CommonCarsPage.
  const [selected, setSelected] = useState(
    machine?.status_id ?? statuses[0]?.id ?? null
  );

  if (!machine) return null;

  const selectedStatus = statuses.find((status) => status.id === selected);
  const isRepairStatus =
    selectedStatus?.name?.trim().toLocaleLowerCase('tr-TR') === 'tamirde';

  const handleSubmit = () => {
    if (selected == null) return;
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
                    Durumu Değiştir
                  </Dialog.Title>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {machine.identification_no || `Makine #${machine.id}`}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <FlaticonIcon name="cross" size="lg" />
                </button>
              </div>

              {/* Body */}
              <div className="space-y-2 px-6 py-5">
                {statuses.length === 0 && (
                  <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-6 text-center text-sm text-gray-500">
                    Durum listesi boş. Ayarlar'dan durum ekleyin.
                  </p>
                )}
                {statuses.map((status) => {
                  const c = colorClasses[status.color] || colorClasses.gray;
                  const isSelected = selected === status.id;

                  return (
                    <button
                      key={status.id}
                      onClick={() => setSelected(status.id)}
                      className={`cursor-pointer flex w-full items-start gap-3 rounded-lg border-2 p-3 text-left transition ${isSelected
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
                        {status.description && (
                          <p className="mt-1 text-xs text-gray-600">
                            {status.description}
                          </p>
                        )}
                      </div>

                      {isSelected && (
                        <FlaticonIcon
                          name="check-circle"
                          size="lg"
                          className={c.text}
                        />
                      )}
                    </button>
                  );
                })}

                {isRepairStatus && (
                  <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                    Makine <strong>Tamirde</strong> durumuna alınacak ve açık
                    bir tamir kaydı oluşturulacak. Kayıt varsayılan olarak{' '}
                    <strong>Diğer</strong> tipiyle açılır; tamir tipi, giriş ve
                    çıkış tarihlerini <strong>Tamir</strong> sayfasından
                    girebilirsiniz.
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  İptal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || selected == null || selected === currentStatusId}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Güncelleniyor...' : 'Onayla'}
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}