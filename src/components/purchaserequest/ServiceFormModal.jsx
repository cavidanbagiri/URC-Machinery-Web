// src/components/purchaserequest/ServiceFormModal.jsx
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
import MachineSearchSelect from './MachineSearchSelect';
import { createServiceRequest } from '../../stores/purchase_request_slice';
import {
  buildServicePayload,
  emptyServiceForm,
  validateServiceForm,
} from '../../utils/purchaseRequest';

export default function ServiceFormModal({ open, onClose, onSaved }) {
  const dispatch = useDispatch();
  const mutating = useSelector((s) => s.purchaseRequest.mutating);

  const [form, setForm] = useState(emptyServiceForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setForm(emptyServiceForm());
    setErrors({});
  }, [open]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const handleSubmit = async (event) => {
    event?.preventDefault?.();
    if (mutating) return;

    const result = validateServiceForm(form);
    setErrors(result.errors);
    if (!result.valid) return;

    try {
      await dispatch(createServiceRequest(buildServicePayload(form))).unwrap();
      toast.success('Servis/hizmet talebi oluşturuldu');
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(String(err || 'Servis/hizmet talebi oluşturulamadı'));
    }
  };

  return (
    <RepairModal
      open={open}
      onClose={onClose}
      title="Yeni Servis / Hizmet Talebi"
      subtitle="Servis formu ile firmadan alınacak hizmeti kaydedin"
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ModalField label="Servis Form Başlığı *" error={errors.title}>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="Örn. Vinç periyodik bakım"
              className={errors.title ? errorInputClass : inputClass}
            />
          </ModalField>

          <ModalField label="Servis Form No *" error={errors.service_form_no}>
            <input
              type="text"
              value={form.service_form_no}
              onChange={(e) => setField('service_form_no', e.target.value)}
              placeholder="Örn. SRV-2026-008"
              className={errors.service_form_no ? errorInputClass : inputClass}
            />
          </ModalField>

          <div className="sm:col-span-2">
            <ModalField label="Makine (ID No) *" error={errors.machine}>
              <MachineSearchSelect
                value={form.machine}
                onChange={(machine) => setField('machine', machine)}
                hasError={Boolean(errors.machine)}
              />
            </ModalField>
          </div>

          <ModalField label="Hizmet Alınacak Firma *" error={errors.company_name}>
            <input
              type="text"
              value={form.company_name}
              onChange={(e) => setField('company_name', e.target.value)}
              className={errors.company_name ? errorInputClass : inputClass}
            />
          </ModalField>

          <ModalField label="Talep Tarihi *" error={errors.request_date}>
            <input
              type="date"
              value={form.request_date}
              onChange={(e) => setField('request_date', e.target.value)}
              className={errors.request_date ? errorInputClass : inputClass}
            />
          </ModalField>

          <div className="sm:col-span-2">
            <ModalField label="Hizmet Tanımı *" error={errors.service_description}>
              <textarea
                rows={4}
                value={form.service_description}
                onChange={(e) => setField('service_description', e.target.value)}
                placeholder="Yapılacak işin kapsamı, parça dahil/hariç bilgisi..."
                className={`${errors.service_description ? errorInputClass : inputClass} resize-y`}
              />
            </ModalField>
          </div>
        </div>
      </form>
    </RepairModal>
  );
}
