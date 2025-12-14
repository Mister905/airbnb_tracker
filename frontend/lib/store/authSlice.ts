import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  supabaseToken: string | null; // Supabase access token
  backendJwt: string | null; // Backend JWT token (used for API calls)
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  supabaseToken: null,
  backendJwt: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ user: User; supabaseToken: string; backendJwt: string }>) => {
      state.user = action.payload.user;
      state.supabaseToken = action.payload.supabaseToken;
      state.backendJwt = action.payload.backendJwt;
      state.isAuthenticated = true;
    },
    clearUser: (state) => {
      state.user = null;
      state.supabaseToken = null;
      state.backendJwt = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
