'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchTrackedUrls } from '@/lib/store/listingsSlice';
import { fetchSnapshots, compareSnapshots, Review } from '@/lib/store/snapshotsSlice';
import { Listbox } from '@headlessui/react';
import DescriptionDiff from './DescriptionDiff';
import ArrayDiff from './ArrayDiff';
import PhotoDiff from './PhotoDiff';
import ReviewDiff from './ReviewDiff';
import SummaryBanner from './SummaryBanner';
import { diffPhotos } from '@/lib/diff/photos';
import { diffReviews } from '@/lib/diff/reviews';

export default function DiffToolContent() {
  const dispatch = useAppDispatch();
  const { trackedUrls } = useAppSelector((state) => state.listings);
  const { snapshots, comparison } = useAppSelector((state) => state.snapshots);
  const [selectedListingId, setSelectedListingId] = useState<string>('');
  const [fromSnapshotId, setFromSnapshotId] = useState<string>('');
  const [toSnapshotId, setToSnapshotId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    dispatch(fetchTrackedUrls());
  }, [dispatch]);

  useEffect(() => {
    if (selectedListingId) {
      dispatch(fetchSnapshots({ listingId: selectedListingId, start: startDate, end: endDate }));
    }
  }, [selectedListingId, startDate, endDate, dispatch]);

  useEffect(() => {
    if (fromSnapshotId && toSnapshotId) {
      dispatch(compareSnapshots({ fromId: fromSnapshotId, toId: toSnapshotId }));
    }
  }, [fromSnapshotId, toSnapshotId, dispatch]);

  // Clear comparison when listing is deselected
  useEffect(() => {
    if (!selectedListingId) {
      setFromSnapshotId('');
      setToSnapshotId('');
    }
  }, [selectedListingId]);

  // Flatten reviews from grouped format to arrays for ReviewDiff
  const { oldReviews, newReviews } = useMemo(() => {
    if (!comparison?.diffs?.reviews) {
      return { oldReviews: [], newReviews: [] };
    }
    
    interface MonthData {
      month: string;
      from: Review[];
      to: Review[];
    }
    
    const old: Review[] = [];
    const new_: Review[] = [];
    
    comparison.diffs.reviews.forEach((monthData: MonthData) => {
      old.push(...(monthData.from || []));
      new_.push(...(monthData.to || []));
    });
    
    return { oldReviews: old, newReviews: new_ };
  }, [comparison]);

  // Generate summary items
  const summaryItems = useMemo(() => {
    if (!comparison) return [];
    
    const items: string[] = [];
    
    if (comparison.diffs.description.changed) {
      items.push('Description changed');
    }
    
    if (comparison.diffs.amenities.added.length > 0) {
      items.push(`${comparison.diffs.amenities.added.length} amenit${comparison.diffs.amenities.added.length === 1 ? 'y' : 'ies'} added`);
    }
    if (comparison.diffs.amenities.removed.length > 0) {
      items.push(`${comparison.diffs.amenities.removed.length} amenit${comparison.diffs.amenities.removed.length === 1 ? 'y' : 'ies'} removed`);
    }
    
    // Use the same photo comparison logic as PhotoDiff component for consistency
    // Use URL as the primary identifier (not ID, since IDs change between snapshots)
    const oldPhotos = (comparison.from.photos || []).map(p => ({ url: p.url, imageId: p.id }));
    const newPhotos = (comparison.to.photos || []).map(p => ({ url: p.url, imageId: p.id }));
    const photoDiff = diffPhotos(oldPhotos, newPhotos);
    
    if (photoDiff.added.length > 0) {
      items.push(`${photoDiff.added.length} photo${photoDiff.added.length === 1 ? '' : 's'} added`);
    }
    if (photoDiff.removed.length > 0) {
      items.push(`${photoDiff.removed.length} photo${photoDiff.removed.length === 1 ? '' : 's'} removed`);
    }
    if (photoDiff.moved.length > 0) {
      items.push(`${photoDiff.moved.length} photo${photoDiff.moved.length === 1 ? '' : 's'} moved`);
    }
    
    if (comparison.diffs.price.changed) {
      items.push(`Price changed from ${comparison.diffs.price.from || 'N/A'} to ${comparison.diffs.price.to || 'N/A'}`);
    }
    
    if (comparison.diffs.rating.changed) {
      items.push(`Rating changed from ${comparison.diffs.rating.from || 'N/A'} to ${comparison.diffs.rating.to || 'N/A'}`);
    }
    
    // Use the same review comparison logic as ReviewDiff component for consistency
    const reviewDiff = diffReviews(oldReviews, newReviews);
    
    if (reviewDiff.added.length > 0) {
      items.push(`${reviewDiff.added.length} review${reviewDiff.added.length === 1 ? '' : 's'} added`);
    }
    if (reviewDiff.removed.length > 0) {
      items.push(`${reviewDiff.removed.length} review${reviewDiff.removed.length === 1 ? '' : 's'} removed`);
    }
    if (reviewDiff.updated.length > 0) {
      items.push(`${reviewDiff.updated.length} review${reviewDiff.updated.length === 1 ? '' : 's'} updated`);
    }
    
    // Also show review count change if it differs from the diff count
    if (comparison.diffs.reviewCount.changed) {
      const diffCount = reviewDiff.added.length - reviewDiff.removed.length;
      const countChange = (comparison.diffs.reviewCount.to || 0) - (comparison.diffs.reviewCount.from || 0);
      // Only show review count if it provides additional info beyond the diff
      if (Math.abs(countChange) !== Math.abs(diffCount)) {
        items.push(`Review count changed from ${comparison.diffs.reviewCount.from || 'N/A'} to ${comparison.diffs.reviewCount.to || 'N/A'}`);
      }
    }
    
    return items;
  }, [comparison, oldReviews, newReviews]);

  // Get listing options
  const listingOptions = useMemo(() => {
    return trackedUrls
      .filter((u) => u.listing)
      .map((url) => ({
        id: url.listing!.id,
        label: url.listing?.title || url.url,
      }));
  }, [trackedUrls]);

  // Get selected listing display text
  const selectedListingText = useMemo(() => {
    if (!selectedListingId) return 'Choose a listing...';
    const option = listingOptions.find((opt) => opt.id === selectedListingId);
    return option?.label || 'Choose a listing...';
  }, [selectedListingId, listingOptions]);

  // Get snapshot options
  const snapshotOptions = useMemo(() => {
    return snapshots.map((snapshot) => ({
      id: snapshot.id,
      label: `Version ${snapshot.version} - ${new Date(snapshot.createdAt).toLocaleDateString()}`,
    }));
  }, [snapshots]);

  // Get selected snapshot display texts
  const selectedFromSnapshotText = useMemo(() => {
    if (!fromSnapshotId) return 'Choose snapshot...';
    const option = snapshotOptions.find((opt) => opt.id === fromSnapshotId);
    return option?.label || 'Choose snapshot...';
  }, [fromSnapshotId, snapshotOptions]);

  const selectedToSnapshotText = useMemo(() => {
    if (!toSnapshotId) return 'Choose snapshot...';
    const option = snapshotOptions.find((opt) => opt.id === toSnapshotId);
    return option?.label || 'Choose snapshot...';
  }, [toSnapshotId, snapshotOptions]);

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
            <Listbox value={selectedListingId} onChange={setSelectedListingId}>
              <div className="relative">
                <Listbox.Button className="input w-full text-left">
                  <span style={{ color: selectedListingId ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                    {selectedListingText}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 mt-1 w-full card border rounded-md shadow-lg max-h-60 overflow-auto" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                  {listingOptions.map((option) => (
                    <Listbox.Option
                      key={option.id}
                      value={option.id}
                      className={({ active }) =>
                        `px-3 py-2 cursor-pointer rounded transition-colors focus:outline-none listbox-option ${
                          active ? 'bg-opacity-20' : ''
                        }`
                      }
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {option.label}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
          </div>

          {/* From Snapshot and To Snapshot - Side by Side Row */}
          {selectedListingId && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  From Snapshot
                </label>
                <Listbox value={fromSnapshotId} onChange={setFromSnapshotId}>
                  <div className="relative">
                    <Listbox.Button className="input w-full text-left">
                      <span style={{ color: fromSnapshotId ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                        {selectedFromSnapshotText}
                      </span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </Listbox.Button>
                    <Listbox.Options className="absolute z-10 mt-1 w-full card border rounded-md shadow-lg max-h-60 overflow-auto" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                      {snapshotOptions.map((option) => (
                        <Listbox.Option
                          key={option.id}
                          value={option.id}
                          className={({ active }) =>
                            `px-3 py-2 cursor-pointer rounded transition-colors focus:outline-none listbox-option ${
                              active ? 'bg-opacity-20' : ''
                            }`
                          }
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {option.label}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </div>
                </Listbox>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  To Snapshot
                </label>
                <Listbox value={toSnapshotId} onChange={setToSnapshotId}>
                  <div className="relative">
                    <Listbox.Button className="input w-full text-left">
                      <span style={{ color: toSnapshotId ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                        {selectedToSnapshotText}
                      </span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </Listbox.Button>
                    <Listbox.Options className="absolute z-10 mt-1 w-full card border rounded-md shadow-lg max-h-60 overflow-auto" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                      {snapshotOptions.map((option) => (
                        <Listbox.Option
                          key={option.id}
                          value={option.id}
                          className={({ active }) =>
                            `px-3 py-2 cursor-pointer rounded transition-colors focus:outline-none listbox-option ${
                              active ? 'bg-opacity-20' : ''
                            }`
                          }
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {option.label}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </div>
                </Listbox>
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

      {selectedListingId && comparison && (
        <div className="card">
          {/* Summary Banner */}
          <div className="mb-6">
            <SummaryBanner summaryItems={summaryItems} />
          </div>

          {/* Simple Tabs Implementation */}
          <div className="w-full">
            <div className="flex border-b" style={{ borderColor: 'var(--color-border)' }}>
              <button
                onClick={() => setActiveTab('description')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'description' ? 'border-b-2' : ''
                }`}
                style={{
                  color: activeTab === 'description' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  borderBottomColor: activeTab === 'description' ? 'var(--color-primary)' : 'transparent',
                }}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab('amenities')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'amenities' ? 'border-b-2' : ''
                }`}
                style={{
                  color: activeTab === 'amenities' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  borderBottomColor: activeTab === 'amenities' ? 'var(--color-primary)' : 'transparent',
                }}
              >
                Amenities
              </button>
              <button
                onClick={() => setActiveTab('photos')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'photos' ? 'border-b-2' : ''
                }`}
                style={{
                  color: activeTab === 'photos' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  borderBottomColor: activeTab === 'photos' ? 'var(--color-primary)' : 'transparent',
                }}
              >
                Photos
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'reviews' ? 'border-b-2' : ''
                }`}
                style={{
                  color: activeTab === 'reviews' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  borderBottomColor: activeTab === 'reviews' ? 'var(--color-primary)' : 'transparent',
                }}
              >
                Reviews
              </button>
            </div>

            <div className="mt-4">
              {activeTab === 'description' && (
                <DescriptionDiff
                  oldText={comparison.from.description || ''}
                  newText={comparison.to.description || ''}
                />
              )}
              {activeTab === 'amenities' && (
                <ArrayDiff
                  oldItems={comparison.diffs.amenities.from || []}
                  newItems={comparison.diffs.amenities.to || []}
                  fieldName="Amenities"
                />
              )}
              {activeTab === 'photos' && (
                <PhotoDiff
                  oldPhotos={comparison.from.photos || []}
                  newPhotos={comparison.to.photos || []}
                />
              )}
              {activeTab === 'reviews' && (
                <ReviewDiff
                  oldReviews={oldReviews}
                  newReviews={newReviews}
                  showUnchangedReviews={true}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
