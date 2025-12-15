'use client';

import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'accent' | 'muted' | 'added' | 'removed' | 'unchanged';
  className?: string;
}

export default function Badge({
  children,
  variant = 'default',
  className = '',
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center px-3 py-1.5 rounded-2xl text-xs font-medium border transition-all duration-200';
  
  const variants = {
    default: { 
      backgroundColor: 'var(--color-surface)', 
      color: 'var(--color-text-primary)', 
      borderColor: 'var(--color-border)' 
    },
    accent: { 
      backgroundColor: 'rgba(0, 159, 61, 0.2)', 
      color: 'var(--color-primary)', 
      borderColor: 'rgba(0, 159, 61, 0.3)' 
    },
    muted: { 
      backgroundColor: 'var(--color-surface-elevated)', 
      color: 'var(--color-text-secondary)', 
      borderColor: 'var(--color-border)' 
    },
    added: { 
      backgroundColor: 'rgba(34, 197, 94, 0.2)', 
      color: '#4ade80', 
      borderColor: 'rgba(34, 197, 94, 0.3)' 
    },
    removed: { 
      backgroundColor: 'rgba(239, 68, 68, 0.2)', 
      color: '#f87171', 
      borderColor: 'rgba(239, 68, 68, 0.3)' 
    },
    unchanged: { 
      backgroundColor: 'var(--color-surface-elevated)', 
      color: 'var(--color-text-muted)', 
      borderColor: 'var(--color-border)' 
    },
  };

  const style = variants[variant];

  return (
    <span
      className={`${baseStyles} ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}

