// src/stores/forum_slice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import ForumService from '../services/ForumService';

const initialFilters = {
  search: '',
  status: 'all',
  mine: false,
};

const initialState = {
  items: [],
  total: 0,
  limit: 10,
  offset: 0,
  filters: { ...initialFilters },
  loading: false,
  error: null,
  listRequestId: null,

  mutating: false,
  mutationError: null,
  // Per-topic busy markers so only the clicked card shows a spinner.
  commentingTopicId: null,
  resolvingTopicId: null,
  deletingTopicId: null,
  // { topicId, photoId, action: 'upload' | 'delete' } while a photo request runs
  photoBusy: null,

  machineOptions: {
    items: [],
    loading: false,
    error: null,
    requestId: null,
  },
};

function errorMessage(err, fallback) {
  const detail = err.response?.data?.detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).filter(Boolean).join(', ') || fallback;
  }
  // Photo downloads use responseType "blob", so the JSON body is a Blob.
  if (typeof Blob !== 'undefined' && detail instanceof Blob) return fallback;
  return detail || err.message || fallback;
}

function applyItem(state, item) {
  const index = state.items.findIndex((row) => row.id === item.id);
  if (index !== -1) state.items[index] = item;
}

// =========================================================
// READ THUNKS
// =========================================================

export const fetchForumTopics = createAsyncThunk(
  'forum/fetchTopics',
  async (_, { getState, rejectWithValue }) => {
    const { limit, offset, filters } = getState().forum;
    try {
      return await ForumService.fetchTopics({ limit, offset, ...filters });
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Forum konuları yüklenemedi'));
    }
  }
);

export const fetchForumTopic = createAsyncThunk(
  'forum/fetchTopic',
  async (topicId, { rejectWithValue }) => {
    try {
      return await ForumService.fetchTopic(topicId);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Konu yüklenemedi'));
    }
  }
);

export const fetchForumMachineOptions = createAsyncThunk(
  'forum/fetchMachineOptions',
  async ({ search = '', limit = 20 } = {}, { rejectWithValue }) => {
    try {
      return await ForumService.fetchMachineOptions({ search, limit });
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Makine listesi yüklenemedi'));
    }
  }
);

// =========================================================
// WRITE THUNKS
// =========================================================

export const createForumTopic = createAsyncThunk(
  'forum/createTopic',
  async (payload, { rejectWithValue }) => {
    try {
      return await ForumService.createTopic(payload);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Konu açılamadı'));
    }
  }
);

export const uploadForumPhoto = createAsyncThunk(
  'forum/uploadPhoto',
  async ({ topicId, file }, { rejectWithValue }) => {
    try {
      return await ForumService.uploadPhoto(topicId, file);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Fotoğraf yüklenemedi'));
    }
  }
);

export const deleteForumPhoto = createAsyncThunk(
  'forum/deletePhoto',
  async ({ topicId, photoId }, { rejectWithValue }) => {
    try {
      return await ForumService.deletePhoto(topicId, photoId);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Fotoğraf silinemedi'));
    }
  }
);

export const addForumComment = createAsyncThunk(
  'forum/addComment',
  async ({ topicId, payload }, { rejectWithValue }) => {
    try {
      return await ForumService.addComment(topicId, payload);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Yorum eklenemedi'));
    }
  }
);

export const setForumTopicResolved = createAsyncThunk(
  'forum/setResolved',
  async ({ topicId, payload }, { rejectWithValue }) => {
    try {
      return await ForumService.setResolved(topicId, payload);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Konu durumu güncellenemedi'));
    }
  }
);

export const deleteForumTopic = createAsyncThunk(
  'forum/deleteTopic',
  async (topicId, { rejectWithValue }) => {
    try {
      await ForumService.deleteTopic(topicId);
      return topicId;
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Konu silinemedi'));
    }
  }
);

const forumSlice = createSlice({
  name: 'forum',
  initialState,
  reducers: {
    setFilter: (state, action) => {
      const { key, value } = action.payload;
      state.filters[key] = value;
      // A new search always restarts from the first page.
      state.offset = 0;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.offset = 0;
    },
    resetFilters: (state) => {
      state.filters = { ...initialFilters };
      state.offset = 0;
    },
    setLimit: (state, action) => {
      state.limit = action.payload;
      state.offset = 0;
    },
    setOffset: (state, action) => {
      state.offset = action.payload;
    },
    clearMutationError: (state) => {
      state.mutationError = null;
    },
    clearMachineOptions: (state) => {
      state.machineOptions = { ...initialState.machineOptions };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchForumTopics.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.listRequestId = action.meta.requestId;
      })
      .addCase(fetchForumTopics.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.listRequestId) return;
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
      })
      .addCase(fetchForumTopics.rejected, (state, action) => {
        if (action.meta.requestId !== state.listRequestId) return;
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(fetchForumTopic.fulfilled, (state, action) => {
        applyItem(state, action.payload);
      })
      .addCase(fetchForumTopic.rejected, (state, action) => {
        state.mutationError = action.payload;
      });

    builder
      .addCase(fetchForumMachineOptions.pending, (state, action) => {
        state.machineOptions.loading = true;
        state.machineOptions.error = null;
        state.machineOptions.requestId = action.meta.requestId;
      })
      .addCase(fetchForumMachineOptions.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.machineOptions.requestId) return;
        state.machineOptions.loading = false;
        state.machineOptions.items = action.payload;
      })
      .addCase(fetchForumMachineOptions.rejected, (state, action) => {
        if (action.meta.requestId !== state.machineOptions.requestId) return;
        state.machineOptions.loading = false;
        state.machineOptions.error = action.payload;
      });

    builder
      .addCase(createForumTopic.pending, (state) => {
        state.mutating = true;
        state.mutationError = null;
      })
      .addCase(createForumTopic.fulfilled, (state, action) => {
        state.mutating = false;
        state.items.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createForumTopic.rejected, (state, action) => {
        state.mutating = false;
        state.mutationError = action.payload;
      });

    builder
      .addCase(uploadForumPhoto.pending, (state, action) => {
        state.mutationError = null;
        state.photoBusy = { topicId: action.meta.arg.topicId, action: 'upload' };
      })
      .addCase(uploadForumPhoto.fulfilled, (state, action) => {
        state.photoBusy = null;
        applyItem(state, action.payload);
      })
      .addCase(uploadForumPhoto.rejected, (state, action) => {
        state.photoBusy = null;
        state.mutationError = action.payload;
      });

    builder
      .addCase(deleteForumPhoto.pending, (state, action) => {
        state.mutationError = null;
        state.photoBusy = {
          topicId: action.meta.arg.topicId,
          photoId: action.meta.arg.photoId,
          action: 'delete',
        };
      })
      .addCase(deleteForumPhoto.fulfilled, (state, action) => {
        state.photoBusy = null;
        applyItem(state, action.payload);
      })
      .addCase(deleteForumPhoto.rejected, (state, action) => {
        state.photoBusy = null;
        state.mutationError = action.payload;
      });

    builder
      .addCase(addForumComment.pending, (state, action) => {
        state.mutationError = null;
        state.commentingTopicId = action.meta.arg.topicId;
      })
      .addCase(addForumComment.fulfilled, (state, action) => {
        state.commentingTopicId = null;
        applyItem(state, action.payload);
      })
      .addCase(addForumComment.rejected, (state, action) => {
        state.commentingTopicId = null;
        state.mutationError = action.payload;
      });

    builder
      .addCase(setForumTopicResolved.pending, (state, action) => {
        state.mutationError = null;
        state.resolvingTopicId = action.meta.arg.topicId;
      })
      .addCase(setForumTopicResolved.fulfilled, (state, action) => {
        state.resolvingTopicId = null;
        applyItem(state, action.payload);
      })
      .addCase(setForumTopicResolved.rejected, (state, action) => {
        state.resolvingTopicId = null;
        state.mutationError = action.payload;
      });

    builder
      .addCase(deleteForumTopic.pending, (state, action) => {
        state.mutationError = null;
        state.deletingTopicId = action.meta.arg;
      })
      .addCase(deleteForumTopic.fulfilled, (state, action) => {
        state.deletingTopicId = null;
        state.items = state.items.filter((item) => item.id !== action.payload);
        state.total = Math.max(0, state.total - 1);
      })
      .addCase(deleteForumTopic.rejected, (state, action) => {
        state.deletingTopicId = null;
        state.mutationError = action.payload;
      });
  },
});

export const {
  setFilter,
  setFilters,
  resetFilters,
  setLimit,
  setOffset,
  clearMutationError,
  clearMachineOptions,
} = forumSlice.actions;

export default forumSlice.reducer;



