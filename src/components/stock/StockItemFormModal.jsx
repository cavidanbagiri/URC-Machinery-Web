// src/components/stock/StockItemFormModal.jsx
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import RepairModal, {
  ModalField,
  PrimaryButton,
  SecondaryButton,
  errorInputClass,
  inputClass,
} from '../repair/RepairModal';
import { createStockItem, updateStockItem } from '../../stores/stock_slice';
import {
  UNIT_OPTIONS,
  buildItemPayload,
  emptyItemForm,
  itemFormFromRow,
  validateItemForm,
} from '../../utils/stock';

export default function StockItemFormModal({ open, onClose, item, onSaved }) {
  const dispatch = useDispatch();
  const mutating = useSelector((s) => s.stock.mutating);

  const [form, setForm] = useState(emptyItemForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setForm(itemFormFromRow(item));
    setErrors({});
  }, [open, item]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const handleSubmit = async (event) => {
    event?.preventDefault?.();
    if (mutating) return;

    const result = validateItemForm(form);
    setErrors(result.errors);
    if (!result.valid) return;

    const payload = buildItemPayload(form);

    try {
      if (item) {
        await dispatch(updateStockItem({ itemId: item.id, payload })).unwrap();
        toast.success('Malzeme güncellendi');
      } else {
        await dispatch(createStockItem(payload)).unwrap();
        toast.success('Malzeme kaydedildi');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(String(err || 'Malzeme kaydedilemedi'));
    }
  };

  return (
    <RepairModal
      open={open}
      onClose={onClose}
      title={item ? 'Malzemeyi Düzenle' : 'Yeni Malzeme'}
      subtitle={
        item
          ? 'Miktarı düzeltmek kart bakiyesini doğrudan değiştirir'
          : 'İlk sayım miktarını girin; sonraki değişimler sahaya çıkışla olur'
      }
      badge={
        item ? (
          <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600">
            {item.issue_count || 0} sahaya çıkış
          </span>
        ) : null
      }
      footer={
        <>
          <SecondaryButton onClick={onClose} disabled={mutating}>
            Vazgeç
          </SecondaryButton>
          <PrimaryButton type="submit" form="stock-item-form" disabled={mutating}>
            {mutating ? 'Kaydediliyor...' : item ? 'Güncelle' : 'Kaydet'}
          </PrimaryButton>
        </>
      }
    >
      <form id="stock-item-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ModalField label="Malzeme Adı *" error={errors.name}>
            <input
              type="text"
              value={form.name}
              onChange={(event) => setField('name', event.target.value)}
              placeholder="Yağ filtresi"
              className={errors.name ? errorInputClass : inputClass}
            />
          </ModalField>

          <ModalField label="Birim *" error={errors.unit}>
            <select
              value={form.unit}
              onChange={(event) => setField('unit', event.target.value)}
              className={errors.unit ? errorInputClass : inputClass}
            >
              {UNIT_OPTIONS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </ModalField>

          <ModalField
            label="Miktar *"
            error={errors.quantity}
            hint={
              item
                ? 'Sayım sonucunu yazın; kart bakiyesi buna eşitlenir'
                : 'Depoda mevcut olan miktar'
            }
          >
            <input
              type="text"
              inputMode="decimal"
              value={form.quantity}
              onChange={(event) => setField('quantity', event.target.value)}
              className={errors.quantity ? errorInputClass : inputClass}
            />
          </ModalField>
        </div>

        <ModalField label="Not">
          <textarea
            rows={3}
            value={form.notes}
            onChange={(event) => setField('notes', event.target.value)}
            placeholder="Raf, tedarikçi veya kullanım notu..."
            className={inputClass}
          />
        </ModalField>
      </form>
    </RepairModal>
  );
}
