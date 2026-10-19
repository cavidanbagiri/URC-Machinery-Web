import { configureStore } from '@reduxjs/toolkit';
import authSlice from './user_slice.js';
import settingSlice from './setting_slice.js'
import lookupReducer from './lookup_slice';    // ← YENİ
import machineReducer from './machine_slice';  // ← YENİ
import maintenanceReducer from './maintenance_slice';
import dashboardReducer from './dashboard_slice';

const store = configureStore({
  reducer: {
    auth: authSlice,
    setting: settingSlice,
    lookup: lookupReducer,
    machine: machineReducer,
    maintenance: maintenanceReducer,
    dashboard: dashboardReducer,
  },
});

export default store;