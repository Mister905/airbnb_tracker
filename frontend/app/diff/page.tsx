'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import Navbar from '@/components/layout/Navbar';
import DiffToolContent from '@/components/diff/DiffToolContent';

export default function DiffPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
        <Navbar />
        <DiffToolContent />
      </div>
    </AuthGuard>
  );
}
