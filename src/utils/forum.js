// src/utils/forum.js
import { formatDateTime } from './repair';

/** Must match MAX_PHOTO_BYTES in server/models/forum_model.py. */
export const MAX_PHOTO_MB = 5;
/** Must match MAX_PHOTOS_PER_TOPIC in server/models/forum_model.py. */
export const MAX_PHOTOS = 6;
/** Must match MAX_TITLE_LENGTH / MAX_BODY_LENGTH / MAX_COMMENT_LENGTH. */
export const MAX_TITLE_LENGTH = 160;
export const MAX_BODY_LENGTH = 4000;
export const MAX_COMMENT_LENGTH = 2000;
export const MAX_RESOLUTION_LENGTH = 1000;

/** Status tabs of the page; ``key`` is sent to ``GET /forum/topics``. */
export const FORUM_STATUS_FILTERS = [
  { key: 'all', label: 'Tümü' },
  { key: 'open', label: 'Açık' },
  { key: 'resolved', label: 'Çözüldü' },
];

const AVATAR_TONES = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-violet-100 text-violet-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
];

function hashString(value) {
  let hash = 0;
  const text = String(value || '');
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) % 100000;
  }
  return hash;
}

/** Deterministic avatar colour so a person keeps the same tone everywhere. */
export function avatarTone(seed) {
  return AVATAR_TONES[hashString(seed) % AVATAR_TONES.length];
}

/** "ilyas haqverdiyev" -> "İH" (Turkish casing, like the rest of the UI). */
export function initialsFromName(name) {
  const words = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) {
    return words[0].charAt(0).toLocaleUpperCase('tr-TR');
  }
  return `${words[0].charAt(0)}${words[words.length - 1].charAt(0)}`.toLocaleUpperCase(
    'tr-TR'
  );
}

/** "5 dk önce", "3 saat önce", ... falling back to the full date. */
export function relativeTime(value) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return formatDateTime(value);

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'az önce';
  if (minutes < 60) return `${minutes} dk önce`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} gün önce`;

  return formatDateTime(value);
}

export function isImageFile(file) {
  if (!file) return false;
  const name = (file.name || '').toLowerCase();
  if (!/\.(jpe?g|png|webp)$/.test(name)) return false;

  const type = (file.type || '').toLowerCase();
  return (
    type === '' ||
    type === 'application/octet-stream' ||
    type === 'image/jpeg' ||
    type === 'image/jpg' ||
    type === 'image/png' ||
    type === 'image/webp'
  );
}

export function validatePhotoFile(file) {
  if (!isImageFile(file)) {
    return 'Sadece JPEG, PNG veya WEBP fotoğraf yükleyebilirsiniz';
  }
  if (!file.size) return 'Boş dosya yüklenemez';
  if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
    return `Fotoğraf boyutu en fazla ${MAX_PHOTO_MB} MB olabilir`;
  }
  return null;
}

/** Statuses 1-3 may write (see server/core/permissions.py). */
export function canWriteForum(statusId) {
  return [1, 2, 3].includes(Number(statusId));
}
