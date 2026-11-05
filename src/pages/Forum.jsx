// src/pages/Forum.jsx
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import { BsChatDots } from 'react-icons/bs';
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import ForumPagination from '../components/forum/ForumPagination';
import ForumResolveModal from '../components/forum/ForumResolveModal';
import ForumTopicCard from '../components/forum/ForumTopicCard';
import ForumTopicFormModal from '../components/forum/ForumTopicFormModal';
import {
  addForumComment,
  deleteForumPhoto,
  deleteForumTopic,
  fetchForumTopics,
  resetFilters,
  setFilter,
  setForumTopicResolved,
  uploadForumPhoto,
} from '../stores/forum_slice';
import {
  FORUM_STATUS_FILTERS,
  MAX_PHOTOS,
  canWriteForum,
  validatePhotoFile,
} from '../utils/forum';

export default function Forum() {
  const dispatch = useDispatch();
  const {
    items,
    limit,
    offset,
    filters,
    loading,
    error,
    commentingTopicId,
    resolvingTopicId,
    deletingTopicId,
    photoBusy,
  } = useSelector((s) => s.forum);
  const currentUser = useSelector((s) => s.auth.user);

  const [formOpen, setFormOpen] = useState(false);
  const [formNonce, setFormNonce] = useState(0);
  const [resolveTarget, setResolveTarget] = useState(null);
  // Comments are visible by default; this holds the topics the user folded.
  const [collapsedIds, setCollapsedIds] = useState([]);

  const isFirstRender = useRef(true);
  const canWrite = canWriteForum(currentUser?.status_id);

  useEffect(() => {
    dispatch(fetchForumTopics());
  }, [dispatch]);

  useEffect(() => {
    if (isFirstRender.current) return undefined;
    const timeout = setTimeout(() => {
      dispatch(fetchForumTopics());
    }, 350);
    return () => clearTimeout(timeout);
  }, [dispatch, filters]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    dispatch(fetchForumTopics());
  }, [dispatch, offset, limit]);

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    (filters.status !== 'all' ? 1 : 0) +
    (filters.mine ? 1 : 0);

  const refreshAll = () => dispatch(fetchForumTopics());
  const handleResetFilters = () => dispatch(resetFilters());

  const openCreate = () => {
    setFormNonce((value) => value + 1);
    setFormOpen(true);
  };

  const showComments = (topicId) => {
    setCollapsedIds((previous) => previous.filter((id) => id !== topicId));
  };

  const toggleComments = (topicId) => {
    setCollapsedIds((previous) =>
      previous.includes(topicId)
        ? previous.filter((id) => id !== topicId)
        : [...previous, topicId]
    );
  };

  const handleComment = async (topic, body) => {
    try {
      await dispatch(
        addForumComment({ topicId: topic.id, payload: { body } })
      ).unwrap();
      showComments(topic.id);
      toast.success('Yorum eklendi');
      return true;
    } catch (err) {
      toast.error(String(err || 'Yorum eklenemedi'));
      return false;
    }
  };

  const handleReopen = async (topic) => {
    try {
      await dispatch(
        setForumTopicResolved({
          topicId: topic.id,
          payload: { is_resolved: false },
        })
      ).unwrap();
      toast.success('Konu yeniden açıldı');
    } catch (err) {
      toast.error(String(err || 'Konu yeniden açılamadı'));
    }
  };

  const handleConfirmResolve = async (note) => {
    if (!resolveTarget) return;
    try {
      await dispatch(
        setForumTopicResolved({
          topicId: resolveTarget.id,
          payload: { is_resolved: true, resolution_note: note },
        })
      ).unwrap();
      setResolveTarget(null);
      toast.success('Konu çözüldü olarak kapatıldı');
    } catch (err) {
      toast.error(String(err || 'Konu kapatılamadı'));
    }
  };

  const handleDeleteTopic = async (topic) => {
    const confirmed = window.confirm(
      `"${topic.title}" konusunu silmek istediğinize emin misiniz?`
    );
    if (!confirmed) return;

    try {
      await dispatch(deleteForumTopic(topic.id)).unwrap();
      toast.success('Konu silindi');
    } catch (err) {
      toast.error(String(err || 'Konu silinemedi'));
    }
  };

  const handleDeletePhoto = async (topic, photo) => {
    const confirmed = window.confirm(
      'Bu fotoğrafı silmek istediğinize emin misiniz?'
    );
    if (!confirmed) return;

    try {
      await dispatch(
        deleteForumPhoto({ topicId: topic.id, photoId: photo.id })
      ).unwrap();
      toast.success('Fotoğraf silindi');
    } catch (err) {
      toast.error(String(err || 'Fotoğraf silinemedi'));
    }
  };

  const handleAddPhoto = async (topic, file) => {
    const validationError = validatePhotoFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if ((topic.photos?.length || 0) >= MAX_PHOTOS) {
      toast.error(`Bir konuya en fazla ${MAX_PHOTOS} fotoğraf eklenebilir`);
      return;
    }

    try {
      await dispatch(uploadForumPhoto({ topicId: topic.id, file })).unwrap();
      toast.success('Fotoğraf eklendi');
    } catch (err) {
      toast.error(String(err || 'Fotoğraf yüklenemedi'));
    }
  };

  return (
    <div className="space-y-5 p-6">
      <Toaster position="top-right" />

      {/* ---------- HEADER ---------- */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div
            style={{ fontFamily: 'Inter' }}
            className="flex items-center gap-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <BsChatDots className="h-4 w-4" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              Forum
            </h1>
          </div>
          <p className="mt-1.5 text-sm text-gray-500">
            Arıza, acil parça ihtiyacı ve çözüm notlarını ekipçe burada
            konuşun.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshAll}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowPathIcon
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
            Yenile
          </button>

          {canWrite && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4" />
              Yeni Konu
            </button>
          )}
        </div>
      </div>

      {/* ---------- TOOLBAR ---------- */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl bg-gray-100 p-1">
            {FORUM_STATUS_FILTERS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() =>
                  dispatch(setFilter({ key: 'status', value: tab.key }))
                }
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  filters.status === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              dispatch(setFilter({ key: 'mine', value: !filters.mine }))
            }
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              filters.mine
                ? 'border-blue-200 bg-blue-50 text-blue-700'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Benim konularım
          </button>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          <div className="relative w-full max-w-xs">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={filters.search}
              onChange={(event) =>
                dispatch(setFilter({ key: 'search', value: event.target.value }))
              }
              placeholder="Başlık veya içerikte ara..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
            >
              <XMarkIcon className="h-3.5 w-3.5" />
              Temizle ({activeFilterCount})
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {String(error)}
        </div>
      )}

      {/* ---------- SKELETON ---------- */}
      {loading && items.length === 0 && (
        <div className="space-y-4">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5"
            >
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 rounded bg-gray-200" />
                  <div className="h-3 w-24 rounded bg-gray-100" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-4 w-2/3 rounded bg-gray-200" />
                <div className="h-3 w-full rounded bg-gray-100" />
                <div className="h-3 w-5/6 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---------- EMPTY ---------- */}
      {!loading && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <BsChatDots className="mx-auto h-10 w-10 text-gray-300" />
          <h2 className="mt-3 text-base font-medium text-gray-700">
            {activeFilterCount > 0
              ? 'Filtrelere uygun konu bulunamadı'
              : 'Henüz konu yok'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {activeFilterCount > 0
              ? 'Arama metnini veya filtreleri değiştirip tekrar deneyin.'
              : 'İlk konuyu siz açın: arızayı, acil parça ihtiyacını ve fotoğrafları paylaşın.'}
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Filtreleri temizle
              </button>
            )}

            {canWrite && activeFilterCount === 0 && (
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4" />
                Yeni Konu
              </button>
            )}
          </div>
        </div>
      )}

      {/* ---------- TOPICS ---------- */}
      {items.length > 0 && (
        <div className="space-y-4">
          {items.map((topic) => (
            <ForumTopicCard
              key={topic.id}
              topic={topic}
              canManage={canWrite || topic.author_id === currentUser?.id}
              expanded={!collapsedIds.includes(topic.id)}
              onToggleComments={toggleComments}
              onComment={handleComment}
              onResolve={setResolveTarget}
              onReopen={handleReopen}
              onDelete={handleDeleteTopic}
              onDeletePhoto={handleDeletePhoto}
              onAddPhoto={handleAddPhoto}
              commenting={commentingTopicId === topic.id}
              resolving={resolvingTopicId === topic.id}
              deleting={deletingTopicId === topic.id}
              photoBusy={photoBusy?.topicId === topic.id ? photoBusy : null}
            />
          ))}
        </div>
      )}

      <ForumPagination />

      <ForumTopicFormModal
        key={`forum-topic-form-${formNonce}`}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={refreshAll}
      />

      <ForumResolveModal
        key={`forum-resolve-${resolveTarget?.id ?? 'none'}`}
        open={Boolean(resolveTarget)}
        topic={resolveTarget}
        busy={resolvingTopicId === resolveTarget?.id}
        onClose={() => setResolveTarget(null)}
        onConfirm={handleConfirmResolve}
      />
    </div>
  );
}

