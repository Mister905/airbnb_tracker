'use client';

import { createTextDiffSegments } from '@/lib/diff/text';
import { useMemo } from 'react';

interface DescriptionDiffProps {
  oldText: string;
  newText: string;
}

export default function DescriptionDiff({ oldText, newText }: DescriptionDiffProps) {
  const { segments, addedLines, removedLines } = useMemo(() => {
    const segments = createTextDiffSegments(oldText || '', newText || '');
    
    // Count added and removed segments (more accurate than line counting)
    let addedCount = 0;
    let removedCount = 0;
    
    segments.forEach((segment) => {
      if (segment.type === 'added' && segment.text.trim()) {
        addedCount++;
      } else if (segment.type === 'removed' && segment.text.trim()) {
        removedCount++;
      }
    });
    
    return {
      segments,
      addedLines: addedCount,
      removedLines: removedCount,
    };
  }, [oldText, newText]);

  return (
    <div className="w-full">
      {/* Summary Header */}
      {(addedLines > 0 || removedLines > 0) && (
        <div className="mb-4 px-4 py-2 rounded-lg border" style={{ 
          backgroundColor: 'var(--color-surface-elevated)', 
          borderColor: 'var(--color-border)' 
        }}>
          <div className="flex items-center gap-4 text-sm">
            <span style={{ color: 'var(--color-text-secondary)' }} className="font-medium">Changes:</span>
            {addedLines > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-success)' }}></span>
                <span style={{ color: 'var(--color-success)' }} className="font-semibold">+{addedLines}</span>
              </span>
            )}
            {removedLines > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-error)' }}></span>
                <span style={{ color: 'var(--color-error)' }} className="font-semibold">-{removedLines}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Unified Diff View */}
      <div className="relative">
        <div className="font-mono text-sm leading-relaxed p-4 rounded-lg border overflow-x-auto" style={{ 
          backgroundColor: 'var(--color-surface-elevated)', 
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-primary)'
        }}>
          <div className="whitespace-pre-wrap break-words">
            {segments.map((segment, index) => {
              if (segment.type === 'added') {
                return (
                  <span
                    key={index}
                    className="px-1 py-0.5 rounded"
                    style={{ backgroundColor: 'rgba(34, 197, 94, 0.3)', color: '#4ade80' }}
                  >
                    {segment.text}
                  </span>
                );
              } else if (segment.type === 'removed') {
                return (
                  <span
                    key={index}
                    className="px-1 py-0.5 rounded line-through"
                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171', textDecorationColor: 'var(--color-error)' }}
                  >
                    {segment.text}
                  </span>
                );
              } else {
                return (
                  <span key={index} style={{ color: 'var(--color-text-primary)' }}>
                    {segment.text}
                  </span>
                );
              }
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.3)', border: '1px solid rgba(34, 197, 94, 0.5)' }}></span>
          <span style={{ color: 'var(--color-success)' }}>Added</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.3)', border: '1px solid rgba(239, 68, 68, 0.5)' }}></span>
          <span style={{ color: 'var(--color-error)' }}>Removed</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }}></span>
          <span style={{ color: 'var(--color-text-muted)' }}>Unchanged</span>
        </div>
      </div>
    </div>
  );
}

