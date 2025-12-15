'use client';

import { useState, useMemo, useEffect } from 'react';
import { diffReviews, getReviewKey } from '@/lib/diff/reviews';
import type { Review } from '@/lib/store/snapshotsSlice';
import DescriptionDiff from './DescriptionDiff';

interface ReviewDiffProps {
  oldReviews: Review[];
  newReviews: Review[];
  showUnchangedReviews?: boolean;
}

interface StarRatingProps {
  rating: number;
  maxRating?: number;
}

function StarRating({ rating, maxRating = 5 }: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxRating }).map((_, i) => (
        <span
          key={i}
          className="text-lg"
          style={{ color: i < rating ? '#fbbf24' : 'var(--color-text-muted)' }}
        >
          ★
        </span>
      ))}
      <span className="ml-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>({rating})</span>
    </div>
  );
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Unknown date';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

function formatMonthYear(dateString: string | null | undefined): string {
  if (!dateString) return 'Unknown';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  } catch {
    return dateString;
  }
}

function getMonthYearKey(dateString: string | null | undefined): string {
  if (!dateString) return 'unknown';
  try {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  } catch {
    return 'unknown';
  }
}

interface GroupedReviews {
  [monthYearKey: string]: {
    monthYear: string;
    reviews: Review[];
  };
}

function groupReviewsByMonth(reviews: Review[]): GroupedReviews {
  const grouped: GroupedReviews = {};
  
  reviews.forEach((review) => {
    const monthYearKey = getMonthYearKey(review.date);
    const monthYear = formatMonthYear(review.date);
    
    if (!grouped[monthYearKey]) {
      grouped[monthYearKey] = {
        monthYear,
        reviews: [],
      };
    }
    
    grouped[monthYearKey].reviews.push(review);
  });
  
  // Sort reviews within each group by date (newest first)
  Object.values(grouped).forEach((group) => {
    group.reviews.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA; // Newest first
    });
  });
  
  return grouped;
}

function sortMonthGroups(groups: GroupedReviews): Array<{ monthYearKey: string; monthYear: string; reviews: Review[] }> {
  return Object.entries(groups)
    .map(([monthYearKey, group]) => ({
      monthYearKey,
      monthYear: group.monthYear,
      reviews: group.reviews,
    }))
    .sort((a, b) => {
      // Sort by month/year key (newest first)
      return b.monthYearKey.localeCompare(a.monthYearKey);
    });
}

interface ReviewCardProps {
  review: Review;
  type: 'added' | 'removed' | 'updated' | 'unchanged';
  oldReview?: Review;
}

function ReviewCard({ review, type, oldReview }: ReviewCardProps) {
  const borderColors = {
    added: { borderLeft: '4px solid var(--color-success)' },
    removed: { borderLeft: '4px solid var(--color-error)' },
    updated: { borderLeft: '4px solid var(--color-warning)' },
    unchanged: { borderLeft: '4px solid var(--color-border)' },
  };

  return (
    <div
      className="rounded-lg border shadow-sm p-4"
      style={{
        ...borderColors[type],
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        opacity: type === 'removed' ? 0.75 : 1,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {review.reviewerName || 'Unknown'}
            </h4>
            {type === 'added' && (
              <span className="px-2 py-0.5 text-xs font-medium rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: 'var(--color-success)' }}>
                Added
              </span>
            )}
            {type === 'removed' && (
              <span className="px-2 py-0.5 text-xs font-medium rounded line-through" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-error)' }}>
                Removed
              </span>
            )}
            {type === 'updated' && (
              <span className="px-2 py-0.5 text-xs font-medium rounded" style={{ backgroundColor: 'rgba(255, 193, 7, 0.2)', color: 'var(--color-warning)' }}>
                Updated
              </span>
            )}
            {type === 'unchanged' && (
              <span className="px-2 py-0.5 text-xs font-medium rounded" style={{ backgroundColor: 'var(--color-surface-elevated)', color: 'var(--color-text-muted)' }}>
                Unchanged
              </span>
            )}
          </div>
          <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{formatDate(review.date)}</div>
        </div>
        {review.rating && <StarRating rating={review.rating} />}
      </div>

      {type === 'updated' && oldReview ? (
        <div className="mt-3 space-y-2">
          <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Comment Changes:</div>
          <DescriptionDiff
            oldText={oldReview.comment || ''}
            newText={review.comment || ''}
          />
          {oldReview.rating !== review.rating && (
            <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Rating:</span>
              <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{oldReview.rating}</span>
              <span style={{ color: 'var(--color-text-muted)' }}>→</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{review.rating}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-2">
          <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
            {review.comment || 'No comment'}
          </p>
        </div>
      )}
    </div>
  );
}

export default function ReviewDiff({ 
  oldReviews, 
  newReviews,
  showUnchangedReviews = true 
}: ReviewDiffProps) {
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [showAllReviews, setShowAllReviews] = useState(false);
  
  const diff = diffReviews(oldReviews, newReviews);

  // Calculate unchanged reviews (reviews that exist in both but aren't updated)
  const unchangedReviews: Review[] = useMemo(() => {
    const unchanged: Review[] = [];
    if (showUnchangedReviews && diff.added.length === 0 && diff.removed.length === 0 && diff.updated.length === 0) {
      // If no changes, all reviews in newReviews are unchanged
      unchanged.push(...newReviews);
    } else if (showUnchangedReviews) {
      // Find reviews that exist in both old and new but aren't in added/updated
      const changedKeys = new Set([
        ...diff.added.map(item => item.key),
        ...diff.updated.map(item => item.key),
      ]);
      
      newReviews.forEach((review) => {
        const key = getReviewKey(review);
        if (!changedKeys.has(key)) {
          // Check if this review also exists in oldReviews (not removed)
          const existsInOld = oldReviews.some(oldReview => {
            return getReviewKey(oldReview) === key;
          });
          if (existsInOld) {
            unchanged.push(review);
          }
        }
      });
    }
    return unchanged;
  }, [oldReviews, newReviews, diff, showUnchangedReviews]);

  // Performance safeguard: limit to 50 most recent if >200 reviews
  const shouldLimitReviews = unchangedReviews.length > 200;
  const displayedUnchangedReviews = useMemo(() => {
    if (!shouldLimitReviews || showAllReviews) {
      return unchangedReviews;
    }
    // Sort by date (newest first) and take first 50
    return [...unchangedReviews]
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 50);
  }, [unchangedReviews, shouldLimitReviews, showAllReviews]);

  // Group unchanged reviews by month
  const groupedUnchangedReviews = useMemo(() => {
    if (displayedUnchangedReviews.length === 0) return [];
    const grouped = groupReviewsByMonth(displayedUnchangedReviews);
    return sortMonthGroups(grouped);
  }, [displayedUnchangedReviews]);

  // Auto-expand first month on initial load
  useEffect(() => {
    if (groupedUnchangedReviews.length > 0 && expandedMonths.size === 0) {
      setExpandedMonths(new Set([groupedUnchangedReviews[0].monthYearKey]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupedUnchangedReviews.length]);

  const toggleMonth = (monthYearKey: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(monthYearKey)) {
        next.delete(monthYearKey);
      } else {
        next.add(monthYearKey);
      }
      return next;
    });
  };

  const hasChanges = diff.added.length > 0 || diff.removed.length > 0 || diff.updated.length > 0;
  const shouldShowUnchanged = showUnchangedReviews && unchangedReviews.length > 0;

  return (
    <div className="space-y-6">
      {/* Added Reviews */}
      {diff.added.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base font-bold" style={{ color: 'var(--color-success)' }}>+</span>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-success)' }}>
              Added ({diff.added.length})
            </h3>
          </div>
          <div className="space-y-3">
            {diff.added.map((item) => (
              <ReviewCard
                key={item.key}
                review={item.newReview!}
                type="added"
              />
            ))}
          </div>
        </div>
      )}

      {/* Removed Reviews */}
      {diff.removed.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base font-bold" style={{ color: 'var(--color-error)' }}>–</span>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-error)' }}>
              Removed ({diff.removed.length})
            </h3>
          </div>
          <div className="space-y-3">
            {diff.removed.map((item) => (
              <ReviewCard
                key={item.key}
                review={item.oldReview!}
                type="removed"
              />
            ))}
          </div>
        </div>
      )}

      {/* Updated Reviews */}
      {diff.updated.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base font-bold" style={{ color: 'var(--color-warning)' }}>↔</span>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-warning)' }}>
              Updated ({diff.updated.length})
            </h3>
          </div>
          <div className="space-y-3">
            {diff.updated.map((item) => (
              <ReviewCard
                key={item.key}
                review={item.newReview!}
                type="updated"
                oldReview={item.oldReview}
              />
            ))}
          </div>
        </div>
      )}

      {/* Historical Reviews - Show when reviews exist (even if there are changes) */}
      {shouldShowUnchanged && (
        <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--color-text-primary)' }}>
            All Historical Reviews
          </h3>
          
          {groupedUnchangedReviews.length > 0 ? (
            <div className="space-y-4">
              {groupedUnchangedReviews.map(({ monthYearKey, monthYear, reviews }) => {
                const isExpanded = expandedMonths.has(monthYearKey);
                return (
                  <div key={monthYearKey} className="border-b last:border-b-0 pb-4 last:pb-0" style={{ borderColor: 'var(--color-border)' }}>
                    <button
                      type="button"
                      onClick={() => toggleMonth(monthYearKey)}
                      className="flex items-center justify-between w-full text-left mb-2 hover:opacity-90 transition-opacity group"
                    >
                      <h4 className="text-sm font-semibold group-hover:text-primary transition-colors" style={{ color: 'var(--color-text-primary)' }}>
                        {monthYear} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                      </h4>
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 flex-shrink-0`}
                        style={{ color: 'var(--color-text-muted)', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isExpanded && (
                      <div className="space-y-3 mt-3 pl-2">
                        {reviews.map((review, index) => {
                          const key = `${getReviewKey(review)}_${index}`;
                          return (
                            <ReviewCard
                              key={key}
                              review={review}
                              type="unchanged"
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Show More / Show Less toggle for large review sets */}
              {shouldLimitReviews && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <button
                    type="button"
                    onClick={() => setShowAllReviews(!showAllReviews)}
                    className="text-sm font-medium underline transition-colors"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {showAllReviews 
                      ? `Show Less (showing all ${unchangedReviews.length} reviews)`
                      : `Show More (showing 50 of ${unchangedReviews.length} reviews)`
                    }
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm italic text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
              No historical reviews available
            </div>
          )}
        </div>
      )}

      {/* Empty State - Only show when there are no reviews at all */}
      {!hasChanges && !shouldShowUnchanged && newReviews.length === 0 && (
        <div className="text-sm italic text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
          No reviews available
        </div>
      )}
    </div>
  );
}

