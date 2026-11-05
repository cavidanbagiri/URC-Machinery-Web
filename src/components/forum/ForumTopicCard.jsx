// src/components/forum/ForumTopicCard.jsx
import { useRef } from 'react';
import {
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PhotoIcon,
  TrashIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';

import ForumAvatar from './ForumAvatar';
import ForumCommentComposer from './ForumCommentComposer';
import ForumCommentList from './ForumCommentList';
import ForumPhoto from './ForumPhoto';
import { formatPersonName } from '../../utils/formatName';
import { relativeTime } from '../../utils/forum';
import { formatDateTime } from '../../utils/repair';

function StatusPill({ resolved }) {
  if (resolved) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-100">
        <CheckCircleIcon className="h-3 w-3" />
        Çözüldü
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-100">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Açık
    </span>
  );
}

function AddPhotoButton({ onAdd, busy = false }) {
  const inputRef = useRef(null);

  return (
    <div className="shrink-0">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="inline-flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-gray-300 text-[11px] font-medium text-gray-500 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? (
          <ArrowPathIcon className="h-5 w-5 animate-spin text-blue-500" />
        ) : (
          <PhotoIcon className="h-5 w-5" />
        )}
        Fotoğraf ekle
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => {
          const file = event.target.files?.[0];
          // Allow picking the same file again after a failed upload.
          event.target.value = '';
          if (file) onAdd?.(file);
        }}
        className="hidden"
      />
    </div>
  );
}

export default function ForumTopicCard({
  topic,
  canManage = false,
  expanded = false,
  onToggleComments,
  onComment,
  onResolve,
  onReopen,
  onDelete,
  onDeletePhoto,
  onAddPhoto,
  commenting = false,
  resolving = false,
  deleting = false,
  photoBusy = null,
}) {
  const photos = topic.photos || [];
  const comments = topic.comments || [];
  const commentCount = topic.comments_count ?? comments.length;

  const handleComment = async (body) => {
    const saved = await onComment?.(topic, body);
    return saved !== false;
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      {/* ---------- AUTHOR ---------- */}
      <header className="flex flex-wrap items-start gap-3 border-b border-gray-100 px-5 py-4">
        <ForumAvatar name={topic.author_name} size="lg" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-gray-900">
              {formatPersonName(topic.author_name) || 'Bilinmeyen kullanıcı'}
            </p>
            {topic.author_position && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                {topic.author_position}
              </span>
            )}
            <StatusPill resolved={topic.is_resolved} />
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-500">
            <span title={formatDateTime(topic.created_at)}>
              {relativeTime(topic.created_at)}
            </span>
            {topic.machine_label && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-700">
                <TruckIcon className="h-3 w-3" />
                {topic.machine_label}
              </span>
            )}
            {topic.plate_no && topic.plate_no !== topic.machine_label && (
              <span className="rounded-full bg-gray-50 px-2 py-0.5 text-gray-500">
                {topic.plate_no}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {canManage && (topic.is_resolved ? (
            <button
              type="button"
              onClick={() => onReopen?.(topic)}
              disabled={resolving}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-[11px] font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              title="Konuyu yeniden aç"
            >
              {resolving ? (
                <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ArrowUturnLeftIcon className="h-3.5 w-3.5" />
              )}
              Yeniden aç
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onResolve?.(topic)}
              disabled={resolving}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              title="Konuyu çözüldü olarak işaretle"
            >
              {resolving ? (
                <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircleIcon className="h-3.5 w-3.5" />
              )}
              Çözüldü
            </button>
          ))}

          {canManage && (
            <button
              type="button"
              onClick={() => onDelete?.(topic)}
              disabled={deleting}
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              title="Konuyu sil"
              aria-label="Konuyu sil"
            >
              {deleting ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <TrashIcon className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </header>

      {/* ---------- MESSAGE ---------- */}
      <div className="px-5 py-4">
        <h3 className="break-words text-base font-semibold text-gray-900">
          {topic.title}
        </h3>
        <p className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-gray-700">
          {topic.body}
        </p>

        {(photos.length > 0 || (canManage && !topic.is_resolved)) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {photos.map((photo) => (
              <ForumPhoto
                key={photo.id}
                topicId={topic.id}
                photo={photo}
                canDelete={canManage && !topic.is_resolved}
                deleting={
                  photoBusy?.action === 'delete' &&
                  photoBusy?.photoId === photo.id
                }
                onDelete={(target) => onDeletePhoto?.(topic, target)}
              />
            ))}

            {canManage && !topic.is_resolved && (
              <AddPhotoButton
                busy={photoBusy?.action === 'upload'}
                onAdd={(file) => onAddPhoto?.(topic, file)}
              />
            )}
          </div>
        )}

        {topic.is_resolved && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-emerald-800">
              <CheckCircleIcon className="h-4 w-4" />
              Konu çözüldü olarak kapatıldı
              {topic.resolved_by_name && (
                <span className="font-normal text-emerald-700">
                  · {formatPersonName(topic.resolved_by_name)}
                </span>
              )}
              {topic.resolved_at && (
                <span className="font-normal text-emerald-700">
                  · {relativeTime(topic.resolved_at)}
                </span>
              )}
            </div>
            {topic.resolution_note && (
              <p className="mt-1.5 whitespace-pre-line break-words text-sm text-emerald-900">
                {topic.resolution_note}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ---------- COMMENTS ---------- */}
      <footer className="border-t border-gray-100 bg-gray-50/70 px-5 py-2.5">
        <button
          type="button"
          onClick={() => onToggleComments?.(topic.id)}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-gray-600 transition hover:bg-white hover:text-blue-700"
          aria-expanded={expanded}
          title={expanded ? 'Yorumları gizle' : 'Yorumları göster'}
        >
          <ChatBubbleLeftRightIcon className="h-4 w-4" />
          Yorumlar ({commentCount})
          {expanded ? (
            <ChevronUpIcon className="h-3.5 w-3.5" />
          ) : (
            <ChevronDownIcon className="h-3.5 w-3.5" />
          )}
        </button>
      </footer>

      {expanded && (
        <div className="space-y-3 border-t border-gray-100 bg-gray-50/40 px-5 py-4">
          <ForumCommentList comments={comments} />

          {topic.is_resolved ? (
            <p className="rounded-lg bg-white px-3 py-2 text-[11px] text-gray-500">
              Konu kapandığı için yeni yorum eklenemez. Yeniden açarak devam
              edebilirsiniz.
            </p>
          ) : (
            <ForumCommentComposer
              onSubmit={handleComment}
              busy={commenting}
            />
          )}
        </div>
      )}
    </article>
  );
}

