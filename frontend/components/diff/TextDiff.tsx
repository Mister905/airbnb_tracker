'use client';

import { createEnhancedTextDiff } from '@/lib/diff/text';

interface TextDiffProps {
  oldText: string;
  newText: string;
  fieldName: string;
}

export default function TextDiff({ oldText, newText, fieldName }: TextDiffProps) {
  const diffHtml = createEnhancedTextDiff(oldText || '', newText || '');

  return (
    <div className="w-full">
      {fieldName && <div className="mb-2 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{fieldName}</div>}
      <div
        className="prose prose-sm max-w-none p-4 rounded-lg border leading-relaxed whitespace-pre-wrap break-words"
        style={{ 
          backgroundColor: 'var(--color-surface)', 
          borderColor: 'var(--color-border)', 
          color: 'var(--color-text-primary)' 
        }}
        dangerouslySetInnerHTML={{ __html: diffHtml }}
      />
      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}></span>
          <span>Added</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}></span>
          <span>Removed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(255, 193, 7, 0.2)' }}></span>
          <span>Modified</span>
        </div>
      </div>
    </div>
  );
}

