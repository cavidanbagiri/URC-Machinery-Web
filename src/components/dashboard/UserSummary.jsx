// src/components/dashboard/UserSummary.jsx
import { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import FlaticonIcon from '../ui/FlaticonIcon';
import { uploadAvatar } from '../../stores/user_slice';
import { buildFullName, buildInitials, formatPersonName } from '../../utils/formatName';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_UPLOAD_MB = 10;

const messageOf = (err, fallback) =>
  typeof err === 'string' ? err : err?.message || fallback;

export default function UserSummary({ user }) {
  const dispatch = useDispatch();
  const inputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');


  const [failedUrl, setFailedUrl] = useState('');

  if (!user) return null;

  const imageUrl = user?.image_url || '';
  const fullName = buildFullName(user?.firstname, user?.lastname) || 'Kullanıcı';
  const initials = buildInitials(user?.firstname, user?.lastname);

  const position = formatPersonName(user?.position) || user?.email || '';
  const showImage = Boolean(imageUrl) && failedUrl !== imageUrl;

  const resetInput = () => {
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFile = async (file) => {
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Yalnızca JPEG, PNG veya WEBP formatındaki fotoğraflar yüklenebilir');
      resetInput();
      return;
    }

    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setError(`Dosya çok büyük (en fazla ${MAX_UPLOAD_MB} MB)`);
      resetInput();
      return;
    }

    setError('');
    setUploading(true);
    try {
      await dispatch(uploadAvatar(file)).unwrap();
    } catch (err) {
      setError(messageOf(err, 'Fotoğraf yüklenemedi'));
    } finally {
      setUploading(false);
      resetInput();
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white py-2 pl-2 pr-4 shadow-sm">
      <div className="group relative shrink-0">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          title="Profil fotoğrafını değiştir"
          aria-label="Profil fotoğrafını değiştir"
          className={`relative block h-11 w-11 overflow-hidden rounded-full ring-2 ring-gray-100 transition ${
            uploading ? 'cursor-wait' : 'cursor-pointer'
          }`}
        >
          {showImage ? (
            <img
              src={imageUrl}
              alt={fullName}
              loading="lazy"
              onError={() => setFailedUrl(imageUrl)}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-blue-50 text-sm font-semibold text-blue-600">
              {initials || <FlaticonIcon name="user" size="sm" />}
            </span>
          )}

          <span
            aria-hidden="true"
            className={`absolute inset-0 flex items-center justify-center bg-gray-900/55 text-white transition-opacity ${
              uploading
                ? 'opacity-100'
                : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
            }`}
          >
            <FlaticonIcon
              name={uploading ? 'refresh' : 'pencil'}
              size="sm"
              className={uploading ? 'animate-spin' : ''}
            />
          </span>
        </button>

        {/* Touch devices have no hover: keep a small pencil badge visible. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-0.5 -bottom-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-gray-500 shadow ring-1 ring-gray-200 sm:hidden"
        >
          <FlaticonIcon name="pencil" className="text-[9px]" />
        </span>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-900" title={user?.email}>
          {fullName}
        </p>
        {error ? (
          <p className="max-w-[15rem] text-[11px] leading-tight text-red-600">{error}</p>
        ) : (
          position && (
            <p className="truncate text-xs font-light text-gray-500">{position}</p>
          )
        )}
      </div>
    </div>
  );
}


