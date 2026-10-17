import { configureStore } from '@reduxjs/toolkit';
import authSlice from './user_slice.js';
import settingSlice from './setting_slice.js'
import lookupReducer from './lookup_slice';    // ← YENİ
import machineReducer from './machine_slice';  // ← YENİ
import dashboardReducer from './dashboard_slice';

const store = configureStore({
  reducer: {
    auth: authSlice,
    setting: settingSlice,
    lookup: lookupReducer,
    machine: machineReducer,
    dashboard: dashboardReducer,
  },
});

export default store;