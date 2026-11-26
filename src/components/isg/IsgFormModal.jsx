// src/components/isg/IsgFormModal.jsx
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
import {
  createIsgItem,
  fetchIsgResponsibles,
  updateIsgItem,
} from '../../stores/isg_slice';
import { fetchLookupIfNeeded } from '../../stores/lookup_slice';
import {
  ISG_SEVERITY_DEFAULT,
  ISG_SEVERITY_OPTIONS,
  ISG_STATUS_OPTIONS,
  todayIso,
} from '../../utils/isg';

//: Mirrors MAX_DESCRIPTION_LENGTH in models/isg_model.py.
const MAX_DESCRIPTION_LENGTH = 2000;

function emptyForm() {
  return {
    record_date: todayIso(),
    description: '',
    territory_id: '',
    responsible_name: '',
    status: 'acik',
    severity: ISG_SEVERITY_DEFAULT,
  };
}

function formFromItem(item) {
  return {
    ...emptyForm(),
    record_date: item?.record_date || todayIso(),
    description: item?.description || '',
    territory_id: item?.territory_id ? String(item.territory_id) : '',
    responsible_name: item?.responsible_name || '',
    status: item?.status || 'acik',
    severity: item?.severity || ISG_SEVERITY_DEFAULT,
  };
}

export default function IsgFormModal({ open, item, onClose, onSaved }) {
  const dispatch = useDispatch();
  const saving = useSelector((s) => s.isg.saving);
  const territories = useSelector((s) => s.lookup.data.territory || []);
  const responsibles = useSelector((s) => s.isg.responsibles);

  // The page remounts this dialog (`key`) every time it opens, so the seeded
  // state below is always the row that was clicked — no syncing effect.
  const [form, setForm] = useState(() => formFromItem(item));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    dispatch(fetchLookupIfNeeded('territory'));
    dispatch(fetchIsgResponsibles());
  }, [open, dispatch]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.record_date) nextErrors.record_date = 'Tarihi seçin';
    if (!form.description.trim()) nextErrors.description = 'Açıklamayı girin';
    if (!form.severity) nextErrors.severity = 'Önem derecesini seçin';
    if (!form.territory_id) nextErrors.territory_id = 'Şantiye seçin';
    if (!form.responsible_name) nextErrors.responsible_name = 'Sorumlu seçin';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      record_date: form.record_date,
      description: form.description.trim(),
      territory_id: Number(form.territory_id),
      responsible_name: form.responsible_name,
      status: form.status,
      severity: form.severity,
    };

    try {
      if (item) {
        await dispatch(
          updateIsgItem({ itemId: item.id, payload })
        ).unwrap();
        toast.success('ISG kaydı güncellendi');
      } else {
        await dispatch(createIsgItem(payload)).unwrap();
        toast.success('ISG kaydı oluşturuldu');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(String(err || 'ISG kaydı kaydedilemedi'));
    }
  };

  return (
    <RepairModal
      open={open}
      onClose={onClose}
      title={item ? 'ISG Kaydını Düzenle' : 'Yeni Uygunsuzluk'}
      subtitle="Tarih, açıklama, önem, durum, şantiye ve sorumlu"
      footer={
        <>
          <SecondaryButton onClick={onClose} disabled={saving}>
            Vazgeç
          </SecondaryButton>
          <PrimaryButton type="button" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </PrimaryButton>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <section>
          <h3 className="mb-3 border-b border-gray-100 pb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Uygunsuzluk Bilgileri
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ModalField label="Tarih *" error={errors.record_date}>
              <input
                type="date"
                value={form.record_date}
                onChange={(e) => handleChange('record_date', e.target.value)}
                className={errors.record_date ? errorInputClass : inputClass}
              />
            </ModalField>

            <ModalField
              label="Durum *"
              hint="Kapalı kayıtta kapanış kanıtı istenir"
            >
              <select
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className={inputClass}
              >
                {ISG_STATUS_OPTIONS.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
            </ModalField>

            <ModalField
              label="Önem Derecesi *"
              hint="Kritik / Önemli / Az Önemli"
              error={errors.severity}
            >
              <select
                value={form.severity}
                onChange={(e) => handleChange('severity', e.target.value)}
                className={errors.severity ? errorInputClass : inputClass}
              >
                {ISG_SEVERITY_OPTIONS.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
            </ModalField>

            <ModalField
              label="Şantiye *"
              hint="Uygunsuzluğun tespit edildiği şantiye"
              error={errors.territory_id}
            >
              <select
                value={form.territory_id}
                onChange={(e) => handleChange('territory_id', e.target.value)}
                className={errors.territory_id ? errorInputClass : inputClass}
              >
                <option value="">Seçin</option>
                {territories.map((territory) => (
                  <option key={territory.id} value={territory.id}>
                    {territory.name}
                  </option>
                ))}
              </select>
            </ModalField>

            <ModalField
              label="Sorumlu *"
              hint="ISG ekibi"
              error={errors.responsible_name}
            >
              <select
                value={form.responsible_name}
                onChange={(e) =>
                  handleChange('responsible_name', e.target.value)
                }
                className={
                  errors.responsible_name ? errorInputClass : inputClass
                }
              >
                <option value="">Seçin</option>
                {responsibles.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </ModalField>
          </div>
        </section>

        <section>
          <ModalField
            label="Açıklama *"
            hint={`${form.description.trim().length}/${MAX_DESCRIPTION_LENGTH} karakter`}
            error={errors.description}
          >
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={5}
              maxLength={MAX_DESCRIPTION_LENGTH}
              placeholder="Uygunsuzluğun tanımı, yeri ve alınması gereken önlem"
              className={`${
                errors.description ? errorInputClass : inputClass
              } resize-y`}
            />
          </ModalField>

          {form.status === 'kapali' && (
            <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-900">
              Kayıt kapalı olarak kaydedilecek. Kapanış kanıtını (PDF veya
              fotoğraf) kaydettikten sonra tablodaki <b>Kanıt</b> sütunundan
              ekleyebilirsiniz.
            </div>
          )}
        </section>
      </form>
    </RepairModal>
  );
}
