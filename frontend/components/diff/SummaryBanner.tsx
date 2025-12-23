'use client';

interface SummaryBannerProps {
  summaryItems: string[];
}

export default function SummaryBanner({ summaryItems }: SummaryBannerProps) {
  if (summaryItems.length === 0) {
    return (
      <div
        role="alert"
        className="relative w-full rounded-xl border p-4 shadow-lg backdrop-blur-sm"
        style={{ 
          backgroundColor: 'var(--color-surface-elevated)', 
          borderColor: 'var(--color-border)' 
        }}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5"
              style={{ color: 'var(--color-primary)' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>Change Summary</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>No changes detected</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="relative w-full rounded-xl border p-4 shadow-lg backdrop-blur-sm"
      style={{ 
        backgroundColor: 'var(--color-surface-elevated)', 
        borderColor: 'var(--color-border)' 
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5"
            style={{ color: 'var(--color-primary)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Change Summary</h3>
          <ul className="list-disc list-inside space-y-1 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {summaryItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

