// src/components/forum/ForumPhoto.jsx
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowPathIcon,
  PhotoIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import ForumService from '../../services/ForumService';

/**
 * One photo of a topic.
 *
 * The bytes are stored in PostgreSQL behind the API, so an ``<img src>`` cannot
 * carry the bearer token: the blob is fetched with axios and shown through an
 * object URL that is revoked on unmount. Clicking the thumbnail opens a
 * full-screen preview.
 */
export default function ForumPhoto({
  topicId,
  photo,
  canDelete = false,
  onDelete,
  deleting = false,
}) {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = '';

    ForumService.fetchPhoto(topicId, photo.id)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(
          new Blob([blob], { type: photo.content_type || 'image/jpeg' })
        );
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setError('Fotoğraf yüklenemedi');
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [topicId, photo.id, photo.content_type]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <>
      <div className="group relative h-24 w-24 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
        {url ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="block h-full w-full"
            title={photo.file_name}
            aria-label={`${photo.file_name} fotoğrafını büyüt`}
          >
            <img
              src={url}
              alt={photo.file_name}
              className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
              loading="lazy"
            />
          </button>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center text-[10px] text-gray-400">
            {error ? (
              <>
                <PhotoIcon className="h-5 w-5" />
                {error}
              </>
            ) : (
              <ArrowPathIcon className="h-5 w-5 animate-spin text-blue-500" />
            )}
          </div>
        )}

        {canDelete && (
          <button
            type="button"
            onClick={() => onDelete?.(photo)}
            disabled={deleting}
            className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-gray-500 shadow-sm transition hover:bg-white hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            title="Fotoğrafı sil"
            aria-label="Fotoğrafı sil"
          >
            {deleting ? (
              <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <TrashIcon className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>

      {open &&
        url &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-black/80 p-6"
            role="dialog"
            aria-modal="true"
            onClick={() => setOpen(false)}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
              aria-label="Kapat"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <img
              src={url}
              alt={photo.file_name}
              className="max-h-[80vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            />
            <p className="max-w-[90vw] truncate text-xs text-white/80">
              {photo.file_name}
            </p>
          </div>,
          document.body
        )}
    </>
  );
}
