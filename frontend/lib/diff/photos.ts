export type PhotoDiff = {
  added: { url: string; imageId: string; newIndex: number }[];
  removed: { url: string; imageId: string; oldIndex: number }[];
  moved: { url: string; imageId: string; oldIndex: number; newIndex: number }[];
  unchanged: { url: string; imageId: string; index: number }[];
};

export function diffPhotos(
  oldPhotos: { url: string; id?: string; imageId?: string }[],
  newPhotos: { url: string; id?: string; imageId?: string }[]
): PhotoDiff {
  // Use URL as the primary identifier for comparison (not ID, since IDs change between snapshots)
  // Only use imageId if explicitly provided, otherwise use URL
  const getImageId = (photo: { url: string; id?: string; imageId?: string }) => {
    // If imageId is explicitly provided, use it (for cases where we want to track specific images)
    // Otherwise, use URL as the identifier since that's what persists across snapshots
    return photo.imageId || photo.url;
  };

  const oldMap = new Map(oldPhotos.map((p, i) => [getImageId(p), { ...p, index: i }]));
  const newMap = new Map(newPhotos.map((p, i) => [getImageId(p), { ...p, index: i }]));

  const added: PhotoDiff["added"] = [];
  const removed: PhotoDiff["removed"] = [];
  const moved: PhotoDiff["moved"] = [];
  const unchanged: PhotoDiff["unchanged"] = [];

  // Convert Map entries to array to avoid downlevelIteration requirement
  for (const [imageId, newPhoto] of Array.from(newMap.entries())) {
    const oldPhoto = oldMap.get(imageId);
    if (!oldPhoto) {
      added.push({ url: newPhoto.url, imageId, newIndex: newPhoto.index });
    } else if (oldPhoto.index !== newPhoto.index) {
      moved.push({
        url: newPhoto.url,
        imageId,
        oldIndex: oldPhoto.index,
        newIndex: newPhoto.index,
      });
    } else {
      unchanged.push({ url: newPhoto.url, imageId, index: newPhoto.index });
    }
  }

  for (const [imageId, oldPhoto] of Array.from(oldMap.entries())) {
    if (!newMap.has(imageId)) {
      removed.push({ url: oldPhoto.url, imageId, oldIndex: oldPhoto.index });
    }
  }

  return { added, removed, moved, unchanged };
}

