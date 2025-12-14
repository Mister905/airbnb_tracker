import { configureStore } from '@reduxjs/toolkit';
import listingsReducer from './store/listingsSlice';
import snapshotsReducer from './store/snapshotsSlice';
import authReducer from './store/authSlice';

export const store = configureStore({
  reducer: {
    listings: listingsReducer,
    snapshots: snapshotsReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
