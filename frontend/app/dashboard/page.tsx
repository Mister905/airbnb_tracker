'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import Navbar from '@/components/layout/Navbar';
import DashboardContent from '@/components/dashboard/DashboardContent';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
        <Navbar />
        <DashboardContent />
      </div>
    </AuthGuard>
  );
}
