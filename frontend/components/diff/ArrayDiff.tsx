'use client';

import { diffAmenities } from '@/lib/diff/amenities';
import { normalizeAmenities } from '@/lib/utils/amenities';
import Badge from '@/components/ui/Badge';
import CollapsibleSection from './CollapsibleSection';

interface ArrayDiffProps {
  oldItems: string[] | unknown;
  newItems: string[] | unknown;
  fieldName?: string;
}

export default function ArrayDiff({ oldItems, newItems, fieldName = 'Items' }: ArrayDiffProps) {
  // Normalize amenities to ensure they're always string arrays
  // Handles JSON strings, JSONB arrays, or already-parsed arrays
  const normalizedOld = normalizeAmenities(oldItems);
  const normalizedNew = normalizeAmenities(newItems);
  
  const diff = diffAmenities(normalizedOld, normalizedNew);

  return (
    <div className="space-y-6">
      {/* Summary Bar */}
      <div className="flex flex-wrap items-center gap-3 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        {diff.added.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1.5 rounded-2xl text-xs font-semibold border shadow-sm" style={{ 
              backgroundColor: 'rgba(34, 197, 94, 0.2)', 
              color: '#4ade80', 
              borderColor: 'rgba(34, 197, 94, 0.3)' 
            }}>
              🟢 Added ({diff.added.length})
            </span>
          </div>
        )}
        {diff.removed.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1.5 rounded-2xl text-xs font-semibold border shadow-sm" style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.2)', 
              color: '#f87171', 
              borderColor: 'rgba(239, 68, 68, 0.3)' 
            }}>
              🔴 Removed ({diff.removed.length})
            </span>
          </div>
        )}
        {diff.unchanged.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1.5 rounded-2xl text-xs font-semibold border shadow-sm" style={{ 
              backgroundColor: 'var(--color-surface-elevated)', 
              color: 'var(--color-text-muted)', 
              borderColor: 'var(--color-border)' 
            }}>
              ⚪️ Unchanged ({diff.unchanged.length})
            </span>
          </div>
        )}
        {diff.added.length === 0 && diff.removed.length === 0 && diff.unchanged.length === 0 && (
          <span className="text-sm italic" style={{ color: 'var(--color-text-muted)' }}>No {fieldName.toLowerCase()} to display</span>
        )}
      </div>

      {/* Two-Column Layout: Old (Removed) | New (Added) */}
      {(diff.removed.length > 0 || diff.added.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Old Amenities Column (Removed - Red) */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2" style={{ color: '#f87171' }}>
              <span style={{ color: 'var(--color-error)' }}>🔴</span>
              Old ({diff.removed.length} removed)
            </h3>
            {diff.removed.length > 0 ? (
              <div className="p-4 rounded-xl space-y-2 min-h-[100px] border" style={{ 
                backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                borderColor: 'rgba(239, 68, 68, 0.3)' 
              }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {diff.removed.map((item, i) => (
                    <Badge 
                      key={i} 
                      variant="removed" 
                      className="line-through decoration-foreground/50 hover:border-red-500 hover:shadow-lg hover:scale-105 cursor-default justify-center"
                    >
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl text-center text-sm italic min-h-[100px] flex items-center justify-center border" style={{ 
                backgroundColor: 'var(--color-surface-elevated)', 
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-muted)'
              }}>
                No removed {fieldName.toLowerCase()}
              </div>
            )}
          </div>

          {/* New Amenities Column (Added - Green) */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2" style={{ color: '#4ade80' }}>
              <span style={{ color: 'var(--color-success)' }}>🟢</span>
              New ({diff.added.length} added)
            </h3>
            {diff.added.length > 0 ? (
              <div className="p-4 rounded-xl space-y-2 min-h-[100px] border" style={{ 
                backgroundColor: 'rgba(34, 197, 94, 0.1)', 
                borderColor: 'rgba(34, 197, 94, 0.3)' 
              }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {diff.added.map((item, i) => (
                    <Badge 
                      key={i} 
                      variant="added" 
                      className="hover:border-green-500 hover:shadow-lg hover:scale-105 cursor-default justify-center"
                    >
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl text-center text-sm italic min-h-[100px] flex items-center justify-center border" style={{ 
                backgroundColor: 'var(--color-surface-elevated)', 
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-muted)'
              }}>
                No added {fieldName.toLowerCase()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Unchanged Amenities */}
      {diff.unchanged.length > 0 && (
        <CollapsibleSection title={`⚪️ Unchanged (${diff.unchanged.length})`} defaultOpen={false} className="w-full space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 w-full">
            {diff.unchanged.map((item, i) => (
              <Badge key={i} variant="unchanged" className="hover:border-primary/50 hover:shadow-md hover:scale-105 cursor-default">
                {item}
              </Badge>
            ))}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}

