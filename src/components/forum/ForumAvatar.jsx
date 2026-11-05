// src/components/forum/ForumAvatar.jsx
import { avatarTone, initialsFromName } from '../../utils/forum';

const SIZES = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-11 w-11 text-sm',
};

/**
 * Initials avatar built from the person's name. Profile photos live in S3 and
 * would need one signed URL per author, so the forum uses initials instead.
 */
export default function ForumAvatar({ name = '', size = 'md', className = '' }) {
  const initials = initialsFromName(name);

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-white ${
        SIZES[size] || SIZES.md
      } ${avatarTone(name)} ${className}`}
    >
      {initials || '?'}
    </span>
  );
}
