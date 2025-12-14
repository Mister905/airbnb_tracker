'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchTrackedUrls } from '@/lib/store/listingsSlice';
import { fetchSnapshots, compareSnapshots } from '@/lib/store/snapshotsSlice';
import { api } from '@/lib/api';
import * as Select from '@radix-ui/react-select';
import * as Tabs from '@radix-ui/react-tabs';

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl heading-primary mb-8">Diff Tool</h1>

      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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

          {selectedListingId && (
            <>
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
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Start Date
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
              End Date
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

      {comparison && (
        <div className="card">
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
                style={{ 
                  color: 'var(--color-text-secondary)',
                  '&:hover': { color: 'var(--color-text-primary)' },
                  '&[data-state=active]': { 
                    color: 'var(--color-primary)',
                    borderColor: 'var(--color-primary)'
                  }
                }}
              >
                Amenities
              </Tabs.Trigger>
              <Tabs.Trigger
                value="photos"
                className="px-4 py-2 text-sm font-medium data-[state=active]:border-b-2 transition-colors"
                style={{ 
                  color: 'var(--color-text-secondary)',
                  '&:hover': { color: 'var(--color-text-primary)' },
                  '&[data-state=active]': { 
                    color: 'var(--color-primary)',
                    borderColor: 'var(--color-primary)'
                  }
                }}
              >
                Photos
              </Tabs.Trigger>
              <Tabs.Trigger
                value="reviews"
                className="px-4 py-2 text-sm font-medium data-[state=active]:border-b-2 transition-colors"
                style={{ 
                  color: 'var(--color-text-secondary)',
                  '&:hover': { color: 'var(--color-text-primary)' },
                  '&[data-state=active]': { 
                    color: 'var(--color-primary)',
                    borderColor: 'var(--color-primary)'
                  }
                }}
              >
                Reviews
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="description" className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>From (Version {comparison.from.version})</h3>
                  <div className="p-4 rounded-md whitespace-pre-wrap" style={{ backgroundColor: 'var(--color-surface-elevated)', color: 'var(--color-text-primary)' }}>
                    {comparison.from.description || 'No description'}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>To (Version {comparison.to.version})</h3>
                  <div className="p-4 rounded-md whitespace-pre-wrap" style={{ backgroundColor: 'var(--color-surface-elevated)', color: 'var(--color-text-primary)' }}>
                    {comparison.to.description || 'No description'}
                  </div>
                </div>
              </div>
              {comparison.diffs.description.changed && (
                <div className="mt-4 alert alert-warning">
                  <p className="text-sm">Description has changed</p>
                </div>
              )}
            </Tabs.Content>

            <Tabs.Content value="amenities" className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>From</h3>
                  <ul className="list-disc list-inside space-y-1" style={{ color: 'var(--color-text-primary)' }}>
                    {(comparison.diffs.amenities.from || []).map((amenity: any, idx: number) => (
                      <li key={idx}>{amenity.name || amenity}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>To</h3>
                  <ul className="list-disc list-inside space-y-1" style={{ color: 'var(--color-text-primary)' }}>
                    {(comparison.diffs.amenities.to || []).map((amenity: any, idx: number) => (
                      <li key={idx} className={comparison.diffs.amenities.added.some((a: any) => (a.name || a) === (amenity.name || amenity)) ? 'diff-added' : ''}>
                        {amenity.name || amenity}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              {comparison.diffs.amenities.added.length > 0 && (
                <div className="mt-4 alert alert-success">
                  <p className="text-sm font-semibold mb-2">Added:</p>
                  <ul className="list-disc list-inside">
                    {comparison.diffs.amenities.added.map((a: any, idx: number) => (
                      <li key={idx} className="diff-added">{a.name || a}</li>
                    ))}
                  </ul>
                </div>
              )}
              {comparison.diffs.amenities.removed.length > 0 && (
                <div className="mt-4 alert alert-error">
                  <p className="text-sm font-semibold mb-2">Removed:</p>
                  <ul className="list-disc list-inside">
                    {comparison.diffs.amenities.removed.map((a: any, idx: number) => (
                      <li key={idx} className="diff-removed">{a.name || a}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Tabs.Content>

            <Tabs.Content value="photos" className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>From ({comparison.diffs.photos.from.length} photos)</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {comparison.diffs.photos.from.slice(0, 4).map((photo: any) => (
                      <img key={photo.id} src={photo.url} alt={photo.caption} className="rounded-md" />
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>To ({comparison.diffs.photos.to.length} photos)</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {comparison.diffs.photos.to.slice(0, 4).map((photo: any) => (
                      <img key={photo.id} src={photo.url} alt={photo.caption} className="rounded-md" />
                    ))}
                  </div>
                </div>
              </div>
              {comparison.diffs.photos.added.length > 0 && (
                <div className="mt-4 alert alert-success">
                  <p className="text-sm font-semibold mb-2">Added Photos:</p>
                  <div className="grid grid-cols-4 gap-2">
                    {comparison.diffs.photos.added.map((photo: any) => (
                      <img key={photo.id} src={photo.url} alt={photo.caption} className="rounded-md" />
                    ))}
                  </div>
                </div>
              )}
              {comparison.diffs.photos.removed && comparison.diffs.photos.removed.length > 0 && (
                <div className="mt-4 alert alert-error">
                  <p className="text-sm font-semibold mb-2">Removed Photos:</p>
                  <div className="grid grid-cols-4 gap-2">
                    {comparison.diffs.photos.removed.map((photo: any) => (
                      <img key={photo.id} src={photo.url} alt={photo.caption} className="rounded-md opacity-50" />
                    ))}
                  </div>
                </div>
              )}
            </Tabs.Content>

            <Tabs.Content value="reviews" className="mt-4">
              <div className="space-y-4">
                {comparison.diffs.reviews.map((monthData: any) => (
                  <div key={monthData.month} className="border rounded-md p-4" style={{ borderColor: 'var(--color-border)' }}>
                    <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>{monthData.month}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>From: {monthData.from.length} reviews</p>
                        {monthData.from.slice(0, 3).map((review: any) => (
                          <div key={review.id} className="mb-2 p-2 rounded" style={{ backgroundColor: 'var(--color-surface-elevated)' }}>
                            <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{review.comment}</p>
                            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{review.reviewerName}</p>
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>To: {monthData.to.length} reviews</p>
                        {monthData.to.slice(0, 3).map((review: any) => (
                          <div key={review.id} className="mb-2 p-2 rounded" style={{ backgroundColor: 'var(--color-surface-elevated)' }}>
                            <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{review.comment}</p>
                            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{review.reviewerName}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Tabs.Content>
          </Tabs.Root>
        </div>
      )}
    </div>
  );
}
