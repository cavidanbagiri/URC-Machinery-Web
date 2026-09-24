import { configureStore } from '@reduxjs/toolkit';
import authSlice from './user_slice.js';
import settingSlice from './setting_slice.js'


const store = configureStore({
  reducer: {
    auth: authSlice,
    setting: settingSlice
  },
});

export default store;