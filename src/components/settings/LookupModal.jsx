// src/components/settings/LookupModal.jsx
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function LookupModal({
  open,
  onClose,
  onSubmit,
  title,
  initialValue = '',
  loading = false,
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  // Modal açıldıqda dəyəri sıfırla
  useEffect(() => {
    if (open) {
      setName(initialValue);
      setError('');
    }
  }, [open, initialValue]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setError('Ad boş ola bilməz');
      return;
    }
    if (trimmed.length > 255) {
      setError('Ad 255 simvoldan çox ola bilməz');
      return;
    }

    onSubmit({ name: trimmed });
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
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <Dialog.Title className="text-lg font-semibold text-gray-900">
                  {title}
                </Dialog.Title>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleSubmit}>
                <div className="px-6 py-5">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Ad
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (error) setError('');
                    }}
                    autoFocus
                    placeholder="Ad daxil edin..."
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition
                      ${error
                        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                      }`}
                  />
                  {error && (
                    <p className="mt-1 text-xs text-red-600">{error}</p>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    Ləğv et
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Yadda saxlanılır...' : 'Yadda saxla'}
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}