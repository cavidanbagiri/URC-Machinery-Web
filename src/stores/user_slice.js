import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../services/authService';

// Get user from localStorage
const storedUser = localStorage.getItem('user');
const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  accessToken: localStorage.getItem('access_token') || null,
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: '',
};

// Add this new thunk for checking session on page refresh
export const checkSession = createAsyncThunk(
  'auth/checkSession',
  async (_, thunkAPI) => {
    try {
      // If we have a token in storage, try to refresh it
      const token = localStorage.getItem('access_token');
      if (token) {
        const response = await authService.refreshToken();
        return response.data;
      }
      return null;
    } catch (error) {
      // Session expired
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      return thunkAPI.rejectWithValue('Session expired');
    }
  }
);

// Register async thunk
export const register = createAsyncThunk(
  'auth/register',
  async (userData, thunkAPI) => {
    try {
      console.log(userData)
      const response = await authService.register(userData);
      return response;
    } catch (error) {
      const message = error.response?.data?.detail || error.message || 'Registration failed';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Login async thunk
export const login = createAsyncThunk(
  'auth/login',
  async (userData, thunkAPI) => {
    try {
      const response = await authService.login(userData);
      return response;
    } catch (error) {
      const message = error.response?.data?.detail || error.message || 'Login failed';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Logout action (no async needed)
export const logout = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
  localStorage.removeItem('user');
  localStorage.removeItem('access_token');
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = '';
    },
    loadUserFromStorage: (state) => {
      const user = localStorage.getItem('user');
      const token = localStorage.getItem('access_token');
      if (user && token) {
        state.user = JSON.parse(user);
        state.accessToken = token;
      }
    },
  },
  extraReducers: (builder) => {
    // Register
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = '';
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        console.log('action payload 1', action)
        console.log('action payload 2', action.payload)
        state.user = action.payload.user;
        state.accessToken = action.payload.access_token;
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        localStorage.setItem('access_token', action.payload.access_token);
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
        state.accessToken = null;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = '';
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.access_token;
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        localStorage.setItem('access_token', action.payload.access_token);
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
        state.accessToken = null;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isSuccess = false;
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
      })
      // Check Session (for page refresh)
      .addCase(checkSession.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkSession.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.user = action.payload.user;
          state.accessToken = action.payload.access_token;
          state.isSuccess = true;
        }
      })
      .addCase(checkSession.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.accessToken = null;
      })
  },
});

export const { reset, loadUserFromStorage } = authSlice.actions;
export default authSlice.reducer;