'use client';

import { useState } from 'react';
import { diffPhotos } from '@/lib/diff/photos';

interface PhotoDiffProps {
  oldPhotos: { url: string; id?: string; imageId?: string }[];
  newPhotos: { url: string; id?: string; imageId?: string }[];
  showAll?: boolean;
  onShowAllChange?: (showAll: boolean) => void;
}

export interface PhotoDiffInfo {
  changedImageIds: Set<string>;
  changedCount: number;
  unchangedCount: number;
}

interface PhotoBadgeProps {
  type: 'added' | 'removed' | 'moved' | 'unchanged';
  label: string;
}

function PhotoBadge({ type, label }: PhotoBadgeProps) {
  const styles = {
    added: { backgroundColor: 'var(--color-success)', color: '#fff', borderColor: '#22c55e' },
    removed: { backgroundColor: 'var(--color-error)', color: '#fff', borderColor: '#ef4444' },
    moved: { backgroundColor: 'var(--color-info)', color: '#fff', borderColor: '#3b82f6' },
  };

  const icons = {
    added: '+',
    removed: '–',
    moved: '↔',
  };

  // Only render badge for changed photos (not for unchanged)
  if (type === 'unchanged') {
    return null;
  }

  return (
    <div
      className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 shadow-lg z-10"
      style={styles[type]}
      title={label}
    >
      {icons[type]}
    </div>
  );
}

interface PhotoThumbnailProps {
  url: string;
  alt: string;
  type: 'added' | 'removed' | 'moved' | 'unchanged';
  label: string;
  index?: number;
  oldIndex?: number;
  newIndex?: number;
}

function PhotoThumbnail({
  url,
  alt,
  type,
  label,
  index,
  oldIndex,
  newIndex,
}: PhotoThumbnailProps) {
  const borderStyles = {
    added: { border: '2px solid #4ade80' },
    removed: { border: '2px solid #f87171', opacity: 0.6 },
    moved: { border: '2px solid #60a5fa' },
    unchanged: { border: '1px solid var(--color-border)' },
  };

  const showIndex = index !== undefined || oldIndex !== undefined || newIndex !== undefined;

  return (
    <div className="relative group">
      <div className="relative overflow-hidden rounded-xl aspect-square">
        <img
          src={url}
          alt={alt}
          className="w-full h-full object-cover transition-all duration-200 group-hover:scale-105"
          style={borderStyles[type]}
        />
        {type !== 'unchanged' && <PhotoBadge type={type} label={label} />}
        {showIndex && (
          <div className="absolute bottom-0 left-0 right-0 text-white text-xs px-1.5 py-0.5 text-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
            {type === 'moved' && oldIndex !== undefined && newIndex !== undefined
              ? `${oldIndex + 1} → ${newIndex + 1}`
              : type === 'added' && newIndex !== undefined
              ? `#${newIndex + 1}`
              : type === 'removed' && oldIndex !== undefined
              ? `#${oldIndex + 1}`
              : index !== undefined
              ? `#${index + 1}`
              : ''}
          </div>
        )}
      </div>
    </div>
  );
}

interface CollapsibleSectionProps {
  title: string;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({ title, count, isOpen, onToggle, children }: CollapsibleSectionProps) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center gap-2 mb-3 w-full text-left hover:opacity-80 transition-opacity"
        style={{ color: 'var(--color-text-primary)' }}
      >
        <span className={`text-sm transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
          ▶
        </span>
        <h4 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {title} ({count})
        </h4>
      </button>
      {isOpen && <div>{children}</div>}
    </div>
  );
}

export default function PhotoDiff({ 
  oldPhotos, 
  newPhotos, 
  showAll: externalShowAll,
  onShowAllChange 
}: PhotoDiffProps) {
  // Convert photos to format expected by diffPhotos (with imageId)
  const normalizedOld = oldPhotos.map(p => ({ url: p.url, imageId: p.imageId || p.id || p.url }));
  const normalizedNew = newPhotos.map(p => ({ url: p.url, imageId: p.imageId || p.id || p.url }));
  
  const diff = diffPhotos(normalizedOld, normalizedNew);
  const [internalShowAll, setInternalShowAll] = useState(false);
  const [showUnchanged, setShowUnchanged] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const showAll = externalShowAll !== undefined ? externalShowAll : internalShowAll;
  const setShowAll = (value: boolean) => {
    if (onShowAllChange) {
      onShowAllChange(value);
    } else {
      setInternalShowAll(value);
    }
  };

  const changedCount = diff.added.length + diff.removed.length + diff.moved.length;
  const unchangedCount = diff.unchanged.length;
  const hasChanges = changedCount > 0;
  const hasUnchanged = unchangedCount > 0;
  
  // Create set of changed image IDs for filtering
  const changedImageIds = new Set<string>();
  diff.added.forEach(p => changedImageIds.add(p.imageId));
  diff.removed.forEach(p => changedImageIds.add(p.imageId));
  diff.moved.forEach(p => changedImageIds.add(p.imageId));

  return (
    <div className="space-y-6">
      {/* Toggle Filter - Only show if not controlled externally */}
      {hasUnchanged && externalShowAll === undefined && (
        <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Changed ({changedCount})
            </span>
            {hasUnchanged && (
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Unchanged ({unchangedCount})
              </span>
            )}
          </div>
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm font-medium transition-colors"
            style={{ color: 'var(--color-primary)' }}
          >
            {showAll ? 'Show Changes Only' : 'Show All'}
          </button>
        </div>
      )}

      {/* Changed Photos - Always visible */}
      {hasChanges && (
        <div className="space-y-4">
          {/* Added Photos */}
          {diff.added.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base font-bold" style={{ color: 'var(--color-success)' }}>+</span>
                <h4 className="text-sm font-semibold" style={{ color: 'var(--color-success)' }}>
                  Added ({diff.added.length})
                </h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {diff.added.map((photo, i) => (
                  <PhotoThumbnail
                    key={`added-${photo.imageId}-${i}`}
                    url={photo.url}
                    alt={`Added photo ${i + 1}`}
                    type="added"
                    label={`Added at position ${photo.newIndex + 1}`}
                    newIndex={photo.newIndex}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Removed Photos */}
          {diff.removed.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base font-bold" style={{ color: 'var(--color-error)' }}>–</span>
                <h4 className="text-sm font-semibold" style={{ color: 'var(--color-error)' }}>
                  Removed ({diff.removed.length})
                </h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {diff.removed.map((photo, i) => (
                  <PhotoThumbnail
                    key={`removed-${photo.imageId}-${i}`}
                    url={photo.url}
                    alt={`Removed photo ${i + 1}`}
                    type="removed"
                    label={`Removed from position ${photo.oldIndex + 1}`}
                    oldIndex={photo.oldIndex}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Moved Photos (Changed) */}
          {diff.moved.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base font-bold" style={{ color: 'var(--color-info)' }}>↔</span>
                <h4 className="text-sm font-semibold" style={{ color: 'var(--color-info)' }}>
                  Changed Position ({diff.moved.length})
                </h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {diff.moved.map((photo, i) => (
                  <PhotoThumbnail
                    key={`moved-${photo.imageId}-${i}`}
                    url={photo.url}
                    alt={`Moved photo ${i + 1}`}
                    type="moved"
                    label={`Moved from position ${photo.oldIndex + 1} to ${photo.newIndex + 1}`}
                    oldIndex={photo.oldIndex}
                    newIndex={photo.newIndex}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Unchanged Photos - Collapsible and de-emphasized */}
      {hasUnchanged && (
        <CollapsibleSection
          title="Unchanged"
          count={unchangedCount}
          isOpen={showAll || showUnchanged}
          onToggle={() => {
            setShowUnchanged(!showUnchanged);
          }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {diff.unchanged.map((photo, i) => (
              <PhotoThumbnail
                key={`unchanged-${photo.imageId}-${i}`}
                url={photo.url}
                alt={`Unchanged photo ${i + 1}`}
                type="unchanged"
                label={`Unchanged at position ${photo.index + 1}`}
                index={photo.index}
              />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Empty State */}
      {!hasChanges && !hasUnchanged && (
        <div className="text-sm italic text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
          No photos to display
        </div>
      )}

      {/* No Changes Message */}
      {!hasChanges && hasUnchanged && (
        <div className="text-sm italic text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
          No photo changes detected. All {unchangedCount} photo{unchangedCount !== 1 ? 's' : ''} remain unchanged.
        </div>
      )}
    </div>
  );
}

