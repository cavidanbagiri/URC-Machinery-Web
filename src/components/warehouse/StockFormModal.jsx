// src/components/warehouse/StockFormModal.jsx
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
import { fetchLookupIfNeeded } from '../../stores/lookup_slice';
import { createStockItem, updateStockItem } from '../../stores/warehouse_slice';
import {
  UNIT_OPTIONS,
  buildStockPayload,
  emptyStockForm,
  stockFormFromItem,
  validateStockForm,
} from '../../utils/warehouse';

export default function StockFormModal({ open, onClose, item, onSaved }) {
  const dispatch = useDispatch();
  const mutating = useSelector((s) => s.warehouse.mutating);
  const territories = useSelector((s) => s.lookup.data.territory || []);

  const [form, setForm] = useState(emptyStockForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    dispatch(fetchLookupIfNeeded('territory'));
    setForm(stockFormFromItem(item));
    setErrors({});
  }, [open, item, dispatch]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const handleSubmit = async (event) => {
    event?.preventDefault?.();
    if (mutating) return;

    const result = validateStockForm(form);
    setErrors(result.errors);
    if (!result.valid) return;

    const payload = buildStockPayload(form);

    try {
      if (item) {
        await dispatch(updateStockItem({ itemId: item.id, payload })).unwrap();
        toast.success('Stok kartı güncellendi');
      } else {
        await dispatch(createStockItem(payload)).unwrap();
        toast.success('Stok kartı oluşturuldu');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(String(err || 'Stok kartı kaydedilemedi'));
    }
  };

  return (
    <RepairModal
      open={open}
      onClose={onClose}
      title={item ? 'Stok Kartını Düzenle' : 'Yeni Stok Kartı'}
      subtitle={
        item
          ? 'Miktar yalnızca giriş/çıkış hareketleriyle değişir'
          : 'Kritik seviye, kartın "Kritik Stok" sayılacağı miktardır'
      }
      footer={
        <>
          <SecondaryButton onClick={onClose} disabled={mutating}>
            Vazgeç
          </SecondaryButton>
          <PrimaryButton type="submit" form="stock-form" disabled={mutating}>
            {mutating ? 'Kaydediliyor...' : item ? 'Güncelle' : 'Kaydet'}
          </PrimaryButton>
        </>
      }
    >
      <form id="stock-form" onSubmit={handleSubmit} className="space-y-4">
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

          <ModalField label="Parça No" hint="Boş bırakılabilir">
            <input
              type="text"
              value={form.part_number}
              onChange={(event) => setField('part_number', event.target.value)}
              placeholder="6CT-001"
              className={inputClass}
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
            label="Kritik Seviye *"
            error={errors.min_quantity}
            hint="Bu miktara düşünce kart kritik olarak işaretlenir"
          >
            <input
              type="text"
              inputMode="decimal"
              value={form.min_quantity}
              onChange={(event) => setField('min_quantity', event.target.value)}
              className={errors.min_quantity ? errorInputClass : inputClass}
            />
          </ModalField>

          <ModalField label="Bölge">
            <select
              value={form.territory_id}
              onChange={(event) => setField('territory_id', event.target.value)}
              className={inputClass}
            >
              <option value="">Seçilmedi</option>
              {territories.map((territory) => (
                <option key={territory.id} value={territory.id}>
                  {territory.name}
                </option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Raf / Göz">
            <input
              type="text"
              value={form.location}
              onChange={(event) => setField('location', event.target.value)}
              placeholder="A-12"
              className={inputClass}
            />
          </ModalField>

          <ModalField label="Açıklama (TR)">
            <input
              type="text"
              value={form.description_tr}
              onChange={(event) =>
                setField('description_tr', event.target.value)
              }
              className={inputClass}
            />
          </ModalField>

          <ModalField label="Açıklama (RU)">
            <input
              type="text"
              value={form.description_ru}
              onChange={(event) =>
                setField('description_ru', event.target.value)
              }
              className={inputClass}
            />
          </ModalField>
        </div>

        <ModalField label="Not">
          <textarea
            rows={2}
            value={form.notes}
            onChange={(event) => setField('notes', event.target.value)}
            className={inputClass}
          />
        </ModalField>
      </form>
    </RepairModal>
  );
}
