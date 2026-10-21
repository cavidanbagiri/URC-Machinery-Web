// src/components/machines/MachinePhotoGallery.jsx
import { Fragment, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';

import FlaticonIcon from '../ui/FlaticonIcon';
import {
  deleteMachinePhoto,
  fetchMachinePhotos,
  setPrimaryMachinePhoto,
  uploadMachinePhoto,
} from '../../stores/machine_slice';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_UPLOAD_MB = 10;

const messageOf = (err, fallback) =>
  typeof err === 'string' ? err : err?.message || fallback;

/**
 * Machine photo gallery used inside MachineDetailModal.
 *
 * Uploads/deletes go through the API (Cloud.ru S3); after every mutation the
 * list is re-read from the server so `is_primary` promotion stays in sync.
 */
export default function MachinePhotoGallery({ machineId, photos = [], onChange }) {
  const dispatch = useDispatch();
  const inputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [busyPhotoId, setBusyPhotoId] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // A photo may disappear while the lightbox is open: clamp without an effect.
  const activeIndex =
    lightboxIndex !== null && lightboxIndex < photos.length
      ? lightboxIndex
      : null;

  const refresh = async () => {
    const fresh = await dispatch(fetchMachinePhotos(machineId)).unwrap();
    onChange?.(fresh);
    return fresh;
  };

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(
          'Yalnızca JPEG, PNG veya WEBP formatındaki fotoğraflar yüklenebilir'
        );
        return;
      }
      if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
        toast.error(`Dosya çok büyük (en fazla ${MAX_UPLOAD_MB} MB)`);
        return;
      }
    }

    setUploading(true);
    try {
      for (const file of files) {
        await dispatch(uploadMachinePhoto({ machineId, file })).unwrap();
      }
      toast.success(
        files.length > 1
          ? `${files.length} fotoğraf yüklendi`
          : 'Fotoğraf yüklendi'
      );
    } catch (err) {
      toast.error(messageOf(err, 'Fotoğraf yüklenemedi'));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
      // Re-read after both success and partial failure.
      await refresh().catch(() => {});
    }
  };

  const handleSetPrimary = async (photo) => {
    setBusyPhotoId(photo.id);
    try {
      await dispatch(setPrimaryMachinePhoto(photo.id)).unwrap();
      await refresh();
      toast.success('Ana fotoğraf güncellendi');
    } catch (err) {
      toast.error(messageOf(err, 'Ana fotoğraf güncellenemedi'));
    } finally {
      setBusyPhotoId(null);
    }
  };

  const handleDelete = async (photo) => {
    if (!window.confirm('Bu fotoğrafı silmek istediğinize emin misiniz?')) return;

    setBusyPhotoId(photo.id);
    try {
      await dispatch(deleteMachinePhoto(photo.id)).unwrap();
      setLightboxIndex(null);
      await refresh();
      toast.success('Fotoğraf silindi');
    } catch (err) {
      toast.error(messageOf(err, 'Fotoğraf silinemedi'));
    } finally {
      setBusyPhotoId(null);
    }
  };

  const activePhoto = activeIndex === null ? null : photos[activeIndex];

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!uploading) handleFiles(event.dataTransfer.files);
      }}
      className={`rounded-xl border border-dashed p-3 transition ${
        dragging ? 'border-blue-400 bg-blue-50' : 'border-transparent'
      }`}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
          >
            <button
              type="button"
              onClick={() => setLightboxIndex(index)}
              className="block h-full w-full cursor-zoom-in"
              title="Büyüt"
            >
              {photo.url ? (
                <img
                  src={photo.url}
                  alt={photo.original_filename || 'Makine fotoğrafı'}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-gray-300">
                  <FlaticonIcon name="picture" size="2xl" />
                </span>
              )}
            </button>

            {photo.is_primary && (
              <span className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-amber-500/95 px-2 py-0.5 text-[11px] font-medium text-white shadow">
                <FlaticonIcon name="star" size="xs" />
                Ana
              </span>
            )}

            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
              {!photo.is_primary && (
                <button
                  type="button"
                  onClick={() => handleSetPrimary(photo)}
                  disabled={busyPhotoId !== null}
                  title="Ana fotoğraf yap"
                  aria-label="Ana fotoğraf yap"
                  className="rounded-md bg-white/90 p-1.5 text-gray-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FlaticonIcon name="star" size="sm" />
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDelete(photo)}
                disabled={busyPhotoId !== null}
                title="Fotoğrafı sil"
                aria-label="Fotoğrafı sil"
                className="rounded-md bg-white/90 p-1.5 text-red-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FlaticonIcon name="trash" size="sm" />
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 transition hover:border-gray-400 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? (
            <FlaticonIcon name="refresh" size="2xl" className="animate-spin" />
          ) : (
            <FlaticonIcon name="add-image" size="2xl" />
          )}
          <span className="text-xs font-medium">
            {uploading ? 'Yükleniyor...' : 'Fotoğraf Ekle'}
          </span>
          <span className="text-[11px] text-gray-400">
            JPEG, PNG, WEBP · max {MAX_UPLOAD_MB} MB
          </span>
        </button>
      </div>

      {photos.length === 0 && (
        <p className="mt-2 text-xs text-gray-400">
          Henüz fotoğraf eklenmemiş. Dosyaları buraya sürükleyebilirsiniz.
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        multiple
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />

      <Transition show={activePhoto !== null} as={Fragment}>
        <Dialog
          onClose={() => setLightboxIndex(null)}
          className="relative z-[60]"
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="flex w-full max-w-4xl flex-col items-center">
                <Dialog.Title className="sr-only">
                  Makine fotoğrafı
                </Dialog.Title>

                {activePhoto?.url && (
                  <img
                    src={activePhoto.url}
                    alt={activePhoto.original_filename || 'Makine fotoğrafı'}
                    className="max-h-[80vh] w-auto rounded-lg object-contain shadow-2xl"
                  />
                )}

                <div className="mt-3 flex items-center gap-3 text-white">
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxIndex((current) =>
                        photos.length
                          ? (current - 1 + photos.length) % photos.length
                          : null
                      )
                    }
                    disabled={photos.length < 2}
                    aria-label="Önceki fotoğraf"
                    className="rounded-lg bg-white/10 p-2 transition hover:bg-white/20 disabled:opacity-30"
                  >
                    <FlaticonIcon name="angle-left" size="lg" />
                  </button>
                  <span className="text-sm tabular-nums">
                    {activeIndex + 1} / {photos.length}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxIndex((current) =>
                        photos.length ? (current + 1) % photos.length : null
                      )
                    }
                    disabled={photos.length < 2}
                    aria-label="Sonraki fotoğraf"
                    className="rounded-lg bg-white/10 p-2 transition hover:bg-white/20 disabled:opacity-30"
                  >
                    <FlaticonIcon name="angle-right" size="lg" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(null)}
                    className="ml-3 rounded-lg bg-white/10 px-3 py-1.5 text-sm transition hover:bg-white/20"
                  >
                    Kapat
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
