// src/components/forum/ForumCommentComposer.jsx
import { useState } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';

import { MAX_COMMENT_LENGTH } from '../../utils/forum';

export default function ForumCommentComposer({
  onSubmit,
  busy = false,
  disabled = false,
}) {
  const [body, setBody] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const text = body.trim();

    if (!text) {
      setError('Yorum metni zorunludur');
      return;
    }

    const saved = await onSubmit?.(text);
    if (saved !== false) {
      setBody('');
      setError('');
    }
  };

  if (disabled) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        rows={2}
        value={body}
        onChange={(event) => {
          setBody(event.target.value);
          if (error) setError('');
        }}
        placeholder="Konuya yorum yazın..."
        maxLength={MAX_COMMENT_LENGTH}
        disabled={busy}
        className={`w-full resize-y rounded-lg border px-3 py-2 text-sm outline-none transition disabled:opacity-60 ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
            : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
        }`}
      />

      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] text-gray-400">
          {error ? (
            <span className="text-red-600">{error}</span>
          ) : (
            `${body.length} / ${MAX_COMMENT_LENGTH}`
          )}
        </span>

        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PaperAirplaneIcon className="h-3.5 w-3.5" />
          {busy ? 'Gönderiliyor...' : 'Yorum yaz'}
        </button>
      </div>
    </form>
  );
}
