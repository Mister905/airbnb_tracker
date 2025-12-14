import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../api';

export interface ListingSnapshot {
  id: string;
  listingId: string;
  version: number;
  description?: string;
  amenities?: any;
  price?: number;
  currency?: string;
  rating?: number;
  reviewCount?: number;
  createdAt: string;
  photos?: Photo[];
  reviews?: Review[];
  scrapeRun?: ScrapeRun;
}

export interface Photo {
  id: string;
  url: string;
  caption?: string;
  order?: number;
}

export interface Review {
  id: string;
  reviewId: string;
  reviewerName?: string;
  reviewerAvatar?: string;
  rating?: number;
  comment?: string;
  date?: string;
}

export interface ScrapeRun {
  id: string;
  status: string;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

interface SnapshotsState {
  snapshots: ListingSnapshot[];
  comparison: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: SnapshotsState = {
  snapshots: [],
  comparison: null,
  loading: false,
  error: null,
};

export const fetchSnapshots = createAsyncThunk(
  'snapshots/fetchSnapshots',
  async ({
    listingId,
    page = 1,
    limit = 50,
    start,
    end,
  }: {
    listingId: string;
    page?: number;
    limit?: number;
    start?: string;
    end?: string;
  }) => {
    const params = new URLSearchParams({
      listing_id: listingId,
      page: page.toString(),
      limit: limit.toString(),
    });
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    return api.get<{ data: ListingSnapshot[]; pagination: any }>(
      `/api/snapshots?${params.toString()}`,
    );
  },
);

export const compareSnapshots = createAsyncThunk(
  'snapshots/compareSnapshots',
  async ({ fromId, toId }: { fromId: string; toId: string }) => {
    return api.get(`/api/snapshots/compare/${fromId}/${toId}`);
  },
);

const snapshotsSlice = createSlice({
  name: 'snapshots',
  initialState,
  reducers: {
    clearComparison: (state) => {
      state.comparison = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSnapshots.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSnapshots.fulfilled, (state, action) => {
        state.loading = false;
        state.snapshots = action.payload.data;
      })
      .addCase(fetchSnapshots.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch snapshots';
      })
      .addCase(compareSnapshots.fulfilled, (state, action) => {
        state.comparison = action.payload;
      });
  },
});

export const { clearComparison } = snapshotsSlice.actions;
export default snapshotsSlice.reducer;
