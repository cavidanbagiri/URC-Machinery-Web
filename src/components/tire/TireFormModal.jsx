// src/components/tire/TireFormModal.jsx
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  ArrowPathIcon,
  DocumentPlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import RepairModal, {
  ModalField,
  PrimaryButton,
  SecondaryButton,
  errorInputClass,
  inputClass,
} from '../repair/RepairModal';
import {
  clearMachineOptions,
  createTireChange,
  fetchTireMachineOptions,
  uploadTireDocument,
} from '../../stores/tire_slice';
import { machineLabel, toNullableText, todayISO } from '../../utils/repair';
import {
  TIRE_CHANGE_REASONS,
  TIRE_POSITIONS,
  validateTirePdf,
} from '../../utils/tire';

function emptyForm() {
  return {
    machine_id: '',
    position: '',
    brand_model: '',
    size: '',
    change_reason: '',
    change_date: todayISO(),
    km_hour: '',
  };
}

export default function TireFormModal({ open, onClose, onSaved }) {
  const dispatch = useDispatch();
  const mutating = useSelector((s) => s.tire.mutating);
  const machineOptions = useSelector((s) => s.tire.machineOptions);

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [machineSearch, setMachineSearch] = useState('');
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (!open) dispatch(clearMachineOptions());
  }, [open, dispatch]);

  useEffect(() => {
    if (!open || selectedMachine) return undefined;
    const timeout = setTimeout(() => {
      dispatch(
        fetchTireMachineOptions({ search: machineSearch, limit: 20 })
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

  const handleFileChange = (event) => {
    const picked = event.target.files?.[0];
    event.target.value = '';
    if (!picked) return;

    const validationError = validateTirePdf(picked);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setFile(picked);
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.machine_id) nextErrors.machine_id = 'Makine seçin';
    if (!form.position.trim()) {
      nextErrors.position = 'Lastik konumu zorunludur';
    }
    if (!form.change_date) {
      nextErrors.change_date = 'Değişim tarihi zorunludur';
    } else if (form.change_date > todayISO()) {
      nextErrors.change_date = 'Değişim tarihi bugünden ileri olamaz';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      const created = await dispatch(
        createTireChange({
          machine_id: Number(form.machine_id),
          position: form.position.trim(),
          brand_model: toNullableText(form.brand_model),
          size: toNullableText(form.size),
          change_reason: toNullableText(form.change_reason),
          km_hour: toNullableText(form.km_hour),
          change_date: form.change_date,
        })
      ).unwrap();

      if (file) {
        try {
          await dispatch(
            uploadTireDocument({ tireId: created.id, file })
          ).unwrap();
          toast.success('Lastik kaydı ve evrak eklendi');
        } catch (err) {
          toast.error(`Kayıt oluşturuldu, evrak yüklenemedi: ${err}`);
        }
      } else {
        toast.success('Lastik kaydı oluşturuldu');
      }

      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(String(err || 'Lastik kaydı oluşturulamadı'));
    }
  };

  return (
    <RepairModal
      open={open}
      onClose={onClose}
      title="Yeni Lastik"
      subtitle="Lastik değişimi kaydı; makinenin durumunu değiştirmez"
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
            {mutating ? 'Kaydediliyor...' : 'Lastik Kaydı Oluştur'}
          </PrimaryButton>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <section>
          <h3 className="mb-3 border-b border-gray-100 pb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Makine (ID No)
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
            Lastik Bilgileri
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ModalField
              label="Lastik Konumu *"
              hint="Listeden seçin veya kendi tanımınızı yazın"
              error={errors.position}
            >
              <input
                type="text"
                list="tire-position-options"
                value={form.position}
                onChange={(e) => handleChange('position', e.target.value)}
                placeholder="Örn. Sol Ön"
                className={errors.position ? errorInputClass : inputClass}
                maxLength={50}
              />
              <datalist id="tire-position-options">
                {TIRE_POSITIONS.map((position) => (
                  <option key={position} value={position} />
                ))}
              </datalist>
            </ModalField>

            <ModalField label="Değişim Tarihi *" error={errors.change_date}>
              <input
                type="date"
                value={form.change_date}
                max={todayISO()}
                onChange={(e) => handleChange('change_date', e.target.value)}
                className={errors.change_date ? errorInputClass : inputClass}
              />
            </ModalField>

            <ModalField label="Lastik Marka / Model" hint="Örn. Michelin XZL">
              <input
                type="text"
                value={form.brand_model}
                onChange={(e) => handleChange('brand_model', e.target.value)}
                placeholder="Marka ve model"
                className={inputClass}
                maxLength={150}
              />
            </ModalField>

            <ModalField label="Lastik Ebadı" hint="Örn. 315/80 R22.5">
              <input
                type="text"
                value={form.size}
                onChange={(e) => handleChange('size', e.target.value)}
                placeholder="Örn. 12.00 R20"
                className={inputClass}
                maxLength={50}
              />
            </ModalField>

            <div className="md:col-span-2">
              <ModalField
                label="Motor Saati / KM"
                hint="Değişim anındaki sayaç değerini elle girin"
              >
                <input
                  type="text"
                  value={form.km_hour}
                  onChange={(e) => handleChange('km_hour', e.target.value)}
                  placeholder="Örn. 12 450 km / 350 saat"
                  className={inputClass}
                  maxLength={50}
                />
              </ModalField>
            </div>

            <div className="md:col-span-2">
              <ModalField
                label="Değişim Sebebi"
                hint="Kısa sebeplerden birine dokunabilir veya serbest metin yazabilirsiniz"
              >
                <textarea
                  rows={2}
                  value={form.change_reason}
                  onChange={(e) => handleChange('change_reason', e.target.value)}
                  placeholder="Örn. Sol ön lastik yanaktan patladı"
                  className={inputClass}
                  maxLength={1000}
                />
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {TIRE_CHANGE_REASONS.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => handleChange('change_reason', reason)}
                      className={`rounded-full border px-2 py-0.5 text-[11px] transition ${
                        form.change_reason === reason
                          ? 'border-blue-500 bg-blue-50 font-medium text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-700'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </ModalField>
            </div>
          </div>
        </section>


        <section>
          <h3 className="mb-3 border-b border-gray-100 pb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Evrak (opsiyonel)
          </h3>

          {file ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {file.name}
                </p>
                <p className="text-[11px] text-gray-500">
                  Kayıt oluşturulunca bu PDF yüklenecek
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="shrink-0 rounded p-1 text-red-600 hover:bg-red-100"
                aria-label="Seçilen evrakı kaldır"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="tire-form-document"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-4 text-sm font-medium text-gray-600 transition hover:border-blue-400 hover:text-blue-700"
            >
              <DocumentPlusIcon className="h-5 w-5" />
              PDF evrak ekle (fatura, irsaliye, iş emri)
            </label>
          )}
          <input
            id="tire-form-document"
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <p className="mt-1 text-[11px] text-gray-400">
            Sadece PDF · en fazla 10 MB. Kayıt açıldıktan sonra tablodan da evrak
            ekleyebilirsiniz.
          </p>
        </section>

        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800">
          Lastik kaydı makinenin durumunu <strong>değiştirmez</strong>. Aynı
          makine ve konum için yeni bir kayıt açtığınızda önceki değişimler
          tablodaki <strong>Eski kayıtlar</strong> düğmesinde birikir.
        </div>
      </form>
    </RepairModal>
  );
}

