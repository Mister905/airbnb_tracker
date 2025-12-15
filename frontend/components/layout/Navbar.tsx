'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAppDispatch } from '@/lib/hooks';
import { clearUser } from '@/lib/store/authSlice';

export default function Navbar() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    dispatch(clearUser());
    router.push('/login');
  };

  return (
    <nav className="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/dashboard" className="flex items-center px-2 py-2 gap-2">
              <Image
                src="/images/Airbnb_Logo.svg"
                alt="Airbnb"
                width={100}
                height={31}
                className="h-8 w-auto"
                priority
              />
              <span className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Tracker
              </span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/dashboard"
                className="nav-link inline-flex items-center px-1 pt-1 text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/diff"
                className="nav-link inline-flex items-center px-1 pt-1 text-sm font-medium"
              >
                Diff Tool
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={handleLogout}
              className="nav-link px-3 py-2 text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
