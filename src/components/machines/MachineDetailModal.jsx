// src/components/machines/MachineDetailModal.jsx
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useSelector } from 'react-redux';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Mock statuslar (backend hazır olana qədər)
const MOCK_STATUSES = [
  { id: 1, name: 'Active', color: 'green' },
  { id: 2, name: 'Tamirde', color: 'yellow' },
  { id: 3, name: 'Bakimda', color: 'blue' },
  { id: 4, name: 'Hurda', color: 'red' },
];

export default function MachineDetailModal({ open, onClose, machine }) {
  const lookups = useSelector((s) => s.lookup.data);

  if (!machine) return null;

  // Lookup ID → ad
  const lookupName = (key, id) => {
    if (!id) return '—';
    const found = lookups[key]?.find((x) => x.id === id);
    return found?.name || `#${id}`;
  };

  // İl çıxar
  const extractYear = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).getFullYear();
    } catch {
      return '—';
    }
  };

  // Tarix formatla
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('az-AZ', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Mock status — hazırda həmişə "Active" (backend hazır olanda dəyişərik)
  const mockStatus = MOCK_STATUSES[0];

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
            <Dialog.Panel className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Dialog.Title className="text-lg font-semibold text-gray-900">
                      {machine.identification_no || `Maşın #${machine.id}`}
                    </Dialog.Title>
                    <StatusBadge status={mockStatus} />
                  </div>
                  {machine.vin_no && (
                    <p className="mt-0.5 text-xs text-gray-500">
                      VIN: <span className="font-mono">{machine.vin_no}</span>
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="space-y-8">
                  {/* BASIC INFO */}
                  <Section title="Əsas məlumat">
                    <Grid>
                      <InfoItem label="Identification No" value={machine.identification_no} />
                      <InfoItem label="VIN No" value={machine.vin_no} mono />
                      <InfoItem
                        label="Technical Character"
                        value={machine.technical_character}
                        fullWidth
                      />
                    </Grid>
                  </Section>

                  {/* TECHNICAL SPECS */}
                  <Section title="Texniki göstəricilər">
                    <Grid>
                      <InfoItem
                        label="Production Year"
                        value={extractYear(machine.production_year)}
                      />
                      <InfoItem
                        label="Weight"
                        value={machine.weight ? `${machine.weight} kg` : null}
                      />
                      <InfoItem label="Dimension" value={machine.dimension} />
                      <InfoItem label="Engine Power" value={machine.engine_power} />
                      <InfoItem label="Engine Mark Model" value={machine.engine_mark_model} />
                      <InfoItem label="Engine Identity" value={machine.engine_identity} mono />
                    </Grid>
                  </Section>

                  {/* LOOKUPS */}
                  <Section title="Təsnifat">
                    <Grid>
                      <InfoItem
                        label="Territory"
                        value={lookupName('territory', machine.territory_id)}
                      />
                      <InfoItem
                        label="Type Transport"
                        value={lookupName('type_transport', machine.type_id)}
                      />
                      <InfoItem
                        label="SubType Transport"
                        value={lookupName('sub_type_transport', machine.subtype_id)}
                      />
                      <InfoItem
                        label="Mark"
                        value={lookupName('car_mark', machine.car_mark_id)}
                      />
                      <InfoItem
                        label="Model"
                        value={lookupName('car_model', machine.car_model_id)}
                      />
                      <InfoItem
                        label="Company"
                        value={lookupName('company', machine.company_id)}
                      />
                    </Grid>
                  </Section>

                  {/* AUDIT */}
                  <Section title="Sistem məlumatı">
                    <Grid>
                      <InfoItem
                        label="Yaradılma tarixi"
                        value={formatDate(machine.created_at)}
                      />
                      <InfoItem
                        label="Yaradan (ID)"
                        value={machine.created_by_id ? `#${machine.created_by_id}` : null}
                      />
                      <InfoItem label="ID" value={`#${machine.id}`} />
                    </Grid>
                  </Section>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end border-t border-gray-200 px-6 py-4">
                <button
                  onClick={onClose}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  Bağla
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

// =========================================================
// KÖMƏKÇI KOMPONENTLƏR
// =========================================================

function Section({ title, children }) {
  return (
    <div>
      <h3 className="mb-3 border-b border-gray-100 pb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Grid({ children }) {
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>;
}

function InfoItem({ label, value, mono, fullWidth }) {
  const display = value === null || value === undefined || value === '' ? '—' : value;

  return (
    <div className={fullWidth ? 'md:col-span-2' : ''}>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </dt>
      <dd
        className={`mt-1 text-sm text-gray-900 ${
          mono ? 'font-mono' : ''
        } ${display === '—' ? 'text-gray-400' : ''}`}
      >
        {display}
      </dd>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    green: 'bg-green-100 text-green-700 ring-green-200',
    yellow: 'bg-yellow-100 text-yellow-700 ring-yellow-200',
    blue: 'bg-blue-100 text-blue-700 ring-blue-200',
    red: 'bg-red-100 text-red-700 ring-red-200',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${colors[status.color]}`}
    >
      {status.name}
    </span>
  );
}