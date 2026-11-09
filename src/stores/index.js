import { configureStore } from '@reduxjs/toolkit';
import authSlice from './user_slice.js';
import settingSlice from './setting_slice.js'
import lookupReducer from './lookup_slice';    // ← YENİ
import machineReducer from './machine_slice';  // ← YENİ
import maintenanceReducer from './maintenance_slice';
import repairReducer from './repair_slice';
import dailyFaultReducer from './daily_fault_slice';
import purchaseRequestReducer from './purchase_request_slice';
import warehouseReducer from './warehouse_slice';
import dashboardReducer from './dashboard_slice';
import forumReducer from './forum_slice';
import tireReducer from './tire_slice';

const store = configureStore({
  reducer: {
    auth: authSlice,
    setting: settingSlice,
    lookup: lookupReducer,
    machine: machineReducer,
    maintenance: maintenanceReducer,
    repair: repairReducer,
    dailyFault: dailyFaultReducer,
    purchaseRequest: purchaseRequestReducer,
    warehouse: warehouseReducer,
    dashboard: dashboardReducer,
    forum: forumReducer,
    tire: tireReducer,
  },
});

export default store;