import type { Review } from '@/lib/store/snapshotsSlice';

// Re-export Review type for convenience
export type { Review };

export interface ReviewDiffItem {
  type: "added" | "removed" | "updated";
  oldReview?: Review;
  newReview?: Review;
  key: string; // reviewerName + date
}

export type ReviewDiff = {
  added: ReviewDiffItem[];
  removed: ReviewDiffItem[];
  updated: ReviewDiffItem[];
};

/**
 * Generate a unique key for a review based on reviewerName and date
 */
export function getReviewKey(review: Review): string {
  const dateStr = review.date 
    ? new Date(review.date).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];
  return `${review.reviewerName || "Unknown"}_${dateStr}`;
}

/**
 * Compare two reviews to determine if they're the same (same reviewerName + date)
 */
export function reviewsMatch(review1: Review, review2: Review): boolean {
  return getReviewKey(review1) === getReviewKey(review2);
}

/**
 * Check if a review has been updated (same key but different content)
 */
export function reviewIsUpdated(oldReview: Review, newReview: Review): boolean {
  if (!reviewsMatch(oldReview, newReview)) {
    return false;
  }
  
  return (
    oldReview.rating !== newReview.rating ||
    oldReview.comment !== newReview.comment
  );
}

/**
 * Diff two arrays of reviews
 */
export function diffReviews(oldReviews: Review[], newReviews: Review[]): ReviewDiff {
  const added: ReviewDiffItem[] = [];
  const removed: ReviewDiffItem[] = [];
  const updated: ReviewDiffItem[] = [];

  // Create maps for quick lookup
  const oldMap = new Map<string, Review>();
  const newMap = new Map<string, Review>();

  oldReviews.forEach((review) => {
    const key = getReviewKey(review);
    oldMap.set(key, review);
  });

  newReviews.forEach((review) => {
    const key = getReviewKey(review);
    newMap.set(key, review);
  });

  // Find added and updated reviews
  // Convert Map entries to array to avoid downlevelIteration requirement
  for (const [key, newReview] of Array.from(newMap.entries())) {
    const oldReview = oldMap.get(key);
    
    if (!oldReview) {
      // Review is new
      added.push({
        type: "added",
        newReview,
        key,
      });
    } else if (reviewIsUpdated(oldReview, newReview)) {
      // Review was updated
      updated.push({
        type: "updated",
        oldReview,
        newReview,
        key,
      });
    }
  }

  // Find removed reviews
  for (const [key, oldReview] of Array.from(oldMap.entries())) {
    if (!newMap.has(key)) {
      removed.push({
        type: "removed",
        oldReview,
        key,
      });
    }
  }

  return { added, removed, updated };
}

