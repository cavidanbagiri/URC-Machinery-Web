// src/components/repair/RepairFormModal.jsx
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import StatusBadge from '../machines/StatusBadge';
import RepairModal, {
  ModalField,
  PrimaryButton,
  SecondaryButton,
  errorInputClass,
  inputClass,
} from './RepairModal';
import {
  clearEstimate,
  clearMachineOptions,
  createRepair,
  fetchRepairEstimate,
  fetchRepairMachineOptions,
  updateRepair,
} from '../../stores/repair_slice';
import { fetchLookupIfNeeded } from '../../stores/lookup_slice';
import { formatDate, machineLabel, todayISO, toNullableText } from '../../utils/repair';

function emptyForm() {
  return {
    machine_id: '',
    repair_type_id: '',
    fault_location: '',
    notes: '',
    entry_date: todayISO(),
    estimated_exit_date: '',
  };
}

function machineFromRecord(record) {
  if (!record) return null;
  return {
    id: record.machine_id,
    identification_no: record.identification_no,
    plate_no: record.plate_no,
    status_name: record.previous_machine_status_name,
  };
}

function formFromRecord(record) {
  if (!record) return emptyForm();
  return {
    machine_id: record.machine_id,
    repair_type_id: String(record.repair_type_id),
    fault_location: record.fault_location || '',
    notes: record.notes || '',
    entry_date: record.entry_date || todayISO(),
    estimated_exit_date: record.estimated_exit_date || '',
  };
}

export default function RepairFormModal({ open, onClose, record, onSaved }) {
  const dispatch = useDispatch();
  const mutating = useSelector((s) => s.repair.mutating);
  const machineOptions = useSelector((s) => s.repair.machineOptions);
  const estimate = useSelector((s) => s.repair.estimate);
  const repairTypes = useSelector((s) => s.lookup.data.repair_type || []);

  const [form, setForm] = useState(() => formFromRecord(record));
  const [errors, setErrors] = useState({});
  const [selectedMachine, setSelectedMachine] = useState(() =>
    machineFromRecord(record)
  );
  const [machineSearch, setMachineSearch] = useState('');
  const [estimateTouched, setEstimateTouched] = useState(Boolean(record));

  useEffect(() => {
    if (open) dispatch(fetchLookupIfNeeded('repair_type'));
  }, [open, dispatch]);

  useEffect(() => {
    if (!open) {
      dispatch(clearEstimate());
      dispatch(clearMachineOptions());
    }
  }, [open, dispatch]);

  useEffect(() => {
    if (!open || record) return undefined;
    const timeout = setTimeout(() => {
      dispatch(fetchRepairMachineOptions({ search: machineSearch, limit: 20 }));
    }, 300);
    return () => clearTimeout(timeout);
  }, [open, record, machineSearch, dispatch]);

  useEffect(() => {
    if (!open || record || !form.repair_type_id) return;
    dispatch(fetchRepairEstimate(Number(form.repair_type_id)));
  }, [open, record, form.repair_type_id, dispatch]);

  const suggestedExitDate =
    !record &&
    !estimateTouched &&
    !form.estimated_exit_date &&
    estimate.data &&
    estimate.repairTypeId === Number(form.repair_type_id)
      ? estimate.data.suggested_exit_date
      : '';
  const effectiveExitDate = suggestedExitDate || form.estimated_exit_date;

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const handleTypeChange = (value) => {
    setEstimateTouched(false);
    setForm((prev) => ({
      ...prev,
      repair_type_id: value,
      estimated_exit_date: '',
    }));
    if (errors.repair_type_id) {
      setErrors((prev) => ({ ...prev, repair_type_id: '' }));
    }
  };

  const handleSelectMachine = (machine) => {
    setSelectedMachine(machine);
    setForm((prev) => ({ ...prev, machine_id: machine.id }));
    setMachineSearch('');
    if (errors.machine_id) setErrors((prev) => ({ ...prev, machine_id: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!record && !form.machine_id) {
      nextErrors.machine_id = 'Makine seçin';
    }
    if (!form.repair_type_id) {
      nextErrors.repair_type_id = 'Tamir tipi seçin';
    }
    if (!form.entry_date) {
      nextErrors.entry_date = 'Giriş tarihi zorunludur';
    }
    if (
      effectiveExitDate &&
      form.entry_date &&
      effectiveExitDate < form.entry_date
    ) {
      nextErrors.estimated_exit_date =
        'Tahmini çıkış tarihi giriş tarihinden önce olamaz';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      repair_type_id: Number(form.repair_type_id),
      fault_location: toNullableText(form.fault_location),
      notes: toNullableText(form.notes),
      entry_date: form.entry_date,
      estimated_exit_date: toNullableText(effectiveExitDate),
    };

    try {
      if (record) {
        await dispatch(
          updateRepair({ repairId: record.id, payload })
        ).unwrap();
        toast.success('Tamir kaydı güncellendi');
      } else {
        await dispatch(
          createRepair({ ...payload, machine_id: Number(form.machine_id) })
        ).unwrap();
        toast.success('Tamir kaydı oluşturuldu');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(String(err || 'Tamir kaydı kaydedilemedi'));
    }
  };

  const selectedType = repairTypes.find(
    (type) => type.id === Number(form.repair_type_id)
  );

  return (
    <RepairModal
      open={open}
      onClose={onClose}
      title={record ? 'Tamir Kaydını Düzenle' : 'Yeni Tamir Kaydı'}
      subtitle={
        record
          ? [record.identification_no, record.plate_no].filter(Boolean).join(' · ')
          : 'Makineyi seçin ve arıza bilgilerini girin'
      }
      badge={
        record?.status_detail ? (
          <StatusBadge status={record.status_detail} />
        ) : null
      }
      footer={
        <>
          <SecondaryButton onClick={onClose} disabled={mutating}>
            Vazgeç
          </SecondaryButton>
          <PrimaryButton type="button" onClick={handleSubmit} disabled={mutating}>
            {mutating
              ? 'Kaydediliyor...'
              : record
                ? 'Değişiklikleri Kaydet'
                : 'Arıza Kaydı Aç'}
          </PrimaryButton>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <section>
          <h3 className="mb-3 border-b border-gray-100 pb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Makine
          </h3>

          {record ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-sm font-medium text-gray-900">
                {machineLabel(record)}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                {[record.plate_no, record.vin_no, record.territory_name]
                  .filter(Boolean)
                  .join(' · ') || 'Makine bilgisi'}
              </p>
            </div>
          ) : selectedMachine ? (
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
                  placeholder="Kimlik no, plaka veya VIN ile makine ara..."
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
                    Uygun makine bulunamadı. Aktif tamiri olan makineler listede
                    görünmez.
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
            Tamir Bilgileri
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ModalField label="Arıza Kategorisi *" error={errors.repair_type_id}>
              <select
                value={form.repair_type_id}
                onChange={(e) => handleTypeChange(e.target.value)}
                className={errors.repair_type_id ? errorInputClass : inputClass}
              >
                <option value="">Seçin</option>
                {repairTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </ModalField>

            <ModalField
              label="Arıza Tanımı"
              hint="Makine üzerindeki bölüm / parça"
            >
              <input
                type="text"
                value={form.fault_location}
                onChange={(e) => handleChange('fault_location', e.target.value)}
                placeholder="Örn. Motor bölmesi"
                className={inputClass}
                maxLength={255}
              />
            </ModalField>

            <ModalField label="Giriş Tarihi *" error={errors.entry_date}>
              <input
                type="date"
                value={form.entry_date}
                onChange={(e) => handleChange('entry_date', e.target.value)}
                className={errors.entry_date ? errorInputClass : inputClass}
              />
            </ModalField>

            <ModalField
              label="Tahmini Çıkış Tarihi"
              hint={
                estimate.loading && form.repair_type_id
                  ? 'Geçmiş kayıtlara göre hesaplanıyor...'
                  : estimate.data &&
                      estimate.repairTypeId === Number(form.repair_type_id)
                    ? `${estimate.data.average_days} gün ortalama · öneri ${formatDate(
                        estimate.data.suggested_exit_date
                      )}`
                    : selectedType
                      ? 'Geçmiş kayıtlara göre öneri alınır'
                      : 'Tamir tipi seçildiğinde öneri hesaplanır'
              }
              error={errors.estimated_exit_date}
            >
              <input
                type="date"
                value={effectiveExitDate}
                min={form.entry_date || undefined}
                onChange={(e) => {
                  setEstimateTouched(true);
                  handleChange('estimated_exit_date', e.target.value);
                }}
                className={
                  errors.estimated_exit_date ? errorInputClass : inputClass
                }
              />
            </ModalField>
          </div>
        </section>

        <ModalField label="Güncel Durum">
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Arıza tanımı, yapılan işlemler veya beklenen parçalar..."
            className={inputClass}
            maxLength={4000}
          />
        </ModalField>

        {!record && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800">
            Kayıt açıldığında makinenin durumu <strong>Arızalı</strong> olarak
            güncellenir. Tamir kapatıldığında önceki makine durumu geri yüklenir.
          </div>
        )}
      </form>
    </RepairModal>
  );
}
