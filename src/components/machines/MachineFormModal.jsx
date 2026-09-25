// src/components/machines/MachineFormModal.jsx
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';

import {
  createMachine,
  updateMachine,
} from '../../stores/machine_slice';

// Boş form
const emptyForm = {
  identification_no: '',
  vin_no: '',
  plate_no: '',                    // ← YENİ
  technical_character: '',
  production_year: '',
  weight: '',
  dimension: '',
  engine_power: '',
  engine_mark_model: '',
  engine_identity: '',
  territory_id: '',
  type_id: '',
  subtype_id: '',
  car_mark_id: '',
  car_model_id: '',
  company_id: '',
  status_id: 1,                  // ← YENİ (default Active)

};

export default function MachineFormModal({ open, onClose, editingMachine }) {
  const dispatch = useDispatch();
  const lookups = useSelector((s) => s.lookup.data);
  const { formSubmitting } = useSelector((s) => s.machine);

  const [form, setForm] = useState({ ...emptyForm });
  const [errors, setErrors] = useState({});

  const isEdit = !!editingMachine;

  // Modal açıldıqda form-u doldur / sıfırla
  useEffect(() => {
    if (!open) return;

    if (editingMachine) {
      setForm({
        identification_no: editingMachine.identification_no || '',
        vin_no: editingMachine.vin_no || '',
        plate_no: editingMachine.plate_no || '',         // ← YEN
        technical_character: editingMachine.technical_character || '',
        production_year: editingMachine.production_year
          ? new Date(editingMachine.production_year).getFullYear()
          : '',
        weight: editingMachine.weight ?? '',
        dimension: editingMachine.dimension || '',
        engine_power: editingMachine.engine_power || '',
        engine_mark_model: editingMachine.engine_mark_model || '',
        engine_identity: editingMachine.engine_identity || '',
        territory_id: editingMachine.territory_id ?? '',
        type_id: editingMachine.type_id ?? '',
        subtype_id: editingMachine.subtype_id ?? '',
        car_mark_id: editingMachine.car_mark_id ?? '',
        car_model_id: editingMachine.car_model_id ?? '',
        company_id: editingMachine.company_id ?? '',
        status_id: editingMachine.status_id ?? 1,   // ← YENİ

      });
    } else {
      setForm({ ...emptyForm });
    }
    setErrors({});
  }, [open, editingMachine]);

  // Field dəyişdikdə
  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: '' }));
    }
  };

  // Validasiya
  const validate = () => {
    const newErrors = {};

    if (form.vin_no && form.vin_no.length > 100) {
      newErrors.vin_no = 'VIN 100 simvoldan çox ola bilməz';
    }
    if (form.plate_no && form.plate_no.length > 50) {
      newErrors.plate_no = 'Plate 50 simvoldan çox ola bilməz';
    }
    if (form.identification_no && form.identification_no.length > 100) {
      newErrors.identification_no = 'Max 100 simvol';
    }
    if (form.production_year) {
      const year = Number(form.production_year);
      if (year < 1900 || year > 2100) {
        newErrors.production_year = 'İl 1900-2100 arasında olmalıdır';
      }
    }
    if (form.weight !== '' && isNaN(Number(form.weight))) {
      newErrors.weight = 'Rəqəm olmalıdır';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Payload hazırla — boş sahələri çıxar
    const payload = {};
    // Object.entries(form).forEach(([key, value]) => {
    //   if (value === '' || value === null || value === undefined) return;

    //   if (key === 'production_year') {
    //     payload[key] = `${value}-01-01T00:00:00Z`;
    //   } else if (key === 'weight') {
    //     payload[key] = Number(value);
    //   } else if (
    //     ['territory_id', 'type_id', 'subtype_id', 'car_mark_id', 'car_model_id', 'company_id'].includes(key)
    //   ) {
    //     payload[key] = Number(value);
    //   } else {
    //     payload[key] = value;
    //   }
    // });
     Object.entries(form).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) return;

      if (key === 'production_year') {
        payload[key] = `${value}-01-01T00:00:00Z`;
      } else if (key === 'weight') {
        payload[key] = Number(value);
      } else if (
        ['territory_id', 'type_id', 'subtype_id', 'car_mark_id', 'car_model_id', 'company_id', 'status_id'].includes(key)
      ) {
        payload[key] = Number(value);        // ← status_id əlavə olundu
      } else {
        payload[key] = value;
      }
    });

    try {
      if (isEdit) {
        await dispatch(
          updateMachine({ id: editingMachine.id, payload })
        ).unwrap();
        toast.success('Uğurla yeniləndi');
      } else {
        await dispatch(createMachine(payload)).unwrap();
        toast.success('Uğurla yaradıldı');
      }
      onClose();
    } catch (err) {
      toast.error(err || 'Xəta baş verdi');
    }
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
            <Dialog.Panel className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <Dialog.Title className="text-lg font-semibold text-gray-900">
                  {isEdit ? 'Maşını redaktə et' : 'Yeni maşın əlavə et'}
                </Dialog.Title>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <form
                id="machine-form"
                onSubmit={handleSubmit}
                className="flex-1 overflow-y-auto px-6 py-5"
              >
                <div className="space-y-8">
                  {/* BASIC INFO */}
                  <Section title="Əsas məlumat">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field
                        label="Identification No"
                        value={form.identification_no}
                        onChange={(v) => handleChange('identification_no', v)}
                        error={errors.identification_no}
                        placeholder="TRK-001"
                      />
                      <Field
                        label="VIN No"
                        value={form.vin_no}
                        onChange={(v) => handleChange('vin_no', v)}
                        error={errors.vin_no}
                        placeholder="WDB9634031L123456"
                      />
                      {/* YENİ */}
                      <Field
                        label="Plate No"
                        value={form.plate_no}
                        onChange={(v) => handleChange('plate_no', v)}
                        error={errors.plate_no}
                        placeholder="90 AB 123"
                      />
                      <Field
                        label="Technical Character"
                        value={form.technical_character}
                        onChange={(v) => handleChange('technical_character', v)}
                        error={errors.technical_character}
                        placeholder="Yük maşını, 3 oxlu"
                        fullWidth
                      />
                    </div>
                  </Section>

                  {/* TECHNICAL SPECS */}
                  <Section title="Texniki göstəricilər">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field
                        label="Production Year"
                        type="number"
                        value={form.production_year}
                        onChange={(v) => handleChange('production_year', v)}
                        error={errors.production_year}
                        placeholder="2020"
                      />
                      <Field
                        label="Weight (kg)"
                        type="number"
                        value={form.weight}
                        onChange={(v) => handleChange('weight', v)}
                        error={errors.weight}
                        placeholder="12000"
                      />
                      <Field
                        label="Dimension"
                        value={form.dimension}
                        onChange={(v) => handleChange('dimension', v)}
                        error={errors.dimension}
                        placeholder="12x2.5x3.8"
                      />
                      <Field
                        label="Engine Power"
                        value={form.engine_power}
                        onChange={(v) => handleChange('engine_power', v)}
                        error={errors.engine_power}
                        placeholder="440 HP"
                      />
                      <Field
                        label="Engine Mark Model"
                        value={form.engine_mark_model}
                        onChange={(v) => handleChange('engine_mark_model', v)}
                        error={errors.engine_mark_model}
                        placeholder="OM 471"
                      />
                      <Field
                        label="Engine Identity"
                        value={form.engine_identity}
                        onChange={(v) => handleChange('engine_identity', v)}
                        error={errors.engine_identity}
                        placeholder="ENG-12345"
                      />
                    </div>
                  </Section>

                  {/* LOOKUPS */}
                  <Section title="Təsnifat">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {/* YENİ — Status */}
                      <SelectField
                        label="Status"
                        value={form.status_id}
                        onChange={(v) => handleChange('status_id', v)}
                        options={lookups.car_status || []}
                        error={errors.status_id}
                      />
                      <SelectField
                        label="Territory"
                        value={form.territory_id}
                        onChange={(v) => handleChange('territory_id', v)}
                        options={lookups.territory || []}
                        error={errors.territory_id}
                      />
                      <SelectField
                        label="Type Transport"
                        value={form.type_id}
                        onChange={(v) => handleChange('type_id', v)}
                        options={lookups.type_transport || []}
                        error={errors.type_id}
                      />
                      <SelectField
                        label="SubType Transport"
                        value={form.subtype_id}
                        onChange={(v) => handleChange('subtype_id', v)}
                        options={lookups.sub_type_transport || []}
                        error={errors.subtype_id}
                      />
                      <SelectField
                        label="Mark"
                        value={form.car_mark_id}
                        onChange={(v) => handleChange('car_mark_id', v)}
                        options={lookups.car_mark || []}
                        error={errors.car_mark_id}
                      />
                      <SelectField
                        label="Model"
                        value={form.car_model_id}
                        onChange={(v) => handleChange('car_model_id', v)}
                        options={lookups.car_model || []}
                        error={errors.car_model_id}
                      />
                      <SelectField
                        label="Company"
                        value={form.company_id}
                        onChange={(v) => handleChange('company_id', v)}
                        options={lookups.company || []}
                        error={errors.company_id}
                      />
                    </div>
                  </Section>
                </div>
              </form>

              {/* Footer */}
              <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={formSubmitting}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  form="machine-form"
                  disabled={formSubmitting}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {formSubmitting
                    ? 'Yadda saxlanılır...'
                    : isEdit
                    ? 'Yenilə'
                    : 'Yarat'}
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

function Field({ label, value, onChange, error, placeholder, type = 'text', fullWidth }) {
  return (
    <div className={fullWidth ? 'md:col-span-2' : ''}>
      <label className="mb-1 block text-xs font-medium text-gray-600">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
            : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function SelectField({ label, value, onChange, options, error }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none transition ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
            : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
        }`}
      >
        <option value="">Seçin...</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}