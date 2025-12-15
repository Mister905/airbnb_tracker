'use client';

import { useState, ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export default function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  className = '',
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 mb-3 hover:opacity-90 transition-all duration-200 w-full text-left group"
        style={{ color: 'var(--color-text-primary)' }}
      >
        <span className="text-sm font-semibold group-hover:text-primary transition-colors duration-200">{title}</span>
        <svg
          className={`w-4 h-4 transition-all duration-200 flex-shrink-0 ml-auto`}
          style={{ color: 'var(--color-text-muted)' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        </svg>
      </button>
      {isOpen && <div className="mt-2 w-full">{children}</div>}
    </div>
  );
}

