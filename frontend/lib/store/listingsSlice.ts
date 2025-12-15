import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../api';
import { ListingSnapshot } from './snapshotsSlice';

export interface TrackedUrl {
  id: string;
  url: string;
  userId: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  listing?: Listing;
  // Optional fields that may come from backend or be computed
  promotional_title?: string; // From listing.title
  scrape_status?: 'pending' | 'running' | 'completed' | 'failed';
  last_scraped_at?: string | null; // From latest snapshot or scrape run
}

export interface Listing {
  id: string;
  trackedUrlId: string;
  airbnbId?: string;
  title?: string;
  description?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
  trackedUrl?: TrackedUrl;
  snapshots?: ListingSnapshot[];
  _count?: {
    snapshots: number;
    reviews: number;
    photos: number;
  };
}

interface ListingsState {
  trackedUrls: TrackedUrl[];
  listings: Listing[];
  loading: boolean;
  error: string | null;
}

const initialState: ListingsState = {
  trackedUrls: [],
  listings: [],
  loading: false,
  error: null,
};

export const fetchTrackedUrls = createAsyncThunk(
  'listings/fetchTrackedUrls',
  async () => {
    return api.get<TrackedUrl[]>('/api/listings/tracked-urls');
  },
);

export const createTrackedUrl = createAsyncThunk(
  'listings/createTrackedUrl',
  async (data: { url: string; enabled?: boolean }) => {
    return api.post<TrackedUrl>('/api/listings/tracked-urls', data);
  },
);

export const updateTrackedUrl = createAsyncThunk(
  'listings/updateTrackedUrl',
  async ({ id, data }: { id: string; data: Partial<TrackedUrl> }) => {
    return api.patch<TrackedUrl>(`/api/listings/tracked-urls/${id}`, data);
  },
);

export const deleteTrackedUrl = createAsyncThunk(
  'listings/deleteTrackedUrl',
  async (id: string) => {
    await api.delete(`/api/listings/tracked-urls/${id}`);
    return id;
  },
);

export const fetchListings = createAsyncThunk(
  'listings/fetchListings',
  async ({ page = 1, limit = 50 }: { page?: number; limit?: number } = {}) => {
    return api.get<{ data: Listing[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      `/api/listings?page=${page}&limit=${limit}`,
    );
  },
);

const listingsSlice = createSlice({
  name: 'listings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrackedUrls.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrackedUrls.fulfilled, (state, action) => {
        state.loading = false;
        state.trackedUrls = action.payload;
      })
      .addCase(fetchTrackedUrls.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch tracked URLs';
      })
      .addCase(createTrackedUrl.fulfilled, (state, action) => {
        state.trackedUrls.push(action.payload);
      })
      .addCase(updateTrackedUrl.fulfilled, (state, action) => {
        const index = state.trackedUrls.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) {
          state.trackedUrls[index] = action.payload;
        }
      })
      .addCase(deleteTrackedUrl.fulfilled, (state, action) => {
        state.trackedUrls = state.trackedUrls.filter((u) => u.id !== action.payload);
      })
      .addCase(fetchListings.fulfilled, (state, action) => {
        state.listings = action.payload.data;
      });
  },
});

export default listingsSlice.reducer;
