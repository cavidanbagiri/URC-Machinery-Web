// src/components/warehouse/ReceiptModal.jsx
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
import { receiveItems } from '../../stores/warehouse_slice';
import {
  buildReceiptPayload,
  emptyReceiptForm,
  formatQuantity,
  validateReceiptForm,
} from '../../utils/warehouse';

export default function ReceiptModal({ open, onClose, rows, onSaved }) {
  const dispatch = useDispatch();
  const mutating = useSelector((s) => s.warehouse.mutating);

  const [form, setForm] = useState(() => emptyReceiptForm(rows));
  const [errors, setErrors] = useState({});
  const [lineErrors, setLineErrors] = useState([]);

  useEffect(() => {
    if (!open) return;
    setForm(emptyReceiptForm(rows));
    setErrors({});
    setLineErrors([]);
  }, [open, rows]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const setLineQuantity = (index, value) => {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line, position) =>
        position === index ? { ...line, quantity: value } : line
      ),
    }));
    setLineErrors((prev) => {
      if (!prev[index]?.quantity) return prev;
      const next = [...prev];
      next[index] = { ...next[index], quantity: '' };
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event?.preventDefault?.();
    if (mutating) return;

    const result = validateReceiptForm(form);
    setErrors(result.errors);
    setLineErrors(result.lineErrors);
    if (!result.valid) return;

    try {
      const payload = await dispatch(
        receiveItems(buildReceiptPayload(form))
      ).unwrap();
      toast.success(
        `${payload.received} kalem depoya alındı${
          payload.created_items
            ? ` · ${payload.created_items} yeni stok kartı`
            : ''
        }`
      );
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(String(err || 'Kalemler depoya alınamadı'));
    }
  };

  return (
    <RepairModal
      open={open}
      onClose={onClose}
      title="Kalemleri Depoya Al"
      subtitle="Gelen miktarlar 'Giriş' hareketi olarak stoğa eklenir"
      maxWidth="max-w-3xl"
      footer={
        <>
          <SecondaryButton onClick={onClose} disabled={mutating}>
            Vazgeç
          </SecondaryButton>
          <PrimaryButton
            type="submit"
            form="receipt-form"
            tone="green"
            disabled={mutating || form.lines.length === 0}
          >
            {mutating ? 'Kaydediliyor...' : 'Depoya Al'}
          </PrimaryButton>
        </>
      }
    >
      <form id="receipt-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ModalField label="Giriş Tarihi *" error={errors.movement_date}>
            <input
              type="date"
              value={form.movement_date}
              onChange={(event) =>
                setField('movement_date', event.target.value)
              }
              className={errors.movement_date ? errorInputClass : inputClass}
            />
          </ModalField>

          <ModalField label="Not">
            <input
              type="text"
              value={form.note}
              onChange={(event) => setField('note', event.target.value)}
              placeholder="İrsaliye no, teslim eden firma..."
              className={inputClass}
            />
          </ModalField>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left">Parça</th>
                <th className="px-3 py-2 text-left">Makine</th>
                <th className="px-3 py-2 text-left">Hedef Kart</th>
                <th className="w-28 px-3 py-2 text-left">Miktar</th>
              </tr>
            </thead>
            <tbody>
              {form.lines.map((line, index) => {
                const row = line.row;
                const rowError = lineErrors[index]?.quantity;

                return (
                  <tr
                    key={line.request_item_id}
                    className="border-t border-gray-100"
                  >
                    <td className="px-3 py-2 align-top">
                      <p className="text-[12px] font-medium text-gray-900">
                        {row.part_number || row.description_tr || '—'}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {row.request_title} · {row.stf_htf_no}
                      </p>
                    </td>
                    <td className="px-3 py-2 align-top text-[12px] text-gray-700">
                      {row.machine_label}
                    </td>
                    <td className="px-3 py-2 align-top text-[12px] text-gray-700">
                      {row.stock_item_id ? (
                        <>
                          <p>{row.stock_item_name}</p>
                          <p className="text-[11px] text-gray-500">
                            Mevcut {formatQuantity(row.stock_item_quantity)}{' '}
                            {row.unit}
                          </p>
                        </>
                      ) : (
                        <span className="text-[11px] text-blue-700">
                          Yeni kart
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={line.quantity}
                        onChange={(event) =>
                          setLineQuantity(index, event.target.value)
                        }
                        className={`${
                          rowError ? errorInputClass : inputClass
                        } px-2 py-1.5 text-[12px]`}
                      />
                      <p className="mt-1 text-[11px] text-gray-500">
                        {row.unit}
                      </p>
                      {rowError && (
                        <p className="mt-0.5 text-[11px] text-red-600">
                          {rowError}
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-[11px] text-gray-500">
          Aynı parça numarasına sahip kalemler mevcut stok kartına eklenir;
          bulunmayanlar için otomatik yeni kart oluşturulur.
        </p>
      </form>
    </RepairModal>
  );
}
