// src/components/dailyfault/DailyFaultFormModal.jsx
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import RepairModal, {
  ModalField,
  PrimaryButton,
  SecondaryButton,
  errorInputClass,
  inputClass,
} from '../repair/RepairModal';
import {
  clearMachineOptions,
  createDailyFault,
  fetchDailyFaultMachineOptions,
} from '../../stores/daily_fault_slice';
import { fetchLookupIfNeeded } from '../../stores/lookup_slice';
import { machineLabel, toNullableText } from '../../utils/repair';

function emptyForm() {
  return {
    machine_id: '',
    km_hour: '',
    territory_id: '',
    repair_type_id: '',
    fault_assignment: '',
    changed_parts: '',
  };
}

export default function DailyFaultFormModal({ open, onClose, onSaved }) {
  const dispatch = useDispatch();
  const mutating = useSelector((s) => s.dailyFault.mutating);
  const machineOptions = useSelector((s) => s.dailyFault.machineOptions);
  const territories = useSelector((s) => s.lookup.data.territory || []);
  const repairTypes = useSelector((s) => s.lookup.data.repair_type || []);

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [machineSearch, setMachineSearch] = useState('');

  useEffect(() => {
    if (!open) return;
    dispatch(fetchLookupIfNeeded('territory'));
    dispatch(fetchLookupIfNeeded('repair_type'));
  }, [open, dispatch]);

  useEffect(() => {
    if (!open) dispatch(clearMachineOptions());
  }, [open, dispatch]);

  useEffect(() => {
    if (!open || selectedMachine) return undefined;
    const timeout = setTimeout(() => {
      dispatch(
        fetchDailyFaultMachineOptions({ search: machineSearch, limit: 20 })
      );
    }, 300);
    return () => clearTimeout(timeout);
  }, [open, selectedMachine, machineSearch, dispatch]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const handleSelectMachine = (machine) => {
    setSelectedMachine(machine);
    setForm((prev) => ({ ...prev, machine_id: machine.id }));
    setMachineSearch('');
    if (errors.machine_id) setErrors((prev) => ({ ...prev, machine_id: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.machine_id) nextErrors.machine_id = 'Makine seçin';
    if (!form.km_hour.trim()) {
      nextErrors.km_hour = 'KM / Saat değeri zorunludur';
    }
    if (!form.territory_id) nextErrors.territory_id = 'Şantiye seçin';
    if (!form.repair_type_id) nextErrors.repair_type_id = 'Arıza tipi seçin';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      await dispatch(
        createDailyFault({
          machine_id: Number(form.machine_id),
          territory_id: Number(form.territory_id),
          repair_type_id: Number(form.repair_type_id),
          km_hour: form.km_hour.trim(),
          fault_assignment: toNullableText(form.fault_assignment),
          changed_parts: toNullableText(form.changed_parts),
        })
      ).unwrap();
      toast.success('Günlük arıza kaydı oluşturuldu');
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(String(err || 'Günlük arıza kaydı oluşturulamadı'));
    }
  };

  return (
    <RepairModal
      open={open}
      onClose={onClose}
      title="Yeni Günlük Arıza"
      subtitle="Hızlı müdahale; makinenin durumu değişmez, tamir kaydı açılmaz"
      footer={
        <>
          <SecondaryButton onClick={onClose} disabled={mutating}>
            Vazgeç
          </SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={handleSubmit}
            disabled={mutating}
          >
            {mutating ? 'Kaydediliyor...' : 'Arıza Kaydı Aç'}
          </PrimaryButton>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <section>
          <h3 className="mb-3 border-b border-gray-100 pb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Makine
          </h3>

          {selectedMachine ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {machineLabel(selectedMachine)}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {selectedMachine.plate_no || selectedMachine.vin_no || '—'}
                  {selectedMachine.status_name
                    ? ` · ${selectedMachine.status_name}`
                    : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedMachine(null);
                  setForm((prev) => ({ ...prev, machine_id: '' }));
                }}
                className="shrink-0 text-xs font-medium text-blue-700 hover:underline"
              >
                Değiştir
              </button>
            </div>
          ) : (
            <div>
              <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={machineSearch}
                  onChange={(e) => setMachineSearch(e.target.value)}
                  placeholder="Makine kimlik no, plaka veya VIN ile ara..."
                  className={`${errors.machine_id ? errorInputClass : inputClass} pl-9`}
                />
                {machineOptions.loading && (
                  <ArrowPathIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-blue-500" />
                )}
              </div>

              <div className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-gray-200">
                {machineOptions.loading && machineOptions.items.length === 0 && (
                  <p className="px-3 py-4 text-center text-xs text-gray-500">
                    Makineler yükleniyor...
                  </p>
                )}
                {!machineOptions.loading && machineOptions.items.length === 0 && (
                  <p className="px-3 py-4 text-center text-xs text-gray-500">
                    Makine bulunamadı.
                  </p>
                )}
                {machineOptions.items.map((machine) => (
                  <button
                    key={machine.id}
                    type="button"
                    onClick={() => handleSelectMachine(machine)}
                    className="flex w-full items-center justify-between gap-3 border-b border-gray-100 px-3 py-2 text-left last:border-0 hover:bg-blue-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-gray-900">
                        {machineLabel(machine)}
                      </span>
                      <span className="block truncate text-[11px] text-gray-500">
                        {machine.plate_no || machine.vin_no || '—'}
                      </span>
                    </span>
                    {machine.status_name && (
                      <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                        {machine.status_name}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {machineOptions.error && (
                <p className="mt-1 text-xs text-red-600">
                  {String(machineOptions.error)}
                </p>
              )}
              {errors.machine_id && (
                <p className="mt-1 text-xs text-red-600">{errors.machine_id}</p>
              )}
            </div>
          )}
        </section>

        <section>
          <h3 className="mb-3 border-b border-gray-100 pb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Arıza Bilgileri
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ModalField
              label="KM / Saat *"
              hint="Kilometre veya saat değerini elle girin"
              error={errors.km_hour}
            >
              <input
                type="text"
                value={form.km_hour}
                onChange={(e) => handleChange('km_hour', e.target.value)}
                placeholder="Örn. 12 450 km / 350 saat"
                className={errors.km_hour ? errorInputClass : inputClass}
                maxLength={50}
              />
            </ModalField>

            <ModalField
              label="Şantiye *"
              hint="Şantiye"
              error={errors.territory_id}
            >
              <select
                value={form.territory_id}
                onChange={(e) => handleChange('territory_id', e.target.value)}
                className={errors.territory_id ? errorInputClass : inputClass}
              >
                <option value="">Seçin</option>
                {territories.map((territory) => (
                  <option key={territory.id} value={territory.id}>
                    {territory.name}
                  </option>
                ))}
              </select>
            </ModalField>

            <div className="md:col-span-2">
              <ModalField label="Arıza Tipi *" error={errors.repair_type_id}>
                <select
                  value={form.repair_type_id}
                  onChange={(e) =>
                    handleChange('repair_type_id', e.target.value)
                  }
                  className={
                    errors.repair_type_id ? errorInputClass : inputClass
                  }
                >
                  <option value="">Seçin</option>
                  {repairTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </ModalField>
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-3 border-b border-gray-100 pb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Müdahale
          </h3>
          <div className="space-y-4">
            <ModalField
              label="Arıza Ataması"
              hint="Arızanın ne olduğunu ve kime / hangi ekibe atandığını yazın"
            >
              <textarea
                rows={3}
                value={form.fault_assignment}
                onChange={(e) =>
                  handleChange('fault_assignment', e.target.value)
                }
                placeholder="Örn. Sol ön lastik patladı, saha ekibi yerinde değiştirdi"
                className={inputClass}
                maxLength={4000}
              />
            </ModalField>

            <ModalField
              label="Değişen Parça"
              hint="Kullanılan yedek parça / sarf malzemesi"
            >
              <textarea
                rows={3}
                value={form.changed_parts}
                onChange={(e) => handleChange('changed_parts', e.target.value)}
                placeholder="Örn. 1 adet 315/80 R22.5 lastik"
                className={inputClass}
                maxLength={4000}
              />
            </ModalField>
          </div>
        </section>

        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800">
          Günlük arıza kaydı makinenin durumunu <strong>değiştirmez</strong> ve
          tamir listesinde görünmez. Kayıt açıldıktan sonra tablodan PDF evrak
          ekleyebilirsiniz.
        </div>
      </form>
    </RepairModal>
  );
}

