// src/components/settings/LookupModal.jsx
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const COLOR_OPTIONS = ['gray', 'green', 'yellow', 'blue', 'red', 'orange', 'purple'];

export default function LookupModal({
  open,
  onClose,
  onSubmit,
  title,
  initialValue = '',
  initialColor = 'gray',
  initialDescription = '',
  showColor = false,
  showDescription = false,
  loading = false,
}) {
  // Settings remounts this modal via key whenever it opens/changes item.
  const [name, setName] = useState(initialValue);
  const [color, setColor] = useState(initialColor);
  const [description, setDescription] = useState(initialDescription);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError('Ad boş ola bilməz');
    if (trimmed.length > 255) return setError('Ad 255 simvoldan çox ola bilməz');

    const payload = { name: trimmed };
    if (showColor) payload.color = color;
    if (showDescription) payload.description = description.trim() || null;
    onSubmit(payload);
  };

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
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <Dialog.Title className="text-base font-semibold text-gray-900">
                  {title}
                </Dialog.Title>
                <button
                  onClick={onClose}
                  aria-label="Bağla"
                  className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <XMarkIcon className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="px-6 py-5">
                  <label htmlFor="lookup-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Ad
                  </label>
                  <input
                    id="lookup-name"
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); if (error) setError(''); }}
                    autoFocus
                    placeholder="Ad daxil edin..."
                    className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400
                      ${error
                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                      }`}
                  />
                  {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}

                  {showColor && (
                    <div className="mt-4">
                      <label htmlFor="lookup-color" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Rəng
                      </label>
                      <select
                        id="lookup-color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      >
                        {COLOR_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {showDescription && (
                    <div className="mt-4">
                      <label htmlFor="lookup-description" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Təsvir
                      </label>
                      <textarea
                        id="lookup-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        maxLength={255}
                        placeholder="Qısa təsvir..."
                        className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50/60 px-6 py-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:opacity-50"
                  >
                    Ləğv et
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50"
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