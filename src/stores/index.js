import { configureStore } from '@reduxjs/toolkit';
import authSlice from './user_slice.js';


const store = configureStore({
  reducer: {
    auth: authSlice,
  },
});

export default store;