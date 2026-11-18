// src/components/stock/StockIssueModal.jsx
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
import StockItemSearchSelect from './StockItemSearchSelect';
import { createStockIssue } from '../../stores/stock_slice';
import {
  buildIssuePayload,
  emptyIssueForm,
  formatQuantity,
  previewIssueBalance,
  todayISO,
  validateIssueForm,
} from '../../utils/stock';

export default function StockIssueModal({ open, onClose, item, onSaved }) {
  const dispatch = useDispatch();
  const mutating = useSelector((s) => s.stock.mutating);

  const [form, setForm] = useState(emptyIssueForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setForm({ ...emptyIssueForm(item), issue_date: todayISO() });
    setErrors({});
  }, [open, item]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const balance = previewIssueBalance(form.stock_item, form.quantity);

  const handleSubmit = async (event) => {
    event?.preventDefault?.();
    if (mutating) return;

    const result = validateIssueForm(form);
    setErrors(result.errors);
    if (!result.valid) return;

    try {
      await dispatch(createStockIssue(buildIssuePayload(form))).unwrap();
      toast.success('Sahaya çıkış kaydedildi');
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(String(err || 'Sahaya çıkış kaydedilemedi'));
    }
  };

  return (
    <RepairModal
      open={open}
      onClose={onClose}
      title="Sahaya Çıkış"
      subtitle="Seçilen miktar stok kartından düşülür"
      footer={
        <>
          <SecondaryButton onClick={onClose} disabled={mutating}>
            Vazgeç
          </SecondaryButton>
          <PrimaryButton
            type="submit"
            form="stock-issue-form"
            disabled={mutating}
          >
            {mutating ? 'Kaydediliyor...' : 'Çıkışı Kaydet'}
          </PrimaryButton>
        </>
      }
    >
      <form id="stock-issue-form" onSubmit={handleSubmit} className="space-y-4">
        <ModalField label="Malzeme *" error={errors.stock_item}>
          <StockItemSearchSelect
            value={form.stock_item}
            onChange={(value) => {
              setField('stock_item', value);
              if (errors.quantity) setErrors((prev) => ({ ...prev, quantity: '' }));
            }}
            hasError={Boolean(errors.stock_item)}
            placeholder="Malzeme adı ara..."
          />
        </ModalField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ModalField
            label="Miktar *"
            error={errors.quantity}
            hint={
              form.stock_item
                ? `Mevcut: ${formatQuantity(form.stock_item.quantity)} ${
                    form.stock_item.unit || ''
                  }`.trim()
                : undefined
            }
          >
            <input
              type="text"
              inputMode="decimal"
              value={form.quantity}
              onChange={(event) => setField('quantity', event.target.value)}
              className={errors.quantity ? errorInputClass : inputClass}
            />
            {balance !== null && (
              <p
                className={`mt-1 text-[11px] font-medium ${
                  balance < 0 ? 'text-rose-600' : 'text-gray-500'
                }`}
              >
                Kayıt sonrası kalan: {formatQuantity(balance)}{' '}
                {form.stock_item?.unit || ''}
              </p>
            )}
          </ModalField>

          <ModalField label="Çıkış Tarihi *" error={errors.issue_date}>
            <input
              type="date"
              value={form.issue_date}
              onChange={(event) => setField('issue_date', event.target.value)}
              className={errors.issue_date ? errorInputClass : inputClass}
            />
          </ModalField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ModalField label="Makine" hint="İsteğe bağlı">
            <MachineSearchSelect
              value={form.machine}
              onChange={(value) => setField('machine', value)}
            />
          </ModalField>

          <ModalField label="Kime Verildi" hint="İsteğe bağlı">
            <input
              type="text"
              value={form.given_to}
              onChange={(event) => setField('given_to', event.target.value)}
              placeholder="Ad soyad / ekip"
              className={inputClass}
            />
          </ModalField>
        </div>

        <ModalField label="Not">
          <textarea
            rows={2}
            value={form.note}
            onChange={(event) => setField('note', event.target.value)}
            placeholder="Kullanım yeri veya açıklama..."
            className={inputClass}
          />
        </ModalField>
      </form>
    </RepairModal>
  );
}
