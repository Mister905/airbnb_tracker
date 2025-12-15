import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../api';

export interface ListingSnapshot {
  id: string;
  listingId: string;
  version: number;
  description?: string;
  amenities?: string[] | unknown;
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

interface SnapshotComparison {
  from: ListingSnapshot;
  to: ListingSnapshot;
  diffs: {
    description: { from: string; to: string; changed: boolean };
    amenities: { from: string[]; to: string[]; added: string[]; removed: string[]; unchanged: string[]; changed: boolean };
    photos: { from: Photo[]; to: Photo[]; added: Photo[]; removed: Photo[]; unchanged: Photo[]; changed: boolean };
    reviews: Array<{ month: string; from: Review[]; to: Review[] }>;
    price: { from: number | null; to: number | null; changed: boolean };
    rating: { from: number | null; to: number | null; changed: boolean };
    reviewCount: { from: number | null; to: number | null; changed: boolean };
  };
}

interface SnapshotsState {
  snapshots: ListingSnapshot[];
  comparison: SnapshotComparison | null;
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
    return api.get<{ data: ListingSnapshot[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      `/api/snapshots?${params.toString()}`,
    );
  },
);

export const compareSnapshots = createAsyncThunk<SnapshotComparison, { fromId: string; toId: string }>(
  'snapshots/compareSnapshots',
  async ({ fromId, toId }) => {
    return api.get<SnapshotComparison>(`/api/snapshots/compare/${fromId}/${toId}`);
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
