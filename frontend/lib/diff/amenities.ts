export type AmenityDiff = {
  added: string[];
  removed: string[];
  unchanged: string[];
};

export function diffAmenities(oldAmenities: string[], newAmenities: string[]): AmenityDiff {
  const oldSet = new Set(oldAmenities.map((a) => a.toLowerCase()));
  const newSet = new Set(newAmenities.map((a) => a.toLowerCase()));

  const added: string[] = [];
  const removed: string[] = [];
  const unchanged: string[] = [];

  for (const amenity of newAmenities) {
    const lower = amenity.toLowerCase();
    if (oldSet.has(lower)) {
      unchanged.push(amenity);
    } else {
      added.push(amenity);
    }
  }

  for (const amenity of oldAmenities) {
    const lower = amenity.toLowerCase();
    if (!newSet.has(lower)) {
      removed.push(amenity);
    }
  }

  return { added, removed, unchanged };
}

