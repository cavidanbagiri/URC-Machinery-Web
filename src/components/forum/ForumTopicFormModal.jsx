// src/components/forum/ForumTopicFormModal.jsx
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import RepairModal, {
  ModalField,
  PrimaryButton,
  SecondaryButton,
  errorInputClass,
  inputClass,
} from '../repair/RepairModal';
import {
  clearMachineOptions,
  createForumTopic,
  fetchForumMachineOptions,
  uploadForumPhoto,
} from '../../stores/forum_slice';
import {
  MAX_BODY_LENGTH,
  MAX_PHOTOS,
  MAX_PHOTO_MB,
  MAX_TITLE_LENGTH,
  validatePhotoFile,
} from '../../utils/forum';
import { formatFileSize } from '../../utils/dailyFault';
import { machineLabel } from '../../utils/repair';

function PhotoPicker({ photos, onAddFiles, onRemove, disabled }) {
  const inputRef = useRef(null);

  const handleFiles = (event) => {
    const selected = Array.from(event.target.files || []);
    // Allow picking the same file again after removing it.
    event.target.value = '';

    const accepted = [];
    selected.forEach((file) => {
      if (photos.length + accepted.length >= MAX_PHOTOS) {
        toast.error(`Bir konuya en fazla ${MAX_PHOTOS} fotoğraf eklenebilir`);
        return;
      }
      const validationError = validatePhotoFile(file);
      if (validationError) {
        toast.error(`${file.name}: ${validationError}`);
        return;
      }
      accepted.push(file);
    });

    if (accepted.length > 0) onAddFiles(accepted);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || photos.length >= MAX_PHOTOS}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PhotoIcon className="h-4 w-4" />
          Fotoğraf ekle
        </button>
        <span className="text-[11px] text-gray-400">
          {photos.length} / {MAX_PHOTOS} · JPEG, PNG veya WEBP · en fazla{' '}
          {MAX_PHOTO_MB} MB
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFiles}
        className="hidden"
      />

      {photos.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {photos.map((photo, index) => (
            <li
              key={photo.url}
              className="relative h-20 w-20 overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
            >
              <img
                src={photo.url}
                alt={photo.file.name}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(index)}
                disabled={disabled}
                className="absolute right-1 top-1 rounded-full bg-white/90 p-0.5 text-gray-600 shadow-sm transition hover:text-red-600 disabled:opacity-50"
                title={`${photo.file.name} (${formatFileSize(photo.file.size)})`}
                aria-label={`${photo.file.name} fotoğrafını kaldır`}
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


export default function ForumTopicFormModal({ open, onClose, onSaved }) {
  const dispatch = useDispatch();
  const mutating = useSelector((s) => s.forum.mutating);
  const machineOptions = useSelector((s) => s.forum.machineOptions);

  const [form, setForm] = useState({ title: '', body: '' });
  const [errors, setErrors] = useState({});
  // [{ file, url }] — the object URL is created once and revoked on removal.
  const [photos, setPhotos] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [machineSearch, setMachineSearch] = useState('');

  const photosRef = useRef([]);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    // The page remounts this modal with a fresh key on every open, so only the
    // cleanup of the preview URLs is needed here.
    return () => {
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.url));
    };
  }, []);

  useEffect(() => {
    if (!open) dispatch(clearMachineOptions());
  }, [open, dispatch]);

  const addPhotos = (files) => {
    setPhotos((previous) => [
      ...previous,
      ...files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    ]);
  };

  const removePhoto = (index) => {
    setPhotos((previous) => {
      const target = previous[index];
      if (target) URL.revokeObjectURL(target.url);
      return previous.filter((_, position) => position !== index);
    });
  };

  useEffect(() => {
    if (!open || selectedMachine) return undefined;
    const timeout = setTimeout(() => {
      dispatch(fetchForumMachineOptions({ search: machineSearch, limit: 20 }));
    }, 300);
    return () => clearTimeout(timeout);
  }, [open, selectedMachine, machineSearch, dispatch]);

  const handleChange = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    if (errors[key]) setErrors((previous) => ({ ...previous, [key]: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = 'Başlık zorunludur';
    if (!form.body.trim()) nextErrors.body = 'Konu açıklaması zorunludur';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    let topic;
    try {
      topic = await dispatch(
        createForumTopic({
          title: form.title.trim(),
          body: form.body.trim(),
          machine_id: selectedMachine ? Number(selectedMachine.id) : null,
        })
      ).unwrap();
    } catch (err) {
      toast.error(String(err || 'Konu açılamadı'));
      return;
    }

    // The topic exists now; a failing photo must not hide that fact.
    const failed = [];
    for (const photo of photos) {
      try {
        await dispatch(
          uploadForumPhoto({ topicId: topic.id, file: photo.file })
        ).unwrap();
      } catch {
        failed.push(photo.file.name);
      }
    }

    if (failed.length > 0) {
      toast.error(
        `Konu açıldı ancak şu fotoğraflar yüklenemedi: ${failed.join(', ')}`
      );
    } else {
      toast.success('Konu açıldı');
    }

    onSaved?.();
    onClose();
  };

  return (
    <RepairModal
      open={open}
      onClose={onClose}
      title="Yeni Forum Konusu"
      subtitle="Arızayı, ihtiyacı veya soruyu fotoğrafla birlikte paylaşın"
      maxWidth="max-w-3xl"
      footer={
        <>
          <SecondaryButton onClick={onClose} disabled={mutating}>
            Vazgeç
          </SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={handleSubmit}
            disabled={mutating}
          >
            {mutating ? 'Yayınlanıyor...' : 'Konuyu Yayınla'}
          </PrimaryButton>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <ModalField
          label="Başlık *"
          hint={`${form.title.length} / ${MAX_TITLE_LENGTH}`}
          error={errors.title}
        >
          <input
            type="text"
            value={form.title}
            onChange={(event) => handleChange('title', event.target.value)}
            placeholder="Örn. Sol ön lastik patladı, yedek parça acil"
            className={errors.title ? errorInputClass : inputClass}
            maxLength={MAX_TITLE_LENGTH}
            autoFocus
          />
        </ModalField>

        <ModalField
          label="Açıklama *"
          hint={`${form.body.length} / ${MAX_BODY_LENGTH} · satır atlayabilirsiniz`}
          error={errors.body}
        >
          <textarea
            rows={6}
            value={form.body}
            onChange={(event) => handleChange('body', event.target.value)}
            placeholder="Ne oldu, hangi parça gerekiyor, hangi makine etkilendi..."
            className={errors.body ? errorInputClass : inputClass}
            maxLength={MAX_BODY_LENGTH}
          />
        </ModalField>

        <section>
          <h3 className="mb-3 border-b border-gray-100 pb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            İlgili makine (opsiyonel)
          </h3>

          {selectedMachine ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {machineLabel(selectedMachine)}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {selectedMachine.plate_no || selectedMachine.vin_no || '—'}
                  {selectedMachine.status_name
                    ? ` · ${selectedMachine.status_name}`
                    : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMachine(null)}
                className="shrink-0 text-xs font-medium text-blue-700 hover:underline"
              >
                Kaldır
              </button>
            </div>
          ) : (
            <div>
              <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={machineSearch}
                  onChange={(event) => setMachineSearch(event.target.value)}
                  placeholder="Makine kimlik no, plaka veya VIN ile ara..."
                  className={`${inputClass} pl-9`}
                />
                {machineOptions.loading && (
                  <ArrowPathIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-blue-500" />
                )}
              </div>

              <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-gray-200">
                {machineOptions.items.length === 0 && (
                  <p className="px-3 py-4 text-center text-xs text-gray-500">
                    {machineOptions.loading
                      ? 'Makineler yükleniyor...'
                      : 'Makine bulunamadı.'}
                  </p>
                )}
                {machineOptions.items.map((machine) => (
                  <button
                    key={machine.id}
                    type="button"
                    onClick={() => {
                      setSelectedMachine(machine);
                      setMachineSearch('');
                    }}
                    className="flex w-full items-center justify-between gap-3 border-b border-gray-100 px-3 py-2 text-left last:border-0 hover:bg-blue-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-gray-900">
                        {machineLabel(machine)}
                      </span>
                      <span className="block truncate text-[11px] text-gray-500">
                        {machine.plate_no || machine.vin_no || '—'}
                      </span>
                    </span>
                    {machine.status_name && (
                      <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                        {machine.status_name}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {machineOptions.error && (
                <p className="mt-1 text-xs text-red-600">
                  {String(machineOptions.error)}
                </p>
              )}
            </div>
          )}
        </section>

        <section>
          <h3 className="mb-3 border-b border-gray-100 pb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Fotoğraflar (opsiyonel)
          </h3>
          <PhotoPicker
            photos={photos}
            onAddFiles={addPhotos}
            onRemove={removePhoto}
            disabled={mutating}
          />
        </section>
      </form>
    </RepairModal>
  );
}


