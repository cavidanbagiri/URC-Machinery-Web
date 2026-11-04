// src/components/warehouse/StockMoveModal.jsx
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
import MachineSearchSelect from '../purchaserequest/MachineSearchSelect';
import { createMovement } from '../../stores/warehouse_slice';
import {
  MOVEMENT_IN,
  buildMovementPayload,
  emptyMovementForm,
  formatQuantity,
  previewBalance,
  validateMovementForm,
} from '../../utils/warehouse';

export default function StockMoveModal({
  open,
  onClose,
  item,
  direction,
  onSaved,
}) {
  const dispatch = useDispatch();
  const mutating = useSelector((s) => s.warehouse.mutating);

  const [form, setForm] = useState(emptyMovementForm);
  const [errors, setErrors] = useState({});

  const isEntry = direction === MOVEMENT_IN;

  useEffect(() => {
    if (!open) return;
    setForm(emptyMovementForm());
    setErrors({});
  }, [open, item, direction]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const balance = previewBalance(item, direction, form.quantity);

  const handleSubmit = async (event) => {
    event?.preventDefault?.();
    if (mutating || !item) return;

    const result = validateMovementForm(form, { direction, item });
    setErrors(result.errors);
    if (!result.valid) return;

    try {
      await dispatch(
        createMovement(buildMovementPayload(form, { direction, item }))
      ).unwrap();
      toast.success(isEntry ? 'Giriş kaydedildi' : 'Çıkış kaydedildi');
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(String(err || 'Hareket kaydedilemedi'));
    }
  };

  return (
    <RepairModal
      open={open}
      onClose={onClose}
      title={isEntry ? 'Depoya Giriş' : 'Depodan Çıkış'}
      subtitle={item ? `${item.name} · ${item.unit}` : undefined}
      badge={
        item ? (
          <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600">
            Mevcut {formatQuantity(item.quantity)} {item.unit}
          </span>
        ) : null
      }
      footer={
        <>
          <SecondaryButton onClick={onClose} disabled={mutating}>
            Vazgeç
          </SecondaryButton>
          <PrimaryButton
            type="submit"
            form="stock-move-form"
            tone={isEntry ? 'green' : 'red'}
            disabled={mutating}
          >
            {mutating
              ? 'Kaydediliyor...'
              : isEntry
                ? 'Girişi Kaydet'
                : 'Çıkışı Kaydet'}
          </PrimaryButton>
        </>
      }
    >
      <form
        id="stock-move-form"
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ModalField
            label={isEntry ? 'Giriş Miktarı *' : 'Çıkış Miktarı *'}
            error={errors.quantity}
          >
            <input
              type="text"
              inputMode="decimal"
              value={form.quantity}
              onChange={(event) => setField('quantity', event.target.value)}
              className={errors.quantity ? errorInputClass : inputClass}
            />
          </ModalField>

          <ModalField label="Tarih *" error={errors.movement_date}>
            <input
              type="date"
              value={form.movement_date}
              onChange={(event) =>
                setField('movement_date', event.target.value)
              }
              className={errors.movement_date ? errorInputClass : inputClass}
            />
          </ModalField>
        </div>

        <ModalField
          label={isEntry ? 'Makine (opsiyonel)' : 'Makine / Ekipman'}
          hint={
            isEntry
              ? 'Parçanın alındığı makine biliniyorsa seçin'
              : 'Parçanın kullanıldığı makineyi seçin'
          }
        >
          <MachineSearchSelect
            value={form.machine}
            onChange={(machine) => setField('machine', machine)}
          />
        </ModalField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ModalField label="Belge No" hint="İrsaliye, fatura veya STF/HTF">
            <input
              type="text"
              value={form.document_no}
              onChange={(event) => setField('document_no', event.target.value)}
              className={inputClass}
            />
          </ModalField>

          <ModalField label="Not">
            <input
              type="text"
              value={form.note}
              onChange={(event) => setField('note', event.target.value)}
              className={inputClass}
            />
          </ModalField>
        </div>

        {item && (
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
            <span className="text-gray-600">Kayıt sonrası bakiye</span>
            <span
              className={`font-semibold ${
                balance !== null && balance < 0
                  ? 'text-red-600'
                  : 'text-gray-900'
              }`}
            >
              {balance === null
                ? '—'
                : `${formatQuantity(balance)} ${item.unit}`}
            </span>
          </div>
        )}
      </form>
    </RepairModal>
  );
}
