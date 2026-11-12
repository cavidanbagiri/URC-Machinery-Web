// src/components/purchaserequest/SparePartFormModal.jsx
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  DocumentPlusIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

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
  updateSparePartRequest,
  uploadSparePartDocument,
} from '../../stores/purchase_request_slice';
import {
  MAX_DOCUMENT_MB,
  SPARE_STATUSES,
  SPARE_STATUS_LABELS,
  UNIT_OPTIONS,
  buildSparePayload,
  emptySpareForm,
  emptySpareItem,
  formatFileSize,
  requestToSpareForm,
  validateSpareDocument,
  validateSpareForm,
} from '../../utils/purchaseRequest';

const compactInputClass = `${inputClass} px-2 py-1.5 text-[12px]`;
const compactErrorClass = `${errorInputClass} px-2 py-1.5 text-[12px]`;

export default function SparePartFormModal({ open, onClose, onSaved, request }) {
  const dispatch = useDispatch();
  const mutating = useSelector((s) => s.purchaseRequest.mutating);
  const territories = useSelector((s) => s.lookup.data.territory || []);
  const requestTypes = useSelector((s) => s.purchaseRequest.requestTypes.items);

  // ``request`` turns the same modal into the edit form of a saved request.
  const editing = Boolean(request?.id);

  const [form, setForm] = useState(emptySpareForm);
  const [errors, setErrors] = useState({});
  const [itemErrors, setItemErrors] = useState([]);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const rowsRef = useRef(null);
  const revealNewRowRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    dispatch(fetchLookupIfNeeded('territory'));
    dispatch(fetchPurchaseRequestTypes());
  }, [open, dispatch]);

  useEffect(() => {
    if (!open) return;
    setForm(request?.id ? requestToSpareForm(request) : emptySpareForm());
    setErrors({});
    setItemErrors([]);
    setFile(null);
    setSaving(false);
  }, [open, request]);

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

  // A freshly added row may land below the scroll fold, so reveal it.
  useEffect(() => {
    if (!revealNewRowRef.current) return;
    revealNewRowRef.current = false;

    const lastRow = rowsRef.current?.lastElementChild;
    lastRow?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [form.items.length]);

  const addRow = () => {
    revealNewRowRef.current = true;
    setForm((prev) => ({ ...prev, items: [...prev.items, emptySpareItem()] }));
  };

  const removeRow = (index) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, position) => position !== index),
    }));
    setItemErrors((prev) => prev.filter((_, position) => position !== index));
  };

  const handleFileChange = (event) => {
    const picked = event.target.files?.[0];
    event.target.value = '';
    if (!picked) return;

    const validationError = validateSpareDocument(picked);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setFile(picked);
  };

  const handleSubmit = async (event) => {
    event?.preventDefault?.();
    if (mutating || saving) return;

    const result = validateSpareForm(form);
    setErrors(result.errors);
    setItemErrors(result.itemErrors);
    if (!result.valid) return;

    setSaving(true);
    const payload = buildSparePayload(form);
    try {
      const saved = editing
        ? await dispatch(
            updateSparePartRequest({ requestId: request.id, payload })
          ).unwrap()
        : await dispatch(createSparePartRequest(payload)).unwrap();

      if (file) {
        try {
          await dispatch(
            uploadSparePartDocument({ requestId: saved.id, file })
          ).unwrap();
          toast.success(
            editing
              ? 'Talep güncellendi ve PDF evrak eklendi'
              : 'Yedek parça talebi ve PDF evrak eklendi'
          );
        } catch (err) {
          toast.error(
            `Talep ${editing ? 'güncellendi' : 'oluşturuldu'}, evrak yüklenemedi: ${err}`
          );
        }
      } else {
        toast.success(
          editing
            ? 'Yedek parça talebi güncellendi'
            : 'Yedek parça talebi oluşturuldu'
        );
      }

      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(
        String(
          err ||
            (editing
              ? 'Yedek parça talebi güncellenemedi'
              : 'Yedek parça talebi oluşturulamadı')
        )
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <RepairModal
      open={open}
      onClose={onClose}
      title={editing ? 'Yedek Parça Talebini Düzenle' : 'Yeni Yedek Parça Talebi'}
      subtitle={
        editing
          ? 'Talep bilgilerini ve parça satırlarını güncelleyin'
          : 'Tek talep birden fazla makine ve parça satırı içerebilir'
      }
      maxWidth="max-w-8xl"
      footer={
        <>
          <SecondaryButton onClick={onClose} disabled={mutating || saving}>
            Vazgeç
          </SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={handleSubmit}
            disabled={mutating || saving}
          >
            {mutating || saving
              ? 'Kaydediliyor...'
              : editing
                ? 'Değişiklikleri Kaydet'
                : 'Talebi Kaydet'}
          </PrimaryButton>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5 ">
        <section>
          <h3 className="mb-3 border-b border-gray-100 pb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Talep Bilgileri
          </h3>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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

            <ModalField label="Durum *" error={errors.status}>
              <select
                value={form.status}
                onChange={(e) => setField('status', e.target.value)}
                className={errors.status ? errorInputClass : inputClass}
              >
                <option value="">Durum seçin</option>
                {SPARE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {SPARE_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </ModalField>
          </div>
        </section>
        

        <section>
          <div className="mb-1 flex items-center justify-between border-b border-gray-100 pb-2">
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

          <div className="space-y-0 " ref={rowsRef}>
            {form.items.map((item, index) => {
              const rowErrors = itemErrors[index] || {};

              return (
                <div
                  key={item.key}
                  className="p-0.5 "
                >
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-12 lg:grid-cols-12">
                    <div className="lg:col-span-1">
                      <ModalField label="Makine (ID No) *" error={rowErrors.machine} index={index}>
                        <MachineSearchSelect
                          value={item.machine}
                          onChange={(machine) =>
                            setRowValue(index, 'machine', machine)
                          }
                          hasError={Boolean(rowErrors.machine)}
                        />
                      </ModalField>
                    </div>

                    <ModalField label="Garaj Talep No" index={index}>
                      <input
                        type="text"
                        value={item.garage_request_no}
                        onChange={(e) =>
                          setRowValue(index, 'garage_request_no', e.target.value)
                        }
                        className={compactInputClass}
                      />
                    </ModalField>

                    <ModalField label="Parça No" index={index}>
                      <input
                        type="text"
                        value={item.part_number}
                        onChange={(e) =>
                          setRowValue(index, 'part_number', e.target.value)
                        }
                        className={compactInputClass}
                      />
                    </ModalField>

                    <div className="sm:col-span-3">
                      <ModalField label="Açıklama (RU)" index={index}>
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

                    <div className="sm:col-span-3">
                      <ModalField label="Açıklama (TR)" index={index}>
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

                    <ModalField label="Miktar *" error={rowErrors.quantity} index={index}>
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

                    <ModalField label="Birim *" error={rowErrors.unit} index={index}>
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

                    <ModalField label="Tedarik Tarihi" index={index}>
                      <input
                        type="date"
                        value={item.supply_date}
                        onChange={(e) =>
                          setRowValue(index, 'supply_date', e.target.value)
                        }
                        className={compactInputClass}
                      />
                    </ModalField>

                    {/* <button
                      type="button"
                      onClick={() => removeRow(index)}
                      disabled={form.items.length === 1}
                      title="Satırı kaldır"
                      aria-label={`Parça ${index + 1} satırını kaldır`}
                      className="rounded-lg p-1 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button> */}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h3 className="mb-2 border-b border-gray-100 pb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            PDF Evrak (opsiyonel)
          </h3>

          {file ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {file.name}
                </p>
                <p className="text-[11px] text-gray-500">
                  {formatFileSize(file.size)} · Talep kaydedilince yüklenecek
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
              htmlFor="spare-part-form-document"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 transition hover:border-blue-400 hover:text-blue-700"
            >
              <DocumentPlusIcon className="h-5 w-5" />
              Sipariş PDF'i ekle (imzalı sipariş, fatura, irsaliye)
            </label>
          )}
          <input
            id="spare-part-form-document"
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <p className="mt-1 text-[11px] text-gray-400">
            Sadece PDF · en fazla {MAX_DOCUMENT_MB} MB. Talebi kaydettikten sonra
            evrakı tablodaki detay penceresinden de ekleyebilirsiniz.
          </p>
        </section>
      </form>
    </RepairModal>
  );
}
