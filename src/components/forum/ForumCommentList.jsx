// src/components/forum/ForumCommentList.jsx
import ForumAvatar from './ForumAvatar';
import { formatPersonName } from '../../utils/formatName';
import { relativeTime } from '../../utils/forum';
import { formatDateTime } from '../../utils/repair';

export default function ForumCommentList({ comments = [] }) {
  if (comments.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-5 text-center text-xs text-gray-500">
        Henüz yorum yok. İlk yorumu siz yazın.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {comments.map((comment) => (
        <li
          key={comment.id}
          className="flex gap-3 rounded-xl border border-gray-100 bg-white p-3"
        >
          <ForumAvatar name={comment.author_name} size="sm" />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-gray-900">
                {formatPersonName(comment.author_name) || 'Bilinmeyen kullanıcı'}
              </p>
              {comment.author_position && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                  {comment.author_position}
                </span>
              )}
              <span
                className="text-[11px] text-gray-400"
                title={formatDateTime(comment.created_at)}
              >
                {relativeTime(comment.created_at)}
              </span>
            </div>

            <p className="mt-1 whitespace-pre-line break-words text-sm leading-relaxed text-gray-700">
              {comment.body}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
