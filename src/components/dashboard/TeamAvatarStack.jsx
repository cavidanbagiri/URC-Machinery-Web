// src/components/dashboard/TeamAvatarStack.jsx
import { useState } from 'react';
import { useSelector } from 'react-redux';

import FlaticonIcon from '../ui/FlaticonIcon';
import { avatarTone } from '../../utils/forum';
import { buildInitials, formatPersonName } from '../../utils/formatName';

//: How many circles fit in the header before the "+N" chip takes over.
const MAX_VISIBLE = 6;

function memberName(member) {
  return (
    member.full_name ||
    [formatPersonName(member.firstname), formatPersonName(member.lastname)]
      .filter(Boolean)
      .join(' ')
  );
}

function memberTitle(member) {
  return [memberName(member), member.position, member.is_self ? '(siz)' : '']
    .filter(Boolean)
    .join(' · ');
}

/**
 * Team members as overlapping circles in the dashboard header.
 *
 * Data comes from `GET /users/team` (see `fetchTeamMembers`), which the
 * dashboard dispatches: people with a profile photo come first, so the stack
 * looks like a photo row even when some accounts have no picture yet. Every
 * circle overlaps the one before it (`-space-x-2.5`); hovering raises a circle
 * above its neighbours without moving the row.
 */
export default function TeamAvatarStack({ className = '' }) {
  const { team = [], teamTotal = 0, teamLoading = false } = useSelector(
    (state) => state.auth
  );
  // A photo can 404 (deleted object, expired signed URL): fall back to
  // initials. Tracked per URL so a freshly uploaded photo is retried.
  const [failedUrls, setFailedUrls] = useState([]);

  const markFailed = (url) =>
    setFailedUrls((previous) =>
      previous.includes(url) ? previous : [...previous, url]
    );

  if (teamLoading && team.length === 0) {
    return (
      <div
        className={`flex items-center -space-x-2.5 ${className}`}
        aria-hidden="true"
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <span
            key={index}
            className="h-9 w-9 animate-pulse rounded-full bg-gray-100 ring-2 ring-white"
          />
        ))}
      </div>
    );
  }

  if (team.length === 0) return null;

  const visible = team.slice(0, MAX_VISIBLE);
  const restCount = Math.max((teamTotal || team.length) - visible.length, 0);

  return (
    <div
      className={`flex items-center -space-x-2.5 ${className}`}
      role="group"
      aria-label={`Ekip: ${teamTotal || team.length} kullanıcı`}
    >
      {visible.map((member) => {
        const name = memberName(member) || 'Kullanıcı';
        const hasPhoto = Boolean(member.image_url) && !failedUrls.includes(member.image_url);

        return (
          <span
            key={member.id}
            title={memberTitle(member)}
            className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-2 ring-white shadow-sm transition duration-150 ease-out hover:z-10 hover:-translate-y-1 hover:shadow-md"
          >
            {hasPhoto ? (
              <img
                src={member.image_url}
                alt={name}
                loading="lazy"
                onError={() => markFailed(member.image_url)}
                className="h-full w-full object-cover"
              />
            ) : (
              <span
                className={`flex h-full w-full items-center justify-center text-[11px] font-semibold ${avatarTone(
                  name
                )}`}
              >
                {buildInitials(member.firstname, member.lastname) || (
                  <FlaticonIcon name="user" size="sm" />
                )}
              </span>
            )}

            {member.is_self && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-white"
              />
            )}
          </span>
        );
      })}

      {restCount > 0 && (
        <span
          title={`${restCount} kişi daha`}
          className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-gray-600 ring-2 ring-white shadow-sm"
        >
          +{restCount}
        </span>
      )}
    </div>
  );
}
