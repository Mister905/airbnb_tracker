'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchTrackedUrls } from '@/lib/store/listingsSlice';
import { fetchSnapshots, compareSnapshots } from '@/lib/store/snapshotsSlice';
import { api } from '@/lib/api';
import * as Select from '@radix-ui/react-select';
import * as Tabs from '@radix-ui/react-tabs';
import DescriptionDiff from './DescriptionDiff';
import ArrayDiff from './ArrayDiff';
import PhotoDiff from './PhotoDiff';
import ReviewDiff from './ReviewDiff';
import SummaryBanner from './SummaryBanner';

export default function DiffToolContent() {
  const dispatch = useAppDispatch();
  const { trackedUrls } = useAppSelector((state) => state.listings);
  const { snapshots, comparison, loading } = useAppSelector((state) => state.snapshots);
  const [selectedListingId, setSelectedListingId] = useState<string>('');
  const [fromSnapshotId, setFromSnapshotId] = useState<string>('');
  const [toSnapshotId, setToSnapshotId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    dispatch(fetchTrackedUrls());
  }, [dispatch]);

  useEffect(() => {
    if (selectedListingId) {
      dispatch(fetchSnapshots({ listingId: selectedListingId, startDate, endDate }));
    }
  }, [selectedListingId, startDate, endDate, dispatch]);

  useEffect(() => {
    if (fromSnapshotId && toSnapshotId) {
      dispatch(compareSnapshots({ fromId: fromSnapshotId, toId: toSnapshotId }));
    }
  }, [fromSnapshotId, toSnapshotId, dispatch]);

  const selectedListing = trackedUrls.find((u) => u.listing?.id === selectedListingId);

  // Flatten reviews from grouped format to arrays for ReviewDiff
  const { oldReviews, newReviews } = useMemo(() => {
    if (!comparison?.diffs?.reviews) {
      return { oldReviews: [], newReviews: [] };
    }
    
    const old: any[] = [];
    const new_: any[] = [];
    
    comparison.diffs.reviews.forEach((monthData: any) => {
      old.push(...(monthData.from || []));
      new_.push(...(monthData.to || []));
    });
    
    return { oldReviews: old, newReviews: new_ };
  }, [comparison]);

  // Generate summary text
  const summaryText = useMemo(() => {
    if (!comparison) return '';
    
    const parts: string[] = [];
    
    if (comparison.diffs.description.changed) {
      parts.push('Description changed');
    }
    
    if (comparison.diffs.amenities.added.length > 0) {
      parts.push(`${comparison.diffs.amenities.added.length} amenit${comparison.diffs.amenities.added.length === 1 ? 'y' : 'ies'} added`);
    }
    if (comparison.diffs.amenities.removed.length > 0) {
      parts.push(`${comparison.diffs.amenities.removed.length} amenit${comparison.diffs.amenities.removed.length === 1 ? 'y' : 'ies'} removed`);
    }
    
    if (comparison.diffs.photos.added.length > 0) {
      parts.push(`${comparison.diffs.photos.added.length} photo${comparison.diffs.photos.added.length === 1 ? '' : 's'} added`);
    }
    if (comparison.diffs.photos.removed.length > 0) {
      parts.push(`${comparison.diffs.photos.removed.length} photo${comparison.diffs.photos.removed.length === 1 ? '' : 's'} removed`);
    }
    
    if (comparison.diffs.price.changed) {
      parts.push(`Price changed from ${comparison.diffs.price.from || 'N/A'} to ${comparison.diffs.price.to || 'N/A'}`);
    }
    
    if (comparison.diffs.rating.changed) {
      parts.push(`Rating changed from ${comparison.diffs.rating.from || 'N/A'} to ${comparison.diffs.rating.to || 'N/A'}`);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'No changes detected';
  }, [comparison]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl heading-primary mb-8">Diff Tool</h1>

      <div className="card mb-6">
        <div className="space-y-4">
          {/* Select Listing - Full Width Row */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Select Listing
            </label>
            <Select.Root value={selectedListingId} onValueChange={setSelectedListingId}>
              <Select.Trigger className="input w-full">
                <Select.Value placeholder="Choose a listing..." />
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="card border rounded-md shadow-lg" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                  <Select.Viewport>
                    {trackedUrls
                      .filter((u) => u.listing)
                      .map((url) => (
                        <Select.Item
                          key={url.listing!.id}
                          value={url.listing!.id}
                          className="px-3 py-2 cursor-pointer"
                          style={{ backgroundColor: 'transparent' }}
                        >
                          <Select.ItemText style={{ color: 'var(--color-text-primary)' }}>{url.url}</Select.ItemText>
                        </Select.Item>
                      ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>

          {/* From Snapshot and To Snapshot - Side by Side Row */}
          {selectedListingId && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  From Snapshot
                </label>
                <Select.Root value={fromSnapshotId} onValueChange={setFromSnapshotId}>
                  <Select.Trigger className="input w-full">
                    <Select.Value placeholder="Choose snapshot..." />
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="card border rounded-md shadow-lg" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                      <Select.Viewport>
                        {snapshots.map((snapshot) => (
                          <Select.Item
                            key={snapshot.id}
                            value={snapshot.id}
                            className="px-3 py-2 cursor-pointer"
                            style={{ backgroundColor: 'transparent' }}
                          >
                            <Select.ItemText style={{ color: 'var(--color-text-primary)' }}>
                              Version {snapshot.version} - {new Date(snapshot.createdAt).toLocaleDateString()}
                            </Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  To Snapshot
                </label>
                <Select.Root value={toSnapshotId} onValueChange={setToSnapshotId}>
                  <Select.Trigger className="input w-full">
                    <Select.Value placeholder="Choose snapshot..." />
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="card border rounded-md shadow-lg" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                      <Select.Viewport>
                        {snapshots.map((snapshot) => (
                          <Select.Item
                            key={snapshot.id}
                            value={snapshot.id}
                            className="px-3 py-2 cursor-pointer"
                            style={{ backgroundColor: 'transparent' }}
                          >
                            <Select.ItemText style={{ color: 'var(--color-text-primary)' }}>
                              Version {snapshot.version} - {new Date(snapshot.createdAt).toLocaleDateString()}
                            </Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>
            </div>
          )}

          {/* Start Date and End Date - Side by Side Row (Optional) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Start Date <span className="text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>(Optional)</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                End Date <span className="text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>(Optional)</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {comparison && (
        <div className="card">
          {/* Summary Banner */}
          <div className="mb-6">
            <SummaryBanner summaryText={summaryText} />
          </div>

          <Tabs.Root defaultValue="description" className="w-full">
            <Tabs.List className="flex border-b" style={{ borderColor: 'var(--color-border)' }}>
              <Tabs.Trigger
                value="description"
                className="px-4 py-2 text-sm font-medium data-[state=active]:border-b-2 transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Description
              </Tabs.Trigger>
              <Tabs.Trigger
                value="amenities"
                className="px-4 py-2 text-sm font-medium data-[state=active]:border-b-2 transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Amenities
              </Tabs.Trigger>
              <Tabs.Trigger
                value="photos"
                className="px-4 py-2 text-sm font-medium data-[state=active]:border-b-2 transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Photos
              </Tabs.Trigger>
              <Tabs.Trigger
                value="reviews"
                className="px-4 py-2 text-sm font-medium data-[state=active]:border-b-2 transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Reviews
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="description" className="mt-4">
              <DescriptionDiff
                oldText={comparison.from.description || ''}
                newText={comparison.to.description || ''}
              />
            </Tabs.Content>

            <Tabs.Content value="amenities" className="mt-4">
              <ArrayDiff
                oldItems={comparison.diffs.amenities.from || []}
                newItems={comparison.diffs.amenities.to || []}
                fieldName="Amenities"
              />
            </Tabs.Content>

            <Tabs.Content value="photos" className="mt-4">
              <PhotoDiff
                oldPhotos={comparison.from.photos || []}
                newPhotos={comparison.to.photos || []}
              />
            </Tabs.Content>

            <Tabs.Content value="reviews" className="mt-4">
              <ReviewDiff
                oldReviews={oldReviews}
                newReviews={newReviews}
                showUnchangedReviews={true}
              />
            </Tabs.Content>
          </Tabs.Root>
        </div>
      )}
    </div>
  );
}
