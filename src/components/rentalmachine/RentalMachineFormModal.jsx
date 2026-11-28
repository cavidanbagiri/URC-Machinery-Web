// src/components/rentalmachine/RentalMachineFormModal.jsx
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
  createRentalMachine,
  updateRentalMachine,
} from '../../stores/rental_machine_slice';
import { fetchLookupIfNeeded } from '../../stores/lookup_slice';

//: Mirrors MAX_*_LENGTH in schemas/rental_machine_schemas.py.
const MAX_NAME_LENGTH = 200;
const MAX_PLATE_LENGTH = 50;

//: The equipment is described with the fleet lookups, so the same vocabulary
//: can be used for the statistics panel and the header filters.  The model is
//: not part of it: the table shows one Marka / Model column fed by the brand.
const EQUIPMENT_LOOKUPS = ['type_transport', 'car_mark'];

function emptyForm() {
  return {
    machine_type_id: '',
    car_mark_id: '',
    plate_no: '',
    company_name: '',
    site_name: '',
    start_date: '',
    end_date: '',
  };
}

function formFromItem(item) {
  return {
    ...emptyForm(),
    machine_type_id: item?.machine_type_id ?? '',
    car_mark_id: item?.car_mark_id ?? '',
    plate_no: item?.plate_no || '',
    company_name: item?.company_name || '',
    site_name: item?.site_name || '',
    start_date: item?.start_date || '',
    end_date: item?.end_date || '',
  };
}

/** Inclusive day count of two ``YYYY-MM-DD`` values (UTC, so no DST drift). */
function dayCount(startDate, endDate) {
  if (!startDate || !endDate) return null;
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  return Math.round((end - start) / 86_400_000) + 1;
}

export default function RentalMachineFormModal({
  open,
  item,
  onClose,
  onSaved,
}) {
  const dispatch = useDispatch();
  const saving = useSelector((s) => s.rentalMachine.saving);
  const lookups = useSelector((s) => s.lookup.data);

  const [form, setForm] = useState(() => formFromItem(item));
  const [errors, setErrors] = useState({});

  // The page remounts this dialog (`key`) every time it opens, so the seeded
  // state above is always the row that was clicked — no effect needed.
  // Only the lookup lists are fetched here (cached across opens).
  useEffect(() => {
    EQUIPMENT_LOOKUPS.forEach((key) => {
      dispatch(fetchLookupIfNeeded(key));
    });
  }, [dispatch]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.machine_type_id) {
      nextErrors.machine_type_id = 'Makine tipini seçin';
    }
    if (!form.company_name.trim()) {
      nextErrors.company_name = 'Firmayı girin';
    }
    if (!form.site_name.trim()) {
      nextErrors.site_name = 'Şantiyeyi girin';
    }
    if (!form.start_date) {
      nextErrors.start_date = 'Başlangıç tarihini seçin';
    }
    if (!form.end_date) {
      nextErrors.end_date = 'Bitiş tarihini seçin';
    }
    if (
      !nextErrors.start_date &&
      !nextErrors.end_date &&
      form.end_date < form.start_date
    ) {
      nextErrors.end_date = 'Bitiş tarihi başlangıçtan önce olamaz';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    // The backend rebuilds `equipment_name` from these fields.
    const payload = {
      machine_type_id: Number(form.machine_type_id),
      car_mark_id: form.car_mark_id ? Number(form.car_mark_id) : null,
      plate_no: form.plate_no.trim() || null,
      company_name: form.company_name.trim(),
      site_name: form.site_name.trim(),
      start_date: form.start_date,
      end_date: form.end_date,
    };

    try {
      if (item) {
        await dispatch(
          updateRentalMachine({ rentalId: item.id, payload })
        ).unwrap();
        toast.success('Kiralama kaydı güncellendi');
      } else {
        await dispatch(createRentalMachine(payload)).unwrap();
        toast.success('Kiralama kaydı oluşturuldu');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(String(err || 'Kiralama kaydı kaydedilemedi'));
    }
  };

  const duration = dayCount(form.start_date, form.end_date);

  return (
    <RepairModal
      open={open}
      onClose={onClose}
      title={item ? 'Kiralama Kaydını Düzenle' : 'Yeni Kiralık Makine'}
      subtitle="Makine tipi, marka, plaka, firma, şantiye ve kiralama tarihleri"
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
            Kiralama Bilgileri
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ModalField
              label="Makine Tipi *"
              hint="İstatistikler bu alana göre gruplanır"
              error={errors.machine_type_id}
            >
              <select
                value={form.machine_type_id}
                onChange={(e) =>
                  handleChange('machine_type_id', e.target.value)
                }
                className={
                  errors.machine_type_id ? errorInputClass : inputClass
                }
              >
                <option value="">Seçin</option>
                {(lookups.type_transport || []).map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </ModalField>

            <ModalField label="Marka" hint="Örn. CAT">
              <select
                value={form.car_mark_id}
                onChange={(e) => handleChange('car_mark_id', e.target.value)}
                className={inputClass}
              >
                <option value="">Seçin</option>
                {(lookups.car_mark || []).map((mark) => (
                  <option key={mark.id} value={mark.id}>
                    {mark.name}
                  </option>
                ))}
              </select>
            </ModalField>

            <ModalField label="Plaka" hint="Plaka yoksa boş bırakın">
              <input
                type="text"
                value={form.plate_no}
                onChange={(e) => handleChange('plate_no', e.target.value)}
                placeholder="Örn. 34 ABC 123"
                className={inputClass}
                maxLength={MAX_PLATE_LENGTH}
              />
            </ModalField>

            <ModalField
              label="Firma *"
              hint="Ekipmanın kiralandığı firma"
              error={errors.company_name}
            >
              <input
                type="text"
                value={form.company_name}
                onChange={(e) => handleChange('company_name', e.target.value)}
                placeholder="Örn. Ustay Kiralama A.Ş."
                className={errors.company_name ? errorInputClass : inputClass}
                maxLength={MAX_NAME_LENGTH}
              />
            </ModalField>

            <ModalField
              label="Şantiye *"
              hint="Ekipmanın çalıştığı şantiye"
              error={errors.site_name}
            >
              <input
                type="text"
                value={form.site_name}
                onChange={(e) => handleChange('site_name', e.target.value)}
                placeholder="Örn. Merkez Şantiye"
                className={errors.site_name ? errorInputClass : inputClass}
                maxLength={MAX_NAME_LENGTH}
              />
            </ModalField>
          </div>
        </section>

        <section>
          <h3 className="mb-3 border-b border-gray-100 pb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Kiralama Tarihleri
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ModalField label="Başlangıç Tarihi *" error={errors.start_date}>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => handleChange('start_date', e.target.value)}
                className={errors.start_date ? errorInputClass : inputClass}
              />
            </ModalField>

            <ModalField label="Bitiş Tarihi *" error={errors.end_date}>
              <input
                type="date"
                value={form.end_date}
                min={form.start_date || undefined}
                onChange={(e) => handleChange('end_date', e.target.value)}
                className={errors.end_date ? errorInputClass : inputClass}
              />
            </ModalField>
          </div>

          <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800">
            Durum (Aktif / Planlandı / Süresi doldu) tarihlere göre otomatik
            hesaplanır.
            {duration !== null && duration > 0 && (
              <span className="ml-1 font-semibold">
                Kiralama süresi: {duration} gün.
              </span>
            )}
          </div>
        </section>
      </form>
    </RepairModal>
  );
}
