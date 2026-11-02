// src/components/purchaserequest/SparePartFormModal.jsx
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

import RepairModal, {
  ModalField,
  PrimaryButton,
  SecondaryButton,
  errorInputClass,
  inputClass,
} from '../repair/RepairModal';
import MachineSearchSelect from './MachineSearchSelect';
import { fetchLookupIfNeeded } from '../../stores/lookup_slice';
import {
  createSparePartRequest,
  fetchPurchaseRequestTypes,
} from '../../stores/purchase_request_slice';
import {
  UNIT_OPTIONS,
  buildSparePayload,
  emptySpareForm,
  emptySpareItem,
  validateSpareForm,
} from '../../utils/purchaseRequest';

const compactInputClass = `${inputClass} px-2 py-1.5 text-[12px]`;
const compactErrorClass = `${errorInputClass} px-2 py-1.5 text-[12px]`;

export default function SparePartFormModal({ open, onClose, onSaved }) {
  const dispatch = useDispatch();
  const mutating = useSelector((s) => s.purchaseRequest.mutating);
  const territories = useSelector((s) => s.lookup.data.territory || []);
  const requestTypes = useSelector((s) => s.purchaseRequest.requestTypes.items);

  const [form, setForm] = useState(emptySpareForm);
  const [errors, setErrors] = useState({});
  const [itemErrors, setItemErrors] = useState([]);

  useEffect(() => {
    if (!open) return;
    dispatch(fetchLookupIfNeeded('territory'));
    dispatch(fetchPurchaseRequestTypes());
  }, [open, dispatch]);

  useEffect(() => {
    if (!open) return;
    setForm(emptySpareForm());
    setErrors({});
    setItemErrors([]);
  }, [open]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const setRowValue = (index, key, value) => {
    setForm((prev) => {
      const items = prev.items.map((item, position) =>
        position === index ? { ...item, [key]: value } : item
      );
      return { ...prev, items };
    });
    setItemErrors((prev) => {
      if (!prev[index] || !prev[index][key]) return prev;
      const next = [...prev];
      next[index] = { ...next[index], [key]: '' };
      return next;
    });
  };

  const addRow = () => {
    setForm((prev) => ({ ...prev, items: [...prev.items, emptySpareItem()] }));
  };

  const removeRow = (index) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, position) => position !== index),
    }));
    setItemErrors((prev) => prev.filter((_, position) => position !== index));
  };

  const handleSubmit = async (event) => {
    event?.preventDefault?.();
    if (mutating) return;

    const result = validateSpareForm(form);
    setErrors(result.errors);
    setItemErrors(result.itemErrors);
    if (!result.valid) return;

    try {
      await dispatch(createSparePartRequest(buildSparePayload(form))).unwrap();
      toast.success('Yedek parça talebi oluşturuldu');
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(String(err || 'Yedek parça talebi oluşturulamadı'));
    }
  };

  return (
    <RepairModal
      open={open}
      onClose={onClose}
      title="Yeni Yedek Parça Talebi"
      subtitle="Tek talep birden fazla makine ve parça satırı içerebilir"
      maxWidth="max-w-5xl"
      footer={
        <>
          <SecondaryButton onClick={onClose} disabled={mutating}>
            Vazgeç
          </SecondaryButton>
          <PrimaryButton type="button" onClick={handleSubmit} disabled={mutating}>
            {mutating ? 'Kaydediliyor...' : 'Talebi Kaydet'}
          </PrimaryButton>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <section>
          <h3 className="mb-3 border-b border-gray-100 pb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Talep Bilgileri
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ModalField label="Talep Başlığı *" error={errors.title}>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="Örn. Hidrolik hortum yenileme"
                className={errors.title ? errorInputClass : inputClass}
              />
            </ModalField>

            <ModalField label="STF / HTF No *" error={errors.stf_htf_no}>
              <input
                type="text"
                value={form.stf_htf_no}
                onChange={(e) => setField('stf_htf_no', e.target.value)}
                placeholder="Örn. STF-2026-014"
                className={errors.stf_htf_no ? errorInputClass : inputClass}
              />
            </ModalField>

            <ModalField label="Bölge *" error={errors.territory_id}>
              <select
                value={form.territory_id}
                onChange={(e) => setField('territory_id', e.target.value)}
                className={errors.territory_id ? errorInputClass : inputClass}
              >
                <option value="">Bölge seçin</option>
                {territories.map((territory) => (
                  <option key={territory.id} value={territory.id}>
                    {territory.name}
                  </option>
                ))}
              </select>
            </ModalField>

            <ModalField label="Talep Türü *" error={errors.request_type_id}>
              <select
                value={form.request_type_id}
                onChange={(e) => setField('request_type_id', e.target.value)}
                className={errors.request_type_id ? errorInputClass : inputClass}
              >
                <option value="">Talep türü seçin</option>
                {requestTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </ModalField>

            <ModalField label="Talep Tarihi *" error={errors.request_date}>
              <input
                type="date"
                value={form.request_date}
                onChange={(e) => setField('request_date', e.target.value)}
                className={errors.request_date ? errorInputClass : inputClass}
              />
            </ModalField>

            <ModalField
              label="Durum"
              hint="Parçalar geldiğinde talebi 'Geldi' olarak işaretleyebilirsiniz"
            >
              <select
                value={form.status}
                onChange={(e) => setField('status', e.target.value)}
                className={inputClass}
              >
                <option value="bekleniyor">Bekleniyor</option>
                <option value="geldi">Geldi</option>
              </select>
            </ModalField>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Parça Satırları
            </h3>
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Satır ekle
            </button>
          </div>

          {errors.items && (
            <p className="mb-2 text-xs text-red-600">{errors.items}</p>
          )}

          <div className="space-y-3">
            {form.items.map((item, index) => {
              const rowErrors = itemErrors[index] || {};

              return (
                <div
                  key={item.key}
                  className="rounded-xl border border-gray-200 bg-gray-50/60 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Parça {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      disabled={form.items.length === 1}
                      title="Satırı kaldır"
                      aria-label={`Parça ${index + 1} satırını kaldır`}
                      className="rounded-lg p-1 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="lg:col-span-2">
                      <ModalField label="Makine (ID No) *" error={rowErrors.machine}>
                        <MachineSearchSelect
                          value={item.machine}
                          onChange={(machine) =>
                            setRowValue(index, 'machine', machine)
                          }
                          hasError={Boolean(rowErrors.machine)}
                        />
                      </ModalField>
                    </div>

                    <ModalField label="Garaj Talep No">
                      <input
                        type="text"
                        value={item.garage_request_no}
                        onChange={(e) =>
                          setRowValue(index, 'garage_request_no', e.target.value)
                        }
                        className={compactInputClass}
                      />
                    </ModalField>

                    <ModalField label="Parça No">
                      <input
                        type="text"
                        value={item.part_number}
                        onChange={(e) =>
                          setRowValue(index, 'part_number', e.target.value)
                        }
                        className={compactInputClass}
                      />
                    </ModalField>

                    <div className="sm:col-span-2">
                      <ModalField label="Açıklama (RU)">
                        <input
                          type="text"
                          value={item.description_ru}
                          onChange={(e) =>
                            setRowValue(index, 'description_ru', e.target.value)
                          }
                          className={compactInputClass}
                        />
                      </ModalField>
                    </div>

                    <div className="sm:col-span-2">
                      <ModalField label="Açıklama (TR)">
                        <input
                          type="text"
                          value={item.description_tr}
                          onChange={(e) =>
                            setRowValue(index, 'description_tr', e.target.value)
                          }
                          className={compactInputClass}
                        />
                      </ModalField>
                    </div>

                    <ModalField label="Miktar *" error={rowErrors.quantity}>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={item.quantity}
                        onChange={(e) =>
                          setRowValue(index, 'quantity', e.target.value)
                        }
                        className={
                          rowErrors.quantity ? compactErrorClass : compactInputClass
                        }
                      />
                    </ModalField>

                    <ModalField label="Birim *" error={rowErrors.unit}>
                      <select
                        value={item.unit}
                        onChange={(e) => setRowValue(index, 'unit', e.target.value)}
                        className={
                          rowErrors.unit ? compactErrorClass : compactInputClass
                        }
                      >
                        {UNIT_OPTIONS.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </ModalField>

                    <ModalField label="Tedarik Tarihi">
                      <input
                        type="date"
                        value={item.supply_date}
                        onChange={(e) =>
                          setRowValue(index, 'supply_date', e.target.value)
                        }
                        className={compactInputClass}
                      />
                    </ModalField>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </form>
    </RepairModal>
  );
}
