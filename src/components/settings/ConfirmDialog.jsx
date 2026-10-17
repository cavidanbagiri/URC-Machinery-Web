// src/components/settings/ConfirmDialog.jsx
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, loading }) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
            leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200">
              <div className="px-6 py-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-100">
                    <ExclamationTriangleIcon className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 pt-0.5">
                    <Dialog.Title className="text-base font-semibold text-gray-900">
                      {title || 'Təsdiq'}
                    </Dialog.Title>
                    <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                      {message || 'Bu əməliyyat geri qaytarıla bilməz.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50/60 px-6 py-4">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:opacity-50"
                >
                  Ləğv et
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? 'Silinir...' : 'Sil'}
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}